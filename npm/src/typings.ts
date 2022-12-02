import { type JWK } from 'jose';

interface SSOConnection {
  defaultRedirectUrl: string;
  redirectUrl: string[] | string;
  tenant: string;
  product: string;
  name?: string;
  description?: string;
}

export interface SAMLSSOConnection extends SSOConnection {
  forceAuthn?: boolean | string;
}

export interface SAMLSSOConnectionWithRawMetadata extends SAMLSSOConnection {
  rawMetadata: string;
  encodedRawMetadata?: never;
  metadataUrl?: string;
}

export interface SAMLSSOConnectionWithEncodedMetadata extends SAMLSSOConnection {
  rawMetadata?: never;
  encodedRawMetadata: string;
  metadataUrl?: string;
}

export interface OIDCSSOConnection extends SSOConnection {
  oidcDiscoveryUrl: string;
  oidcClientId: string;
  oidcClientSecret: string;
}

export interface SAMLSSORecord extends SAMLSSOConnection {
  clientID: string; // set by Jackson
  clientSecret: string; // set by Jackson
  metadataUrl?: string;
  idpMetadata: {
    entityID: string;
    loginType?: string;
    provider: string | 'Unknown';
    slo: {
      postUrl?: string;
      redirectUrl?: string;
    };
    sso: {
      postUrl?: string;
      redirectUrl?: string;
    };
    thumbprint?: string;
    validTo?: string;
  };
}

export interface OIDCSSORecord extends SSOConnection {
  clientID: string; // set by Jackson
  clientSecret: string; // set by Jackson
  oidcProvider: {
    provider?: string;
    discoveryUrl?: string;
    clientId?: string;
    clientSecret?: string;
  };
}

export type ConnectionType = 'saml' | 'oidc';

type ClientIDQuery = {
  clientID: string;
};

type TenantQuery = {
  tenant: string;
  product: string;
  strategy?: ConnectionType;
};

type TenantProduct = {
  tenant: string;
  product: string;
};

export type GetConnectionsQuery = ClientIDQuery | TenantQuery;
export type GetEntityIDBody = TenantProduct;
export type DelConnectionsQuery = (ClientIDQuery & { clientSecret: string }) | TenantQuery;

export type GetConfigQuery = ClientIDQuery | Omit<TenantQuery, 'strategy'>;
export type DelConfigQuery = (ClientIDQuery & { clientSecret: string }) | Omit<TenantQuery, 'strategy'>;

export interface IConnectionAPIController {
  /**
   * @deprecated Use `createSAMLConnection` instead.
   */
  config(body: SAMLSSOConnection): Promise<SAMLSSORecord>;
  createSAMLConnection(
    body: SAMLSSOConnectionWithRawMetadata | SAMLSSOConnectionWithEncodedMetadata
  ): Promise<SAMLSSORecord>;
  createOIDCConnection(body: OIDCSSOConnection): Promise<OIDCSSORecord>;
  /**
   * @deprecated Use `updateSAMLConnection` instead.
   */
  updateConfig(body: SAMLSSOConnection & { clientID: string; clientSecret: string }): Promise<void>;
  updateSAMLConnection(
    body: (SAMLSSOConnectionWithRawMetadata | SAMLSSOConnectionWithEncodedMetadata) & {
      clientID: string;
      clientSecret: string;
    }
  ): Promise<void>;
  updateOIDCConnection(body: OIDCSSOConnection & { clientID: string; clientSecret: string }): Promise<void>;
  getConnections(body: GetConnectionsQuery): Promise<Array<SAMLSSORecord | OIDCSSORecord>>;
  getEntityID(body: GetEntityIDBody): string;
  /**
   * @deprecated Use `getConnections` instead.
   */
  getConfig(body: GetConfigQuery): Promise<SAMLSSORecord | Record<string, never>>;
  deleteConnections(body: DelConnectionsQuery): Promise<void>;
  /**
   * @deprecated Use `deleteConnections` instead.
   */
  deleteConfig(body: DelConfigQuery): Promise<void>;
}

export interface IOAuthController {
  authorize(body: OAuthReq): Promise<{ redirect_url?: string; authorize_form?: string }>;
  samlResponse(body: SAMLResponsePayload): Promise<{ redirect_url?: string; app_select_form?: string }>;
  oidcAuthzResponse(body: OIDCAuthzResponsePayload): Promise<{ redirect_url?: string }>;
  token(body: OAuthTokenReq): Promise<OAuthTokenRes>;
  userInfo(token: string): Promise<Profile>;
}

export interface IAdminController {
  getAllConnection(pageOffset?: number, pageLimit?: number);
}

export interface IHealthCheckController {
  status(): Promise<{
    status: number;
  }>;
  init(): Promise<void>;
}

