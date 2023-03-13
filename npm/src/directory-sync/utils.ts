import type {
  Directory,
  DirectorySyncEvent,
  DirectorySyncEventType,
  DirectorySyncGroupMember,
  Group,
  User,
} from '../typings';
import { DirectorySyncProviders, UserPatchOperation, GroupPatchOperation } from '../typings';
import { transformUser, transformGroup, transformUserGroup } from './transform';
import crypto from 'crypto';

const parseGroupOperation = (operation: GroupPatchOperation) => {
  const { op, path, value } = operation;

  if (path === 'members' || (path && path.startsWith('members[value eq'))) {
    // Add group members
    if (op === 'add') {
      return {
        action: 'addGroupMember',
        members: value,
      };
    }

    // Remove group members
    if (op === 'remove') {
      return {
        action: 'removeGroupMember',
        members: path ? [{ value: path.split('"')[1] }] : value,
      };
    }
  }

  // Update group name
  if (op === 'replace' && 'displayName' in value) {
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
  return [];
  return users.map((user) => ({
    value: user.user_id,
  }));
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

// Parse the PATCH request body and return the user attributes (both standard and custom)
const parseUserPatchRequest = (operation: UserPatchOperation) => {
  const { value, path } = operation;

  const attributes: Partial<User> = {};
  const rawAttributes = {};

  const attributesMap = {
    active: 'active',
    'name.givenName': 'first_name',
    'name.familyName': 'last_name',
  };

  // If there is a path, then the value is the value
  // For example { path: "active", value: true }
  if (path) {
    if (path in attributesMap) {
      attributes[attributesMap[path]] = value;
    }

    rawAttributes[path] = value;
  }

  // If there is no path, then the value can be an object with multiple attributes
  // For example { value: { active: true, "name.familyName": "John" } }
  else if (typeof value === 'object') {
    for (const attribute of Object.keys(value)) {
      if (attribute in attributesMap) {
        attributes[attributesMap[attribute]] = value[attribute];
      }

      rawAttributes[attribute] = value[attribute];
    }
  }

  return {
    attributes,
    rawAttributes,
  };
};

export {
  parseGroupOperation,
  toGroupMembers,
  getDirectorySyncProviders,
  transformEventPayload,
  createHeader,
  createSignatureString,
  parseUserPatchRequest,
};
