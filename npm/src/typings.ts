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
  samlResponse(body: SAMLResponsePayload): Promise<{ redirect_url?: string; app_select_form?: string }>;
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

export interface ILogoutController {
  createRequest(body: SLORequestParams): Promise<{ logoutUrl: string | null; logoutForm: string | null }>;
  handleResponse(body: SAMLResponsePayload): Promise<any>;
}

export interface IUsersController {
  with(tenant: string, product: string): IUsersController;
  create(param: { first_name: string; last_name: string; email: string; raw: any }): Promise<User>;
  get(id: string): Promise<User | null>;
  update(
    id: string,
    param: {
      first_name: string;
      last_name: string;
      email: string;
      raw: any;
    }
  ): Promise<User>;
  delete(id: string): Promise<void>;
}

export interface IGroupsController {
  with(tenant: string, product: string): IGroupsController;
  create(param: any): Promise<Group>;
  get(id: string): Promise<Group | null>;
  update(id: string, param: any): Promise<Group>;
  delete(id: string): Promise<void>;
  addUser(groupId: string, userId: string): Promise<void>;
  removeUser(groupId: string, userId: string): Promise<void>;
}

export interface OAuthReqBody {
  response_type: 'code';
  client_id: string;
  redirect_uri: string;
  state: string;
  tenant?: string;
  product?: string;
  access_type?: string;
  scope?: string;
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

export interface DatabaseStore {
  store(namespace: string): Storable;
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
  idpDiscoveryPath?: string;
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

// See Error Response section in https://www.oauth.com/oauth2-servers/authorization/the-authorization-response/
export interface OAuthErrorHandlerParams {
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

export interface UsersController {
  with(tenant: string, product: string): UsersController;
  setTenantAndProduct(tenant: string, product: string): void;
  list({ tenant, product }: { tenant: string; product: string }): Promise<User[]>;
  get(id: string): Promise<User>;
}

export interface GroupsController {
  with(tenant: string, product: string): GroupsController;
  setTenantAndProduct(tenant: string, product: string): void;
  list({ tenant, product }: { tenant: string; product: string }): Promise<Group[]>;
  get(id: string): Promise<Group>;
  getAllUsers(groupId: string): Promise<{ user_id: string }[]>;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  raw?: any;
}

export interface Group {
  id: string;
  name: string;
  raw?: any;
}

export type DirectoryType = 'azure' | 'onelogin' | 'okta';

export interface Directory {
  id: string;
  name: string;
  tenant: string;
  product: string;
  type: DirectoryType;
  scim: {
    path: string;
    endpoint?: string;
    secret: string;
  };
  webhook: {
    endpoint: string;
    secret: string;
  };
}

export interface DirectoryConfig {
  create({
    name,
    tenant,
    product,
    webhook_url,
    webhook_secret,
    type,
  }: {
    name: string;
    tenant: string;
    product: string;
    webhook_url: string;
    webhook_secret: string;
    type: DirectoryType;
  }): Promise<Directory>;
  get(id: string): Promise<Directory>;
  update(
    id: string,
    param: {
      name: string;
      webhook_url: string;
      webhook_secret: string;
    }
  ): Promise<Directory>;
  getByTenantAndProduct(tenant: string, product: string): Promise<Directory>;
  list(): Promise<Directory[]>;
  listUsers({ directory }: { directory: string }): Promise<User[]>;
  listGroups({ directory }: { directory: string }): Promise<Group[]>;
  delete(id: string): Promise<void>;
  validateAPISecret(id: string, bearerToken: string | null): Promise<boolean>;
}

export interface DirectoryUsers {
  create(directory: Directory, body: any): Promise<DirectorySyncResponse>;
  get(userId: string): Promise<DirectorySyncResponse>;
  update(directory: Directory, userId: string, body: any): Promise<DirectorySyncResponse>;
  updateOperation(directory: Directory, userId: string, body: any): Promise<DirectorySyncResponse>;
  delete(directory: Directory, userId: string): Promise<DirectorySyncResponse>;
  handleRequest(request: DirectorySyncRequest): Promise<DirectorySyncResponse>;
}

export interface DirectoryGroups {
  create(directory: Directory, body: any): Promise<DirectorySyncResponse>;
  get(groupId: string): Promise<DirectorySyncResponse>;
  update(directory: Directory, groupId: string, body: any): Promise<DirectorySyncResponse>;
  updateOperation(directory: Directory, groupId: string, body: any): Promise<DirectorySyncResponse>;
  delete(directory: Directory, groupId: string): Promise<DirectorySyncResponse>;
  handleRequest(request: DirectorySyncRequest): Promise<DirectorySyncResponse>;
}

export interface DirectorySyncRequest {
  method: string;
  directory_id: string;
  user_id?: string;
  group_id?: string;
  body?: any;
  query_params?: {
    count: number;
    startIndex: number;
    filter?: string;
  };
}

export interface DirectorySyncResponse {
  status: number;
  data?: any;
}

export interface UsersRequestHandler {
  handle(request: DirectorySyncRequest): Promise<DirectorySyncResponse>;
}

export interface GroupsRequestHandler {
  handle(request: DirectorySyncRequest): Promise<DirectorySyncResponse>;
}

export interface DirectorySync {
  directories: DirectoryConfig;
  usersRequest: UsersRequestHandler;
  groupsRequest: GroupsRequestHandler;
  users: UsersController;
  groups: GroupsController;
  events: WebhookEvents;
}

export interface WebhookEventLog {
  id: string;
  directory_id: string;
  event: string;
  webhook_endpoint: string;
  payload: any;
  created_at: Date;
  status_code?: number;
  delivered?: boolean;
}

export interface WebhookEvents {
  send(
    action: DirectorySyncEventType,
    payload: {
      directory: Directory;
      group?: Group;
      user?: User;
    }
  ): Promise<void>;
  getAll(): Promise<WebhookEventLog[]>;
  setTenantAndProduct(tenant: string, product: string): WebhookEvents;
  with(tenant: string, product: string): WebhookEvents;
  updateStatus(log: WebhookEventLog, statusCode: number): Promise<WebhookEventLog>;
}
