const express = require('express');
const { v4: uuidv4 } = require('uuid');

const saml = require('./saml.js');
const DB = require('./db/db.js');
const store = require('./db/store.js');
const env = require('./env.js');
const redirect = require('./redirect.js');

const samlPath = '/auth/saml';

let configStore;
let sessionStore;
let codeStore;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get(samlPath + '/authorize', async (req, res) => {
  const {
    response_type = 'code',
    client_id,
    redirect_uri,
    state,
    tenant,
    product,
  } = req.query;
  let idpMeta;

  if (client_id) {
    idpMeta = await configStore.getAsync(client_id);
  } else {
    idpMetas = await configStore.getByIndexAsync({
      name: DB.indexNames.tenantProduct,
      value: DB.keyFromParts(tenant, product),
    });

    // TODO: Support multiple matches
    idpMeta = idpMetas[0];
  }

  const samlReq = saml.request({
    entityID: idpMeta.entityID,
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

  return redirect.success(res, idpMeta.sso.redirectUrl, {
    RelayState: state,
    SAMLRequest: Buffer.from(samlReq.request).toString('base64'),
  });
});

app.post(samlPath, async (req, res) => {
  const { SAMLResponse, RelayState } = req.body; // RelayState will contain the state from earlier quasi-oauth flow

  var parseRelayState = new URLSearchParams(RelayState);

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

  const idpMetas = await configStore.getByIndexAsync({
    name: DB.indexNames.entityID,
    value: parsedResp.issuer,
  });

  // TODO: Support multiple matches
  const idpMeta = idpMetas[0];

  const profile = await saml.validateAsync(rawResponse, {
    thumbprint: idpMeta.thumbprint,
    audience: env.samlAudience,
  });

  // store details against a code
  const code = uuidv4();

  await codeStore.putAsync(code, profile);

  return redirect.success(res, idpMeta.appRedirectUrl, {
    code,
    state: parseRelayState.get('state'),
  });
});

app.post(samlPath + '/config', async (req, res) => {
  const { rawMetadata, appRedirectUrl, tenant, product } = req.body;
  const idpMeta = await saml.parseMetadataAsync(rawMetadata);
  idpMeta.appRedirectUrl = appRedirectUrl;

  let clientID = store.keyDigest(
    DB.keyFromParts(tenant, product, idpMeta.entityID)
  );

  // store secondary index on entityID and tenant + product
  await configStore.putAsync(
    clientID,
    idpMeta,
    {
      name: DB.indexNames.entityID,
      value: idpMeta.entityID,
    },
    {
      name: DB.indexNames.tenantProduct,
      value: DB.keyFromParts(tenant, product),
    }
  );

  res.json({
    client_id: clientID,
  });
});

app.get(samlPath + '/me', async (req, res) => {
  const { code } = req.query;

  const profile = await codeStore.getAsync(code);

  res.json(profile);
});

const server = app.listen(env.hostPort, async () => {
  console.log(
    `🚀 The path of the righteous server: http://${env.hostUrl}:${env.hostPort}`
  );

  const db = await DB.newAsync('redis', {});
  configStore = db.store('saml:config');
  sessionStore = db.store('saml:session', 300);
  codeStore = db.store('saml:code', 300);
});

module.exports = server;
