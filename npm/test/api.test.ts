import * as path from 'path';
import sinon from 'sinon';
import tap from 'tap';
import * as dbutils from '../src/db/utils';
import controllers from '../src/index';
import readConfig from '../src/read-config';
import { IdPConfig, JacksonOption } from '../src/typings';
import { saml_config } from './fixture';

let apiController;

const CLIENT_ID = '75edb050796a0eb1cf2cfb0da7245f85bc50baa7';
const PROVIDER = 'accounts.google.com';
const OPTIONS = <JacksonOption>{
  externalUrl: 'https://my-cool-app.com',
  samlAudience: 'https://saml.boxyhq.com',
  samlPath: '/sso/oauth/saml',
  db: {
    engine: 'mem',
  },
  jwtSigningKeys: { private: 'PRIVATE_KEY', public: 'PUBLIC_KEY' },
  jwsAlg: 'RS256',
};

tap.before(async () => {
  const controller = await controllers(OPTIONS);

  apiController = controller.apiController;
});

tap.teardown(async () => {
  process.exit(0);
});

tap.test('controller/api', async (t) => {
  const metadataPath = path.join(__dirname, '/data/metadata');
  const config = await readConfig(metadataPath);

  t.afterEach(async () => {
    await apiController.deleteConfig({
      tenant: saml_config.tenant,
      product: saml_config.product,
    });
  });

  t.test('Create the config', async (t) => {
    t.test('when required fields are missing or invalid', async (t) => {
      t.test('when `encodedRawMetadata` is empty', async (t) => {
        const body: Partial<IdPConfig> = Object.assign({}, saml_config);
        delete body['encodedRawMetadata'];

        try {
          await apiController.config(body);
          t.fail('Expecting JacksonError.');
        } catch (err: any) {
          t.equal(err.message, 'Please provide rawMetadata or encodedRawMetadata');
          t.equal(err.statusCode, 400);
        }

        t.end();
      });

      t.test('when `defaultRedirectUrl` is empty', async (t) => {
        const body: Partial<IdPConfig> = Object.assign({}, saml_config);
        delete body['defaultRedirectUrl'];

        try {
          await apiController.config(body as IdPConfig);
          t.fail('Expecting JacksonError.');
        } catch (err: any) {
          t.equal(err.message, 'Please provide a defaultRedirectUrl');
          t.equal(err.statusCode, 400);
        }

        t.end();
      });

      t.test('when `redirectUrl` is empty', async (t) => {
        const body: Partial<IdPConfig> = Object.assign({}, saml_config);
        delete body['redirectUrl'];

        try {
          await apiController.config(body as IdPConfig);
          t.fail('Expecting JacksonError.');
        } catch (err: any) {
          t.equal(err.message, 'Please provide redirectUrl');
          t.equal(err.statusCode, 400);
        }

        t.end();
      });

      t.test('when defaultRedirectUrl or redirectUrl is invalid', async (t) => {
        const body: Partial<IdPConfig> = Object.assign({}, saml_config);

        t.test('when defaultRedirectUrl is invalid', async (t) => {
          body['defaultRedirectUrl'] = 'http://localhost::';
          try {
            await apiController.config(body as IdPConfig);
            t.fail('Expecting JacksonError.');
          } catch (err: any) {
            t.equal(err.message, 'defaultRedirectUrl is invalid');
            t.equal(err.statusCode, 400);
          }
        });

        t.test('when redirectUrl list is huge', async (t) => {
          body['redirectUrl'] = Array(101).fill('http://localhost:8080');
          try {
            await apiController.config(body as IdPConfig);
            t.fail('Expecting JacksonError.');
          } catch (err: any) {
            t.equal(err.message, 'Exceeded maximum number of allowed redirect urls');
            t.equal(err.statusCode, 400);
          }
        });

        t.test('when redirectUrl list contains invalid', async (t) => {
          body['redirectUrl'] = '["http://localhost:8000","http://localhost::8080"]';
          try {
            await apiController.config(body as IdPConfig);
            t.fail('Expecting JacksonError.');
          } catch (err: any) {
            t.equal(err.message, 'redirectUrl is invalid');
            t.equal(err.statusCode, 400);
          }
        });
      });

      t.test('when `tenant` is empty', async (t) => {
        const body: Partial<IdPConfig> = Object.assign({}, saml_config);
        delete body['tenant'];

        try {
          await apiController.config(body as IdPConfig);
          t.fail('Expecting JacksonError.');
        } catch (err: any) {
          t.equal(err.message, 'Please provide tenant');
          t.equal(err.statusCode, 400);
        }

        t.end();
      });

      t.test('when `product` is empty', async (t) => {
        const body: Partial<IdPConfig> = Object.assign({}, saml_config);
        delete body['product'];

        try {
          await apiController.config(body as IdPConfig);
          t.fail('Expecting JacksonError.');
        } catch (err: any) {
          t.equal(err.message, 'Please provide product');
          t.equal(err.statusCode, 400);
        }

        t.end();
      });

      t.test('when `encodedRawMetadata` is not a valid XML', async (t) => {
        const body = Object.assign({}, saml_config);
        body['encodedRawMetadata'] = Buffer.from('not a valid XML', 'utf8').toString('base64');

        try {
          await apiController.config(body);
          t.fail('Expecting Error.');
        } catch (err: any) {
          t.match(err.message, /Non-whitespace before first tag./);
        }

        t.end();
      });
    });

    t.test('when the request is good', async (t) => {
      const body = Object.assign({}, saml_config);

      const kdStub = sinon.stub(dbutils, 'keyDigest').returns(CLIENT_ID);

      const response = await apiController.config(body);

      t.ok(kdStub.called);
      t.equal(response.clientID, CLIENT_ID);
      t.equal(response.idpMetadata.provider, PROVIDER);

      const savedConfig = await apiController.getConfig({
        clientID: CLIENT_ID,
      });

      t.equal(savedConfig.name, 'testConfig');

      kdStub.restore();

      t.end();
    });

    t.end();
  });

  t.test('Update the config', async (t) => {
    const body: Partial<IdPConfig> = Object.assign({}, saml_config);

    t.test('When clientID is missing', async (t) => {
      const { client_secret: clientSecret } = await apiController.config(body as IdPConfig);
      try {
        await apiController.updateConfig({ description: 'A new description', clientSecret });
        t.fail('Expecting JacksonError.');
      } catch (err: any) {
        t.equal(err.message, 'Please provide clientID');
        t.equal(err.statusCode, 400);
        t.end();
      }
    });

    t.test('When clientSecret is missing', async (t) => {
      const { clientID } = await apiController.config(body as IdPConfig);

      try {
        await apiController.updateConfig({ description: 'A new description', clientID });
        t.fail('Expecting JacksonError.');
      } catch (err: any) {
        t.equal(err.message, 'Please provide clientSecret');
        t.equal(err.statusCode, 400);
        t.end();
      }
    });

    t.test('Update the name/description', async (t) => {
      const { clientID, clientSecret } = await apiController.config(body as IdPConfig);
      const { name, description } = await apiController.getConfig({ clientID });
      t.equal(name, 'testConfig');
      t.equal(description, 'Just a test configuration');
      await apiController.updateConfig({
        clientID,
        clientSecret,
        name: 'A new name',
        description: 'A new description',
      });
      const savedConfig = await apiController.getConfig({ clientID });
      t.equal(savedConfig.name, 'A new name');
      t.equal(savedConfig.description, 'A new description');
      t.end();
    });

    t.end();
  });

  t.test('Get the config', async (t) => {
    t.test('when valid request', async (t) => {
      const body: Partial<IdPConfig> = Object.assign({}, saml_config);

      await apiController.config(body as IdPConfig);

      const savedConfig = await apiController.getConfig(body);

      t.equal(savedConfig.name, 'testConfig');

      t.end();
    });

    t.test('when invalid request', async (t) => {
      let response;

      const body: Partial<IdPConfig> = Object.assign({}, saml_config);

      await apiController.config(body);

      // Empty body
      try {
        await apiController.getConfig({});
        t.fail('Expecting Error.');
      } catch (err: any) {
        t.match(err.message, 'Please provide `clientID` or `tenant` and `product`.');
      }

      // Invalid clientID
      response = await apiController.getConfig({
        clientID: 'an invalid clientID',
      });

      t.match(response, {});

      // Invalid tenant and product combination
      response = await apiController.getConfig({
        tenant: 'demo.com',
        product: 'desk',
      });

      t.match(response, {});

      t.end();
    });

    t.end();
  });

  t.test('Delete the config', async (t) => {
    t.test('when valid request', async (t) => {
      const body: Partial<IdPConfig> = Object.assign({}, saml_config);

      const { clientID, clientSecret } = await apiController.config(body);

      await apiController.deleteConfig({
        clientID,
        clientSecret,
      });

      const response = await apiController.getConfig({
        clientID,
      });

      t.match(response, {});

      t.end();
    });

    t.test('when invalid request', async (t) => {
      const body: Partial<IdPConfig> = Object.assign({}, saml_config);

      const { clientID, clientSecret } = await apiController.config(body);

      // Empty body
      try {
        await apiController.deleteConfig({});
        t.fail('Expecting Error.');
      } catch (err: any) {
        t.match(err.message, 'Please provide `clientID` and `clientSecret` or `tenant` and `product`.');
      }

      // Invalid clientID or clientSecret
      try {
        await apiController.deleteConfig({
          clientID,
          clientSecret: 'invalid client secret',
        });

        t.fail('Expecting Error.');
      } catch (err: any) {
        t.match(err.message, 'clientSecret mismatch');
      }

      t.end();
    });

    t.end();
  });

  t.end();
});
