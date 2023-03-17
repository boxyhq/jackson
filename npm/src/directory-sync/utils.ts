import type { Directory, DirectorySyncEvent, DirectorySyncEventType, Group, User } from '../typings';
import { DirectorySyncProviders, UserPatchOperation, GroupPatchOperation } from '../typings';
import { transformUser, transformGroup, transformUserGroup } from './transform';
import lodash from 'lodash';

const parseGroupOperation = (operation: GroupPatchOperation) => {
  const { op, path, value } = operation;

  if (path === 'members') {
    if (op === 'add') {
      return {
        action: 'addGroupMember',
        members: value,
      };
    }

    if (op === 'remove') {
      return {
        action: 'removeGroupMember',
        members: value,
      };
    }
  }

  if (path && path.startsWith('members[value eq')) {
    if (op === 'remove') {
      return {
        action: 'removeGroupMember',
        members: [{ value: path.split('"')[1] }],
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

// Parse the PATCH request body and return the user attributes (both standard and custom)
const parseUserPatchRequest = (operation: UserPatchOperation) => {
  const { value, path } = operation;

  const attributes: Partial<User> = {};
  const rawAttributes = {};

  const attributesMap = {
    active: 'active',
    'name.givenName': 'first_name',
    'name.familyName': 'last_name',
    'emails[type eq "work"].value': 'email',
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

// Extract standard attributes from the user body
const extractStandardUserAttributes = (body: any) => {
  const { name, emails, userName, active } = body as {
    name?: { givenName: string; familyName: string };
    emails?: { value: string }[];
    userName: string;
    active: boolean;
  };

  return {
    first_name: name && 'givenName' in name ? name.givenName : '',
    last_name: name && 'familyName' in name ? name.familyName : '',
    email: emails && emails.length > 0 ? emails[0].value : userName,
    active: active || true,
  };
};

// Update raw user attributes
const updateRawUserAttributes = (raw, attributes) => {
  const keys = Object.keys(attributes);

  if (keys.length === 0) {
    return raw;
  }

  for (const key of keys) {
    lodash.set(raw, key, attributes[key]);
  }

  return raw;
};

export {
  parseGroupOperation,
  getDirectorySyncProviders,
  transformEventPayload,
  parseUserPatchRequest,
  extractStandardUserAttributes,
  updateRawUserAttributes,
};
