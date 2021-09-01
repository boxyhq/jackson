const express = require('express');
const saml = require('./saml.js');

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

  //console.log('SAMLResponse=', SAMLResponse);

  const profile = await saml.parse(Buffer.from(SAMLResponse, 'base64').toString());
  
  console.log('profile=', profile);

  // if origin is not null check if it is allowed and then validate against config

  // store details against a code

  res.send('OK');
});

app.post(`/auth/saml/config`, async (req, res) => {
  const { idpMetadata } = req.body;

  //console.log('idpMetadata=', idpMetadata);

  const idpMeta = await saml.parseMetadata(idpMetadata);
  
  console.log('idpMeta=', JSON.stringify(idpMeta, null, 2));

  res.send('OK');
});

const server = app.listen(hostPort, () =>
  console.log(`🚀 The path of the righteous server: http://${hostUrl}:${hostPort}`)
);
