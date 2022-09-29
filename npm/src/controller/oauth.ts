import crypto from 'crypto';
import { promisify } from 'util';
import { deflateRaw } from 'zlib';
import { Client, errors, generators, Issuer, TokenSet } from 'openid-client';
import * as jose from 'jose';
import * as dbutils from '../db/utils';
import * as metrics from '../opentelemetry/metrics';

import saml from '@boxyhq/saml20';
import claims from '../saml/claims';

import type {
  IOAuthController,
  JacksonOption,
  OAuthErrorHandlerParams,
  OAuthReq,
  OAuthTokenReq,
  OAuthTokenRes,
  OIDCErrorCodes,
  Profile,
  SAMLResponsePayload,
  Storable,
} from '../typings';
import { JacksonError } from './error';
import * as allowed from './oauth/allowed';
import * as codeVerifier from './oauth/code-verifier';
import * as redirect from './oauth/redirect';
import {
  relayStatePrefix,
  IndexNames,
  OAuthErrorResponse,
  getErrorMessage,
  loadJWSPrivateKey,
  isJWSKeyPairLoaded,
} from './utils';
import x509 from '../saml/x509';

const deflateRawAsync = promisify(deflateRaw);

const validateSAMLResponse = async (rawResponse: string, validateOpts) => {
  const profile = await saml.validate(rawResponse, validateOpts);
  if (profile && profile.claims) {
    // we map claims to our attributes id, email, firstName, lastName where possible. We also map original claims to raw
    profile.claims = claims.map(profile.claims);

    // some providers don't return the id in the assertion, we set it to a sha256 hash of the email
    if (!profile.claims.id && profile.claims.email) {
      profile.claims.id = crypto.createHash('sha256').update(profile.claims.email).digest('hex');
    }
  }
  return profile;
};

function getEncodedTenantProduct(param: string): { tenant: string | null; product: string | null } | null {
  try {
    const sp = new URLSearchParams(param);
    const tenant = sp.get('tenant');
    const product = sp.get('product');
    if (tenant && product) {
      return {
        tenant: sp.get('tenant'),
        product: sp.get('product'),
      };
    }

    return null;
  } catch (err) {
    return null;
  }
}

function getScopeValues(scope?: string): string[] {
  return typeof scope === 'string' ? scope.split(' ').filter((s) => s.length > 0) : [];
}

export class OAuthController implements IOAuthController {
  private connectionStore: Storable;
  private sessionStore: Storable;
  private codeStore: Storable;
  private tokenStore: Storable;
  private opts: JacksonOption;

  constructor({ connectionStore, sessionStore, codeStore, tokenStore, opts }) {
    this.connectionStore = connectionStore;
    this.sessionStore = sessionStore;
    this.codeStore = codeStore;
    this.tokenStore = tokenStore;
    this.opts = opts;
  }

  private resolveMultipleConnectionMatches(
    connections,
    idp_hint,
    originalParams,
    isIdpFlow = false
  ): { resolvedConnection?: unknown; redirect_url?: string; app_select_form?: string } {
    if (connections.length > 1) {
      if (idp_hint) {
        return { resolvedConnection: connections.find(({ clientID }) => clientID === idp_hint) };
      } else if (this.opts.idpDiscoveryPath) {
        if (!isIdpFlow) {
          // redirect to IdP selection page
          const idpList = connections.map(({ idpMetadata, oidcProvider, clientID }) =>
            JSON.stringify({
              provider: idpMetadata?.provider ?? oidcProvider?.provider,
              clientID,
              connectionIsSAML: idpMetadata && typeof idpMetadata === 'object',
              connectionIsOIDC: oidcProvider && typeof oidcProvider === 'object',
            })
          );
          return {
            redirect_url: redirect.success(this.opts.externalUrl + this.opts.idpDiscoveryPath, {
              ...originalParams,
              idp: idpList,
            }),
          };
        } else {
          // Relevant to IdP initiated SAML flow
          const appList = connections.map(({ product, name, description, clientID }) => ({
            product,
            name,
            description,
            clientID,
          }));
          return {
            app_select_form: saml.createPostForm(this.opts.idpDiscoveryPath, [
              {
                name: 'SAMLResponse',
                value: originalParams.SAMLResponse,
              },
              {
                name: 'app',
                value: encodeURIComponent(JSON.stringify(appList)),
              },
            ]),
          };
        }
      }
    }
    return {};
  }

