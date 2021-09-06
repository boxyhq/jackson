const express = require('express');
const saml = require('./saml.js');
const DB = require('./db/db.js');
const store = require('./db/store.js');
const env = require('./env.js');

// const { PrismaClient } = require('@prisma/client');
// const prisma = new PrismaClient();

let configStore;
let sessionStore;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// quasi oauth flow: response_type, client_id, redirect_uri, state
app.get('/auth/saml/authorize', async (req, res) => {
  const { response_type, client_id, redirect_uri, state } = req.query;

  const idpMeta = await configStore.get(client_id);

  res.redirect(idpMeta.sso.redirectUrl);
});

app.post('/auth/saml', async (req, res) => {
  const { SAMLResponse } = req.body;

  console.log('headers.origin=', req.headers.origin);

  const rawResponse = Buffer.from(SAMLResponse, 'base64').toString();
  console.log('rawResponse=', rawResponse);

  // if origin is not null, check if it is allowed and then validate against config

  const parsedResp = await saml.parse(rawResponse);
  console.log('parsedResp=', parsedResp);

  const idpMetas = await configStore.getByIndex({
    name: DB.indexNames.entityID,
    value: parsedResp.issuer,
  });

  // TODO: Support multiple matches
  const idpMeta = idpMetas[0];

  console.log('idpMeta: /auth/saml: ', idpMeta);
  const profile = await saml.validate(rawResponse, {
    thumbprint: idpMeta.thumbprint,
    audience: env.samlAudience,
  });

  console.log('profile=', profile);

  // store details against a code

  await sessionStore.put('code', profile);

  var url = new URL(idpMeta.appRedirectUrl);
  url.searchParams.set('code', 'code');

  res.redirect(url);
});

app.post('/auth/saml/config', async (req, res) => {
  const { idpMetadata, appRedirectUrl, tenant, product } = req.body;
  const idpMeta = await saml.parseMetadata(idpMetadata);
  idpMeta.appRedirectUrl = appRedirectUrl;

  console.log('idpMeta=', JSON.stringify(idpMeta, null, 2));

  let clientID = store.keyDigest(DB.keyFromParts(tenant, product, idpMeta.entityID));

  console.log('clientID=', clientID);

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

app.get('/auth/saml/profile', async (req, res) => {
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
