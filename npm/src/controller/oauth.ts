import crypto from 'crypto';
import { promisify } from 'util';
import { deflateRaw } from 'zlib';
import * as jose from 'jose';
import * as dbutils from '../db/utils';
import * as metrics from '../opentelemetry/metrics';

import saml from '@boxyhq/saml20';
import claims from '../saml/claims';

import {
  IOAuthController,
  JacksonOption,
  OAuthReqBody,
  OAuthTokenReq,
  OAuthTokenRes,
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

const deflateRawAsync = promisify(deflateRaw);

const validateResponse = async (rawResponse: string, validateOpts) => {
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
  private configStore: Storable;
  private sessionStore: Storable;
  private codeStore: Storable;
  private tokenStore: Storable;
  private opts: JacksonOption;

  constructor({ configStore, sessionStore, codeStore, tokenStore, opts }) {
    this.configStore = configStore;
    this.sessionStore = sessionStore;
    this.codeStore = codeStore;
    this.tokenStore = tokenStore;
    this.opts = opts;
  }

  private resolveMultipleConfigMatches(
    samlConfigs,
    idp_hint,
    originalParams,
    isIdpFlow = false
  ): { resolvedSamlConfig?: unknown; redirect_url?: string; app_select_form?: string } {
    if (samlConfigs.length > 1) {
      if (idp_hint) {
        return { resolvedSamlConfig: samlConfigs.find(({ clientID }) => clientID === idp_hint) };
      } else if (this.opts.idpDiscoveryPath) {
        if (!isIdpFlow) {
          // redirect to IdP selection page
          const idpList = samlConfigs.map(({ idpMetadata: { provider }, clientID }) =>
            JSON.stringify({
              provider,
              clientID,
            })
          );
          return {
            redirect_url: redirect.success(this.opts.externalUrl + this.opts.idpDiscoveryPath, {
              ...originalParams,
              idp: idpList,
            }),
          };
        } else {
          const appList = samlConfigs.map(({ product, name, description, clientID }) => ({
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

  public async authorize(body: OAuthReqBody): Promise<{ redirect_url?: string; authorize_form?: string }> {
    const {
      response_type = 'code',
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
      code_challenge_method = '',
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      provider = 'saml',
      idp_hint,
    } = body;

    let requestedTenant = tenant;
    let requestedProduct = product;

    metrics.increment('oauthAuthorize');

    if (!redirect_uri) {
      throw new JacksonError('Please specify a redirect URL.', 400);
    }

    let samlConfig;
    const requestedScopes = getScopeValues(scope);
    const requestedOIDCFlow = requestedScopes.includes('openid');

    if (tenant && product) {
      const samlConfigs = await this.configStore.getByIndex({
        name: IndexNames.TenantProduct,
        value: dbutils.keyFromParts(tenant, product),
      });

      if (!samlConfigs || samlConfigs.length === 0) {
        throw new JacksonError('SAML configuration not found.', 403);
      }

      samlConfig = samlConfigs[0];

      // Support multiple matches
      const { resolvedSamlConfig, redirect_url } = this.resolveMultipleConfigMatches(samlConfigs, idp_hint, {
        response_type,
        client_id,
        redirect_uri,
        state,
        tenant,
        product,
        code_challenge,
        code_challenge_method,
        provider,
      });

      if (redirect_url) {
        return { redirect_url };
      }

      if (resolvedSamlConfig) {
        samlConfig = resolvedSamlConfig;
      }
    } else if (client_id && client_id !== '' && client_id !== 'undefined' && client_id !== 'null') {
      // if tenant and product are encoded in the client_id then we parse it and check for the relevant config(s)
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

        const samlConfigs = await this.configStore.getByIndex({
          name: IndexNames.TenantProduct,
          value: dbutils.keyFromParts(sp.tenant, sp.product),
        });

        if (!samlConfigs || samlConfigs.length === 0) {
          throw new JacksonError('SAML configuration not found.', 403);
        }

        samlConfig = samlConfigs[0];
        // Support multiple matches
        const { resolvedSamlConfig, redirect_url } = this.resolveMultipleConfigMatches(
          samlConfigs,
          idp_hint,
          {
            response_type,
            client_id,
            redirect_uri,
            state,
            tenant,
            product,
            code_challenge,
            code_challenge_method,
            provider,
          }
        );

        if (redirect_url) {
          return { redirect_url };
        }

        if (resolvedSamlConfig) {
          samlConfig = resolvedSamlConfig;
        }
      } else {
        samlConfig = await this.configStore.get(client_id);
        if (samlConfig) {
          requestedTenant = samlConfig.tenant;
          requestedProduct = samlConfig.product;
        }
      }
    } else {
      throw new JacksonError('You need to specify client_id or tenant & product', 403);
    }

    if (!samlConfig) {
      throw new JacksonError('SAML configuration not found.', 403);
    }

    if (!allowed.redirect(redirect_uri, samlConfig.redirectUrl)) {
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

    let ssoUrl;
    let post = false;

    const { sso } = samlConfig.idpMetadata;

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
      const samlReq = saml.request({
        ssoUrl,
        entityID: this.opts.samlAudience!,
        callbackUrl: this.opts.externalUrl + this.opts.samlPath,
        signingKey: samlConfig.certs.privateKey,
        publicKey: samlConfig.certs.publicKey,
      });

      const sessionId = crypto.randomBytes(16).toString('hex');

      const requested = { client_id, state } as Record<string, string | boolean | string[]>;
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

      await this.sessionStore.put(sessionId, {
        id: samlReq.id,
        redirect_uri,
        response_type,
        state,
        code_challenge,
        code_challenge_method,
        requested,
      });

      const relayState = relayStatePrefix + sessionId;

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
    const samlConfigs = await this.configStore.getByIndex({
      name: IndexNames.EntityID,
      value: issuer,
    });

    if (!samlConfigs || samlConfigs.length === 0) {
      throw new JacksonError('SAML configuration not found.', 403);
    }

    let samlConfig = samlConfigs[0];

    if (isIdPFlow) {
      RelayState = '';
      const { resolvedSamlConfig, app_select_form } = this.resolveMultipleConfigMatches(
        samlConfigs,
        idp_hint,
        { SAMLResponse },
        true
      );
      if (app_select_form) {
        return { app_select_form };
      }
      if (resolvedSamlConfig) {
        samlConfig = resolvedSamlConfig;
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
      samlConfig =
        samlConfigs.length === 1
          ? samlConfigs[0]
          : samlConfigs.filter((c) => {
              return (
                c.clientID === session?.requested?.client_id ||
                (c.tenant === session?.requested?.tenant && c.product === session?.requested?.product)
              );
            })[0];
    }

    if (!samlConfig) {
      throw new JacksonError('SAML configuration not found.', 403);
    }

    const validateOpts: Record<string, string> = {
      thumbprint: samlConfig.idpMetadata.thumbprint,
      audience: this.opts.samlAudience!,
      privateKey: samlConfig.certs.privateKey,
    };

    if (session && session.redirect_uri && !allowed.redirect(session.redirect_uri, samlConfig.redirectUrl)) {
      throw new JacksonError('Redirect URL is not allowed.', 403);
    }

    if (session && session.id) {
      validateOpts.inResponseTo = session.id;
    }

    let profile;
    const redirect_uri = (session && session.redirect_uri) || samlConfig.defaultRedirectUrl;
    try {
      profile = await validateResponse(rawResponse, validateOpts);
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
      clientID: samlConfig.clientID,
      clientSecret: samlConfig.clientSecret,
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
   *         description: Use the client_id returned by the SAML config API
   *         required: true
   *       - name: client_secret
   *         in: formData
   *         type: string
   *         description: Use the client_secret returned by the SAML config API
   *         required: true
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
    const { client_id, client_secret, code_verifier, code, grant_type = 'authorization_code' } = body;

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
    const requestedOIDCFlow = !!codeVal.requested.oidc;
    const requestHasNonce = !!codeVal.requested.nonce;
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
      const signingKey = await loadJWSPrivateKey(jwtSigningKeys.private, jwsAlg);
      const id_token = await new jose.SignJWT(claims)
        .setProtectedHeader({ alg: jwsAlg })
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
   *           example:
   *             id: 32b5af58fdf
   *             email: jackson@coolstartup.com
   *             firstName: SAML
   *             lastName: Jackson
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
