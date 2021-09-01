const express = require('express');
const saml = require('./saml.js');
const memDB = require('./db/mem.js').new();

// const { PrismaClient } = require('@prisma/client');
// const prisma = new PrismaClient();

const app = express();

const hostUrl = process.env.HOST_URL || 'localhost';
const hostPort = (process.env.HOST_PORT || '5000') * 1;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post(`/auth/saml`, async (req, res) => {
  const { SAMLResponse } = req.body;

  console.log('headers.origin=', req.headers.origin);

  const rawResponse = Buffer.from(SAMLResponse, 'base64').toString();
  console.log('rawResponse=', rawResponse);

  const idpMeta = memDB.get('record');

  // if origin is not null check if it is allowed and then validate against config

  const profile = await saml.validate(rawResponse, {
    publicKey: idpMeta.X509Certificate,
    audience: 'http://localhost:5000/auth/saml',
  });

  console.log('profile=', profile);

  // store details against a code

  memDB.put('code', profile);

  var url = new URL(idpMeta.appRedirectUrl);
  url.searchParams.set('code', 'code');

  res.redirect(url);
});

app.post(`/auth/saml/config`, async (req, res) => {
  const { idpMetadata, appRedirectUrl } = req.body;

  const idpMeta = await saml.parseMetadata(idpMetadata);
  idpMeta.appRedirectUrl = appRedirectUrl;

  console.log('idpMeta=', JSON.stringify(idpMeta, null, 2));

  memDB.put('record', idpMeta);

  res.send('OK');
});

const server = app.listen(hostPort, () =>
  console.log(
    `🚀 The path of the righteous server: http://${hostUrl}:${hostPort}`
  )
);
