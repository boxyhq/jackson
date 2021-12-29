import crypto from 'crypto';
import * as dbutils from '../db/utils';
import {
  IOAuthController,
  OAuthReqBody,
  OAuthTokenReq,
  OAuthTokenRes,
  Profile,
  SAMLResponsePayload,
} from 'saml-jackson';
import { JacksonError } from './error';
import * as allowed from './oauth/allowed';
import * as codeVerifier from './oauth/code-verifier';
import * as redirect from './oauth/redirect';
import { IndexNames } from './utils';

import saml from '../saml/saml';

const relayStatePrefix = 'boxyhq_jackson_';

function getEncodedClientId(
  client_id: string
): { tenant: string | null; product: string | null } | null {
  try {
    const sp = new URLSearchParams(client_id);
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

export class OAuthController implements IOAuthController {
  private configStore;
  private sessionStore;
  private codeStore;
  private tokenStore;
  private opts;

  constructor({ configStore, sessionStore, codeStore, tokenStore, opts }) {
    this.configStore = configStore;
    this.sessionStore = sessionStore;
    this.codeStore = codeStore;
    this.tokenStore = tokenStore;
    this.opts = opts;
  }

  public async authorize(
    body: OAuthReqBody
  ): Promise<{ redirect_url: string }> {
    const {
      response_type = 'code',
      client_id,
      redirect_uri,
      state,
      tenant,
      product,
      code_challenge,
      code_challenge_method = '',
      // eslint-disable-next-line no-unused-vars
      provider = 'saml',
    } = body;

    if (!redirect_uri) {
      throw new JacksonError('Please specify a redirect URL.', 400);
    }

    if (!state) {
      throw new JacksonError(
        'Please specify a state to safeguard against XSRF attacks.',
        400
      );
    }

    let samlConfig;

    if (tenant && product) {
      const samlConfigs = await this.configStore.getByIndex({
        name: IndexNames.TenantProduct,
        value: dbutils.keyFromParts(tenant, product),
      });

      if (!samlConfigs || samlConfigs.length === 0) {
        throw new JacksonError('SAML configuration not found.', 403);
      }

      // TODO: Support multiple matches
      samlConfig = samlConfigs[0];
    } else if (
      client_id &&
      client_id !== '' &&
      client_id !== 'undefined' &&
      client_id !== 'null'
    ) {
      // if tenant and product are encoded in the client_id then we parse it and check for the relevant config(s)
      const sp = getEncodedClientId(client_id);
      if (sp?.tenant) {
        const samlConfigs = await this.configStore.getByIndex({
          name: IndexNames.TenantProduct,
          value: dbutils.keyFromParts(sp.tenant, sp.product || ''),
        });

        if (!samlConfigs || samlConfigs.length === 0) {
          throw new JacksonError('SAML configuration not found.', 403);
        }

        // TODO: Support multiple matches
        samlConfig = samlConfigs[0];
      } else {
        samlConfig = await this.configStore.get(client_id);
      }
    } else {
      throw new JacksonError(
        'You need to specify client_id or tenant & product',
        403
      );
    }

    if (!samlConfig) {
      throw new JacksonError('SAML configuration not found.', 403);
    }

    if (!allowed.redirect(redirect_uri, samlConfig.redirectUrl)) {
      throw new JacksonError('Redirect URL is not allowed.', 403);
    }

    const samlReq = saml.request({
      entityID: this.opts.samlAudience,
      callbackUrl: this.opts.externalUrl + this.opts.samlPath,
      signingKey: samlConfig.certs.privateKey,
    });

    const sessionId = crypto.randomBytes(16).toString('hex');

    await this.sessionStore.put(sessionId, {
      id: samlReq.id,
      redirect_uri,
      response_type,
      state,
      code_challenge,
      code_challenge_method,
    });

    const redirectUrl = redirect.success(
      samlConfig.idpMetadata.sso.redirectUrl,
      {
        RelayState: relayStatePrefix + sessionId,
        SAMLRequest: Buffer.from(samlReq.request).toString('base64'),
      }
    );

    return { redirect_url: redirectUrl };
  }

  public async samlResponse(
    body: SAMLResponsePayload
  ): Promise<{ redirect_url: string }> {
    const { SAMLResponse } = body; // RelayState will contain the sessionId from earlier quasi-oauth flow

    let RelayState = body.RelayState || '';

    if (!this.opts.idpEnabled && !RelayState.startsWith(relayStatePrefix)) {
      // IDP is disabled so block the request

      throw new JacksonError(
        'IdP (Identity Provider) flow has been disabled. Please head to your Service Provider to login.',
        403
      );
    }

    if (!RelayState.startsWith(relayStatePrefix)) {
      RelayState = '';
    }

    RelayState = RelayState.replace(relayStatePrefix, '');

    const rawResponse = Buffer.from(SAMLResponse, 'base64').toString();

    const parsedResp = await saml.parseAsync(rawResponse);

    const samlConfigs = await this.configStore.getByIndex({
      name: IndexNames.EntityID,
      value: parsedResp?.issuer,
    });

    if (!samlConfigs || samlConfigs.length === 0) {
      throw new JacksonError('SAML configuration not found.', 403);
    }

    // TODO: Support multiple matches
    const samlConfig = samlConfigs[0];

    let session;

    if (RelayState !== '') {
      session = await this.sessionStore.get(RelayState);
      if (!session) {
        throw new JacksonError(
          'Unable to validate state from the origin request.',
          403
        );
      }
    }

    let validateOpts: any = {
      thumbprint: samlConfig.idpMetadata.thumbprint,
      audience: this.opts.samlAudience,
    };

    if (session && session.id) {
      validateOpts.inResponseTo = session.id;
    }

    const profile = await saml.validateAsync(rawResponse, validateOpts);

    // store details against a code
    const code = crypto.randomBytes(20).toString('hex');

    let codeVal: any = {
      profile,
      clientID: samlConfig.clientID,
      clientSecret: samlConfig.clientSecret,
    };

    if (session) {
      codeVal.session = session;
    }

    await this.codeStore.put(code, codeVal);

    if (
      session &&
      session.redirect_uri &&
      !allowed.redirect(session.redirect_uri, samlConfig.redirectUrl)
    ) {
      throw new JacksonError('Redirect URL is not allowed.', 403);
    }

    let params: any = {
      code,
    };

    if (session && session.state) {
      params.state = session.state;
    }

    const redirectUrl = redirect.success(
      (session && session.redirect_uri) || samlConfig.defaultRedirectUrl,
      params
    );

    return { redirect_url: redirectUrl };
  }

  public async token(body: OAuthTokenReq): Promise<OAuthTokenRes> {
    const {
      client_id,
      client_secret,
      code_verifier,
      code,
      grant_type = 'authorization_code',
    } = body;

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

    if (client_id && client_secret) {
      // check if we have an encoded client_id
      if (client_id !== 'dummy' && client_secret !== 'dummy') {
        const sp = getEncodedClientId(client_id);
        if (!sp) {
          // OAuth flow
          if (
            client_id !== codeVal.clientID ||
            client_secret !== codeVal.clientSecret
          ) {
            throw new JacksonError('Invalid client_id or client_secret', 401);
          }
        }
      }
    } else if (code_verifier) {
      // PKCE flow
      let cv = code_verifier;
      if (codeVal.session.code_challenge_method.toLowerCase() === 's256') {
        cv = codeVerifier.encode(code_verifier);
      }

      if (codeVal.session.code_challenge !== cv) {
        throw new JacksonError('Invalid code_verifier', 401);
      }
    } else if (codeVal && codeVal.session) {
      throw new JacksonError(
        'Please specify client_secret or code_verifier',
        401
      );
    }

    // store details against a token
    const token = crypto.randomBytes(20).toString('hex');

    await this.tokenStore.put(token, codeVal.profile);

    return {
      access_token: token,
      token_type: 'bearer',
      expires_in: this.opts.db.ttl,
    };
  }

  public async userInfo(token: string): Promise<Profile> {
    const { claims } = await this.tokenStore.get(token);

    return claims;
  }
}
