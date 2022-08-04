import { type JWK } from 'jose';

export type IdPConfig = {
  defaultRedirectUrl: string;
  redirectUrl: string[] | string;
  tenant: string;
  product: string;
  name: string;
  description: string;
  // SAML Provider
  rawMetadata?: string;
  encodedRawMetadata?: string;
  // OpenID Provider
  oidcDiscoveryUrl?: string;
  oidcClientId?: string;
  oidcClientSecret?: string;
};

export type connectionType = 'saml' | 'oidc';

export interface IConfigAPIController {
  config(body: IdPConfig): Promise<any>;
  createSAMLConfig(body: IdPConfig): Promise<any>;
  createOIDCConfig(body: IdPConfig): Promise<any>;
  updateConfig(body: IdPConfig & { clientID: 'string'; clientSecret: 'string' }): Promise<any>;
  updateSAMLConfig(body: IdPConfig & { clientID: 'string'; clientSecret: 'string' }): Promise<any>;
  updateOIDCConfig(body: IdPConfig & { clientID: 'string'; clientSecret: 'string' }): Promise<any>;
  getConfig(body: { clientID?: string; tenant?: string; product?: string }): Promise<any>;
  deleteConfig(body: {
    clientID?: string;
    clientSecret?: string;
    tenant?: string;
    product?: string;
  }): Promise<void>;
}

export interface IOAuthController {
  authorize(body: OAuthReqBody): Promise<{ redirect_url?: string; authorize_form?: string }>;
  samlResponse(body: SAMLResponsePayload): Promise<{ redirect_url?: string; app_select_form?: string }>;
  oidcAuthzResponse(body: AuthzResponsePayload): Promise<{ redirect_url?: string }>;
  token(body: OAuthTokenReq): Promise<OAuthTokenRes>;
  userInfo(token: string): Promise<Profile>;
}

export interface IAdminController {
  getAllConfig(pageOffset?: number, pageLimit?: number);
  getAllSAMLConfig(pageOffset?: number, pageLimit?: number);
  getAllOIDCConfig(pageOffset?: number, pageLimit?: number);
}
export interface IHealthCheckController {
  status(): Promise<{
    status: number;
  }>;
  init(): Promise<void>;
}

export interface IOidcDiscoveryController {
  openidConfig(): {
    issuer: string;
    authorization_endpoint: string;
    token_endpoint: string;
    userinfo_endpoint: string;
    jwks_uri: string;
    response_types_supported: Array<string>;
    subject_types_supported: Array<string>;
    id_token_signing_alg_values_supported: Array<string>;
    grant_types_supported: Array<string>;
    code_challenge_methods_supported: Array<string>;
  };

  jwks(): Promise<{
    keys: JWK[];
  }>;
}

export interface OAuthReqBody {
  response_type: 'code';
  client_id: string;
  redirect_uri: string;
  state: string;
  tenant?: string;
  product?: string;
  access_type?: string;
  resource?: string;
  scope?: string;
  nonce?: string;
  code_challenge: string;
  code_challenge_method: 'plain' | 'S256' | '';
  provider: 'saml';
  idp_hint?: string;
}

export interface SAMLResponsePayload {
  SAMLResponse: string;
  RelayState: string;
  idp_hint?: string;
}

export interface AuthzResponsePayload {
  code: string;
  state: string;
}

export interface OAuthTokenReq {
  client_id: string;
  client_secret: string;
  code_verifier: string;
  code: string;
  grant_type: 'authorization_code';
}

export interface OAuthTokenRes {
  access_token: string;
  id_token?: string;
  token_type: 'bearer';
  expires_in: number;
}

export interface Profile {
  id: string;
  sub?: string;
  email: string;
  firstName: string;
  lastName: string;
  requested: Record<string, string>;
}

export interface Index {
  name: string;
  value: string;
}

export interface DatabaseDriver {
  getAll(namespace: string, pageOffset?: number, pageLimit?: number): Promise<unknown[]>;
  get(namespace: string, key: string): Promise<any>;
  put(namespace: string, key: string, val: any, ttl: number, ...indexes: Index[]): Promise<any>;
  delete(namespace: string, key: string): Promise<any>;
  getByIndex(namespace: string, idx: Index): Promise<any>;
}

export interface Storable {
  getAll(pageOffset?: number, pageLimit?: number): Promise<unknown[]>;
  get(key: string): Promise<any>;
  put(key: string, val: any, ...indexes: Index[]): Promise<any>;
  delete(key: string): Promise<any>;
  getByIndex(idx: Index): Promise<any>;
}

export interface Encrypted {
  iv?: string;
  tag?: string;
  value: string;
}

export type EncryptionKey = any;

export type DatabaseEngine = 'redis' | 'sql' | 'mongo' | 'mem' | 'planetscale';

export type DatabaseType = 'postgres' | 'mysql' | 'mariadb';

export interface DatabaseOption {
  engine?: DatabaseEngine;
  url?: string;
  type?: DatabaseType;
  ttl?: number;
  cleanupLimit?: number;
  encryptionKey?: string;
  pageLimit?: number;
  ssl?: any;
}

export interface JacksonOption {
  externalUrl: string;
  samlPath: string;
  oidcPath?: string; // TODO: Add validation
  samlAudience?: string;
  preLoadedConfig?: string;
  idpEnabled?: boolean;
  db: DatabaseOption;
  clientSecretVerifier?: string;
  idpDiscoveryPath?: string;
  openid: {
    jwsAlg?: string;
    jwtSigningKeys?: {
      private: string;
      public: string;
    };
  };
}

export interface SLORequestParams {
  nameId: string;
  tenant: string;
  product: string;
  redirectUrl?: string;
}

interface Metadata {
  sso: {
    postUrl?: string;
    redirectUrl: string;
  };
  slo: {
    redirectUrl?: string;
    postUrl?: string;
  };
  entityID: string;
  thumbprint: string;
  loginType: 'idp' | 'sp';
  provider: string;
}

export interface SAMLConfig {
  idpMetadata: Metadata;
  certs: {
    privateKey: string;
    publicKey: string;
  };
  defaultRedirectUrl: string;
}

export interface ILogoutController {
  createRequest(body: SLORequestParams): Promise<{ logoutUrl: string | null; logoutForm: string | null }>;
  handleResponse(body: SAMLResponsePayload): Promise<any>;
}

export interface OAuthErrorHandlerParams {
  // See Error Response section in https://www.oauth.com/oauth2-servers/authorization/the-authorization-response/
  error:
    | 'invalid_request'
    | 'access_denied'
    | 'unauthorized_client'
    | 'unsupported_response_type'
    | 'invalid_scope'
    | 'server_error'
    | 'temporarily_unavailable';
  error_description: string;
  redirect_uri: string;
  state?: string;
}