  public async authorize(body: OAuthReq): Promise<{ redirect_url?: string; authorize_form?: string }> {
    const {
      response_type = 'code',
      client_id,
      redirect_uri,
      state,
      scope,
      nonce,
      code_challenge,
      code_challenge_method = '',
      idp_hint,
      prompt,
    } = body;

    const tenant = 'tenant' in body ? body.tenant : undefined;
    const product = 'product' in body ? body.product : undefined;
    const access_type = 'access_type' in body ? body.access_type : undefined;
    const resource = 'resource' in body ? body.resource : undefined;

    let requestedTenant = tenant;
    let requestedProduct = product;

    metrics.increment('oauthAuthorize');

    if (!redirect_uri) {
      throw new JacksonError('Please specify a redirect URL.', 400);
    }

    let connection;
    const requestedScopes = getScopeValues(scope);
    const requestedOIDCFlow = requestedScopes.includes('openid');

    if (tenant && product) {
      const connections = await this.connectionStore.getByIndex({
        name: IndexNames.TenantProduct,
        value: dbutils.keyFromParts(tenant, product),
      });

      if (!connections || connections.length === 0) {
        throw new JacksonError('IdP connection not found.', 403);
      }

      connection = connections[0];

      // Support multiple matches
      const { resolvedConnection, redirect_url } = this.resolveMultipleConnectionMatches(
        connections,
        idp_hint,
        {
          response_type,
          client_id,
          redirect_uri,
          state,
          tenant,
          product,
          access_type,
          resource,
          scope,
          nonce,
          code_challenge,
          code_challenge_method,
        }
      );

      if (redirect_url) {
        return { redirect_url };
      }

      if (resolvedConnection) {
        connection = resolvedConnection;
      }
    } else if (client_id && client_id !== '' && client_id !== 'undefined' && client_id !== 'null') {
      // if tenant and product are encoded in the client_id then we parse it and check for the relevant connection(s)
      let sp = getEncodedTenantProduct(client_id);

      if (!sp && access_type) {
        sp = getEncodedTenantProduct(access_type);
      }
      if (!sp && resource) {
        sp = getEncodedTenantProduct(resource);
      }
      if (!sp && requestedScopes) {
        const encodedParams = requestedScopes.find((scope) => scope.includes('=') && scope.includes('&')); // for now assume only one encoded param i.e. for tenant/product
        if (encodedParams) {
          sp = getEncodedTenantProduct(encodedParams);
        }
      }
      if (sp && sp.tenant && sp.product) {
        requestedTenant = sp.tenant;
        requestedProduct = sp.product;

        const connections = await this.connectionStore.getByIndex({
          name: IndexNames.TenantProduct,
          value: dbutils.keyFromParts(sp.tenant, sp.product),
        });

        if (!connections || connections.length === 0) {
          throw new JacksonError('IdP connection not found.', 403);
        }

        connection = connections[0];
        // Support multiple matches
        const { resolvedConnection, redirect_url } = this.resolveMultipleConnectionMatches(
          connections,
          idp_hint,
          {
            response_type,
            client_id,
            redirect_uri,
            state,
            tenant,
            product,
            access_type,
            resource,
            scope,
            nonce,
            code_challenge,
            code_challenge_method,
          }
        );

        if (redirect_url) {
          return { redirect_url };
        }

        if (resolvedConnection) {
          connection = resolvedConnection;
        }
      } else {
        connection = await this.connectionStore.get(client_id);
        if (connection) {
          requestedTenant = connection.tenant;
          requestedProduct = connection.product;
        }
      }
    } else {
      throw new JacksonError('You need to specify client_id or tenant & product', 403);
    }

    if (!connection) {
      throw new JacksonError('IdP connection not found.', 403);
    }

    if (!allowed.redirect(redirect_uri, connection.redirectUrl)) {
      throw new JacksonError('Redirect URL is not allowed.', 403);
    }

    if (
      requestedOIDCFlow &&
      (!this.opts.openid.jwtSigningKeys || !isJWSKeyPairLoaded(this.opts.openid.jwtSigningKeys))
    ) {
      return {
        redirect_url: OAuthErrorResponse({
          error: 'server_error',
          error_description:
            'OAuth server not configured correctly for openid flow, check if JWT signing keys are loaded',
          redirect_uri,
        }),
      };
    }

    if (!state) {
      return {
        redirect_url: OAuthErrorResponse({
          error: 'invalid_request',
          error_description: 'Please specify a state to safeguard against XSRF attacks',
          redirect_uri,
        }),
      };
    }

    if (response_type !== 'code') {
      return {
        redirect_url: OAuthErrorResponse({
          error: 'unsupported_response_type',
          error_description: 'Only Authorization Code grant is supported',
          redirect_uri,
          state,
        }),
      };
    }

    // Connection retrieved: Handover to IdP starts here
    let ssoUrl;
    let post = false;
    const connectionIsSAML = connection.idpMetadata && typeof connection.idpMetadata === 'object';
    const connectionIsOIDC = connection.oidcProvider && typeof connection.oidcProvider === 'object';

    // Init sessionId
    const sessionId = crypto.randomBytes(16).toString('hex');
    const relayState = relayStatePrefix + sessionId;
    // SAML connection: SAML request will be constructed here
    let samlReq;
    if (connectionIsSAML) {
      const { sso } = connection.idpMetadata;

      if ('redirectUrl' in sso) {
        // HTTP Redirect binding
        ssoUrl = sso.redirectUrl;
      } else if ('postUrl' in sso) {
        // HTTP-POST binding
        ssoUrl = sso.postUrl;
        post = true;
      } else {
        return {
          redirect_url: OAuthErrorResponse({
            error: 'invalid_request',
            error_description: 'SAML binding could not be retrieved',
            redirect_uri,
            state,
          }),
        };
      }

      try {
        const { validTo } = new crypto.X509Certificate(connection.certs.publicKey);
        const isValidExpiry = validTo != 'Bad time value' && new Date(validTo) > new Date();
        if (!isValidExpiry) {
          const certs = await x509.generate();
          connection.certs = certs;
          if (certs) {
            await this.connectionStore.put(
              connection.clientID,
              connection,
              {
                // secondary index on entityID
                name: IndexNames.EntityID,
                value: connection.idpMetadata.entityID,
              },
              {
                // secondary index on tenant + product
                name: IndexNames.TenantProduct,
                value: dbutils.keyFromParts(connection.tenant, connection.product),
              }
            );
          } else {
            throw new Error('Error generating x509 certs');
          }
        }
        // We will get undefined or Space delimited, case sensitive list of ASCII string values in prompt
        // If login is one of the value in prompt we want to enable forceAuthn
        // Else use the saml connection forceAuthn value
        const promptOptions = prompt ? prompt.split(' ').filter((p) => p === 'login') : [];
        samlReq = saml.request({
          ssoUrl,
          entityID: this.opts.samlAudience!,
          callbackUrl: this.opts.externalUrl + this.opts.samlPath,
          signingKey: connection.certs.privateKey,
          publicKey: connection.certs.publicKey,
          forceAuthn: promptOptions.length > 0 ? true : !!connection.forceAuthn,
        });
      } catch (err: unknown) {
        return {
          redirect_url: OAuthErrorResponse({
            error: 'server_error',
            error_description: getErrorMessage(err),
            redirect_uri,
            state,
          }),
        };
      }
    }
    // OIDC Connection: Issuer discovery, openid-client init and extraction of authorization endpoint happens here
    let oidcCodeVerifier: string | undefined;
    if (connectionIsOIDC) {
      const { discoveryUrl, clientId, clientSecret } = connection.oidcProvider;
      try {
        const oidcIssuer = await Issuer.discover(discoveryUrl);
        const oidcClient = new oidcIssuer.Client({
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uris: [this.opts.externalUrl + this.opts.oidcPath],
          response_types: ['code'],
        });
        oidcCodeVerifier = generators.codeVerifier();
        const code_challenge = generators.codeChallenge(oidcCodeVerifier);
        ssoUrl = oidcClient.authorizationUrl({
          scope: [...requestedScopes, 'openid', 'email', 'profile']
            .filter((value, index, self) => self.indexOf(value) === index) // filter out duplicates
            .join(' '),
          code_challenge,
          code_challenge_method: 'S256',
          state: relayState,
        });
      } catch (err: unknown) {
        if (err) {
          return {
            redirect_url: OAuthErrorResponse({
              error: 'server_error',
              error_description: (err as errors.OPError)?.error || getErrorMessage(err),
              redirect_uri,
              state,
            }),
          };
        }
      }
    }
    // Session persistence happens here
    try {
      const requested = { client_id, state, redirect_uri } as Record<string, string | boolean | string[]>;
      if (requestedTenant) {
        requested.tenant = requestedTenant;
      }
      if (requestedProduct) {
        requested.product = requestedProduct;
      }
      if (idp_hint) {
        requested.idp_hint = idp_hint;
      }
      if (requestedOIDCFlow) {
        requested.oidc = true;
        if (nonce) {
          requested.nonce = nonce;
        }
      }
      if (requestedScopes) {
        requested.scope = requestedScopes;
      }

      const sessionObj = {
        redirect_uri,
        response_type,
        state,
        code_challenge,
        code_challenge_method,
        requested,
      };
      await this.sessionStore.put(
        sessionId,
        connectionIsSAML
          ? {
              ...sessionObj,
              id: samlReq?.id,
            }
          : { ...sessionObj, id: connection.clientID, oidcCodeVerifier }
      );
      // Redirect to IdP
      if (connectionIsSAML) {
        let redirectUrl;
        let authorizeForm;

        if (!post) {
          // HTTP Redirect binding
          redirectUrl = redirect.success(ssoUrl, {
            RelayState: relayState,
            SAMLRequest: Buffer.from(await deflateRawAsync(samlReq.request)).toString('base64'),
          });
        } else {
          // HTTP POST binding
          authorizeForm = saml.createPostForm(ssoUrl, [
            {
              name: 'RelayState',
              value: relayState,
            },
            {
              name: 'SAMLRequest',
              value: Buffer.from(samlReq.request).toString('base64'),
            },
          ]);
        }
        return {
          redirect_url: redirectUrl,
          authorize_form: authorizeForm,
        };
      } else if (connectionIsOIDC) {
        return { redirect_url: ssoUrl };
      } else {
        return {
          redirect_url: OAuthErrorResponse({
            error: 'invalid_request',
            error_description: 'Connection appears to be misconfigured',
            redirect_uri,
            state,
          }),
        };
      }
    } catch (err: unknown) {
      return {
        redirect_url: OAuthErrorResponse({
          error: 'server_error',
          error_description: getErrorMessage(err),
          redirect_uri,
          state,
        }),
      };
    }
  }

