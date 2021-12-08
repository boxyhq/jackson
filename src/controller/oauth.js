const crypto = require('crypto');

const saml = require('../saml/saml.js');
const codeVerifier = require('./oauth/code-verifier.js');
const { indexNames } = require('./utils.js');
const dbutils = require('../db/utils.js');
const redirect = require('./oauth/redirect.js');
const allowed = require('./oauth/allowed.js');
const { JacksonError } = require('./error.js');

let configStore;
let sessionStore;
let codeStore;
let tokenStore;
let options;

const relayStatePrefix = 'boxyhq_jackson_';

function getEncodedClientId(client_id) {
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

const authorize = async (body) => {
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

  if (
    client_id &&
    client_id !== '' &&
    client_id !== 'undefined' &&
    client_id !== 'null'
  ) {
    // if tenant and product are encoded in the client_id then we parse it and check for the relevant config(s)
    const sp = getEncodedClientId(client_id);
    if (sp) {
      const samlConfigs = await configStore.getByIndex({
        name: indexNames.tenantProduct,
        value: dbutils.keyFromParts(sp.tenant, sp.product),
      });

      if (!samlConfigs || samlConfigs.length === 0) {
        throw new JacksonError('SAML configuration not found.', 403);
      }

      // TODO: Support multiple matches
      samlConfig = samlConfigs[0];
    } else {
      samlConfig = await configStore.get(client_id);
    }
  } else {
    const samlConfigs = await configStore.getByIndex({
      name: indexNames.tenantProduct,
      value: dbutils.keyFromParts(tenant, product),
    });

    if (!samlConfigs || samlConfigs.length === 0) {
      throw new JacksonError('SAML configuration not found.', 403);
    }

    // TODO: Support multiple matches
    samlConfig = samlConfigs[0];
  }

  if (!samlConfig) {
    throw new JacksonError('SAML configuration not found.', 403);
  }

  if (!allowed.redirect(redirect_uri, samlConfig.redirectUrl)) {
    throw new JacksonError('Redirect URL is not allowed.', 403);
  }

  const samlReq = saml.request({
    entityID: options.samlAudience,
    callbackUrl: options.externalUrl + options.samlPath,
    signingKey: samlConfig.certs.privateKey,
  });

  const sessionId = crypto.randomBytes(16).toString('hex');

  await sessionStore.put(sessionId, {
    id: samlReq.id,
    redirect_uri,
    response_type,
    state,
    code_challenge,
    code_challenge_method,
  });

  const redirectUrl = redirect.success(samlConfig.idpMetadata.sso.redirectUrl, {
    RelayState: relayStatePrefix + sessionId,
    SAMLRequest: Buffer.from(samlReq.request).toString('base64'),
  });

  return { redirect_url: redirectUrl };
};

const samlResponse = async (body) => {
  const { SAMLResponse } = body; // RelayState will contain the sessionId from earlier quasi-oauth flow

  let RelayState = body.RelayState || '';

  if (!options.idpEnabled && !RelayState.startsWith(relayStatePrefix)) {
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

  const samlConfigs = await configStore.getByIndex({
    name: indexNames.entityID,
    value: parsedResp.issuer,
  });

  if (!samlConfigs || samlConfigs.length === 0) {
    throw new JacksonError('SAML configuration not found.', 403);
  }

  // TODO: Support multiple matches
  const samlConfig = samlConfigs[0];

  let session;

  if (RelayState !== '') {
    session = await sessionStore.get(RelayState);
    if (!session) {
      throw new JacksonError(
        'Unable to validate state from the origin request.',
        403
      );
    }
  }

  let validateOpts = {
    thumbprint: samlConfig.idpMetadata.thumbprint,
    audience: options.samlAudience,
  };

  if (session && session.id) {
    validateOpts.inResponseTo = session.id;
  }

  const profile = await saml.validateAsync(rawResponse, validateOpts);

  // store details against a code
  const code = crypto.randomBytes(20).toString('hex');

  let codeVal = {
    profile,
    clientID: samlConfig.clientID,
    clientSecret: samlConfig.clientSecret,
  };

  if (session) {
    codeVal.session = session;
  }

  await codeStore.put(code, codeVal);

  if (
    session &&
    session.redirect_uri &&
    !allowed.redirect(session.redirect_uri, samlConfig.redirectUrl)
  ) {
    throw new JacksonError('Redirect URL is not allowed.', 403);
  }

  let params = {
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
};

const token = async (body) => {
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

  const codeVal = await codeStore.get(code);
  if (!codeVal || !codeVal.profile) {
    throw new JacksonError('Invalid code', 403);
  }

  if (client_id && client_secret) {
    // check if we have an encoded client_id
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

  await tokenStore.put(token, codeVal.profile);

  return {
    access_token: token,
    token_type: 'bearer',
    expires_in: options.db.ttl,
  };
};

const userInfo = async (token) => {
  const { claims } = await tokenStore.get(token);

  return claims;
};

module.exports = (opts) => {
  configStore = opts.configStore;
  sessionStore = opts.sessionStore;
  codeStore = opts.codeStore;
  tokenStore = opts.tokenStore;
  options = opts.opts;

  return {
    authorize,
    samlResponse,
    token,
    userInfo,
  };
};
