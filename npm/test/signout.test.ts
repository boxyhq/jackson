import crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import sinon from 'sinon';
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

// TODO: Move this to a helper file
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

// tap.beforeEach(async () => {});

// tap.afterEach(async () => {
//   await apiController.deleteConfig({ tenant: samlConfig.tenant, product: samlConfig.product });
// });

tap.teardown(async () => {
  process.exit(0);
});

tap.test('LogoutController -> createRequest', async (t) => {
  const body = {
    nameId: 'google-oauth2|146623609101108149256',
    tenant: samlConfig.tenant,
    product: samlConfig.product,
    redirectUrl: samlConfig.defaultRedirectUrl,
  };

  t.test('createRequest', async (t) => {
    t.test('Should throw an error if the tenant or product are invalid', async (t) => {
      try {
        await logoutController.createRequest({
          ...body,
          tenant: 'invalid-tenant',
        });
      } catch (err: any) {
        t.equal(err.message, 'SAML configuration not found.');
        t.equal(err.statusCode, 403);
      }

      try {
        await logoutController.createRequest({
          ...body,
          product: 'invalid-product',
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

    t.test("Should throw an error if metadata doesn't present SingleLogoutService URL", async (t) => {
      try {
        await logoutController.createRequest({
          ...body,
        });
      } catch (err: any) {
        t.equal(err.message, `accounts.google.com doesn't support SLO or disabled by IdP.`);
        t.equal(err.statusCode, 400);
      }

      t.end();
    });

    t.test('Should return logoutUrl and logoutForm for a valid logout request', async (t) => {
      const result = await logoutController.createRequest({
        ...body,
        tenant: 'example.com',
      });

      t.ok('logoutUrl' in result);
      t.ok('logoutForm' in result);
      t.ok(result.logoutUrl?.includes('https://dev-tyj7qyzz.auth0.com/samlp/logout'));

      const params = new URLSearchParams(new URL(result.logoutUrl as string).search);

      t.ok(params.has('SAMLRequest'));
      t.ok(params.has('RelayState'));

      t.end();
    });

    t.end();
  });

  t.test('handleResponse', async (t) => {
    const sessionId = 'a0089b303b86a97080ff';
    const relayState = `boxyhq_jackson_${sessionId}`;

    const logoutResponseXML = await fs.readFile(path.join(__dirname, '/data/logout_response.xml'), 'utf8');
    const logoutResponseFailedXML = await fs.readFile(
      path.join(__dirname, '/data/logout_response_failed.xml'),
      'utf8'
    );

    const logoutResponse = Buffer.from(logoutResponseXML).toString('base64');
    const logoutResponseFailed = Buffer.from(logoutResponseFailedXML).toString('base64');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const stubRandomBytes = sinon.stub(crypto, 'randomBytes').returns(sessionId);

    await logoutController.createRequest({
      ...body,
      tenant: 'example.com',
    });

    t.test('Should throw an error is RelayState is invalid', async (t) => {
      try {
        await logoutController.handleResponse({
          SAMLResponse: logoutResponse,
          RelayState: 'invalid',
        });
      } catch (err: any) {
        t.equal(err.message, 'Unable to validate state from the origin request.');
        t.equal(err.statusCode, 403);
      }

      t.end();
    });

    t.test('Should throw an error is logout request not success', async (t) => {
      try {
        await logoutController.handleResponse({
          SAMLResponse: logoutResponseFailed,
          RelayState: relayState,
        });
      } catch (err: any) {
        t.equal(err.message, 'SLO failed with status urn:oasis:names:tc:SAML:2.0:status:AuthnFailed.');
        t.equal(err.statusCode, 400);
      }

      t.end();
    });

    t.test('Should throw an error when request ID mismatch', async (t) => {
      const logoutResponse = Buffer.from(logoutResponseXML.replace(`_${sessionId}`, '_123')).toString(
        'base64'
      );

      try {
        await logoutController.handleResponse({
          SAMLResponse: logoutResponse,
          RelayState: relayState,
        });
      } catch (err: any) {
        t.equal(err.message, 'SLO failed with mismatched request ID.');
        t.equal(err.statusCode, 400);
      }

      t.end();
    });

    t.test('Return the redirectUrl after the post logout', async (t) => {
      const result = await logoutController.handleResponse({
        SAMLResponse: logoutResponse,
        RelayState: relayState,
      });

      t.ok('redirectUrl' in result);
      t.match(result.redirectUrl, samlConfig.defaultRedirectUrl);

      t.end();
    });

    t.end();
  });

  t.end();
});