  public async samlResponse(
    body: SAMLResponsePayload
  ): Promise<{ redirect_url?: string; app_select_form?: string }> {
    const { SAMLResponse, idp_hint } = body;

    let RelayState = body.RelayState || ''; // RelayState will contain the sessionId from earlier quasi-oauth flow

    const isIdPFlow = !RelayState.startsWith(relayStatePrefix);

    if (!this.opts.idpEnabled && isIdPFlow) {
      // IDP is disabled so block the request

      throw new JacksonError(
        'IdP (Identity Provider) flow has been disabled. Please head to your Service Provider to login.',
        403
      );
    }

    RelayState = RelayState.replace(relayStatePrefix, '');

    const rawResponse = Buffer.from(SAMLResponse, 'base64').toString();

    const issuer = saml.parseIssuer(rawResponse);
    if (!issuer) {
      throw new JacksonError('Issuer not found.', 403);
    }
    const samlConnections = await this.connectionStore.getByIndex({
      name: IndexNames.EntityID,
      value: issuer,
    });

    if (!samlConnections || samlConnections.length === 0) {
      throw new JacksonError('SAML connection not found.', 403);
    }

    let samlConnection = samlConnections[0];

    if (isIdPFlow) {
      RelayState = '';
      const { resolvedConnection, app_select_form } = this.resolveMultipleConnectionMatches(
        samlConnections,
        idp_hint,
        { SAMLResponse },
        true
      );
      if (app_select_form) {
        return { app_select_form };
      }
      if (resolvedConnection) {
        samlConnection = resolvedConnection;
      }
    }

    let session;

    if (RelayState !== '') {
      session = await this.sessionStore.get(RelayState);
      if (!session) {
        throw new JacksonError('Unable to validate state from the origin request.', 403);
      }
    }
    if (!isIdPFlow) {
      // Resolve if there are multiple matches for SP login. TODO: Support multiple matches for IdP login
      samlConnection =
        samlConnections.length === 1
          ? samlConnections[0]
          : samlConnections.filter((c) => {
              return (
                c.clientID === session?.requested?.client_id ||
                (c.tenant === session?.requested?.tenant && c.product === session?.requested?.product)
              );
            })[0];
    }

    if (!samlConnection) {
      throw new JacksonError('SAML connection not found.', 403);
    }

    const validateOpts: Record<string, string> = {
      thumbprint: samlConnection.idpMetadata.thumbprint,
      audience: this.opts.samlAudience!,
      privateKey: samlConnection.certs.privateKey,
    };

    if (
      session &&
      session.redirect_uri &&
      !allowed.redirect(session.redirect_uri, samlConnection.redirectUrl)
    ) {
      throw new JacksonError('Redirect URL is not allowed.', 403);
    }

    if (session && session.id) {
      validateOpts.inResponseTo = session.id;
    }

    let profile;
    const redirect_uri = (session && session.redirect_uri) || samlConnection.defaultRedirectUrl;
    try {
      profile = await validateSAMLResponse(rawResponse, validateOpts);
    } catch (err: unknown) {
      // return error to redirect_uri
      return {
        redirect_url: OAuthErrorResponse({
          error: 'access_denied',
          error_description: getErrorMessage(err),
          redirect_uri,
          state: session?.requested?.state,
        }),
      };
    }
    // store details against a code
    const code = crypto.randomBytes(20).toString('hex');

    const codeVal: Record<string, unknown> = {
      profile,
      clientID: samlConnection.clientID,
      clientSecret: samlConnection.clientSecret,
      requested: session?.requested,
    };

    if (session) {
      codeVal.session = session;
    }

    try {
      await this.codeStore.put(code, codeVal);
    } catch (err: unknown) {
      // return error to redirect_uri
      return {
        redirect_url: OAuthErrorResponse({
          error: 'server_error',
          error_description: getErrorMessage(err),
          redirect_uri,
          state: session?.requested?.state,
        }),
      };
    }

    const params: Record<string, string> = {
      code,
    };

    if (session && session.state) {
      params.state = session.state;
    }

    const redirectUrl = redirect.success(redirect_uri, params);

    // delete the session
    try {
      await this.sessionStore.delete(RelayState);
    } catch (_err) {
      // ignore error
    }

    return { redirect_url: redirectUrl };
  }

