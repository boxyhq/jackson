const express = require('express');
const crypto = require('crypto');

const saml = require('./saml.js');
const DB = require('./db/db.js');
const store = require('./db/store.js');
const env = require('./env.js');
const redirect = require('./redirect.js');

const samlPath = '/auth/saml';

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
  let samlConfig;

  if (client_id) {
    samlConfig = await configStore.getAsync(client_id);
  } else {
    samlConfigs = await configStore.getByIndexAsync({
      name: DB.indexNames.tenantProduct,
      value: DB.keyFromParts(tenant, product),
    });

    // TODO: Support multiple matches
    samlConfig = samlConfigs[0];
  }

  const samlReq = saml.request({
    entityID: samlConfig.idpMetadata.entityID,
    callbackUrl: env.externalUrl + samlPath,
  });

  await sessionStore.putAsync(
    samlReq.id,
    JSON.stringify({
      state,
      redirect_uri,
      response_type,
    })
  );

  return redirect.success(res, samlConfig.idpMetadata.sso.redirectUrl, {
    RelayState: state,
    SAMLRequest: Buffer.from(samlReq.request).toString('base64'),
  });
});

app.post(samlPath, async (req, res) => {
  const { SAMLResponse, RelayState } = req.body; // RelayState will contain the state from earlier quasi-oauth flow

  const rawResponse = Buffer.from(SAMLResponse, 'base64').toString();

  // if origin is not null, check if it is allowed and then validate against config

  const parsedResp = await saml.parseAsync(rawResponse);

  if (parsedResp.inResponseTo) {
    // validate InResponseTo and state
    const id = await sessionStore.getAsync(parsedResp.inResponseTo);
    if (!id) {
      //return redirect.error(res, )
    }

    if (id.state !== RelayState) {
      //return redirect.error(res, )
    }
  }

  const samlConfigs = await configStore.getByIndexAsync({
    name: DB.indexNames.entityID,
    value: parsedResp.issuer,
  });

  // TODO: Support multiple matches
  const samlConfig = samlConfigs[0];

  const profile = await saml.validateAsync(rawResponse, {
    thumbprint: samlConfig.idpMetadata.thumbprint,
    audience: env.samlAudience,
  });

  // store details against a token
  const token = crypto.randomBytes(20).toString('hex');

  await tokenStore.putAsync(token, profile);

  return redirect.success(res, samlConfig.appRedirectUrl, {
    token,
    state: RelayState,
  });
});

app.post(samlPath + '/config', async (req, res) => {
  const { rawMetadata, appRedirectUrl, tenant, product } = req.body;
  const idpMetadata = await saml.parseMetadataAsync(rawMetadata);

  let clientID = store.keyDigest(
    DB.keyFromParts(tenant, product, idpMetadata.entityID)
  );

  await configStore.putAsync(
    clientID,
    {
      idpMetadata,
      appRedirectUrl,
      tenant,
      product,
      clientID,
    },
    { // secondary index on entityID
      name: DB.indexNames.entityID,
      value: idpMetadata.entityID,
    },
    { // secondary index on tenant + product
      name: DB.indexNames.tenantProduct,
      value: DB.keyFromParts(tenant, product),
    }
  );

  res.json({
    client_id: clientID,
  });
});

app.post(samlPath + '/me', async (req, res) => {
  const token = extractBearerToken(req);
console.log('token=', token);
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
}

module.exports = server;
