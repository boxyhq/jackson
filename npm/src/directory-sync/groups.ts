import type {
  DirectorySyncRequest,
  Group,
  DirectoryConfig,
  DirectorySyncResponse,
  Directory,
  WebhookEvents,
} from '../typings';
import type { GroupsController } from '../controller/groups';
import type { UsersController } from '../controller/users';

export class DirectoryGroups {
  private directories: DirectoryConfig;
  private users: UsersController;
  private groups: GroupsController;
  private webhookEvents: WebhookEvents;

  constructor({
    directories,
    users,
    groups,
    webhookEvents,
  }: {
    directories: DirectoryConfig;
    users: UsersController;
    groups: GroupsController;
    webhookEvents: WebhookEvents;
  }) {
    this.directories = directories;
    this.users = users;
    this.groups = groups;
    this.webhookEvents = webhookEvents;
  }

  public async create(directory: Directory, body: any): Promise<DirectorySyncResponse> {
    const { displayName, members } = body;

    const group = await this.groups.create({
      name: displayName,
      raw: body,
    });

    await this.addGroupMembers(directory, group, members);

    this.webhookEvents.send('group.created', { directory, group });

    return {
      status: 201,
      data: {
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
        id: group.id,
        displayName: group.name,
        members: members ?? [],
      },
    };
  }

  public async get(groupId: string): Promise<DirectorySyncResponse> {
    const group = await this.groups.get(groupId);

    return {
      status: 200,
      data: {
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
        id: group?.id,
        displayName: group?.name,
        members: await this.getUsers(groupId),
      },
    };
  }

  public async update(directory: Directory, groupId: string, body: any): Promise<DirectorySyncResponse> {
    const { displayName, members } = body;

    const group = await this.groups.update(groupId, {
      name: displayName,
      raw: body,
    });

    if (members && members.length > 0) {
      await this.addOrRemoveGroupMembers(directory, group, members);
    }

    this.webhookEvents.send('group.updated', { directory, group });

    return {
      status: 200,
      data: {
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
        id: group.id,
        displayName: group.name,
        members: await this.getUsers(groupId),
      },
    };
  }

  // Update a group using a patch operation.
  // Some identity providers send a PATCH request to update a group and group members.
  public async updateOperation(
    directory: Directory,
    groupId: string,
    body: any
  ): Promise<DirectorySyncResponse> {
    const { Operations } = body;
    const { op, path, value } = Operations[0];

    const group = await this.groups.get(groupId);

    // Add group members
    if (op === 'add') {
      await this.addGroupMembers(directory, group, value);
    }

    // Remove group members
    else if (op === 'remove') {
      let userId = '';

      if (path === 'members' && value.length > 0) {
        userId = value[0].value;
      }

      // Pattern: members[value eq \"f0f159bf-00fd-4815-b4b4-ef5e9c29071f\"]
      if (path.startsWith('members[value eq')) {
        userId = path.split('"')[1];
      }

      await this.removeGroupMembers(directory, group, [{ user_id: userId }]);
    }

    // Update the group name if there is a name change
    else if (op === 'replace' && group.name != value.displayName) {
      const updatedGroup = await this.groups.update(groupId, {
        name: value.displayName,
        raw: group.raw,
      });

      this.webhookEvents.send('group.updated', { directory, group: updatedGroup });
    }

    return {
      status: 200,
      data: {
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
        id: group?.id,
        displayName: group?.name,
        members: await this.getUsers(groupId),
      },
    };
  }

  public async delete(directory: Directory, groupId: string): Promise<DirectorySyncResponse> {
    const group = await this.groups.get(groupId);

    await this.groups.removeAllUsers(groupId);
    await this.groups.delete(groupId);

    this.webhookEvents.send('group.deleted', { directory, group });

    return {
      status: 200,
      data: {},
    };
  }

  public async getUsers(groupId: string): Promise<{ value: string }[]> {
    const users = await this.groups.getAllUsers(groupId);

    return users.map((user) => ({
      value: user.user_id,
    }));
  }

  public async getAll(): Promise<DirectorySyncResponse> {
    const groups = await this.groups.getAll();

    return {
      status: 200,
      data: {
        schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
        totalResults: groups.length,
        itemsPerPage: groups.length,
        startIndex: 1,
        Resources: groups.map((group) => group.raw),
      },
    };
  }

  // Add members to a group
  public async addGroupMembers(directory: Directory, group: Group, members: { value: string }[]) {
    if (members && members.length === 0) {
      return;
    }

    for (const member of members) {
      if (await this.groups.isUserInGroup(group.id, member.value)) {
        continue;
      }

      await this.groups.addUserToGroup(group.id, member.value);

      this.webhookEvents.send('group.user_added', {
        directory,
        group,
        user: await this.users.get(member.value),
      });
    }

    return;
  }

  // Remove members from a group
  public async removeGroupMembers(directory: Directory, group: Group, members: { user_id: string }[]) {
    if (members.length === 0) {
      return;
    }

    for (const member of members) {
      await this.groups.removeUserFromGroup(group.id, member.user_id);

      this.webhookEvents.send('group.user_removed', {
        directory,
        group,
        user: await this.users.get(member.user_id),
      });
    }

    return;
  }

  // Add or remove users from a group
  public async addOrRemoveGroupMembers(
    directory: Directory,
    group: Group,
    members: { value: string }[]
  ): Promise<void> {
    const users = await this.groups.getAllUsers(group.id);

    const usersToAdd = members.filter((member) => !users.some((user) => user.user_id === member.value));
    const usersToRemove = users.filter((user) => !members.some((member) => member.value === user.user_id));

    await this.addGroupMembers(directory, group, usersToAdd);
    await this.removeGroupMembers(directory, group, usersToRemove);
  }

  // Handle the request from the Identity Provider and route it to the appropriate method
  public async handleRequest(request: DirectorySyncRequest): Promise<DirectorySyncResponse> {
    const { method, directory_id: directoryId, group_id: groupId, body, query_params: queryParams } = request;

    const directory = await this.directories.get(directoryId);

    const { tenant, product } = directory;

    this.groups.setTenantAndProduct(tenant, product);
    this.users.setTenantAndProduct(tenant, product);

    if (groupId) {
      // Retrieve specific Group
      // GET /Groups/$groupId
      if (method === 'GET') {
        return await this.get(groupId);
      }

      // Update a specific Group name
      // PUT /Groups/$groupId
      if (method === 'PUT') {
        return await this.update(directory, groupId, body);
      }

      // Update specific Group membership
      // PATCH /Groups/$groupId
      if (method === 'PATCH') {
        return await this.updateOperation(directory, groupId, body);
      }

      // Delete a specific Group
      // DELETE /Groups/$groupId
      if (method === 'DELETE') {
        return await this.delete(directory, groupId);
      }
    }

    // Create a new group
    // POST /Groups
    if (method === 'POST') {
      return await this.create(directory, body);
    }

    // Retrieve Groups
    // GET /Groups
    if (method === 'GET' && queryParams) {
      return await this.getAll();
    }

    return {
      status: 404,
      data: {},
    };
  }
}
