import * as path from 'path';
import sinon from 'sinon';
import tap from 'tap';
import * as dbutils from '../db/utils';
import controllers from '../index';
import readConfig from '../read-config';
import { IdPConfig } from '../typings';


let apiController;

const CLIENT_ID = '75edb050796a0eb1cf2cfb0da7245f85bc50baa7';
const PROVIDER = 'accounts.google.com';
const OPTIONS = {
  externalUrl: 'https://my-cool-app.com',
  samlAudience: 'https://saml.boxyhq.com',
  samlPath: '/sso/oauth/saml',
  db: {
    engine: 'mem',
  },
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
      tenant: config[0].tenant,
      product: config[0].product,
    });
  });

  t.test('Create the config', async (t) => {
    t.test('when required fields are missing or invalid', async (t) => {
      t.test('when `rawMetadata` is empty', async (t) => {
        const body: Partial<IdPConfig> = Object.assign({}, config[0]);
        delete body['rawMetadata'];

        try {
          await apiController.config(body);
          t.fail('Expecting JacksonError.');
        } catch (err: any) {
          t.equal(err.message, 'Please provide rawMetadata');
          t.equal(err.statusCode, 400);
        }

        t.end();
      });

      t.test('when `defaultRedirectUrl` is empty', async (t) => {
        const body: Partial<IdPConfig> = Object.assign({}, config[0]);
        delete body['defaultRedirectUrl'];

        try {
          await apiController.config(body);
          t.fail('Expecting JacksonError.');
        } catch (err: any) {
          t.equal(err.message, 'Please provide a defaultRedirectUrl');
          t.equal(err.statusCode, 400);
        }

        t.end();
      });

      t.test('when `redirectUrl` is empty', async (t) => {
        const body: Partial<IdPConfig> = Object.assign({}, config[0]);
        delete body['redirectUrl'];

        try {
          await apiController.config(body);
          t.fail('Expecting JacksonError.');
        } catch (err: any) {
          t.equal(err.message, 'Please provide redirectUrl');
          t.equal(err.statusCode, 400);
        }

        t.end();
      });

      t.test('when `tenant` is empty', async (t) => {
        const body: Partial<IdPConfig> = Object.assign({}, config[0]);
        delete body['tenant'];

        try {
          await apiController.config(body);
          t.fail('Expecting JacksonError.');
        } catch (err: any) {
          t.equal(err.message, 'Please provide tenant');
          t.equal(err.statusCode, 400);
        }

        t.end();
      });

      t.test('when `product` is empty', async (t) => {
        const body: Partial<IdPConfig> = Object.assign({}, config[0]);
        delete body['product'];

        try {
          await apiController.config(body);
          t.fail('Expecting JacksonError.');
        } catch (err: any) {
          t.equal(err.message, 'Please provide product');
          t.equal(err.statusCode, 400);
        }

        t.end();
      });

      t.test('when `rawMetadata` is not a valid XML', async (t) => {
        const body = Object.assign({}, config[0]);
        body['rawMetadata'] = 'not a valid XML';

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
      const body = Object.assign({}, config[0]);

      const kdStub = sinon.stub(dbutils, 'keyDigest').returns(CLIENT_ID);

      const response = await apiController.config(body);

      sinon.stub('')

      t.ok(kdStub.called);
      t.equal(response.client_id, CLIENT_ID);
      t.equal(response.provider, PROVIDER);

      let savedConf = await apiController.getConfig({
        clientID: CLIENT_ID,
      });

      t.equal(savedConf.provider, PROVIDER);

      kdStub.restore();

      t.end();
    });

    t.end();
  });

  t.test('Get the config', async (t) => {
    t.test('when valid request', async (t) => {
      const body: Partial<IdPConfig> = Object.assign({}, config[0]);

      await apiController.config(body);

      const { provider } = await apiController.getConfig(body);

      t.equal(provider, PROVIDER);

      t.end();
    });

    t.test('when invalid request', async (t) => {
      let response;

      const body: Partial<IdPConfig> = Object.assign({}, config[0]);

      await apiController.config(body);

      // Empty body
      try {
        await apiController.getConfig({});
        t.fail('Expecting Error.');
      } catch (err: any) {
        t.match(
          err.message,
          'Please provide `clientID` or `tenant` and `product`.'
        );
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
      const body: Partial<IdPConfig> = Object.assign({}, config[0]);

      const client = await apiController.config(body);

      await apiController.deleteConfig({
        clientID: client.client_id,
        clientSecret: client.client_secret,
      });

      const response = await apiController.getConfig({
        clientID: client.client_id,
      });

      t.match(response, {});

      t.end();
    });

    t.test('when invalid request', async (t) => {
      let response;

      const body: Partial<IdPConfig> = Object.assign({}, config[0]);

      const client = await apiController.config(body);

      // Empty body
      try {
        await apiController.deleteConfig({});
        t.fail('Expecting Error.');
      } catch (err: any) {
        t.match(
          err.message,
          'Please provide `clientID` and `clientSecret` or `tenant` and `product`.'
        );
      }

      // Invalid clientID or clientSecret
      try {
        await apiController.deleteConfig({
          clientID: client.client_id,
          clientSecret: 'invalid client secret',
        });

        t.fail('Expecting Error.');
      } catch (err: any) {
        t.match(err.message, 'clientSecret mismatch.');
      }

      t.end();
    });

    t.end();
  });

  t.end();
});
