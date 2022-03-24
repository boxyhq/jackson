import { promises as fs } from 'fs';
import path from 'path';
import tap from 'tap';
import readConfig from '../src/read-config';
import { IAPIController, ILogoutController, JacksonOption } from '../src/typings';

let apiController: IAPIController;
let logoutController: ILogoutController;

const metadataPath = path.join(__dirname, '/data/metadata');

const options = <JacksonOption>{
  externalUrl: 'https://my-cool-app.com',
  samlAudience: 'https://saml.boxyhq.com',
  samlPath: '/sso/oauth/saml',
  db: {
    engine: 'mem',
  },
};

const samlConfig = {
  name: 'testConfig',
  tenant: 'boxyhq.com',
  product: 'crm',
  redirectUrl: '["http://localhost:3366/*"]',
  defaultRedirectUrl: 'http://localhost:3366/login/saml',
  encodedRawMetadata: null,
};

const addMetadata = async (metadataPath) => {
  const configs = await readConfig(metadataPath);

  for (const config of configs) {
    await apiController.config(config);
  }
};

tap.before(async () => {
  const controller = await (await import('../src/index')).default(options);

  apiController = controller.apiController;
  logoutController = controller.logoutController;

  await addMetadata(metadataPath);
});

tap.teardown(async () => {
  process.exit(0);
});

tap.test('Logout Controller', async (t) => {
  const body = {
    nameId: 'google-oauth2|146623609101108149256',
    tenant: samlConfig.tenant,
    product: samlConfig.product,
    redirectUrl: samlConfig.defaultRedirectUrl,
  };

  const result = await logoutController.createRequest(body);
  const params = new URLSearchParams(new URL(result.logoutUrl as string).search);

  const samlResponse = await fs.readFile(path.join(__dirname, '/data/logout_response'), 'utf8');

  t.test('SAML configuration not found.', async (t) => {
    try {
      await logoutController.createRequest({
        ...body,
        tenant: 'example.com',
      });
    } catch (err: any) {
      t.equal(err.message, 'SAML configuration not found.');
      t.equal(err.statusCode, 403);
    }

    try {
      await logoutController.createRequest({
        ...body,
        tenant: '',
        product: '',
      });
    } catch (err: any) {
      t.equal(err.message, 'SAML configuration not found.');
      t.equal(err.statusCode, 403);
    }

    t.end();
  });

  t.test('Should return logoutUrl and logoutForm', async (t) => {
    t.ok('logoutUrl' in result);
    t.ok('logoutForm' in result);

    t.ok(params.has('SAMLRequest'));
    t.ok(params.has('RelayState'));

    t.end();
  });

  t.test('Unable to validate state from the origin request', async (t) => {
    try {
      await logoutController.handleResponse({
        SAMLResponse: samlResponse,
        RelayState: 'invalid',
      });
    } catch (err: any) {
      t.equal(err.message, 'Unable to validate state from the origin request.');
      t.equal(err.statusCode, 403);
    }

    t.end();
  });

  t.test('SLO failed with mismatched request ID', async (t) => {
    try {
      await logoutController.handleResponse({
        SAMLResponse: samlResponse,
        RelayState: params.get('RelayState') as string,
      });
    } catch (err: any) {
      t.equal(err.message, 'SLO failed with mismatched request ID.');
      t.equal(err.statusCode, 400);
    }
  });
});