  private async extractOIDCUserProfile(tokenSet: TokenSet, oidcClient: Client) {
    const profile: { claims: Partial<Profile & { raw: Record<string, unknown> }> } = { claims: {} };
    const idTokenClaims = tokenSet.claims();
    const userinfo = await oidcClient.userinfo(tokenSet);
    profile.claims.id = idTokenClaims.sub;
    profile.claims.email = idTokenClaims.email ?? userinfo.email;
    profile.claims.firstName = idTokenClaims.given_name ?? userinfo.given_name;
    profile.claims.lastName = idTokenClaims.family_name ?? userinfo.family_name;
    profile.claims.raw = userinfo;
    return profile;
  }

  public async oidcAuthzResponse(body: {
    code?: string;
    state?: string;
    error?: OAuthErrorHandlerParams['error'] | OIDCErrorCodes;
    error_description?: string;
  }): Promise<{ redirect_url?: string }> {
    const { code: opCode, state, error, error_description } = body;

    let RelayState = state || '';
    if (!RelayState) {
      throw new JacksonError('State from original request is missing.', 403);
    }
    RelayState = RelayState.replace(relayStatePrefix, '');
    const session = await this.sessionStore.get(RelayState);
    if (!session) {
      throw new JacksonError('Unable to validate state from the original request.', 403);
    }

    const oidcConnection = await this.connectionStore.get(session.id);

    if (session.redirect_uri && !allowed.redirect(session.redirect_uri, oidcConnection.redirectUrl)) {
      throw new JacksonError('Redirect URL is not allowed.', 403);
    }
    const redirect_uri = (session && session.redirect_uri) || oidcConnection.defaultRedirectUrl;

    if (error) {
      return {
        redirect_url: OAuthErrorResponse({
          error,
          error_description: error_description ?? 'Authorization failure at OIDC Provider',
          redirect_uri,
          state: session.state,
        }),
      };
    }

    // Reconstruct the oidcClient
    const { discoveryUrl, clientId, clientSecret } = oidcConnection.oidcProvider;
    let profile;
    try {
      const oidcIssuer = await Issuer.discover(discoveryUrl);
      const oidcClient = new oidcIssuer.Client({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uris: [this.opts.externalUrl + this.opts.oidcPath],
        response_types: ['code'],
      });
      const tokenSet = await oidcClient.callback(
        this.opts.externalUrl + this.opts.oidcPath,
        {
          code: opCode,
        },
        { code_verifier: session.oidcCodeVerifier }
      );
      profile = await this.extractOIDCUserProfile(tokenSet, oidcClient);
    } catch (err: unknown) {
      if (err) {
        return {
          redirect_url: OAuthErrorResponse({
            error: 'server_error',
            error_description: (err as errors.OPError)?.error || getErrorMessage(err),
            redirect_uri,
            state: session.state,
          }),
        };
      }
    }
    // store details against a code
    const code = crypto.randomBytes(20).toString('hex');

    const codeVal: Record<string, unknown> = {
      profile,
      clientID: oidcConnection.clientID,
      clientSecret: oidcConnection.clientSecret,
      requested: session?.requested,
    };

    if (session) {
      codeVal.session = session;
    }

    try {
      await this.codeStore.put(code, codeVal);
    } catch (err: unknown) {
      // return error to redirect_uri
      return {
        redirect_url: OAuthErrorResponse({
          error: 'server_error',
          error_description: getErrorMessage(err),
          redirect_uri,
          state: session.state,
        }),
      };
    }
    const params: Record<string, string> = {
      code,
    };

    if (session && session.state) {
      params.state = session.state;
    }

    const redirectUrl = redirect.success(redirect_uri, params);

    // delete the session
    try {
      await this.sessionStore.delete(RelayState);
    } catch (_err) {
      // ignore error
    }

    return { redirect_url: redirectUrl };
  }

