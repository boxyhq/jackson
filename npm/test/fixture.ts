import { OAuthReqBody, OAuthTokenReq } from '../src';
import boxyhq from './data/metadata/boxyhq';
import boxyhqNobinding from './data/metadata/boxyhq-nobinding';
import exampleOidc from './data/metadata/example.oidc';

// BEGIN: Fixtures for authorize
export const authz_request_normal: Partial<OAuthReqBody> = {
  redirect_uri: boxyhq.defaultRedirectUrl,
  state: 'state-123',
  client_id: `tenant=${boxyhq.tenant}&product=${boxyhq.product}`,
};

export const authz_request_normal_with_access_type: Partial<OAuthReqBody> = {
  redirect_uri: boxyhq.defaultRedirectUrl,
  state: 'state-123',
  access_type: `tenant=${boxyhq.tenant}&product=${boxyhq.product}`,
  client_id: 'dummy',
};

export const authz_request_normal_with_resource: Partial<OAuthReqBody> = {
  redirect_uri: boxyhq.defaultRedirectUrl,
  state: 'state-123',
  resource: `tenant=${boxyhq.tenant}&product=${boxyhq.product}`,
  client_id: 'dummy',
};

export const authz_request_normal_with_scope: Partial<OAuthReqBody> = {
  redirect_uri: boxyhq.defaultRedirectUrl,
  state: 'state-123',
  scope: `tenant=${boxyhq.tenant}&product=${boxyhq.product}`,
  client_id: 'dummy',
};

export const authz_request_normal_oidc_flow: Partial<OAuthReqBody> = {
  redirect_uri: boxyhq.defaultRedirectUrl,
  state: 'state-123',
  scope: `openid`,
  client_id: `tenant=${boxyhq.tenant}&product=${boxyhq.product}`,
};

export const redirect_uri_not_set: Partial<OAuthReqBody> = {
  redirect_uri: undefined,
  state: 'state',
};

export const redirect_uri_not_allowed: Partial<OAuthReqBody> = {
  ...authz_request_normal,
  redirect_uri: 'https://example.com/',
};

export const state_not_set: Partial<OAuthReqBody> = {
  redirect_uri: boxyhq.defaultRedirectUrl,
  state: undefined,
  client_id: `tenant=${boxyhq.tenant}&product=${boxyhq.product}`,
};

export const response_type_not_code: Partial<OAuthReqBody> = {
  redirect_uri: boxyhq.defaultRedirectUrl,
  state: 'state-123',
  client_id: `tenant=${boxyhq.tenant}&product=${boxyhq.product}`,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  response_type: 'token',
};

export const invalid_client_id: Partial<OAuthReqBody> = {
  redirect_uri: boxyhq.defaultRedirectUrl,
  state: 'state-123',
  client_id: 'xxxxxxxxx',
};

export const saml_binding_absent: Partial<OAuthReqBody> = {
  redirect_uri: boxyhqNobinding.defaultRedirectUrl,
  state: 'state-123',
  client_id: `tenant=${boxyhqNobinding.tenant}&product=${boxyhqNobinding.product}`,
};

export const authz_request_oidc_provider = {
  redirect_uri: exampleOidc.defaultRedirectUrl,
  state: 'state-123',
  client_id: `tenant=${exampleOidc.tenant}&product=${exampleOidc.product}`,
  scope: 'openid',
};
// END: Fixtures for authorize

// BEGIN: Fixtures for token
const CODE = '1234567890';
const CLIENT_SECRET_VERIFIER = 'TOP-SECRET';
export const bodyWithInvalidCode: Partial<OAuthTokenReq> = {
  grant_type: 'authorization_code',
  client_id: `tenant=${boxyhq.tenant}&product=${boxyhq.product}`,
  client_secret: CLIENT_SECRET_VERIFIER,
  code: 'invalid-code',
  redirect_uri: boxyhq.defaultRedirectUrl,
};
// invalid redirect_uri
export const bodyWithInvalidRedirectUri: Partial<OAuthTokenReq> = {
  grant_type: 'authorization_code',
  client_id: `tenant=${boxyhq.tenant}&product=${boxyhq.product}`,
  client_secret: CLIENT_SECRET_VERIFIER,
  code: CODE,
  redirect_uri: 'http://example.com',
};
export const bodyWithMissingRedirectUri: Partial<OAuthTokenReq> = {
  grant_type: 'authorization_code',
  client_id: `tenant=${boxyhq.tenant}&product=${boxyhq.product}`,
  client_secret: CLIENT_SECRET_VERIFIER,
  code: CODE,
};
//encoded clientId and wrong secret
export const bodyWithInvalidClientSecret: Partial<OAuthTokenReq> = {
  grant_type: 'authorization_code',
  client_id: `tenant=${boxyhq.tenant}&product=${boxyhq.product}`,
  client_secret: 'dummy',
  code: CODE,
  redirect_uri: boxyhq.defaultRedirectUrl,
};
//unencoded clientId with wrong secret
export const bodyWithUnencodedClientId_InvalidClientSecret_gen = (configRecords) => {
  const configRecord = configRecords.find(
    (record) => `tenant=${record.tenant}&product=${record.product}` === authz_request_normal.client_id
  );
  return {
    grant_type: 'authorization_code',
    client_id: configRecord.clientID,
    client_secret: 'dummy',
    code: CODE,
    redirect_uri: boxyhq.defaultRedirectUrl,
  };
};

export const bodyWithDummyCredentials: Partial<OAuthTokenReq> = {
  grant_type: 'authorization_code',
  client_id: `dummy`,
  client_secret: 'dummy',
  code: CODE,
  redirect_uri: boxyhq.defaultRedirectUrl,
};

export const token_req_encoded_client_id: Partial<OAuthTokenReq> = {
  grant_type: 'authorization_code',
  client_id: `tenant=${boxyhq.tenant}&product=${boxyhq.product}`,
  client_secret: CLIENT_SECRET_VERIFIER,
  code: CODE,
  redirect_uri: boxyhq.defaultRedirectUrl,
};

export const token_req_unencoded_client_id_gen = (configRecords) => {
  const configRecord = configRecords.find(
    (record) => `tenant=${record.tenant}&product=${record.product}` === authz_request_normal.client_id
  );
  return {
    grant_type: 'authorization_code',
    client_id: configRecord.clientID,
    client_secret: configRecord.clientSecret,
    code: '1234567890',
    redirect_uri: boxyhq.defaultRedirectUrl,
  };
};

export const token_req_idp_initiated_saml_login = {
  grant_type: 'authorization_code',
  code: '1234567890',
};
// END: Fixtures for token

// BEGIN: Fixtures for api.test.ts
export const saml_config = boxyhq;