export interface ILogoutController {
  createRequest(body: SLORequestParams): Promise<{ logoutUrl: string | null; logoutForm: string | null }>;
  handleResponse(body: SAMLResponsePayload): Promise<any>;
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
  state: string;
  response_type: 'code';
  redirect_uri: string;
  code_challenge: string;
  code_challenge_method: 'plain' | 'S256' | '';
  scope?: string;
  nonce?: string;
  idp_hint?: string;
  prompt?: string;
}

export interface OAuthReqBodyWithClientId extends OAuthReqBody {
  client_id: string;
}

export interface OAuthReqBodyWithTenantProduct extends OAuthReqBody {
  client_id: 'dummy';
  tenant: string;
  product: string;
}

export interface OAuthReqBodyWithAccessType extends OAuthReqBody {
  client_id: 'dummy';
  access_type: string;
}

export interface OAuthReqBodyWithResource extends OAuthReqBody {
  client_id: 'dummy';
  resource: string;
}

export type OAuthReq =
  | OAuthReqBodyWithClientId
  | OAuthReqBodyWithTenantProduct
  | OAuthReqBodyWithAccessType
  | OAuthReqBodyWithResource;

export interface SAMLResponsePayload {
  SAMLResponse: string;
  RelayState: string;
  idp_hint?: string;
}

interface OIDCAuthzResponseSuccess {
  code: string;
  state: string;
  error?: never;
  error_description?: never;
}

interface OIDCAuthzResponseError {
  code?: never;
  state: string;
  error: OAuthErrorHandlerParams['error'] | OIDCErrorCodes;
  error_description?: string;
}

export type OIDCAuthzResponsePayload = OIDCAuthzResponseSuccess | OIDCAuthzResponseError;

interface OAuthTokenReqBody {
  code: string;
  grant_type: 'authorization_code';
  redirect_uri: string;
}

export interface OAuthTokenReqWithCodeVerifier extends OAuthTokenReqBody {
  code_verifier: string;
  client_id?: never;
  client_secret?: never;
}

export interface OAuthTokenReqWithCredentials extends OAuthTokenReqBody {
  code_verifier?: never;
  client_id: string;
  client_secret: string;
}

export type OAuthTokenReq = OAuthTokenReqWithCodeVerifier | OAuthTokenReqWithCredentials;

export interface OAuthTokenRes {
  access_token: string;
  id_token?: string;
  token_type: 'bearer';
  expires_in: number;
}

export interface Profile {
  id: string;
  idHash: string;
  sub?: string;
  email: string;
  firstName: string;
  lastName: string;
  roles?: string[];
  groups?: string[];
  requested: Record<string, string>;
  raw: any;
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
  getAll(pageOffset?: number, pageLimit?: number): Promise<any[]>;
  get(key: string): Promise<any>;
  put(key: string, val: any, ...indexes: Index[]): Promise<any>;
  delete(key: string): Promise<any>;
  getByIndex(idx: Index): Promise<any>;
}

export interface DatabaseStore {
  store(namespace: string): Storable;
}

export interface Encrypted {
  iv?: string;
  tag?: string;
  value: string;
}

export type EncryptionKey = any;

export type DatabaseEngine = 'redis' | 'sql' | 'mongo' | 'mem' | 'planetscale';

