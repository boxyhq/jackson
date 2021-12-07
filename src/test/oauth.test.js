const tap = require('tap');
const { promises: fs } = require('fs');
const path = require('path');
const sinon = require('sinon');
const crypto = require('crypto');

const readConfig = require('../read-config');
const saml = require('../saml/saml');

let apiController;
let oauthController;

const code = '1234567890';
const token = '24c1550190dd6a5a9bd6fe2a8ff69d593121c7b9';

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
  tenant: 'boxyhq.com',
  product: 'crm',
  redirectUrl: '["http://localhost:3000/*"]',
  defaultRedirectUrl: 'http://localhost:3000/login/saml',
  rawMetadata: null,
};

const addMetadata = async (metadataPath) => {
  const configs = await readConfig(metadataPath);

  for (const config of configs) {
    await apiController.config(config);
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
  t.test('Should throw an error if `redirect_uri` null', async (t) => {
    const body = {
      redirect_uri: null,
      state: 'state',
    };

    try {
      await oauthController.authorize(body);
      t.fail('Expecting JacksonError.');
    } catch (err) {
      t.equal(
        err.message,
        'Please specify a redirect URL.',
        'got expected error message'
      );
      t.equal(err.statusCode, 400, 'got expected status code');
    }

    t.end();
  });

  t.test('Should throw an error if `state` null', async (t) => {
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
        'Please specify a state to safeguard against XSRF attacks.',
        'got expected error message'
      );
      t.equal(err.statusCode, 400, 'got expected status code');
    }

    t.end();
  });

  t.test('Should throw an error if `client_id` is invalid', async (t) => {
    const body = {
      redirect_uri: 'https://example.com/',
      state: 'state-123',
      client_id: '27fa9a11875ec3a0',
    };

    try {
      await oauthController.authorize(body);

      t.fail('Expecting JacksonError.');
    } catch (err) {
      t.equal(
        err.message,
        'SAML configuration not found.',
        'got expected error message'
      );
      t.equal(err.statusCode, 403, 'got expected status code');
    }

    t.end();
  });

  t.test(
    'Should throw an error if `redirect_uri` is not allowed',
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
        t.equal(
          err.message,
          'Redirect URL is not allowed.',
          'got expected error message'
        );
        t.equal(err.statusCode, 403, 'got expected status code');
      }

      t.end();
    }
  );

  t.test('Should return the Idp SSO URL', async (t) => {
    const body = {
      redirect_uri: samlConfig.defaultRedirectUrl,
      state: 'state-123',
      client_id: `tenant=${samlConfig.tenant}&product=${samlConfig.product}`,
    };

    const response = await oauthController.authorize(body);
    const params = new URLSearchParams(new URL(response.redirect_url).search);

    t.ok('redirect_url' in response, 'got the Idp authorize URL');
    t.ok(params.has('RelayState'), 'RelayState present in the query string');
    t.ok(params.has('SAMLRequest'), 'SAMLRequest present in the query string');

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

      const stubRandomBytes = sinon.stub(crypto, 'randomBytes').returns(code);

      const response = await oauthController.samlResponse(responseBody);

      const params = new URLSearchParams(new URL(response.redirect_url).search);

      t.ok(stubValidateAsync.calledOnce);
      t.ok(stubRandomBytes.calledOnce);
      t.ok('redirect_url' in response);
      t.ok(params.has('code'));
      t.ok(params.has('state'));
      t.match(params.get('state'), authBody.state);

      stubRandomBytes.restore();
      stubValidateAsync.restore();

      t.end();
    }
  );

  t.end();
});

tap.test('token()', (t) => {
  t.test(
    'Should throw an error if `grant_type` is not `authorization_code`',
    async (t) => {
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
    }
  );

  t.test('Should throw an error if `code` is missing', async (t) => {
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

  t.test('Should throw an error if `code` is invalid', async (t) => {
    const body = {
      grant_type: 'authorization_code',
      client_id: `tenant=${samlConfig.tenant}&product=${samlConfig.product}`,
      client_secret: 'some-secret',
      redirect_uri: null,
      code: 'invalid-code',
    };

    try {
      await oauthController.token(body);

      t.fail('Expecting JacksonError.');
    } catch (err) {
      t.equal(err.message, 'Invalid code');
      t.equal(err.statusCode, 403);
    }

    t.end();
  });

  t.test('Should return the `access_token` for a valid request', async (t) => {
    const body = {
      grant_type: 'authorization_code',
      client_id: `tenant=${samlConfig.tenant}&product=${samlConfig.product}`,
      client_secret: 'some-secret',
      redirect_uri: null,
      code: code,
    };

    const stubRandomBytes = sinon.stub(crypto, 'randomBytes').returns(token);

    const response = await oauthController.token(body);

    t.ok('access_token' in response);
    t.ok('token_type' in response);
    t.ok('expires_in' in response);

    t.match(response.access_token, token);
    t.match(response.token_type, 'bearer');
    t.match(response.expires_in, 300);

    t.ok(stubRandomBytes.calledOnce);

    stubRandomBytes.reset();

    t.end();
  });

  // TODO
  t.test('Handle invalid client_id', async (t) => {
    t.end();
  });

  t.end();
});
