const express = require('express');
const cors = require('cors');

const env = require('./env.js');

const controllers = require('./index.js');
let configController;
let oauthController;

const oauthPath = '/oauth';
const samlPath = '/oauth/saml';
const apiPath = '/api/v1/saml';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get(oauthPath + '/authorize', async (req, res) => {
  try {
    await oauthController.authorize(req, res);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post(samlPath, async (req, res) => {
  try {
    await oauthController.samlResponse(
      req,
      res,
    );
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post(oauthPath + '/token', cors(), async (req, res) => {
  try {
    await oauthController.token(req, res);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get(oauthPath + '/userinfo', cors(), async (req, res) => {
  try {
    await oauthController.userInfo(req, res);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

const server = app.listen(env.hostPort, async () => {
  console.log(
    `🚀 The path of the righteous server: http://${env.hostUrl}:${env.hostPort}`
  );

  const ret = await controllers(samlPath);
  configController = ret.configController;
  oauthController = ret.oauthController;
});

// Internal routes, recommended not to expose this to the public interface though it would be guarded by API key(s)
let internalApp = app;

if (env.useInternalServer) {
  internalApp = express();

  internalApp.use(express.json());
  internalApp.use(express.urlencoded({ extended: true }));
}

internalApp.post(apiPath + '/config', async (req, res) => {
  try {
    res.json(await configController(req.body));
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
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
