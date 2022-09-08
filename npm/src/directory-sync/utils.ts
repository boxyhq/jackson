import type {
  Directory,
  DirectorySyncEvent,
  DirectorySyncEventType,
  DirectorySyncGroupMember,
  Group,
  User,
} from '../typings';
import { DirectorySyncProviders } from '../typings';
import { transformUser, transformGroup, transformUserGroup } from './transform';
import crypto from 'crypto';

const parseGroupOperations = (
  operations: {
    op: 'add' | 'remove' | 'replace';
    path: string;
    value: any;
  }[]
):
  | {
      action: 'addGroupMember' | 'removeGroupMember';
      members: DirectorySyncGroupMember[];
    }
  | {
      action: 'updateGroupName';
      displayName: string;
    }
  | {
      action: 'unknown';
    } => {
  const { op, path, value } = operations[0];

  // Add group members
  if (op === 'add' && path === 'members') {
    return {
      action: 'addGroupMember',
      members: value,
    };
  }

  // Remove group members
  if (op === 'remove' && path === 'members') {
    return {
      action: 'removeGroupMember',
      members: value,
    };
  }

  // Remove group members
  if (op === 'remove' && path.startsWith('members[value eq')) {
    return {
      action: 'removeGroupMember',
      members: [{ value: path.split('"')[1] }],
    };
  }

  // Update group name
  if (op === 'replace') {
    return {
      action: 'updateGroupName',
      displayName: value.displayName,
    };
  }

  return {
    action: 'unknown',
  };
};

const toGroupMembers = (users: { user_id: string }[]): DirectorySyncGroupMember[] => {
  return users.map((user) => ({
    value: user.user_id,
  }));
};

export const parseUserOperations = (operations: {
  op: 'replace';
  value: any;
}): {
  action: 'updateUser' | 'unknown';
  raw: any;
  attributes: Partial<User>;
} => {
  const { op, value } = operations[0];

  const attributes: Partial<User> = {};

  // Update the user
  if (op === 'replace') {
    if ('active' in value) {
      attributes['active'] = value.active;
    }

    if ('name.givenName' in value) {
      attributes['first_name'] = value['name.givenName'];
    }

    if ('name.familyName' in value) {
      attributes['last_name'] = value['name.familyName'];
    }

    return {
      action: 'updateUser',
      raw: value,
      attributes,
    };
  }

  return {
    action: 'unknown',
    raw: value,
    attributes,
  };
};

// List of directory sync providers
// TODO: Fix the return type
const getDirectorySyncProviders = (): { [K: string]: string } => {
  return Object.entries(DirectorySyncProviders).reduce((acc, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {});
};

const transformEventPayload = (
  event: DirectorySyncEventType,
  payload: { directory: Directory; group?: Group | null; user?: User | null }
): DirectorySyncEvent => {
  const { directory, group, user } = payload;
  const { tenant, product, id: directory_id } = directory;

  const eventPayload = {
    event,
    tenant,
    product,
    directory_id,
  } as DirectorySyncEvent;

  // User events
  if (['user.created', 'user.updated', 'user.deleted'].includes(event) && user) {
    eventPayload['data'] = transformUser(user);
  }

  // Group events
  if (['group.created', 'group.updated', 'group.deleted'].includes(event) && group) {
    eventPayload['data'] = transformGroup(group);
  }

  // Group membership events
  if (['group.user_added', 'group.user_removed'].includes(event) && user && group) {
    eventPayload['data'] = transformUserGroup(user, group);
  }

  return eventPayload;
};

// Create request headers
const createHeader = async (secret: string, event: DirectorySyncEvent) => {
  return {
    'Content-Type': 'application/json',
    'BoxyHQ-Signature': await createSignatureString(secret, event),
  };
};

// Create a signature string
const createSignatureString = async (secret: string, event: DirectorySyncEvent) => {
  if (!secret) {
    return '';
  }

  const timestamp = new Date().getTime();

  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${JSON.stringify(event)}`)
    .digest('hex');

  return `t=${timestamp},s=${signature}`;
};

export {
  parseGroupOperations,
  toGroupMembers,
  getDirectorySyncProviders,
  transformEventPayload,
  createHeader,
  createSignatureString,
};
