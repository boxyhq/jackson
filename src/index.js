const express = require('express');
const saml = require('./saml.js');
const DB = require('./db/db.js');
const store = require('./db/store.js');
const env = require('./env.js');

// const { PrismaClient } = require('@prisma/client');
// const prisma = new PrismaClient();

const samlPath = '/auth/saml';

let configStore;
let sessionStore;

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
    idpMeta = await configStore.get(client_id);
  } else {
    idpMetas = await configStore.getByIndex({
      name: DB.indexNames.tenantProduct,
      value: DB.keyFromParts(tenant, product),
    });

    // TODO: Support multiple matches
    idpMeta = idpMetas[0];
  }

  var url = new URL(idpMeta.sso.redirectUrl);
  url.searchParams.set(
    'RelayState',
    `state=${state}&redirect_uri=${redirect_uri}&response_type=${response_type}`
  );

  const authnRequest = saml.request({
    entityID: idpMeta.entityID,
    callbackUrl: env.externalUrl + samlPath,
  });

  url.searchParams.set(
    'SAMLRequest',
    Buffer.from(authnRequest).toString('base64')
  );

  res.redirect(url);
});

app.post(samlPath, async (req, res) => {
  const { SAMLResponse, RelayState } = req.body;

  var parseRelayState = new URLSearchParams(RelayState);

  const rawResponse = Buffer.from(SAMLResponse, 'base64').toString();

  // if origin is not null, check if it is allowed and then validate against config

  const parsedResp = await saml.parse(rawResponse);

  const idpMetas = await configStore.getByIndex({
    name: DB.indexNames.entityID,
    value: parsedResp.issuer,
  });

  // TODO: Support multiple matches
  const idpMeta = idpMetas[0];

  const profile = await saml.validate(rawResponse, {
    thumbprint: idpMeta.thumbprint,
    audience: env.samlAudience,
  });

  // store details against a code

  await sessionStore.put('code', profile);

  var url = new URL(idpMeta.appRedirectUrl);
  url.searchParams.set('code', 'code');
  url.searchParams.set('state', parseRelayState.get('state'));

  res.redirect(url);
});

app.post(samlPath + '/config', async (req, res) => {
  const { idpMetadata, appRedirectUrl, tenant, product } = req.body;
  const idpMeta = await saml.parseMetadata(idpMetadata);
  idpMeta.appRedirectUrl = appRedirectUrl;

  let clientID = store.keyDigest(
    DB.keyFromParts(tenant, product, idpMeta.entityID)
  );

  // store secondary index on entityID and tenant + product
  await configStore.put(
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

app.get(samlPath + '/profile', async (req, res) => {
  const { code } = req.query;

  const profile = await sessionStore.get(code);

  res.json(profile);
});

const server = app.listen(env.hostPort, async () => {
  console.log(
    `🚀 The path of the righteous server: http://${env.hostUrl}:${env.hostPort}`
  );

  const db = await DB.new('redis', {});
  configStore = db.store('saml:config');
  sessionStore = db.store('saml:session', 10);
});

module.exports = server;
