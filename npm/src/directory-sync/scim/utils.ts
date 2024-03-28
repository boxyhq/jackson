import _ from 'lodash';

import { DirectorySyncProviders } from '../../typings';
import type { DirectoryType, User, UserPatchOperation, GroupPatchOperation } from '../../typings';

export const indexNames = {
  directoryIdUsername: 'directoryIdUsername',
  directoryIdDisplayname: 'directoryIdDisplayname',
  directoryId: 'directoryId',
  groupId: 'groupId',
};

const parseUserRoles = (roles: string | string[]) => {
  if (typeof roles === 'string') {
    return roles.split(',');
  }

  return roles;
};

export const parseGroupOperation = (operation: GroupPatchOperation) => {
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
export const getDirectorySyncProviders = (): { [K: string]: string } => {
  return Object.entries(DirectorySyncProviders).reduce((acc, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {});
};

// Parse the PATCH request body and return the user attributes (both standard and custom)
export const parseUserPatchRequest = (operation: UserPatchOperation) => {
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
export const extractStandardUserAttributes = (body: any) => {
  const { name, emails, userName, active, userId, roles } = body as {
    name?: { givenName: string; familyName: string };
    emails?: { value: string }[];
    userName: string;
    active: boolean;
    userId?: string;
    roles?: string | string[];
  };

  const userAttributes: Omit<User, 'raw'> = {
    first_name: name && 'givenName' in name ? name.givenName : '',
    last_name: name && 'familyName' in name ? name.familyName : '',
    email: emails && emails.length > 0 ? emails[0].value : userName,
    active: 'active' in body ? active : true,
    id: userId || '', // For non-SCIM providers, the id will exist in the body
  };

  if (roles) {
    userAttributes['roles'] = parseUserRoles(roles);
  }

  return userAttributes;
};

// Update raw user attributes
export const updateRawUserAttributes = (raw, attributes) => {
  const keys = Object.keys(attributes);

  if (keys.length === 0) {
    return raw;
  }

  for (const key of keys) {
    _.set(raw, key, attributes[key]);
  }

  return raw;
};

export const isSCIMEnabledProvider = (type: DirectoryType) => {
  return type !== 'google';
};
