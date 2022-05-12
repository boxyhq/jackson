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
import saml from '@boxyhq/saml20';
import {
  authz_request_normal,
  authz_request_normal_with_access_type,
  bodyWithDummyCredentials,
  bodyWithInvalidClientSecret,
  bodyWithInvalidCode,
  bodyWithUnencodedClientId_InvalidClientSecret_gen,
  invalid_client_id,
  redirect_uri_not_allowed,
  redirect_uri_not_set,
  response_type_not_code,
  saml_binding_absent,
  state_not_set,
  token_req_encoded_client_id,
  token_req_unencoded_client_id_gen,
} from './fixture';

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
  clientSecretVerifier: 'TOP-SECRET',
};

const configRecords: Array<any> = [];

const addMetadata = async (metadataPath) => {
  const configs = await readConfig(metadataPath);
  for (const config of configs) {
    const _record = await apiController.config(config);
    configRecords.push(_record);
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
    const body = redirect_uri_not_set;

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

  t.test('Should return OAuth Error response if `state` is not set', async (t) => {
    const body = state_not_set;

    const { redirect_url } = await oauthController.authorize(<OAuthReqBody>body);

    t.equal(
      redirect_url,
      `${body.redirect_uri}?error=invalid_request&error_description=Please+specify+a+state+to+safeguard+against+XSRF+attacks`,
      'got OAuth error'
    );

    t.end();
  });

  t.test('Should return OAuth Error response if `response_type` is not `code`', async (t) => {
    const body = response_type_not_code;

    const { redirect_url } = await oauthController.authorize(<OAuthReqBody>body);

    t.equal(
      redirect_url,
      `${body.redirect_uri}?error=unsupported_response_type&error_description=Only+Authorization+Code+grant+is+supported`,
      'got OAuth error'
    );

    t.end();
  });

  t.test('Should return OAuth Error response if saml binding could not be retrieved', async (t) => {
    const body = saml_binding_absent;

    const { redirect_url } = await oauthController.authorize(<OAuthReqBody>body);

    t.equal(
      redirect_url,
      `${body.redirect_uri}?error=invalid_request&error_description=SAML+binding+could+not+be+retrieved`,
      'got OAuth error'
    );

    t.end();
  });

  t.test('Should return OAuth Error response if request creation fails', async (t) => {
    const body = authz_request_normal;
    const stubSamlRequest = sinon.stub(saml, 'request').throws(Error('Internal error: Fatal'));
    const { redirect_url } = await oauthController.authorize(<OAuthReqBody>body);
    t.equal(
      redirect_url,
      `${body.redirect_uri}?error=server_error&error_description=Internal+error%3A+Fatal`,
      'got OAuth error'
    );
    stubSamlRequest.restore();
    t.end();
  });

  t.test('Should throw an error if `client_id` is invalid', async (t) => {
    const body = invalid_client_id;

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
    const body = redirect_uri_not_allowed;

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
    t.test('accepts client_id', async (t) => {
      const body = authz_request_normal;

      const response = await oauthController.authorize(<OAuthReqBody>body);
      const params = new URLSearchParams(new URL(response.redirect_url!).search);

      t.ok('redirect_url' in response, 'got the Idp authorize URL');
      t.ok(params.has('RelayState'), 'RelayState present in the query string');
      t.ok(params.has('SAMLRequest'), 'SAMLRequest present in the query string');

      t.end();
    });

    t.test('accepts access_type', async (t) => {
      const body = authz_request_normal_with_access_type;

      const response = await oauthController.authorize(<OAuthReqBody>body);
      const params = new URLSearchParams(new URL(response.redirect_url!).search);

      t.ok('redirect_url' in response, 'got the Idp authorize URL');
      t.ok(params.has('RelayState'), 'RelayState present in the query string');
      t.ok(params.has('SAMLRequest'), 'SAMLRequest present in the query string');

      t.end();
    });
  });

  t.end();
});

