const tap = require('tap');
const path = require('path');
const sinon = require('sinon');
const crypto = require('crypto');

const readConfig = require('../read-config');
const dbutils = require('../db/utils');

let apiController;

const options = {
  externalUrl: 'https://my-cool-app.com',
  samlAudience: 'https://saml.boxyhq.com',
  samlPath: '/sso/oauth/saml',
  db: {
    engine: 'mem',
  },
};

tap.before(async () => {
  const controller = await require('../index.js')(options);

  apiController = controller.apiController;
});

tap.teardown(async () => {
  process.exit(0);
});

tap.test('controller/api', async (t) => {
  const metadataPath = path.join(__dirname, '/data/metadata');
  const config = await readConfig(metadataPath);

  t.test('.config()', async (t) => {
    t.test('when required fields are missing or invalid', async (t) => {
      t.test('when `rawMetadata` is empty', async (t) => {
        const body = Object.assign({}, config[0]);
        delete body['rawMetadata'];

        try {
          await apiController.config(body);
          t.fail('Expecting JacksonError.');
        } catch (err) {
          t.equal(err.message, 'Please provide rawMetadata');
          t.equal(err.statusCode, 400);
        }

        t.end();
      });

      t.test('when `defaultRedirectUrl` is empty', async (t) => {
        const body = Object.assign({}, config[0]);
        delete body['defaultRedirectUrl'];

        try {
          await apiController.config(body);
          t.fail('Expecting JacksonError.');
        } catch (err) {
          t.equal(err.message, 'Please provide a defaultRedirectUrl');
          t.equal(err.statusCode, 400);
        }

        t.end();
      });

      t.test('when `redirectUrl` is empty', async (t) => {
        const body = Object.assign({}, config[0]);
        delete body['redirectUrl'];

        try {
          await apiController.config(body);
          t.fail('Expecting JacksonError.');
        } catch (err) {
          t.equal(err.message, 'Please provide redirectUrl');
          t.equal(err.statusCode, 400);
        }

        t.end();
      });

      t.test('when `tenant` is empty', async (t) => {
        const body = Object.assign({}, config[0]);
        delete body['tenant'];

        try {
          await apiController.config(body);
          t.fail('Expecting JacksonError.');
        } catch (err) {
          t.equal(err.message, 'Please provide tenant');
          t.equal(err.statusCode, 400);
        }

        t.end();
      });

      t.test('when `product` is empty', async (t) => {
        const body = Object.assign({}, config[0]);
        delete body['product'];

        try {
          await apiController.config(body);
          t.fail('Expecting JacksonError.');
        } catch (err) {
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
        } catch (err) {
          t.match(err.message, /Non-whitespace before first tag./);
        }

        t.end();
      });
    });

    t.test('when the request is good', async (t) => {
      const body = Object.assign({}, config[0]);
      const CLIENTID = '75edb050796a0eb1cf2cfb0da7245f85bc50baa7';
      const PROVIDER = 'accounts.google.com';

      const kdStub = sinon.stub(dbutils, 'keyDigest').returns(CLIENTID);
      const rbStub = sinon
        .stub(crypto, 'randomBytes')
        .returns('f3b0f91eb8f4a9f7cc2254e08682d50b05b5d36262929e7f');

      const response = await apiController.config(body);
      t.ok(kdStub.called);
      t.ok(rbStub.calledOnce);
      t.equal(response.client_id, CLIENTID);
      t.equal(
        response.client_secret,
        'f3b0f91eb8f4a9f7cc2254e08682d50b05b5d36262929e7f'
      );
      t.equal(response.provider, PROVIDER);

      const savedConf = await apiController.getConfig({
        clientID: CLIENTID,
      });
      t.equal(savedConf.provider, PROVIDER);

      dbutils.keyDigest.restore();
      crypto.randomBytes.restore();

      t.end();
    });

    t.end();
  });

  t.end();
});
