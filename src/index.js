const express = require('express');
const saml = require('./saml.js');
const DB = require('./db/db.js');

// const { PrismaClient } = require('@prisma/client');
// const prisma = new PrismaClient();

let configStore;
let sessionStore;

const app = express();

const hostUrl = process.env.HOST_URL || 'localhost';
const hostPort = (process.env.HOST_PORT || '5000') * 1;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// quasi oauth flow: response_type, client_id, redirect_uri, state
app.get('/auth/saml/authorize', async (req, res) => {
  const { response_type, client_id, redirect_uri, state } = req.query;

  const idpMeta = await configStore.get('record');

  res.redirect(idpMeta.sso.redirectUrl);
});

app.post('/auth/saml', async (req, res) => {
  const { SAMLResponse } = req.body;

  console.log('headers.origin=', req.headers.origin);

  const rawResponse = Buffer.from(SAMLResponse, 'base64').toString();
  console.log('rawResponse=', rawResponse);

  const idpMeta = await configStore.get('record');

  // if origin is not null check if it is allowed and then validate against config

  const profile = await saml.validate(rawResponse, {
    thumbprint: idpMeta.thumbprint,
    audience: 'http://localhost:5000/auth/saml',
  });

  console.log('profile=', profile);

  // store details against a code

  await sessionStore.put('code', profile);

  var url = new URL(idpMeta.appRedirectUrl);
  url.searchParams.set('code', 'code');

  res.redirect(url);
});

app.post('/auth/saml/config', async (req, res) => {
  const { idpMetadata, appRedirectUrl } = req.body;

  const idpMeta = await saml.parseMetadata(idpMetadata);
  idpMeta.appRedirectUrl = appRedirectUrl;

  console.log('idpMeta=', JSON.stringify(idpMeta, null, 2));

  await configStore.put('record', idpMeta);

  res.send('OK');
});

app.get('/auth/saml/profile', async (req, res) => {
  const { code } = req.query;

  const profile = await sessionStore.get(code);

  res.json(profile);
});

const server = app.listen(hostPort, async () => {
  console.log(
    `🚀 The path of the righteous server: http://${hostUrl}:${hostPort}`
  );

  const db = await DB.new('redis', {});
  configStore = db.store('saml:config');
  sessionStore = db.store('saml:session', 10);
});
