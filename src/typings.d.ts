export type IdPConfig = {
  defaultRedirectUrl: string;
  redirectUrl: string;
  tenant: string;
  product: string;
  rawMetadata: string;
};

// TODO: Suggest an interface name
export interface OAuth {
  client_id: string;
  client_secret: string;
  provider: string;
}

// TODO: Suggest an interface name
export type IABC =
  | {
      clientID: string;
      clientSecret?: string;
      tenant?: string;
      product?: string;
    }
  | {
      clientID?: string;
      clientSecret?: string;
      tenant: string;
      product: string;
    };

export interface ISAMLConfig {
  // Ensure backward compatibility
  config(body: IdPConfig): Promise<OAuth>;
  getConfig(body: IABC): Promise<Partial<OAuth>>;
  deleteConfig(body: IABC): Promise<void>;

  create(body: IdPConfig): Promise<OAuth>;
  get(body: IABC): Promise<Partial<OAuth>>;
  delete(body: IABC): Promise<void>;
}

export interface IOAuthController {
  authorize(body: OAuthReqBody): Promise<{ redirect_url: string }>;
  samlResponse(body: SAMLResponsePayload): Promise<{ redirect_url: string }>;
  token(body: OAuthTokenReq): Promise<OAuthTokenRes>;
  userInfo(body: string): Promise<Profile>;
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
  get(namespace: string, key: string): Promise<any>;
  put(
    namespace: string,
    key: string,
    val: any,
    ttl: number,
    indexes: Index[]
  ): Promise<any>;
  delete(namespace: string, key: string): Promise<any>;
  getByIndex(namespace: string, idx: Index): Promise<any>;
}

export interface Storable {
  get(key: string): Promise<any>;
  put(key: string, val: any, indexes?: Index[]): Promise<any>;
  delete(key: string): Promise<any>;
  getByIndex(idx: Index): Promise<any>;
}

export interface Encrypted {
  iv: string;
  tag: string;
  value: string;
}

// TODO: Need fix
export type EncryptionKey = any;

export type DatabaseEngine = 'redis' | 'sql' | 'mongo' | 'mem';

export type DatabaseType = 'postgres' | 'cockroachdb' | 'mysql' | 'mariadb';

export interface DatabaseOption {
  engine: DatabaseEngine;
  url: string;
  type: DatabaseType;
  ttl: number;
  cleanupLimit: number;
  encryptionKey?: string;
}

export interface SAMLReq {
  ssoUrl: string;
  entityID: string;
  callbackUrl: string;
  isPassive: boolean;
  forceAuthn: boolean;
  identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress';
  providerName: 'BoxyHQ';
  signingKey: string;
}
