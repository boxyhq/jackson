import { OAuthReqBody } from '../src';
import boxyhq from './data/metadata/boxyhq';
import boxyhqNobinding from './data/metadata/boxyhq-nobinding';

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

// END: Fixtures for authorize

// BEGIN: Fixtures for api.test.ts
export const saml_config = boxyhq;
