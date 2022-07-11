import type { DirectorySyncGroupMember, User } from '../typings';
import { DirectorySyncProviders } from '../typings';

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

export { parseGroupOperations, toGroupMembers, getDirectorySyncProviders };
