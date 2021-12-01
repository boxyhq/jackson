const tap = require('tap');
const { promises: fs } = require('fs');
const path = require('path');

let apiController;
let oauthController;

const options = {
  externalUrl: 'https://my-cool-app.com',
  samlAudience: 'https://my-cool-app.com',
  samlPath: '/sso/oauth/saml',
  db: {
    engine: 'mongo',
    url: 'mongodb://localhost:27017/jackson',
  },
};

const metadataPath = path.join(__dirname, '/saml.xml');

const samlConfig = {
  tenant: 'boxyhq.com',
  product: 'demo',
  redirectUrl: '["http://localhost:3000/*"]',
  defaultRedirectUrl: 'http://localhost:3000/login/saml',
  rawMetadata: null,
};

tap.before(async () => {
  const controller = await require('../index.js')(options);
  samlConfig['rawMetadata'] = await fs.readFile(metadataPath);

  apiController = controller.apiController;
  oauthController = controller.oauthController;

  await apiController.config(samlConfig);
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

  t.test('Should return the SAML config for a valid client id', async (t) => {
    const body = {
      redirect_uri: samlConfig.defaultRedirectUrl,
      state: 'state-123',
      client_id: `tenant=${samlConfig.tenant}&product=${samlConfig.product}`,
    };

    const result = await oauthController.authorize(body);

    t.match(
      result,
      { redirect_url: /^(https:\/\/)[abc]/ },
      'Should return Idp authorize URL.'
    );
    t.end();
  });

  t.test(
    'Should throw exception for if Redirect URL is not allowed.',
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

tap.test('samlResponse()', (t) => {
  t.end();
});

tap.test('userInfo', (t) => {
  t.end();
});
