import * as path from 'path';
import sinon from 'sinon';
import tap from 'tap';
import * as dbutils from '../../src/db/utils';
import controllers from '../../src/index';
import loadConnection from '../../src/loadConnection';
import { IConnectionAPIController, IdPConnection } from '../../src/typings';
import { saml_connection } from './fixture';
import { databaseOptions } from '../utils';

let connectionAPIController: IConnectionAPIController;

const CLIENT_ID_SAML = '75edb050796a0eb1cf2cfb0da7245f85bc50baa7';
const PROVIDER = 'accounts.google.com';

tap.before(async () => {
  const controller = await controllers(databaseOptions);

  connectionAPIController = controller.connectionAPIController;
});

tap.teardown(async () => {
  process.exit(0);
});

tap.test('controller/api', async (t) => {
  // loading connection here would set the SAML metadata on the config for the tests that follow
  const metadataPath = path.join(__dirname, '/data/metadata');
  await loadConnection(metadataPath);

  t.afterEach(async () => {
    await connectionAPIController.deleteConnection({
      tenant: saml_connection.tenant,
      product: saml_connection.product,
    });
  });

  t.test('Create the connection', async (t) => {
    t.test('when required fields are missing or invalid', async (t) => {
      t.test('when `encodedRawMetadata` is empty for saml strategy', async (t) => {
        const body: IdPConnection = Object.assign({}, saml_connection);
        delete body['encodedRawMetadata'];

        try {
          await connectionAPIController.createSAMLConnection(body);
          t.fail('Expecting JacksonError.');
        } catch (err: any) {
          t.equal(err.message, 'Please provide rawMetadata or encodedRawMetadata');
          t.equal(err.statusCode, 400);
        }
      });

      t.test('when `defaultRedirectUrl` is empty', async (t) => {
        const body: Partial<IdPConnection> = Object.assign({}, saml_connection);
        delete body['defaultRedirectUrl'];

        try {
          await connectionAPIController.createSAMLConnection(body as IdPConnection);
          t.fail('Expecting JacksonError.');
        } catch (err: any) {
          t.equal(err.message, 'Please provide a defaultRedirectUrl');
          t.equal(err.statusCode, 400);
        }
      });

      t.test('when `redirectUrl` is empty', async (t) => {
        const body: Partial<IdPConnection> = Object.assign({}, saml_connection);
        delete body['redirectUrl'];

        try {
          await connectionAPIController.createSAMLConnection(body as IdPConnection);
          t.fail('Expecting JacksonError.');
        } catch (err: any) {
          t.equal(err.message, 'Please provide redirectUrl');
          t.equal(err.statusCode, 400);
        }
      });

      t.test('when defaultRedirectUrl or redirectUrl is invalid', async (t) => {
        const body_saml_provider: IdPConnection = Object.assign({}, saml_connection);

        t.test('when defaultRedirectUrl is invalid', async (t) => {
          body_saml_provider['defaultRedirectUrl'] = 'http://localhost::';
          try {
            await connectionAPIController.createSAMLConnection(body_saml_provider as IdPConnection);
            t.fail('Expecting JacksonError.');
          } catch (err: any) {
            t.equal(err.message, 'defaultRedirectUrl is invalid');
            t.equal(err.statusCode, 400);
          }
        });

        t.test('when redirectUrl list is huge', async (t) => {
          body_saml_provider['redirectUrl'] = Array(101).fill('http://localhost:8080');
          try {
            await connectionAPIController.createSAMLConnection(body_saml_provider as IdPConnection);
            t.fail('Expecting JacksonError.');
          } catch (err: any) {
            t.equal(err.message, 'Exceeded maximum number of allowed redirect urls');
            t.equal(err.statusCode, 400);
          }
        });

        t.test('when redirectUrl list contains invalid', async (t) => {
          body_saml_provider['redirectUrl'] = '["http://localhost:8000","http://localhost::8080"]';

          try {
            await connectionAPIController.createSAMLConnection(body_saml_provider as IdPConnection);
            t.fail('Expecting JacksonError.');
          } catch (err: any) {
            t.equal(err.message, 'redirectUrl is invalid');
            t.equal(err.statusCode, 400);
          }
        });
      });

      t.test('tenant/product empty', async (t) => {
        t.test('when `tenant` is empty', async (t) => {
          const body: Partial<IdPConnection> = Object.assign({}, saml_connection);
          delete body['tenant'];

          try {
            await connectionAPIController.createSAMLConnection(body as IdPConnection);
            t.fail('Expecting JacksonError.');
          } catch (err: any) {
            t.equal(err.message, 'Please provide tenant');
            t.equal(err.statusCode, 400);
          }
        });

        t.test('when `product` is empty', async (t) => {
          const body: Partial<IdPConnection> = Object.assign({}, saml_connection);
          delete body['product'];

          try {
            await connectionAPIController.createSAMLConnection(body as IdPConnection);
            t.fail('Expecting JacksonError.');
          } catch (err: any) {
            t.equal(err.message, 'Please provide product');
            t.equal(err.statusCode, 400);
          }
        });
      });

      t.test('when `encodedRawMetadata` is not a valid XML', async (t) => {
        const body = Object.assign({}, saml_connection);
        body['encodedRawMetadata'] = Buffer.from('not a valid XML', 'utf8').toString('base64');

        try {
          await connectionAPIController.createSAMLConnection(body);
          t.fail('Expecting Error.');
        } catch (err: any) {
          t.match(err.message, /Non-whitespace before first tag./);
        }
      });
    });

    t.test('when the request is good', async (t) => {
      const body = Object.assign({}, saml_connection);

      const kdStub = sinon.stub(dbutils, 'keyDigest').returns(CLIENT_ID_SAML);

      const response = await connectionAPIController.createSAMLConnection(body);

      t.ok(kdStub.called);
      t.equal(response.clientID, CLIENT_ID_SAML);
      t.equal(response.idpMetadata.provider, PROVIDER);

      const savedConnection = await connectionAPIController.getConnection({
        clientID: CLIENT_ID_SAML,
      });

      t.equal(savedConnection.name, 'testConfig');

      kdStub.restore();
    });
  });

  t.test('Update the connection', async (t) => {
    const body_saml_provider: IdPConnection = Object.assign({}, saml_connection);
    t.test('When clientID is missing', async (t) => {
      const { clientSecret } = await connectionAPIController.createSAMLConnection(
        body_saml_provider as IdPConnection
      );
      try {
        await connectionAPIController.updateSAMLConnection({
          description: 'A new description',
          clientID: '',
          clientSecret,
          defaultRedirectUrl: saml_connection.defaultRedirectUrl,
          redirectUrl: saml_connection.redirectUrl,
          tenant: saml_connection.tenant,
          product: saml_connection.product,
        });
        t.fail('Expecting JacksonError.');
      } catch (err: any) {
        t.equal(err.message, 'Please provide clientID');
        t.equal(err.statusCode, 400);
        t.end();
      }
    });

    t.test('When clientSecret is missing', async (t) => {
      const { clientID } = await connectionAPIController.createSAMLConnection(
        body_saml_provider as IdPConnection
      );
      try {
        await connectionAPIController.updateSAMLConnection({
          description: 'A new description',
          clientID,
          clientSecret: '',
          defaultRedirectUrl: saml_connection.defaultRedirectUrl,
          redirectUrl: saml_connection.redirectUrl,
          tenant: saml_connection.tenant,
          product: saml_connection.product,
        });
        t.fail('Expecting JacksonError.');
      } catch (err: any) {
        t.equal(err.message, 'Please provide clientSecret');
        t.equal(err.statusCode, 400);
        t.end();
      }
    });

    t.test('Update the name/description', async (t) => {
      const { clientID, clientSecret } = await connectionAPIController.createSAMLConnection(
        body_saml_provider as IdPConnection
      );
      const { name, description } = await connectionAPIController.getConnection({ clientID });
      t.equal(name, 'testConfig');
      t.equal(description, 'Just a test configuration');

      await connectionAPIController.updateSAMLConnection({
        clientID,
        clientSecret,
        redirectUrl: saml_connection.redirectUrl,
        defaultRedirectUrl: saml_connection.defaultRedirectUrl,
        name: 'A new name',
        description: 'A new description',
        tenant: body_saml_provider.tenant,
        product: body_saml_provider.product,
      });
      const savedConnection = await connectionAPIController.getConnection({ clientID });
      t.equal(savedConnection.name, 'A new name');
      t.equal(savedConnection.description, 'A new description');
    });
  });

  t.test('Get the connection', async (t) => {
    t.test('when valid request', async (t) => {
      const body: IdPConnection = Object.assign({}, saml_connection);

      await connectionAPIController.createSAMLConnection(body as IdPConnection);

      const savedConnection = await connectionAPIController.getConnection(body);

      t.equal(savedConnection.name, 'testConfig');
    });

    t.test('when invalid request', async (t) => {
      let response;

      const body: IdPConnection = Object.assign({}, saml_connection);

      const { clientID } = await connectionAPIController.createSAMLConnection(body);

      // Empty body
      try {
        await connectionAPIController.getConnection({});
        t.fail('Expecting Error.');
      } catch (err: any) {
        t.match(err.message, 'Please provide `clientID` or `tenant` and `product`.');
      }

      // Invalid strategy
      try {
        await connectionAPIController.getConnection({ strategy: 'oidc', clientID });
        t.fail('Expecting Error.');
      } catch (err: any) {
        t.match(err.message, 'connection type mismatch');
      }
      // Invalid clientID
      response = await connectionAPIController.getConnection({
        clientID: 'an invalid clientID',
      });

      t.match(response, {});

      // Invalid tenant and product combination
      response = await connectionAPIController.getConnection({
        tenant: 'demo.com',
        product: 'desk',
      });

      t.match(response, {});
    });
  });

  t.test('Delete the connection', async (t) => {
    t.test('when valid request', async (t) => {
      const body: IdPConnection = Object.assign({}, saml_connection);

      const { clientID, clientSecret } = await connectionAPIController.createSAMLConnection(body);

      await connectionAPIController.deleteConnection({
        clientID,
        clientSecret,
      });

      const response = await connectionAPIController.getConnection({
        clientID,
      });

      t.match(response, {});
    });

    t.test('when invalid request', async (t) => {
      const body: IdPConnection = Object.assign({}, saml_connection);

      const { clientID, clientSecret } = await connectionAPIController.createSAMLConnection(body);

      // Empty body
      try {
        await connectionAPIController.deleteConnection({});
        t.fail('Expecting Error.');
      } catch (err: any) {
        t.match(err.message, 'Please provide `clientID` and `clientSecret` or `tenant` and `product`.');
      }

      // Invalid strategy
      try {
        await connectionAPIController.deleteConnection({ strategy: 'oidc', clientID, clientSecret });
        t.fail('Expecting Error.');
      } catch (err: any) {
        t.match(err.message, 'connection type mismatch');
      }

      // Invalid clientID or clientSecret
      try {
        await connectionAPIController.deleteConnection({
          clientID,
          clientSecret: 'invalid client secret',
        });

        t.fail('Expecting Error.');
      } catch (err: any) {
        t.match(err.message, 'clientSecret mismatch');
      }
    });
  });
});
