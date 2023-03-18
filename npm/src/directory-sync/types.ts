import directorySync from '.';
import { DirectoryConfig } from './DirectoryConfig';
import { DirectoryGroups } from './DirectoryGroups';
import { DirectoryUsers } from './DirectoryUsers';
import { Users } from './Users';
import { Groups } from './Groups';
import { WebhookEventsLogger } from './WebhookEventsLogger';

export type IDirectorySyncController = Awaited<ReturnType<typeof directorySync>>;
export type IDirectoryConfig = InstanceType<typeof DirectoryConfig>;
export type IDirectoryGroups = InstanceType<typeof DirectoryGroups>;
export type IDirectoryUsers = InstanceType<typeof DirectoryUsers>;
export type IUsers = InstanceType<typeof Users>;
export type IGroups = InstanceType<typeof Groups>;
export type IWebhookEventsLogger = InstanceType<typeof WebhookEventsLogger>;

export type DirectorySyncEventType =
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'group.created'
  | 'group.updated'
  | 'group.deleted'
  | 'group.user_added'
  | 'group.user_removed';

export enum DirectorySyncProviders {
  'azure-scim-v2' = 'Azure SCIM v2.0',
  'onelogin-scim-v2' = 'OneLogin SCIM v2.0',
  'okta-scim-v2' = 'Okta SCIM v2.0',
  'jumpcloud-scim-v2' = 'JumpCloud v2.0',
  'generic-scim-v2' = 'SCIM Generic v2.0',
}

export type DirectoryType = keyof typeof DirectorySyncProviders;

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
  method: string; //'POST' | 'PUT' | 'DELETE' | 'GET' | 'PATCH';
  body: any | undefined;
  directoryId: Directory['id'];
  resourceType: string; //'users' | 'groups';
  resourceId: string | undefined;
  apiSecret: string | null;
  query: {
    count?: number;
    startIndex?: number;
    filter?: string;
  };
}

export type DirectorySyncEventData = User | Group | UserWithGroup;

export interface DirectorySyncEvent {
  directory_id: Directory['id'];
  event: DirectorySyncEventType;
  data: DirectorySyncEventData;
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

export type UserWithGroup = User & { group: Group };

export type PaginationParams = {
  pageOffset?: number;
  pageLimit?: number;
};

export type UserPatchOperation = {
  op: 'replace' | 'add';
  path?: string;
  value:
    | boolean
    | {
        active: boolean;
      }
    | {
        'name.givenName': string;
      }
    | {
        'name.familyName': string;
      }
    | {
        'emails[type eq "work"].value': string;
      }
    | {
        [key: string]: string | boolean;
      };
};

export type GroupPatchOperation = {
  op: 'add' | 'remove' | 'replace';
  path?: 'members' | 'displayName';
  value:
    | {
        value: string;
        display?: string;
      }[];
};
