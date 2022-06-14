import type { DirectorySyncGroupMember } from '../typings';

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

export { parseGroupOperations, toGroupMembers };
