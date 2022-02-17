import crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import {
  IOAuthController,
  IAPIController,
  JacksonOption,
  OAuthReqBody,
  OAuthTokenReq,
  SAMLResponsePayload,
} from '../src/typings';
import sinon from 'sinon';
import tap from 'tap';
import { JacksonError } from '../src/controller/error';
import readConfig from '../src/read-config';
import saml from '../src/saml/saml';

let apiController: IAPIController;
let oauthController: IOAuthController;

const code = '1234567890';
const token = '24c1550190dd6a5a9bd6fe2a8ff69d593121c7b9';

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
  tenant: 'boxyhq.com',
  product: 'crm',
  redirectUrl: '["http://localhost:3000/*"]',
  defaultRedirectUrl: 'http://localhost:3000/login/saml',
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
  oauthController = controller.oauthController;

  await addMetadata(metadataPath);
});

tap.teardown(async () => {
  process.exit(0);
});

tap.test('authorize()', async (t) => {
  t.test('Should throw an error if `redirect_uri` null', async (t) => {
    const body: Partial<OAuthReqBody> = {
      redirect_uri: undefined,
      state: 'state',
    };

    try {
      await oauthController.authorize(<OAuthReqBody>body);
      t.fail('Expecting JacksonError.');
    } catch (err) {
      const { message, statusCode } = err as JacksonError;
      t.equal(message, 'Please specify a redirect URL.', 'got expected error message');
      t.equal(statusCode, 400, 'got expected status code');
    }

    t.end();
  });

  t.test('Should throw an error if `state` null', async (t) => {
    const body: Partial<OAuthReqBody> = {
      redirect_uri: 'https://example.com/',
      state: undefined,
    };

    try {
      await oauthController.authorize(<OAuthReqBody>body);

      t.fail('Expecting JacksonError.');
    } catch (err) {
      const { message, statusCode } = err as JacksonError;
      t.equal(
        message,
        'Please specify a state to safeguard against XSRF attacks.',
        'got expected error message'
      );
      t.equal(statusCode, 400, 'got expected status code');
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
      await oauthController.authorize(<OAuthReqBody>body);

      t.fail('Expecting JacksonError.');
    } catch (err) {
      const { message, statusCode } = err as JacksonError;
      t.equal(message, 'SAML configuration not found.', 'got expected error message');
      t.equal(statusCode, 403, 'got expected status code');
    }

    t.end();
  });

  t.test('Should throw an error if `redirect_uri` is not allowed', async (t) => {
    const body = {
      redirect_uri: 'https://example.com/',
      state: 'state-123',
      client_id: `tenant=${samlConfig.tenant}&product=${samlConfig.product}`,
    };

    try {
      await oauthController.authorize(<OAuthReqBody>body);

      t.fail('Expecting JacksonError.');
    } catch (err) {
      const { message, statusCode } = err as JacksonError;
      t.equal(message, 'Redirect URL is not allowed.', 'got expected error message');
      t.equal(statusCode, 403, 'got expected status code');
    }

    t.end();
  });

  t.test('Should return the Idp SSO URL', async (t) => {
    const body = {
      redirect_uri: samlConfig.defaultRedirectUrl,
      state: 'state-123',
      client_id: `tenant=${samlConfig.tenant}&product=${samlConfig.product}`,
    };

    const response = await oauthController.authorize(<OAuthReqBody>body);
    const params = new URLSearchParams(new URL(response.redirect_url!).search);

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

  const { redirect_url } = await oauthController.authorize(<OAuthReqBody>authBody);

  const relayState = new URLSearchParams(new URL(redirect_url!).search).get('RelayState');

  const rawResponse = await fs.readFile(path.join(__dirname, '/data/saml_response'), 'utf8');

  t.test('Should throw an error if `RelayState` is missing', async (t) => {
    const responseBody: Partial<SAMLResponsePayload> = {
      SAMLResponse: rawResponse,
    };

    try {
      await oauthController.samlResponse(<SAMLResponsePayload>responseBody);

      t.fail('Expecting JacksonError.');
    } catch (err) {
      const { message, statusCode } = err as JacksonError;
      t.equal(
        message,
        'IdP (Identity Provider) flow has been disabled. Please head to your Service Provider to login.',
        'got expected error message'
      );

      t.equal(statusCode, 403, 'got expected status code');
    }

    t.end();
  });

  t.test('Should return a URL with code and state as query params', async (t) => {
    const responseBody = {
      SAMLResponse: rawResponse,
      RelayState: relayState,
    };

    const stubValidateAsync = sinon
      .stub(saml, 'validateAsync')
      .resolves({ audience: '', claims: {}, issuer: '', sessionIndex: '' });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const stubRandomBytes = sinon.stub(crypto, 'randomBytes').returns(code);

    const response = await oauthController.samlResponse(<SAMLResponsePayload>responseBody);

    const params = new URLSearchParams(new URL(response.redirect_url!).search);

    t.ok(stubValidateAsync.calledOnce, 'validateAsync called once');
    t.ok(stubRandomBytes.calledOnce, 'randomBytes called once');
    t.ok('redirect_url' in response, 'response contains redirect_url');
    t.ok(params.has('code'), 'query string includes code');
    t.ok(params.has('state'), 'query string includes state');
    t.match(params.get('state'), authBody.state, 'state value is valid');

    stubRandomBytes.restore();
    stubValidateAsync.restore();

    t.end();
  });

  t.end();
});

tap.test('token()', (t) => {
  t.test('Should throw an error if `grant_type` is not `authorization_code`', async (t) => {
    const body = {
      grant_type: 'authorization_code_1',
    };

    try {
      await oauthController.token(<OAuthTokenReq>body);

      t.fail('Expecting JacksonError.');
    } catch (err) {
      const { message, statusCode } = err as JacksonError;
      t.equal(message, 'Unsupported grant_type', 'got expected error message');
      t.equal(statusCode, 400, 'got expected status code');
    }

    t.end();
  });

  t.test('Should throw an error if `code` is missing', async (t) => {
    const body = {
      grant_type: 'authorization_code',
    };

    try {
      await oauthController.token(<OAuthTokenReq>body);

      t.fail('Expecting JacksonError.');
    } catch (err) {
      const { message, statusCode } = err as JacksonError;
      t.equal(message, 'Please specify code', 'got expected error message');
      t.equal(statusCode, 400, 'got expected status code');
    }

    t.end();
  });

  t.test('Should throw an error if `code` is invalid', async (t) => {
    const body: Partial<OAuthTokenReq> = {
      grant_type: 'authorization_code',
      client_id: `tenant=${samlConfig.tenant}&product=${samlConfig.product}`,
      client_secret: 'some-secret',
      code: 'invalid-code',
    };

    try {
      await oauthController.token(<OAuthTokenReq>body);

      t.fail('Expecting JacksonError.');
    } catch (err) {
      const { message, statusCode } = err as JacksonError;
      t.equal(message, 'Invalid code', 'got expected error message');
      t.equal(statusCode, 403, 'got expected status code');
    }

    t.end();
  });

  t.test('Should return the `access_token` for a valid request', async (t) => {
    const body: Partial<OAuthTokenReq> = {
      grant_type: 'authorization_code',
      client_id: `tenant=${samlConfig.tenant}&product=${samlConfig.product}`,
      client_secret: 'dummy',
      code: code,
    };

    const stubRandomBytes = sinon
      .stub(crypto, 'randomBytes')
      .onFirstCall()
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .returns(token);

    const response = await oauthController.token(<OAuthTokenReq>body);

    t.ok(stubRandomBytes.calledOnce, 'randomBytes called once');
    t.ok('access_token' in response, 'includes access_token');
    t.ok('token_type' in response, 'includes token_type');
    t.ok('expires_in' in response, 'includes expires_in');
    t.match(response.access_token, token);
    t.match(response.token_type, 'bearer');
    t.match(response.expires_in, 300);

    stubRandomBytes.restore();

    t.end();
  });

  // TODO
  t.test('Handle invalid client_id', async (t) => {
    t.end();
  });

  t.end();
});
