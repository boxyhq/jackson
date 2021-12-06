const tap = require('tap');
const { promises: fs } = require('fs');
const path = require('path');
const readConfig = require('../read-config');
const sinon = require('sinon');
const saml = require('../saml/saml');

let apiController;
let oauthController;

const metadataPath = path.join(__dirname, '/data/metadata');

const options = {
  externalUrl: 'https://my-cool-app.com',
  samlAudience: 'https://saml.boxyhq.com',
  samlPath: '/sso/oauth/saml',
  db: {
    engine: 'mongo',
    url: 'mongodb://localhost:27017/jackson',
  },
};

const samlConfig = {
  tenant: 'cedex.com',
  product: 'crm',
  redirectUrl: '["http://localhost:3000/*"]',
  defaultRedirectUrl: 'http://localhost:3000/login/saml',
  rawMetadata: null,
};

const addMetadata = async (metadataPath) => {
  const configs = await readConfig(metadataPath);

  for (const config of configs) {
    await apiController.config(config);

    console.log(
      `loaded config for tenant "${config.tenant}" and product "${config.product}"`
    );
  }
};

tap.before(async () => {
  const controller = await require('../index.js')(options);

  apiController = controller.apiController;
  oauthController = controller.oauthController;

  await addMetadata(metadataPath);
});

tap.teardown(async () => {
  process.exit(0);
});

tap.test('authorize()', async (t) => {
  t.test('Should provide a redirect URL', async (t) => {
    const body = {
      redirect_uri: null,
      state: 'state',
    };

    try {
      await oauthController.authorize(body);

      t.fail('Expecting JacksonError.');
    } catch (err) {
      t.equal(err.message, 'Please specify a redirect URL.');
      t.equal(err.statusCode, 400);
    }

    t.end();
  });

  t.test('Should provide a state value', async (t) => {
    const body = {
      redirect_uri: 'https://example.com/',
      state: null,
    };

    try {
      await oauthController.authorize(body);

      t.fail('Expecting JacksonError.');
    } catch (err) {
      t.equal(
        err.message,
        'Please specify a state to safeguard against XSRF attacks.'
      );
      t.equal(err.statusCode, 400);
    }

    t.end();
  });

  t.test('Should throw error for an invalid client id', async (t) => {
    const body = {
      redirect_uri: 'https://example.com/',
      state: 'state-123',
      client_id: '27fa9a11875ec3a0',
    };

    try {
      await oauthController.authorize(body);

      t.fail('Expecting JacksonError.');
    } catch (err) {
      t.equal(err.message, 'SAML configuration not found.');
      t.equal(err.statusCode, 403);
    }

    t.end();
  });

  t.test('Should return the Idp SSO URL given valid client id', async (t) => {
    const body = {
      redirect_uri: samlConfig.defaultRedirectUrl,
      state: 'state-123',
      client_id: `tenant=${samlConfig.tenant}&product=${samlConfig.product}`,
    };

    const result = await oauthController.authorize(body);

    t.ok('redirect_url' in result, 'Should return Idp authorize URL.');

    t.end();
  });

  t.test(
    'Should throw exception if Redirect URL is not allowed.',
    async (t) => {
      const body = {
        redirect_uri: 'https://example.com/',
        state: 'state-123',
        client_id: `tenant=${samlConfig.tenant}&product=${samlConfig.product}`,
      };

      try {
        await oauthController.authorize(body);

        t.fail('Expecting JacksonError.');
      } catch (err) {
        t.equal(err.message, 'Redirect URL is not allowed.');
        t.equal(err.statusCode, 403);
      }

      t.end();
    }
  );

  t.end();
});

tap.test('token()', (t) => {
  t.test('Grant type should be authorization_code', async (t) => {
    const body = {
      grant_type: 'authorization_code_1',
    };

    try {
      await oauthController.token(body);

      t.fail('Expecting JacksonError.');
    } catch (err) {
      t.equal(err.message, 'Unsupported grant_type');
      t.equal(err.statusCode, 400);
    }

    t.end();
  });

  t.test('Should provide the authorization code', async (t) => {
    const body = {
      grant_type: 'authorization_code',
    };

    try {
      await oauthController.token(body);

      t.fail('Expecting JacksonError.');
    } catch (err) {
      t.equal(err.message, 'Please specify code');
      t.equal(err.statusCode, 400);
    }

    t.end();
  });

  t.end();
});

tap.test('samlResponse()', async (t) => {
  const authBody = {
    redirect_uri: samlConfig.defaultRedirectUrl,
    state: 'state-123',
    client_id: `tenant=${samlConfig.tenant}&product=${samlConfig.product}`,
  };

  const { redirect_url } = await oauthController.authorize(authBody);

  const relayState = new URLSearchParams(new URL(redirect_url).search).get(
    'RelayState'
  );

  const rawResponse = await fs.readFile(
    path.join(__dirname, '/data/saml_response'),
    'utf8'
  );

  t.test('Should throw error if RelayState is missing', async (t) => {
    const responseBody = {
      SAMLResponse: rawResponse,
    };

    try {
      await oauthController.samlResponse(responseBody);

      t.fail('Expecting JacksonError.');
    } catch (err) {
      t.equal(
        err.message,
        'IdP (Identity Provider) flow has been disabled. Please head to your Service Provider to login.'
      );

      t.equal(err.statusCode, 403);
    }

    t.end();
  });

  t.test(
    'Should return a URL with code and state as query params',
    async (t) => {
      const responseBody = {
        SAMLResponse: rawResponse,
        RelayState: relayState,
      };

      const stubValidateAsync = sinon.stub(saml, 'validateAsync').returns({
        id: 1,
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });

      const response = await oauthController.samlResponse(responseBody);

      const params = new URLSearchParams(new URL(response.redirect_url).search);

      t.ok(stubValidateAsync.calledOnce);
      t.ok('redirect_url' in response);
      t.ok(params.has('code'));
      t.ok(params.has('state'));
      t.match(params.get('state'), authBody.state);
    }
  );

  t.end();
});
