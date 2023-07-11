import sinon from 'sinon';
import tap from 'tap';
import { generators, Issuer } from 'openid-client';
import { IConnectionAPIController, IOAuthController, OAuthReq } from '../../src/typings';
import { authz_request_oidc_provider, oidc_response, oidc_response_with_error } from './fixture';
import { JacksonError } from '../../src/controller/error';
import { addSSOConnections, jacksonOptions } from '../utils';
import path from 'path';

let connectionAPIController: IConnectionAPIController;
let oauthController: IOAuthController;

const metadataPath = path.join(__dirname, '/data/metadata');

tap.before(async () => {
  const controller = await (await import('../../src/index')).default(jacksonOptions);

  connectionAPIController = controller.connectionAPIController;
  oauthController = controller.oauthController;
  await addSSOConnections(metadataPath, connectionAPIController);
});

tap.teardown(async () => {
  process.exit(0);
});

tap.test('[OIDCProvider]', async (t) => {
  const context: Record<string, any> = {};
  t.test('[authorize] Should return the IdP SSO URL', async (t) => {
    const codeVerifier = generators.codeVerifier();
    const stubCodeVerifier = sinon.stub(generators, 'codeVerifier').returns(codeVerifier);
    // will be matched in happy path test
    context.codeVerifier = codeVerifier;
    const codeChallenge = generators.codeChallenge(codeVerifier);

    const response = (await oauthController.authorize(<OAuthReq>authz_request_oidc_provider)) as {
      redirect_url: string;
    };
    const params = new URLSearchParams(new URL(response.redirect_url!).search);
    t.ok('redirect_url' in response, 'got the Idp authorize URL');
    t.ok(params.has('state'), 'state present');
    t.match(params.get('scope'), 'openid email profile', 'openid scopes present');
    t.match(params.get('code_challenge'), codeChallenge, 'codeChallenge present');
    stubCodeVerifier.restore();
    context.state = params.get('state');
  });

  t.test('[authorize] Should return error if `oidcPath` is not set', async (t) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    oauthController.opts.oidcPath = undefined;
    const response = (await oauthController.authorize(<OAuthReq>authz_request_oidc_provider)) as {
      redirect_url: string;
    };
    const response_params = new URLSearchParams(new URL(response.redirect_url!).search);

    t.match(response_params.get('error'), 'server_error', 'got server_error when `oidcPath` is not set');
    t.match(
      response_params.get('error_description'),
      'OpenID response handler path (oidcPath) is not set',
      'matched error_description when `oidcPath` is not set'
    );
    t.match(
      response_params.get('state'),
      authz_request_oidc_provider.state,
      'state present in error response'
    );
    // Restore
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    oauthController.opts.oidcPath = jacksonOptions.oidcPath;
  });

  t.test('[oidcAuthzResponse] Should throw an error if `state` is missing', async (t) => {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      await oauthController.oidcAuthzResponse(oidc_response);
    } catch (err) {
      const { message, statusCode } = err as JacksonError;
      t.equal(message, 'State from original request is missing.', 'got expected error message');
      t.equal(statusCode, 403, 'got expected status code');
    }
  });

  t.test('[oidcAuthzResponse] Should throw an error if `code` is missing', async (t) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const { redirect_url } = await oauthController.oidcAuthzResponse({ state: context.state });
    const response_params = new URLSearchParams(new URL(redirect_url!).search);

    t.match(
      response_params.get('error'),
      'server_error',
      'got server_error when unable to retrieve code from provider'
    );
    t.match(
      response_params.get('error_description'),
      'Authorization code could not be retrieved from OIDC Provider',
      'matched error_description when unable to retrieve code from provider'
    );
    t.match(
      response_params.get('state'),
      authz_request_oidc_provider.state,
      'state present in error response'
    );
  });

  t.test('[oidcAuthzResponse] Should throw an error if `state` is invalid', async (t) => {
    try {
      await oauthController.oidcAuthzResponse({ ...oidc_response, state: context.state + 'invalid_chars' });
    } catch (err) {
      const { message, statusCode } = err as JacksonError;
      t.equal(message, 'Unable to validate state from the original request.', 'got expected error message');
      t.equal(statusCode, 403, 'got expected status code');
    }
  });

  t.test('[oidcAuthzResponse] Should forward any provider errors to redirect_uri', async (t) => {
    const { redirect_url } = await oauthController.oidcAuthzResponse({
      ...oidc_response_with_error,
      state: context.state,
    });
    const response_params = new URLSearchParams(new URL(redirect_url!).search);

    t.match(response_params.get('error'), oidc_response_with_error.error, 'oidc error got forwarded');
    t.match(
      response_params.get('error_description'),
      oidc_response_with_error.error_description,
      'oidc error_description got forwarded'
    );
    t.match(
      response_params.get('state'),
      authz_request_oidc_provider.state,
      'state present in error response'
    );
  });

  t.test(
    '[oidcAuthzResponse] Should return the client redirect url with code and original state attached',
    async (t) => {
      const TOKEN_SET = {
        access_token: 'ACCESS_TOKEN',
        id_token: 'ID_TOKEN',
        claims: () => ({
          sub: 'USER_IDENTIFIER',
          email: 'jackson@example.com',
          given_name: 'jackson',
          family_name: 'samuel',
        }),
      };
      const fakeCb = sinon.fake(async () => TOKEN_SET);
      function FakeOidcClient(this: any) {
        this.callback = fakeCb;
        this.userinfo = async () => ({
          sub: 'USER_IDENTIFIER',
          email: 'jackson@example.com',
          given_name: 'jackson',
          family_name: 'samuel',
          picture: 'https://jackson.cloud.png',
          email_verified: true,
        });
      }

      sinon.stub(Issuer, 'discover').callsFake(
        () =>
          ({
            Client: FakeOidcClient,
          }) as any
      );
      const { redirect_url } = await oauthController.oidcAuthzResponse({
        ...oidc_response,
        state: context.state,
      });
      t.ok(
        fakeCb.calledWithMatch(
          // @ts-ignore
          jacksonOptions.externalUrl + jacksonOptions.oidcPath,
          { code: oidc_response.code },
          { code_verifier: context.codeVerifier }
        )
      );

      const response_params = new URLSearchParams(new URL(redirect_url!).search);

      t.ok(response_params.has('code'), 'redirect_url has code');
      t.match(response_params.get('state'), authz_request_oidc_provider.state);
      sinon.restore();
    }
  );
});
