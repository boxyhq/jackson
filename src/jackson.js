const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const saml = require('./saml/saml.js');
const x509 = require('./saml/x509.js');
const DB = require('./db/db.js');
const dbutils = require('./db/db-utils.js');
const env = require('./env.js');
const redirect = require('./redirect.js');
const allowed = require('./oauth/allowed.js');
const codeVerifier = require('./oauth/code-verifier.js');

const oauthPath = '/oauth';
const samlPath = '/oauth/saml';
const apiPath = '/api/v1/saml';

const relayStatePrefix = 'boxyhq_jackson_';

let configStore;
let sessionStore;
let codeStore;
let tokenStore;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function getEncodedClientId(client_id) {
  try {
    const sp = new URLSearchParams(client_id);
    return {
      tenant: sp.get('tenant'),
      product: sp.get('product'),
    };
  } catch (err) {}
}

app.get(oauthPath + '/authorize', async (req, res) => {
  const {
    response_type = 'code',
    client_id,
    redirect_uri,
    state,
    tenant,
    product,
    code_challenge,
    code_challenge_method = '',
    provider = 'saml',
  } = req.query;

  if (!redirect_uri) {
    return res.status(403).send('Please specify a redirect URL.');
  }

  if (!state) {
    return res
      .status(403)
      .send('Please specify a state to safeguard against XSRF attacks.');
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
        name: DB.indexNames.tenantProduct,
        value: DB.keyFromParts(sp.tenant, sp.product),
      });

      if (!samlConfigs || samlConfigs.length === 0) {
        return res.status(403).send('SAML configuration not found.');
      }

      // TODO: Support multiple matches
      samlConfig = samlConfigs[0];
    } else {
      samlConfig = await configStore.get(client_id);
    }
  } else {
    const samlConfigs = await configStore.getByIndex({
      name: DB.indexNames.tenantProduct,
      value: DB.keyFromParts(tenant, product),
    });

    if (!samlConfigs || samlConfigs.length === 0) {
      return res.status(403).send('SAML configuration not found.');
    }

    // TODO: Support multiple matches
    samlConfig = samlConfigs[0];
  }

  if (!samlConfig) {
    return res.status(403).send('SAML configuration not found.');
  }

  if (!allowed.redirect(redirect_uri, samlConfig.redirectUrl)) {
    return res.status(403).send('Redirect URL is not allowed.');
  }

  const samlReq = saml.request({
    entityID: samlConfig.idpMetadata.entityID,
    callbackUrl: env.externalUrl + samlPath,
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

  return redirect.success(res, samlConfig.idpMetadata.sso.redirectUrl, {
    RelayState: relayStatePrefix + sessionId,
    SAMLRequest: Buffer.from(samlReq.request).toString('base64'),
  });
});

app.post(samlPath, async (req, res) => {
  const { SAMLResponse } = req.body; // RelayState will contain the sessionId from earlier quasi-oauth flow

  let RelayState = req.body.RelayState || '';

  if (!env.idpEnabled && !RelayState.startsWith(relayStatePrefix)) {
    // IDP is disabled so block the request
    return res
      .status(403)
      .send(
        'IdP (Identity Provider) flow has been disabled. Please head to your Service Provider to login.'
      );
  }

  if (!RelayState.startsWith(relayStatePrefix)) {
    RelayState = '';
  }

  RelayState = RelayState.replace(relayStatePrefix, '');

  const rawResponse = Buffer.from(SAMLResponse, 'base64').toString();

  const parsedResp = await saml.parseAsync(rawResponse);

  const samlConfigs = await configStore.getByIndex({
    name: DB.indexNames.entityID,
    value: parsedResp.issuer,
  });

  if (!samlConfigs || samlConfigs.length === 0) {
    return res.status(403).send('SAML configuration not found.');
  }

  // TODO: Support multiple matches
  const samlConfig = samlConfigs[0];

  let session;

  if (RelayState !== '') {
    session = await sessionStore.get(RelayState);
    if (!session) {
      return redirect.error(
        res,
        samlConfig.defaultRedirectUrl,
        'Unable to validate state from the origin request.'
      );
    }
  }

  let validateOpts = {
    thumbprint: samlConfig.idpMetadata.thumbprint,
    audience: env.samlAudience,
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
    return res.status(403).send('Redirect URL is not allowed.');
  }

  let params = {
    code,
  };

  if (session && session.state) {
    params.state = session.state;
  }

  return redirect.success(
    res,
    session && session.redirect_uri || samlConfig.defaultRedirectUrl,
    params
  );
});