tap.test('samlResponse()', async (t) => {
  const authBody = authz_request_normal;

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

  t.test('Should return OAuth Error response if response validation fails', async (t) => {
    const responseBody = {
      SAMLResponse: rawResponse,
      RelayState: relayState,
    };

    const stubValidateAsync = sinon.stub(saml, 'validateAsync').throws(Error('Internal error: Fatal'));

    const response = await oauthController.samlResponse(<SAMLResponsePayload>responseBody);

    const params = new URLSearchParams(new URL(response.redirect_url!).search);
    t.match(params.get('error'), 'access_denied');
    t.match(params.get('error_description'), 'Internal error: Fatal');

    stubValidateAsync.restore();

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

  t.test('Should throw an error if `code` or `client_secret` is invalid', async (t) => {
    try {
      await oauthController.token(<OAuthTokenReq>bodyWithInvalidCode);

      t.fail('Expecting JacksonError.');
    } catch (err) {
      const { message, statusCode } = err as JacksonError;
      t.equal(message, 'Invalid code', 'got expected error message');
      t.equal(statusCode, 403, 'got expected status code');
    }

    try {
      await oauthController.token(<OAuthTokenReq>bodyWithInvalidClientSecret);

      t.fail('Expecting JacksonError.');
    } catch (err) {
      const { message, statusCode } = err as JacksonError;
      t.equal(message, 'Invalid client_secret', 'got expected error message');
      t.equal(statusCode, 401, 'got expected status code');
    }

    try {
      const bodyWithUnencodedClientId_InvalidClientSecret =
        bodyWithUnencodedClientId_InvalidClientSecret_gen(configRecords);
      await oauthController.token(<OAuthTokenReq>bodyWithUnencodedClientId_InvalidClientSecret);

      t.fail('Expecting JacksonError.');
    } catch (err) {
      const { message, statusCode } = err as JacksonError;
      t.equal(message, 'Invalid client_id or client_secret', 'got expected error message');
      t.equal(statusCode, 401, 'got expected status code');
    }

    try {
      await oauthController.token(<OAuthTokenReq>bodyWithDummyCredentials);

      t.fail('Expecting JacksonError.');
    } catch (err) {
      const { message, statusCode } = err as JacksonError;
      t.equal(message, 'Invalid client_secret', 'got expected error message');
      t.equal(statusCode, 401, 'got expected status code');
    }

    t.end();
  });

  t.test('Should return the `access_token`/`userprofile` for a valid request', async (t) => {
    t.test('encoded client_id', async (t) => {
      const body = token_req_encoded_client_id;
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

    t.test('unencoded client_id', async (t) => {
      // have to call authorize, because previous happy path deletes the code.
      const authBody = authz_request_normal;

      const { redirect_url } = await oauthController.authorize(<OAuthReqBody>authBody);

      const relayState = new URLSearchParams(new URL(redirect_url!).search).get('RelayState');

      const rawResponse = await fs.readFile(path.join(__dirname, '/data/saml_response'), 'utf8');
      const responseBody = {
        SAMLResponse: rawResponse,
        RelayState: relayState,
      };

      sinon.stub(saml, 'validateAsync').resolves({ audience: '', claims: {}, issuer: '', sessionIndex: '' });

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const stubRandomBytes = sinon.stub(crypto, 'randomBytes').returns(code).onSecondCall().returns(token);

      await oauthController.samlResponse(<SAMLResponsePayload>responseBody);

      const body = token_req_unencoded_client_id_gen(configRecords);

      const tokenRes = await oauthController.token(<OAuthTokenReq>body);

      t.ok('access_token' in tokenRes, 'includes access_token');
      t.ok('token_type' in tokenRes, 'includes token_type');
      t.ok('expires_in' in tokenRes, 'includes expires_in');
      t.match(tokenRes.access_token, token);
      t.match(tokenRes.token_type, 'bearer');
      t.match(tokenRes.expires_in, 300);

      const profile = await oauthController.userInfo(tokenRes.access_token);

      t.equal(profile.requested.client_id, authz_request_normal.client_id);
      t.equal(profile.requested.state, authz_request_normal.state);
      t.equal(profile.requested.tenant, new URLSearchParams(authz_request_normal.client_id).get('tenant'));
      t.equal(profile.requested.product, new URLSearchParams(authz_request_normal.client_id).get('product'));

      stubRandomBytes.restore();

      t.end();
    });
  });

  t.end();
});
