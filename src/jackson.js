const express = require('express');
const cors = require('cors');

const DB = require('./db/db.js');
const env = require('./env.js');
const readConfig = require('./read-config.js');

// controllers
const configController = require('./controller/config.js');
const oauthController = require('./controller/oauth.js');

const oauthPath = '/oauth';
const samlPath = '/oauth/saml';
const apiPath = '/api/v1/saml';

let configStore;
let sessionStore;
let codeStore;
let tokenStore;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get(oauthPath + '/authorize', async (req, res) => {
  try {
    oauthController.authorize(req, res, configStore, sessionStore, samlPath);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post(samlPath, async (req, res) => {
  try {
    oauthController.samlResponse(
      req,
      res,
      configStore,
      codeStore,
      sessionStore
    );
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post(oauthPath + '/token', cors(), async (req, res) => {
  try {
    oauthController.token(req, res, tokenStore, codeStore);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get(oauthPath + '/userinfo', cors(), async (req, res) => {
  try {
    oauthController.userInfo(req, res, tokenStore);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

const server = app.listen(env.hostPort, async () => {
  console.log(
    `🚀 The path of the righteous server: http://${env.hostUrl}:${env.hostPort}`
  );

  const db = await DB.new(env.db);
  configStore = db.store('saml:config');
  sessionStore = db.store('oauth:session', 300);
  codeStore = db.store('oauth:code', 300);
  tokenStore = db.store('oauth:token', 300);

  // write pre-loaded config if present
  if (env.preLoadedConfig && env.preLoadedConfig.length > 0) {
    const configs = await readConfig(env.preLoadedConfig);

    for (const config of configs) {
      await configController(config, configStore);
      console.log(
        `loaded config for tenant "${config.tenant}" and product "${config.product}"`
      );
    }
  }

  console.log(`Using engine: ${env.db.engine}`);
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
    res.json(await configController(req.body, configStore));
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