app.post(oauthPath + '/token', cors(), async (req, res) => {
  const {
    client_id,
    client_secret,
    code_verifier,
    code,
    grant_type = 'authorization_code',
  } = req.body;

  if (grant_type !== 'authorization_code') {
    return res.send('Unsupported grant_type');
  }

  if (!code) {
    return res.send('Please specify code');
  }

  const codeVal = await codeStore.get(code);
  if (!codeVal || !codeVal.profile) {
    return res.send('Invalid code');
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
        return res.send('Invalid client_id or client_secret');
      }
    }
  } else if (code_verifier) {
    // PKCE flow
    let cv = code_verifier;
    if (codeVal.session.code_challenge_method.toLowerCase() === 's256') {
      cv = codeVerifier.encode(code_verifier);
    }

    if (codeVal.session.code_challenge !== cv) {
      return res.send('Invalid code_verifier');
    }
  } else if (codeVal && codeVal.session) {
    return res.send('Please specify client_secret or code_verifier');
  }

  // store details against a token
  const token = crypto.randomBytes(20).toString('hex');

  await tokenStore.put(token, codeVal.profile);

  res.json({
    access_token: token,
    token_type: 'bearer',
    expires_in: 300,
  });
});

app.get(oauthPath + '/userinfo', cors(), async (req, res) => {
  let token = extractBearerToken(req);

  // check for query param
  if (!token) {
    token = req.query.access_token;
  }

  const profile = await tokenStore.get(token);

  res.json(profile.claims);
});

const server = app.listen(env.hostPort, async () => {
  console.log(
    `🚀 The path of the righteous server: http://${env.hostUrl}:${env.hostPort}`
  );

  const db = await DB.new(env.dbEngine, {
    url: env.dbUrl,
  });
  configStore = db.store('saml:config');
  sessionStore = db.store('oauth:session', 300);
  codeStore = db.store('oauth:code', 300);
  tokenStore = db.store('oauth:token', 300);
});

const extractBearerToken = (req) => {
  const authHeader = req.get('authorization');
  const parts = (authHeader || '').split(' ');
  if (parts.length > 1) {
    return parts[1];
  }

  return null;
};

// Internal routes, recommended not to expose this to the public interface though it would be guarded by API key(s)
let internalApp = app;

if (env.useInternalServer) {
  internalApp = express();

  internalApp.use(express.json());
  internalApp.use(express.urlencoded({ extended: true }));
}

internalApp.post(apiPath + '/config', async (req, res) => {
  const { rawMetadata, defaultRedirectUrl, redirectUrl, tenant, product } =
    req.body;
  const idpMetadata = await saml.parseMetadataAsync(rawMetadata);

  let clientID = dbutils.keyDigest(
    DB.keyFromParts(tenant, product, idpMetadata.entityID)
  );
  let clientSecret;

  let exists = await configStore.get(clientID);
  if (exists) {
    clientSecret = exists.clientSecret;
  } else {
    clientSecret = crypto.randomBytes(24).toString('hex');
  }

  const certs = await x509.generate();
  if (!certs) {
    throw new Error('Error generating x59 certs');
  }

  await configStore.put(
    clientID,
    {
      idpMetadata,
      defaultRedirectUrl,
      redirectUrl: JSON.parse(redirectUrl),
      tenant,
      product,
      clientID,
      clientSecret,
      certs,
    },
    {
      // secondary index on entityID
      name: DB.indexNames.entityID,
      value: idpMetadata.entityID,
    },
    {
      // secondary index on tenant + product
      name: DB.indexNames.tenantProduct,
      value: DB.keyFromParts(tenant, product),
    }
  );

  res.json({
    client_id: clientID,
    client_secret: clientSecret,
  });
});

let internalServer = server;
if (env.useInternalServer) {
  internalServer = internalApp.listen(env.internalPort, async () => {
    console.log(
      `🚀 The path of the righteous internal server: http://${env.internalUrl}:${env.internalPort}`
    );
  });
}

module.exports = {
  server,
  internalServer,
};
