import * as path from 'path';
import sinon from 'sinon';
import tap from 'tap';
import * as dbutils from '../src/db/utils';
import controllers from '../src/index';
import readConfig from '../src/read-config';
import { IConfigAPIController, IdPConfig, JacksonOption } from '../src/typings';
import { oidc_config, saml_config } from './fixture';

let configAPIController: IConfigAPIController;

const CLIENT_ID_SAML = '75edb050796a0eb1cf2cfb0da7245f85bc50baa7';
const CLIENT_ID_OIDC = '85edb050796a0eb1cf2cfb0da7245f85bc50baa7';
const PROVIDER = 'accounts.google.com';
const OPTIONS = <JacksonOption>{
  externalUrl: 'https://my-cool-app.com',
  samlAudience: 'https://saml.boxyhq.com',
  samlPath: '/sso/oauth/saml',
  db: {
    engine: 'mem',
  },
  openid: {
    jwtSigningKeys: { private: 'PRIVATE_KEY', public: 'PUBLIC_KEY' },
    jwsAlg: 'RS256',
  },
};

tap.before(async () => {
  const controller = await controllers(OPTIONS);

  configAPIController = controller.configAPIController;
});

tap.teardown(async () => {
  process.exit(0);
});

tap.test('controller/api', async (t) => {
  // reading config here would set the metadata on the config for the tests that follow
  const metadataPath = path.join(__dirname, '/data/metadata');
  await readConfig(metadataPath);

  t.afterEach(async () => {
    await configAPIController.deleteConfig({
      tenant: saml_config.tenant,
      product: saml_config.product,
    });
  });

  t.test('Create the config', async (t) => {
    t.test('when required fields are missing or invalid', async (t) => {
      t.test('when `encodedRawMetadata` is empty for saml strategy', async (t) => {
        const body: IdPConfig = Object.assign({}, saml_config);
        delete body['encodedRawMetadata'];

        try {
          await configAPIController.config(body);
          t.fail('Expecting JacksonError.');
        } catch (err: any) {
          t.equal(err.message, 'Please provide rawMetadata or encodedRawMetadata');
          t.equal(err.statusCode, 400);
        }

        t.end();
      });

      t.test('[OIDCProvider/createOIDCConfig] oidc provider/application params missing ', async (t) => {
        t.test('missing discoveryUrl', async (t) => {
          const body: IdPConfig = Object.assign({}, oidc_config);
          delete body['oidcDiscoveryUrl'];
          try {
            await configAPIController.createOIDCConfig(body);
            t.fail('Expecting JacksonError.');
          } catch (err: any) {
            t.equal(err.message, 'Please provide the discoveryUrl for the OpenID Provider');
            t.equal(err.statusCode, 400);
          }
        });
        t.test('missing clientId', async (t) => {
          const body: IdPConfig = Object.assign({}, oidc_config);
          delete body['oidcClientId'];
          try {
            await configAPIController.createOIDCConfig(body);
            t.fail('Expecting JacksonError.');
          } catch (err: any) {
            t.equal(err.message, 'Please provide the clientId from OpenID Provider');
            t.equal(err.statusCode, 400);
          }
        });
        t.test('missing clientSecret', async (t) => {
          const body: IdPConfig = Object.assign({}, oidc_config);
          delete body['oidcClientSecret'];
          try {
            await configAPIController.createOIDCConfig(body);
            t.fail('Expecting JacksonError.');
          } catch (err: any) {
            t.equal(err.message, 'Please provide the clientSecret from OpenID Provider');
            t.equal(err.statusCode, 400);
          }
        });
      });

      t.test('when `defaultRedirectUrl` is empty', async (t) => {
        t.test('[SAMLProvider]', async (t) => {
          const body: Partial<IdPConfig> = Object.assign({}, saml_config);
          delete body['defaultRedirectUrl'];

          try {
            await configAPIController.config(body as IdPConfig);
            t.fail('Expecting JacksonError.');
          } catch (err: any) {
            t.equal(err.message, 'Please provide a defaultRedirectUrl');
            t.equal(err.statusCode, 400);
          }

          t.end();
        });

        t.test('[OIDCProvider]', async (t) => {
          const body: Partial<IdPConfig> = Object.assign({}, oidc_config);
          delete body['defaultRedirectUrl'];

          try {
            await configAPIController.createOIDCConfig(body as IdPConfig);
            t.fail('Expecting JacksonError.');
          } catch (err: any) {
            t.equal(err.message, 'Please provide a defaultRedirectUrl');
            t.equal(err.statusCode, 400);
          }

          t.end();
        });
      });

      t.test('when `redirectUrl` is empty', async (t) => {
        t.test('[SAMLProvider]', async (t) => {
          const body: Partial<IdPConfig> = Object.assign({}, saml_config);
          delete body['redirectUrl'];

          try {
            await configAPIController.config(body as IdPConfig);
            t.fail('Expecting JacksonError.');
          } catch (err: any) {
            t.equal(err.message, 'Please provide redirectUrl');
            t.equal(err.statusCode, 400);
          }

          t.end();
        });

        t.test('[OIDCProvider]', async (t) => {
          const body: Partial<IdPConfig> = Object.assign({}, oidc_config);
          delete body['redirectUrl'];

          try {
            await configAPIController.createOIDCConfig(body as IdPConfig);
            t.fail('Expecting JacksonError.');
          } catch (err: any) {
            t.equal(err.message, 'Please provide redirectUrl');
            t.equal(err.statusCode, 400);
          }

          t.end();
        });
      });

      t.test('when defaultRedirectUrl or redirectUrl is invalid', async (t) => {
        const body_saml_provider: IdPConfig = Object.assign({}, saml_config);
        const body_oidc_provider: IdPConfig = Object.assign({}, oidc_config);

        t.test('when defaultRedirectUrl is invalid', async (t) => {
          body_saml_provider['defaultRedirectUrl'] = 'http://localhost::';
          try {
            await configAPIController.config(body_saml_provider as IdPConfig);
            t.fail('Expecting JacksonError.');
          } catch (err: any) {
            t.equal(err.message, 'defaultRedirectUrl is invalid');
            t.equal(err.statusCode, 400);
          }
          body_oidc_provider['defaultRedirectUrl'] = 'http://localhost::';
          try {
            await configAPIController.createOIDCConfig(body_oidc_provider as IdPConfig);
            t.fail('Expecting JacksonError.');
          } catch (err: any) {
            t.equal(err.message, 'defaultRedirectUrl is invalid');
            t.equal(err.statusCode, 400);
          }
        });

        t.test('when redirectUrl list is huge', async (t) => {
          body_saml_provider['redirectUrl'] = Array(101).fill('http://localhost:8080');
          try {
            await configAPIController.config(body_saml_provider as IdPConfig);
            t.fail('Expecting JacksonError.');
          } catch (err: any) {
            t.equal(err.message, 'Exceeded maximum number of allowed redirect urls');
            t.equal(err.statusCode, 400);
          }
          body_oidc_provider['redirectUrl'] = Array(101).fill('http://localhost:8080');
          try {
            await configAPIController.createOIDCConfig(body_oidc_provider as IdPConfig);
            t.fail('Expecting JacksonError.');
          } catch (err: any) {
            t.equal(err.message, 'Exceeded maximum number of allowed redirect urls');
            t.equal(err.statusCode, 400);
          }
        });

        t.test('when redirectUrl list contains invalid', async (t) => {
          body_saml_provider['redirectUrl'] = '["http://localhost:8000","http://localhost::8080"]';
          body_oidc_provider['redirectUrl'] = '["http://localhost:8000","http://localhost::8080"]';
          try {
            await configAPIController.config(body_saml_provider as IdPConfig);
            t.fail('Expecting JacksonError.');
          } catch (err: any) {
            t.equal(err.message, 'redirectUrl is invalid');
            t.equal(err.statusCode, 400);
          }
          try {
            await configAPIController.createOIDCConfig(body_oidc_provider as IdPConfig);
            t.fail('Expecting JacksonError.');
          } catch (err: any) {
            t.equal(err.message, 'redirectUrl is invalid');
            t.equal(err.statusCode, 400);
          }
        });
      });

      t.test('[SAMLProvider] tenant/product empty', async (t) => {
        t.test('when `tenant` is empty', async (t) => {
          const body: Partial<IdPConfig> = Object.assign({}, saml_config);
          delete body['tenant'];

          try {
            await configAPIController.config(body as IdPConfig);
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
            await configAPIController.config(body as IdPConfig);
            t.fail('Expecting JacksonError.');
          } catch (err: any) {
            t.equal(err.message, 'Please provide product');
            t.equal(err.statusCode, 400);
          }

          t.end();
        });
      });

      t.test('[OIDCProvider] tenant/product empty', async (t) => {
        t.test('when `tenant` is empty', async (t) => {
          const body: Partial<IdPConfig> = Object.assign({}, oidc_config);
          delete body['tenant'];

          try {
            await configAPIController.createOIDCConfig(body as IdPConfig);
            t.fail('Expecting JacksonError.');
          } catch (err: any) {
            t.equal(err.message, 'Please provide tenant');
            t.equal(err.statusCode, 400);
          }

          t.end();
        });

        t.test('when `product` is empty', async (t) => {
          const body: Partial<IdPConfig> = Object.assign({}, oidc_config);
          delete body['product'];

          try {
            await configAPIController.createOIDCConfig(body as IdPConfig);
            t.fail('Expecting JacksonError.');
          } catch (err: any) {
            t.equal(err.message, 'Please provide product');
            t.equal(err.statusCode, 400);
          }

          t.end();
        });
      });

      t.test('when `encodedRawMetadata` is not a valid XML', async (t) => {
        const body = Object.assign({}, saml_config);
        body['encodedRawMetadata'] = Buffer.from('not a valid XML', 'utf8').toString('base64');

        try {
          await configAPIController.config(body);
          t.fail('Expecting Error.');
        } catch (err: any) {
          t.match(err.message, /Non-whitespace before first tag./);
        }

        t.end();
      });
    });

    t.test('[SAMLProvider/config] when the request is good', async (t) => {
      const body = Object.assign({}, saml_config);

      const kdStub = sinon.stub(dbutils, 'keyDigest').returns(CLIENT_ID_SAML);

      const response = await configAPIController.config(body);

      t.ok(kdStub.called);
      t.equal(response.clientID, CLIENT_ID_SAML);
      t.equal(response.idpMetadata.provider, PROVIDER);

      const savedConfig = await configAPIController.getConfig({
        clientID: CLIENT_ID_SAML,
      });

      t.equal(savedConfig.name, 'testConfig');

      kdStub.restore();

      t.end();
    });

    t.test('[OIDCProvider/createOIDCConfig] when the request is good', async (t) => {
      const body = Object.assign({}, oidc_config);

      const kdStub = sinon.stub(dbutils, 'keyDigest').returns(CLIENT_ID_OIDC);

      const response = await configAPIController.createOIDCConfig(body);

      t.ok(kdStub.called);
      t.equal(response.clientID, CLIENT_ID_OIDC);
      t.equal(response.oidcProvider.provider, PROVIDER);

      const savedConfig = await configAPIController.getConfig({
        clientID: CLIENT_ID_OIDC,
      });

      t.equal(savedConfig.name, oidc_config.name);
      t.equal(savedConfig.oidcProvider.clientId, oidc_config.oidcClientId);
      t.equal(savedConfig.oidcProvider.clientSecret, oidc_config.oidcClientSecret);

      kdStub.restore();

      t.end();
    });

    t.end();
  });

  t.test('Update the config', async (t) => {
    const body_saml_provider: IdPConfig = Object.assign({}, saml_config);
    const body_oidc_provider: IdPConfig = Object.assign({}, oidc_config);
    t.test('When clientID is missing', async (t) => {
      t.test('[SAMLProvider]', async (t) => {
        const { client_secret: clientSecret } = await configAPIController.config(
          body_saml_provider as IdPConfig
        );
        try {
          await configAPIController.updateConfig({
            description: 'A new description',
            clientID: '',
            clientSecret,
            defaultRedirectUrl: saml_config.defaultRedirectUrl,
            redirectUrl: saml_config.redirectUrl,
            tenant: saml_config.tenant,
            product: saml_config.product,
          });
          t.fail('Expecting JacksonError.');
        } catch (err: any) {
          t.equal(err.message, 'Please provide clientID');
          t.equal(err.statusCode, 400);
          t.end();
        }
      });
      t.test('[OIDCProvider]', async (t) => {
        const { client_secret: clientSecret } = await configAPIController.createOIDCConfig(
          body_oidc_provider as IdPConfig
        );
        try {
          await configAPIController.updateOIDCConfig({
            description: 'A new description',
            clientID: '',
            clientSecret,
            defaultRedirectUrl: saml_config.defaultRedirectUrl,
            redirectUrl: saml_config.redirectUrl,
            tenant: saml_config.tenant,
            product: saml_config.product,
          });
          t.fail('Expecting JacksonError.');
        } catch (err: any) {
          t.equal(err.message, 'Please provide clientID');
          t.equal(err.statusCode, 400);
          t.end();
        }
      });
    });

    t.test('When clientSecret is missing', async (t) => {
      const { clientID } = await configAPIController.config(body_saml_provider as IdPConfig);

      try {
        await configAPIController.updateConfig({
          description: 'A new description',
          clientID,
          defaultRedirectUrl: saml_config.defaultRedirectUrl,
          redirectUrl: saml_config.redirectUrl,
          tenant: saml_config.tenant,
          product: saml_config.product,
          clientSecret: '',
        });
        t.fail('Expecting JacksonError.');
      } catch (err: any) {
        t.equal(err.message, 'Please provide clientSecret');
        t.equal(err.statusCode, 400);
        t.end();
      }
    });

    t.test('Update the name/description', async (t) => {
      const { clientID, clientSecret } = await configAPIController.config(body_saml_provider as IdPConfig);
      const { name, description } = await configAPIController.getConfig({ clientID });
      t.equal(name, 'testConfig');
      t.equal(description, 'Just a test configuration');

      await configAPIController.updateConfig({
        clientID,
        clientSecret,
        redirectUrl: saml_config.redirectUrl,
        defaultRedirectUrl: saml_config.defaultRedirectUrl,
        name: 'A new name',
        description: 'A new description',
        tenant: body_saml_provider.tenant,
        product: body_saml_provider.product,
      });
      const savedConfig = await configAPIController.getConfig({ clientID });
      t.equal(savedConfig.name, 'A new name');
      t.equal(savedConfig.description, 'A new description');
      t.end();
    });

    t.end();
  });

  t.test('Get the config', async (t) => {
    t.test('when valid request', async (t) => {
      const body: IdPConfig = Object.assign({}, saml_config);

      await configAPIController.config(body as IdPConfig);

      const savedConfig = await configAPIController.getConfig(body);

      t.equal(savedConfig.name, 'testConfig');

      t.end();
    });

    t.test('when invalid request', async (t) => {
      let response;

      const body: IdPConfig = Object.assign({}, saml_config);

      await configAPIController.config(body);

      // Empty body
      try {
        await configAPIController.getConfig({});
        t.fail('Expecting Error.');
      } catch (err: any) {
        t.match(err.message, 'Please provide `clientID` or `tenant` and `product`.');
      }

      // Invalid clientID
      response = await configAPIController.getConfig({
        clientID: 'an invalid clientID',
      });

      t.match(response, {});

      // Invalid tenant and product combination
      response = await configAPIController.getConfig({
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
      const body: IdPConfig = Object.assign({}, saml_config);

      const { clientID, clientSecret } = await configAPIController.config(body);

      await configAPIController.deleteConfig({
        clientID,
        clientSecret,
      });

      const response = await configAPIController.getConfig({
        clientID,
      });

      t.match(response, {});

      t.end();
    });

    t.test('when invalid request', async (t) => {
      const body: IdPConfig = Object.assign({}, saml_config);

      const { clientID } = await configAPIController.config(body);

      // Empty body
      try {
        await configAPIController.deleteConfig({});
        t.fail('Expecting Error.');
      } catch (err: any) {
        t.match(err.message, 'Please provide `clientID` and `clientSecret` or `tenant` and `product`.');
      }

      // Invalid clientID or clientSecret
      try {
        await configAPIController.deleteConfig({
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
