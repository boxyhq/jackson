import cors from 'cors';
import express from 'express';
import { IOAuthController, ISAMLConfig } from './index';
import { JacksonError } from './controller/error';
import { extractAuthToken } from './controller/utils';
import env from './env';
import jackson from './index';

let apiController: ISAMLConfig;
let oauthController: IOAuthController;

const oauthPath = '/oauth';
const apiPath = '/api/v1/saml';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get(oauthPath + '/authorize', async (req, res) => {
  try {
    const { redirect_url } = await oauthController.authorize(req.query);

    res.redirect(redirect_url);
  } catch (err) {
    const { message, statusCode = 500 } = err as JacksonError;

    res.status(statusCode).send(message);
  }
});

app.post(env.samlPath, async (req, res) => {
  try {
    const { redirect_url } = await oauthController.samlResponse(req.body);

    res.redirect(redirect_url);
  } catch (err) {
    const { message, statusCode = 500 } = err as JacksonError;

    res.status(statusCode).send(message);
  }
});

app.post(oauthPath + '/token', cors(), async (req, res) => {
  try {
    const result = await oauthController.token(req.body);

    res.json(result);
  } catch (err) {
    const { message, statusCode = 500 } = err as JacksonError;

    res.status(statusCode).send(message);
  }
});

app.get(oauthPath + '/userinfo', async (req, res) => {
  try {
    let token = extractAuthToken(req);

    // check for query param
    if (!token) {
      token = req.query.access_token;
    }

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const profile = await oauthController.userInfo(token);

    res.json(profile);
  } catch (err) {
    const { message, statusCode = 500 } = err as JacksonError;

    res.status(statusCode).json({ message });
  }
});

const server = app.listen(env.hostPort, async () => {
  console.log(
    `🚀 The path of the righteous server: http://${env.hostUrl}:${env.hostPort}`
  );

  // @ts-ignore
  const ctrlrModule = await jackson(env);

  apiController = ctrlrModule.apiController;
  oauthController = ctrlrModule.oauthController;
});

// Internal routes, recommended not to expose this to the public interface though it would be guarded by API key(s)
let internalApp = app;

if (env.useInternalServer) {
  internalApp = express();

  internalApp.use(express.json());
  internalApp.use(express.urlencoded({ extended: true }));
}

const validateApiKey = (token) => {
  return env.apiKeys.includes(token);
};

internalApp.post(apiPath + '/config', async (req, res) => {
  try {
    const apiKey = extractAuthToken(req);
    if (!validateApiKey(apiKey)) {
      res.status(401).send('Unauthorized');
      return;
    }

    res.json(await apiController.config(req.body));
  } catch (err) {
    const { message } = err as JacksonError;

    res.status(500).json({
      error: message,
    });
  }
});

internalApp.get(apiPath + '/config', async (req, res) => {
  try {
    const apiKey = extractAuthToken(req);
    if (!validateApiKey(apiKey)) {
      res.status(401).send('Unauthorized');
      return;
    }

    res.json(await apiController.getConfig(req.query));
  } catch (err) {
    const { message } = err as JacksonError;

    res.status(500).json({
      error: message,
    });
  }
});

internalApp.delete(apiPath + '/config', async (req, res) => {
  try {
    const apiKey = extractAuthToken(req);
    if (!validateApiKey(apiKey)) {
      res.status(401).send('Unauthorized');
      return;
    }
    await apiController.deleteConfig(req.body);
    res.status(200).end();
  } catch (err) {
    const { message } = err as JacksonError;

    res.status(500).json({
      error: message,
    });
  }
});

let internalServer = server;
if (env.useInternalServer) {
  internalServer = internalApp.listen(env.internalHostPort, async () => {
    console.log(
      `🚀 The path of the righteous internal server: http://${env.internalHostUrl}:${env.internalHostPort}`
    );
  });
}

module.exports = {
  server,
  internalServer,
};