export type DatabaseType = 'postgres' | 'mysql' | 'mariadb' | 'mssql';

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
  oidcPath?: string;
  samlAudience?: string;
  preLoadedConfig?: string;
  preLoadedConnection?: string;
  idpEnabled?: boolean;
  db: DatabaseOption;
  clientSecretVerifier?: string;
  idpDiscoveryPath?: string;
  scimPath?: string;
  openid?: {
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

export interface SAMLConnection {
  idpMetadata: Metadata;
  defaultRedirectUrl: string;
}

// See Error Response section in https://www.oauth.com/oauth2-servers/authorization/the-authorization-response/
export interface OAuthErrorHandlerParams {
  error:
    | 'invalid_request'
    | 'access_denied'
    | 'unauthorized_client'
    | 'unsupported_response_type'
    | 'invalid_scope'
    | 'server_error'
    | 'temporarily_unavailable'
    | OIDCErrorCodes;
  error_description: string;
  redirect_uri: string;
  state?: string;
}

export type OIDCErrorCodes =
  | 'interaction_required'
  | 'login_required'
  | 'account_selection_required'
  | 'consent_required'
  | 'invalid_request_uri'
  | 'invalid_request_object'
  | 'request_not_supported'
  | 'request_uri_not_supported'
  | 'registration_not_supported';

export interface ISPSAMLConfig {
  get(): Promise<{
    acsUrl: string;
    entityId: string;
    response: string;
    assertionSignature: string;
    signatureAlgorithm: string;
    publicKey: string;
    publicKeyString: string;
  }>;
  toMarkdown(): string;
  toHTML(): string;
  toXMLMetadata(): Promise<string>;
}

export type DirectorySyncEventType =
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'group.created'
  | 'group.updated'
  | 'group.deleted'
  | 'group.user_added'
  | 'group.user_removed';

export interface Base {
  store(type: 'groups' | 'members' | 'users'): Storable;
  setTenant(tenant: string): this;
  setProduct(product: string): this;
  setTenantAndProduct(tenant: string, product: string): this;
  with(tenant: string, product: string): this;
  createId(): string;
}

export interface Users extends Base {
  list({
    pageOffset,
    pageLimit,
  }: {
    pageOffset?: number;
    pageLimit?: number;
  }): Promise<{ data: User[] | null; error: ApiError | null }>;
  get(id: string): Promise<{ data: User | null; error: ApiError | null }>;
  search(userName: string): Promise<{ data: User[] | null; error: ApiError | null }>;
  delete(id: string): Promise<{ data: null; error: ApiError | null }>;
  clear(): Promise<void>;
  create(param: {
    first_name: string;
    last_name: string;
    email: string;
    active: boolean;
    raw: any;
  }): Promise<{ data: User | null; error: ApiError | null }>;
  update(
    id: string,
    param: {
      first_name: string;
      last_name: string;
      email: string;
      active: boolean;
      raw: object;
    }
  ): Promise<{ data: User | null; error: ApiError | null }>;
}

export interface Groups extends Base {
  create(param: { name: string; raw: any }): Promise<{ data: Group | null; error: ApiError | null }>;
  removeAllUsers(groupId: string): Promise<void>;
  list({
    pageOffset,
    pageLimit,
  }: {
    pageOffset?: number;
    pageLimit?: number;
  }): Promise<{ data: Group[] | null; error: ApiError | null }>;
  get(id: string): Promise<{ data: Group | null; error: ApiError | null }>;
  getAllUsers(groupId: string): Promise<{ user_id: string }[]>;
  delete(id: string): Promise<{ data: null; error: ApiError | null }>;
  addUserToGroup(groupId: string, userId: string): Promise<void>;
  isUserInGroup(groupId: string, userId: string): Promise<boolean>;
  removeUserFromGroup(groupId: string, userId: string): Promise<void>;
  search(displayName: string): Promise<{ data: Group[] | null; error: ApiError | null }>;
  update(
    id: string,
    param: {
      name: string;
      raw: any;
    }
  ): Promise<{ data: Group | null; error: ApiError | null }>;
}

export type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  active: boolean;
  raw?: any;
};

export type Group = {
  id: string;
  name: string;
  raw?: any;
};

export enum DirectorySyncProviders {
  'azure-scim-v2' = 'Azure SCIM v2.0',
  'onelogin-scim-v2' = 'OneLogin SCIM v2.0',
  'okta-scim-v2' = 'Okta SCIM v2.0',
  'jumpcloud-scim-v2' = 'JumpCloud v2.0',
  'generic-scim-v2' = 'SCIM Generic v2.0',
}

export type DirectoryType = keyof typeof DirectorySyncProviders;

export type HTTPMethod = 'POST' | 'PUT' | 'DELETE' | 'GET' | 'PATCH';

export type Directory = {
  id: string;
  name: string;
  tenant: string;
  product: string;
  type: DirectoryType;
  log_webhook_events: boolean;
  scim: {
    path: string;
    endpoint?: string;
    secret: string;
  };
  webhook: {
    endpoint: string;
    secret: string;
  };
};

export type DirectorySyncGroupMember = { value: string; email?: string };

export interface DirectoryConfig {
  create({
    name,
    tenant,
    product,
    webhook_url,
    webhook_secret,
    type,
  }: {
    name?: string;
    tenant: string;
    product: string;
    webhook_url?: string;
    webhook_secret?: string;
    type?: DirectoryType;
  }): Promise<{ data: Directory | null; error: ApiError | null }>;
  update(
    id: string,
    param: Omit<Partial<Directory>, 'id' | 'tenant' | 'prodct' | 'scim'>
  ): Promise<{ data: Directory | null; error: ApiError | null }>;
  get(id: string): Promise<{ data: Directory | null; error: ApiError | null }>;
  getByTenantAndProduct(
    tenant: string,
    product: string
  ): Promise<{ data: Directory | null; error: ApiError | null }>;
  list({
    pageOffset,
    pageLimit,
  }: {
    pageOffset?: number;
    pageLimit?: number;
  }): Promise<{ data: Directory[] | null; error: ApiError | null }>;
  delete(id: string): Promise<void>;
}

