export type IdPConfig = {
  defaultRedirectUrl: string;
  redirectUrl: string[] | string;
  tenant: string;
  product: string;
  name: string;
  description: string;
  rawMetadata?: string;
  encodedRawMetadata?: string;
};

export interface IAPIController {
  config(body: IdPConfig): Promise<any>;
  updateConfig(body: any): Promise<any>;
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
  samlResponse(body: SAMLResponsePayload): Promise<{ redirect_url: string }>;
  token(body: OAuthTokenReq): Promise<OAuthTokenRes>;
  userInfo(token: string): Promise<Profile>;
}

export interface IAdminController {
  getAllConfig(pageOffset?: number, pageLimit?: number);
}
export interface IHealthCheckController {
  status(): Promise<{
    status: number;
  }>;
  init(): Promise<void>;
}
export interface OAuthReqBody {
  response_type: 'code';
  client_id: string;
  redirect_uri: string;
  state: string;
  tenant: string;
  product: string;
  code_challenge: string;
  code_challenge_method: 'plain' | 'S256' | '';
  provider: 'saml';
}

export interface SAMLResponsePayload {
  SAMLResponse: string;
  RelayState: string;
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
  token_type: 'bearer';
  expires_in: number;
}

export interface Profile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
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

export type DatabaseEngine = 'redis' | 'sql' | 'mongo' | 'mem';

export type DatabaseType = 'postgres' | 'mysql' | 'mariadb';

export interface DatabaseOption {
  engine?: DatabaseEngine;
  url?: string;
  type?: DatabaseType;
  ttl?: number;
  cleanupLimit?: number;
  encryptionKey?: string;
  pageLimit?: number;
}

export interface JacksonOption {
  externalUrl: string;
  samlPath: string;
  samlAudience?: string;
  preLoadedConfig?: string;
  idpEnabled?: boolean;
  db: DatabaseOption;
  clientSecretVerifier?: string;
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
  loginType: 'idp';
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