  /**
   * @swagger
   *
   * /oauth/token:
   *   post:
   *     summary: Code exchange
   *     operationId: oauth-code-exchange
   *     tags:
   *       - OAuth
   *     consumes:
   *       - application/x-www-form-urlencoded
   *     parameters:
   *       - name: grant_type
   *         in: formData
   *         type: string
   *         description: Grant type should be 'authorization_code'
   *         default: authorization_code
   *         required: true
   *       - name: client_id
   *         in: formData
   *         type: string
   *         description: Use the client_id returned by the SAML connection API
   *         required: true
   *       - name: client_secret
   *         in: formData
   *         type: string
   *         description: Use the client_secret returned by the SAML connection API
   *         required: true
   *       - name: code_verifier
   *         in: formData
   *         type: string
   *         description: code_verifier against the code_challenge in the authz request (relevant to PKCE flow)
   *       - name: redirect_uri
   *         in: formData
   *         type: string
   *         description: Redirect URI
   *         required: true
   *       - name: code
   *         in: formData
   *         type: string
   *         description: Code
   *         required: true
   *     responses:
   *       '200':
   *         description: Success
   *         schema:
   *           type: object
   *           properties:
   *             access_token:
   *               type: string
   *             token_type:
   *               type: string
   *             expires_in:
   *               type: string
   *           example:
   *             access_token: 8958e13053832b5af58fdf2ee83f35f5d013dc74
   *             token_type: bearer
   *             expires_in: 300
   */
  public async token(body: OAuthTokenReq): Promise<OAuthTokenRes> {
    const {
      client_id,
      client_secret,
      code_verifier,
      code,
      grant_type = 'authorization_code',
      redirect_uri,
    } = body;

    metrics.increment('oauthToken');

    if (grant_type !== 'authorization_code') {
      throw new JacksonError('Unsupported grant_type', 400);
    }

    if (!code) {
      throw new JacksonError('Please specify code', 400);
    }

    const codeVal = await this.codeStore.get(code);
    if (!codeVal || !codeVal.profile) {
      throw new JacksonError('Invalid code', 403);
    }

    if (codeVal.requested?.redirect_uri) {
      if (redirect_uri !== codeVal.requested.redirect_uri) {
        throw new JacksonError(
          `Invalid request: ${!redirect_uri ? 'redirect_uri missing' : 'redirect_uri mismatch'}`,
          400
        );
      }
    }

    if (code_verifier) {
      // PKCE flow
      let cv = code_verifier;
      if (codeVal.session.code_challenge_method.toLowerCase() === 's256') {
        cv = codeVerifier.encode(code_verifier);
      }

      if (codeVal.session.code_challenge !== cv) {
        throw new JacksonError('Invalid code_verifier', 401);
      }
    } else if (client_id && client_secret) {
      // check if we have an encoded client_id
      if (client_id !== 'dummy') {
        const sp = getEncodedTenantProduct(client_id);
        if (!sp) {
          // OAuth flow
          if (client_id !== codeVal.clientID || client_secret !== codeVal.clientSecret) {
            throw new JacksonError('Invalid client_id or client_secret', 401);
          }
        } else {
          if (sp.tenant !== codeVal.requested?.tenant || sp.product !== codeVal.requested?.product) {
            throw new JacksonError('Invalid tenant or product', 401);
          }
          // encoded client_id, verify client_secret
          if (client_secret !== this.opts.clientSecretVerifier) {
            throw new JacksonError('Invalid client_secret', 401);
          }
        }
      } else {
        if (client_secret !== this.opts.clientSecretVerifier && client_secret !== codeVal.clientSecret) {
          throw new JacksonError('Invalid client_secret', 401);
        }
      }
    } else if (codeVal && codeVal.session) {
      throw new JacksonError('Please specify client_secret or code_verifier', 401);
    }

    // store details against a token
    const token = crypto.randomBytes(20).toString('hex');

    const tokenVal = {
      ...codeVal.profile,
      requested: codeVal.requested,
    };
    const requestedOIDCFlow = !!codeVal.requested?.oidc;
    const requestHasNonce = !!codeVal.requested?.nonce;
    if (requestedOIDCFlow) {
      const { jwtSigningKeys, jwsAlg } = this.opts.openid;
      if (!jwtSigningKeys || !isJWSKeyPairLoaded(jwtSigningKeys)) {
        throw new JacksonError('JWT signing keys are not loaded', 500);
      }
      let claims: Record<string, string> = requestHasNonce ? { nonce: codeVal.requested.nonce } : {};
      claims = {
        ...claims,
        id: codeVal.profile.claims.id,
        email: codeVal.profile.claims.email,
        firstName: codeVal.profile.claims.firstName,
        lastName: codeVal.profile.claims.lastName,
      };
      const signingKey = await loadJWSPrivateKey(jwtSigningKeys.private, jwsAlg!);
      const id_token = await new jose.SignJWT(claims)
        .setProtectedHeader({ alg: jwsAlg! })
        .setIssuedAt()
        .setIssuer(this.opts.samlAudience || '')
        .setSubject(codeVal.profile.claims.id)
        .setAudience(tokenVal.requested.client_id)
        .setExpirationTime(`${this.opts.db.ttl}s`) //  identity token only really needs to be valid long enough for it to be verified by the client application.
        .sign(signingKey);
      tokenVal.id_token = id_token;
      tokenVal.claims.sub = codeVal.profile.claims.id;
    }

    await this.tokenStore.put(token, tokenVal);

    // delete the code
    try {
      await this.codeStore.delete(code);
    } catch (_err) {
      // ignore error
    }

    const tokenResponse: OAuthTokenRes = {
      access_token: token,
      token_type: 'bearer',
      expires_in: this.opts.db.ttl!,
    };

    if (requestedOIDCFlow) {
      tokenResponse.id_token = tokenVal.id_token;
    }

    return tokenResponse;
  }

  /**
   * @swagger
   *
   * /oauth/userinfo:
   *   get:
   *     summary: Get profile
   *     operationId: oauth-get-profile
   *     tags:
   *       - OAuth
   *     responses:
   *       '200':
   *         description: Success
   *         schema:
   *           type: object
   *           properties:
   *             id:
   *               type: string
   *             email:
   *               type: string
   *             firstName:
   *               type: string
   *             lastName:
   *               type: string
   *             raw:
   *               type: object
   *             requested:
   *               type: object
   *           example:
   *             id: 32b5af58fdf
   *             email: jackson@coolstartup.com
   *             firstName: SAML
   *             lastName: Jackson
   *             raw: {
   *
   *             }
   *             requested: {
   *
   *             }
   */
  public async userInfo(token: string): Promise<Profile> {
    const rsp = await this.tokenStore.get(token);

    metrics.increment('oauthUserInfo');

    if (!rsp || !rsp.claims) {
      throw new JacksonError('Invalid token', 403);
    }

    return {
      ...rsp.claims,
      requested: rsp.requested,
    };
  }
}