export interface IDirectoryUsers {
  create(directory: Directory, body: any): Promise<DirectorySyncResponse>;
  get(user: User): Promise<DirectorySyncResponse>;
  update(directory: Directory, user: User, body: any): Promise<DirectorySyncResponse>;
  patch(directory: Directory, user: User, body: any): Promise<DirectorySyncResponse>;
  delete(directory: Directory, user: User, active: boolean): Promise<DirectorySyncResponse>;
  getAll(queryParams: { count: number; startIndex: number; filter?: string }): Promise<DirectorySyncResponse>;
  handleRequest(request: DirectorySyncRequest, eventCallback?: EventCallback): Promise<DirectorySyncResponse>;
}

export interface IDirectoryGroups {
  create(directory: Directory, body: any): Promise<DirectorySyncResponse>;
  get(group: Group): Promise<DirectorySyncResponse>;
  updateDisplayName(directory: Directory, group: Group, body: any): Promise<Group>;
  delete(directory: Directory, group: Group): Promise<DirectorySyncResponse>;
  getAll(queryParams: { filter?: string }): Promise<DirectorySyncResponse>;
  addGroupMembers(
    directory: Directory,
    group: Group,
    members: DirectorySyncGroupMember[] | undefined,
    sendWebhookEvent: boolean
  ): Promise<void>;
  removeGroupMembers(
    directory: Directory,
    group: Group,
    members: DirectorySyncGroupMember[],
    sendWebhookEvent: boolean
  ): Promise<void>;
  addOrRemoveGroupMembers(
    directory: Directory,
    group: Group,
    members: DirectorySyncGroupMember[]
  ): Promise<void>;
  update(directory: Directory, group: Group, body: any): Promise<DirectorySyncResponse>;
  patch(directory: Directory, group: Group, body: any): Promise<DirectorySyncResponse>;
  handleRequest(request: DirectorySyncRequest, eventCallback?: EventCallback): Promise<DirectorySyncResponse>;
}

export interface IWebhookEventsLogger extends Base {
  log(directory: Directory, event: DirectorySyncEvent): Promise<WebhookEventLog>;
  getAll(): Promise<WebhookEventLog[]>;
  get(id: string): Promise<WebhookEventLog>;
  clear(): Promise<void>;
  delete(id: string): Promise<void>;
  updateStatus(log: WebhookEventLog, statusCode: number): Promise<WebhookEventLog>;
}

export type DirectorySyncResponse = {
  status: number;
  data?: any;
};

export interface DirectorySyncRequestHandler {
  handle(request: DirectorySyncRequest, callback?: EventCallback): Promise<DirectorySyncResponse>;
}

export interface Events {
  handle(event: DirectorySyncEvent): Promise<void>;
}

export interface DirectorySyncRequest {
  method: HTTPMethod;
  body: any | undefined;
  directoryId: Directory['id'];
  resourceType: 'users' | 'groups';
  resourceId: string | undefined;
  apiSecret: string | null;
  query: {
    count?: number;
    startIndex?: number;
    filter?: string;
  };
}

export type IDirectorySyncController = {
  requests: DirectorySyncRequestHandler;
  directories: DirectoryConfig;
  groups: Groups;
  users: Users;
  events: { callback: EventCallback };
  webhookLogs: IWebhookEventsLogger;
  providers: () => {
    [K in string]: string;
  };
};

export interface ApiError {
  message: string;
  code: number;
}

export interface DirectorySyncEvent {
  directory_id: Directory['id'];
  event: DirectorySyncEventType;
  data: User | Group | (User & { group: Group });
  tenant: string;
  product: string;
}

export interface EventCallback {
  (event: DirectorySyncEvent): Promise<void>;
}

export interface WebhookEventLog extends DirectorySyncEvent {
  id: string;
  webhook_endpoint: string;
  created_at: Date;
  status_code?: number;
  delivered?: boolean;
}
export type SetupLinkCreatePayload = {
  tenant: string;
  product: string;
  service: 'sso' | 'dsync';
  regenerate?: boolean;
};

export type SetupLinkRegeneratePayload = {
  reference: string;
};

export type SetupLink = {
  setupID: string;
  tenant: string;
  product: string;
  url: string;
  service: string;
  validTill: number;
};

export type ApiResponse<T> = {
  data: T | null;
  error: ApiError | null;
};

export interface ISetupLinkController {
  create(body: SetupLinkCreatePayload): Promise<ApiResponse<SetupLink>>;
  getAll(): Promise<ApiResponse<SetupLink[]>>;
  getByService(service): Promise<ApiResponse<SetupLink[]>>;
  getByToken(token): Promise<ApiResponse<SetupLink>>;
  remove(key: string): Promise<ApiResponse<boolean>>;
}
