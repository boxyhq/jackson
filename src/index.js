const express = require('express');
const crypto = require('crypto');

const saml = require('./saml.js');
const DB = require('./db/db.js');
const store = require('./db/store.js');
const env = require('./env.js');
const redirect = require('./redirect.js');
const allowed = require('./allowed.js');

const samlPath = '/auth/saml';
const relayStatePrefix = 'boxyhq_jackson_';

let configStore;
let sessionStore;
let tokenStore;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get(samlPath + '/authorize', async (req, res) => {
  const {
    response_type = 'token',
    client_id,
    redirect_uri,
    state,
    tenant,
    product,
  } = req.query;

  if (!redirect_uri) {
    return res.status(403).send('Please specify a redirect URL.');
  }

  if (!state) {
    return res
      .status(403)
      .send('Please specify a state to safeguard against XRSF attacks.');
  }

  let samlConfig;

  if (client_id) {
    samlConfig = await configStore.getAsync(client_id);
  } else {
    samlConfigs = await configStore.getByIndexAsync({
      name: DB.indexNames.tenantProduct,
      value: DB.keyFromParts(tenant, product),
    });

    if (!samlConfigs || samlConfigs.length == 0) {
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
  });

  const sessionId = crypto.randomBytes(16).toString('hex');

  await sessionStore.putAsync(sessionId, {
    id: samlReq.id,
    redirect_uri,
    response_type,
    state,
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

  RelayState = RelayState.replace(relayStatePrefix, '');

  const rawResponse = Buffer.from(SAMLResponse, 'base64').toString();

  const parsedResp = await saml.parseAsync(rawResponse);

  const samlConfigs = await configStore.getByIndexAsync({
    name: DB.indexNames.entityID,
    value: parsedResp.issuer,
  });

  if (!samlConfigs || samlConfigs.length == 0) {
    return res.status(403).send('SAML configuration not found.');
  }

  // TODO: Support multiple matches
  const samlConfig = samlConfigs[0];

  let session;

  if (RelayState !== '') {
    session = await sessionStore.getAsync(RelayState);
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

  // store details against a token
  const token = crypto.randomBytes(20).toString('hex');

  await tokenStore.putAsync(token, profile);

  if (
    session &&
    session.redirect_uri &&
    !allowed.redirect(session.redirect_uri, samlConfig.redirectUrl)
  ) {
    return res.status(403).send('Redirect URL is not allowed.');
  }

  let params = {
    token,
  };

  if (session.state) {
    params.state = session.state;
  }

  return redirect.success(
    res,
    session.redirect_uri || samlConfig.defaultRedirectUrl,
    params
  );
});

app.post(samlPath + '/me', async (req, res) => {
  const token = extractBearerToken(req);

  const profile = await tokenStore.getAsync(token);

  res.json(profile);
});

const server = app.listen(env.hostPort, async () => {
  console.log(
    `🚀 The path of the righteous server: http://${env.hostUrl}:${env.hostPort}`
  );

  const db = await DB.newAsync('redis', {});
  configStore = db.store('saml:config');
  sessionStore = db.store('saml:session', 300);
  tokenStore = db.store('saml:token', 300);
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
const internalApp = express();

internalApp.use(express.json());
internalApp.use(express.urlencoded({ extended: true }));

internalApp.post(samlPath + '/config', async (req, res) => {
  const { rawMetadata, defaultRedirectUrl, redirectUrl, tenant, product } =
    req.body;
  const idpMetadata = await saml.parseMetadataAsync(rawMetadata);

  let clientID = store.keyDigest(
    DB.keyFromParts(tenant, product, idpMetadata.entityID)
  );

  await configStore.putAsync(
    clientID,
    {
      idpMetadata,
      defaultRedirectUrl,
      redirectUrl: JSON.parse(redirectUrl),
      tenant,
      product,
      clientID,
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
  });
});

const internalServer = internalApp.listen(env.internalPort, async () => {
  console.log(
    `🚀 The path of the righteous internal server: http://${env.internalUrl}:${env.internalPort}`
  );
});

module.exports = {
  server,
  internalServer,
};
