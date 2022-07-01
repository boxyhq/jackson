import type { DirectorySyncGroupRequest } from '../../../src/typings';

const requests = {
  // Create a group
  // POST /api/scim/v2.0/{directoryId}/Groups
  create: (directoryId: string, group: any): DirectorySyncGroupRequest => {
    return {
      method: 'POST',
      body: {
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
        displayName: group.displayName,
        members: [],
      },
      query: {
        directory_id: directoryId,
      },
    };
  },

  // Get a group by id
  // GET /api/scim/v2.0/{directoryId}/Groups/{groupId}
  getById: (directoryId: string, groupId: string): DirectorySyncGroupRequest => {
    return {
      method: 'GET',
      query: {
        directory_id: directoryId,
        group_id: groupId,
      },
    };
  },

  // Filter by displayName
  // GET /api/scim/v2.0/{directoryId}/Groups?filter=displayName eq "{displayName}"
  filterByDisplayName: (directoryId: string, displayName: string): DirectorySyncGroupRequest => {
    return {
      method: 'GET',
      query: {
        directory_id: directoryId,
        filter: `displayName eq "${displayName}"`,
      },
    };
  },

  // Update a group by id
  // PUT /api/scim/v2.0/{directoryId}/Groups/{groupId}
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

  // Delete a group by id
  // DELETE /api/scim/v2.0/{directoryId}/Groups/{groupId}
  deleteById: (directoryId: string, groupId: string): DirectorySyncGroupRequest => {
    return {
      method: 'DELETE',
      query: {
        directory_id: directoryId,
        group_id: groupId,
      },
    };
  },

  // Get all groups
  // GET /api/scim/v2.0/{directoryId}/Groups
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
        schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
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
        schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
        Operations: [
          {
            op: 'remove',
            value: members,
            path,
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
        schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
        Operations: [
          {
            op: 'replace',
            value: {
              id: groupId,
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
