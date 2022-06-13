import type { DirectorySyncGroupRequest } from '../../../src/typings';

const requests = {
  create: (directoryId: string, group: any): DirectorySyncGroupRequest => {
    return {
      method: 'POST',
      body: group,
      query: {
        directory_id: directoryId,
      },
    };
  },

  getById: (directoryId: string, groupId: string): DirectorySyncGroupRequest => {
    return {
      method: 'GET',
      query: {
        directory_id: directoryId,
        group_id: groupId,
      },
    };
  },

  updateById: (directoryId: string, groupId: string, group: any): DirectorySyncGroupRequest => {
    return {
      method: 'PUT',
      body: group,
      query: {
        directory_id: directoryId,
        group_id: groupId,
      },
    };
  },

  deleteById: (directoryId: string, groupId: string): DirectorySyncGroupRequest => {
    return {
      method: 'DELETE',
      query: {
        directory_id: directoryId,
        group_id: groupId,
      },
    };
  },

  getAll: (directoryId: string): DirectorySyncGroupRequest => {
    return {
      method: 'GET',
      query: {
        count: 1,
        startIndex: 1,
        directory_id: directoryId,
      },
    };
  },

  addMembers: (directoryId: string, groupId: string, members: any): DirectorySyncGroupRequest => {
    return {
      method: 'PATCH',
      body: {
        Operations: [
          {
            op: 'add',
            path: 'members',
            value: members,
          },
        ],
      },
      query: {
        directory_id: directoryId,
        group_id: groupId,
      },
    };
  },

  removeMembers: (
    directoryId: string,
    groupId: string,
    members: any,
    path: string
  ): DirectorySyncGroupRequest => {
    return {
      method: 'PATCH',
      body: {
        Operations: [
          {
            op: 'remove',
            path,
            value: members,
          },
        ],
      },
      query: {
        directory_id: directoryId,
        group_id: groupId,
      },
    };
  },

  updateName: (directoryId: string, groupId: string, group: any): DirectorySyncGroupRequest => {
    return {
      method: 'PATCH',
      body: {
        Operations: [
          {
            op: 'replace',
            value: {
              displayName: group.displayName,
            },
          },
        ],
      },
      query: {
        directory_id: directoryId,
        group_id: groupId,
      },
    };
  },
};

export default requests;
