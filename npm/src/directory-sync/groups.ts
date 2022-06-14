import type {
  Group,
  DirectoryConfig,
  DirectorySyncResponse,
  Directory,
  WebhookEvents,
  DirectorySyncGroupMember,
  DirectorySyncGroupRequest,
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

  public async create(
    directory: Directory,
    body: DirectorySyncGroupRequest['body']
  ): Promise<DirectorySyncResponse> {
    const { displayName, members } = body;

    const group = await this.groups.create({
      name: displayName,
      raw: body,
    });

    await this.webhookEvents.send('group.created', { directory, group });

    await this.addGroupMembers(directory, group, members, false);

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

  public async update(
    directory: Directory,
    groupId: string,
    body: DirectorySyncGroupRequest['body']
  ): Promise<DirectorySyncResponse> {
    const { displayName, members } = body;

    const group = await this.groups.update(groupId, {
      name: displayName,
      raw: body,
    });

    if (members && members.length > 0) {
      await this.addOrRemoveGroupMembers(directory, group, members);
    }

    await this.webhookEvents.send('group.updated', { directory, group });

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

    let group = await this.groups.get(groupId);

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

      await this.removeGroupMembers(directory, group, [{ value: userId }]);
    }

    // Update group
    else if (op === 'replace') {
      group = await this.groups.update(groupId, {
        name: value.displayName,
        raw: group.raw,
      });

      await this.webhookEvents.send('group.updated', { directory, group });
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

    await this.webhookEvents.send('group.deleted', { directory, group });

    return {
      status: 200,
      data: {},
    };
  }

  public async getUsers(groupId: string): Promise<DirectorySyncGroupMember[]> {
    const users = await this.groups.getAllUsers(groupId);

    return users.map((user) => ({
      value: user.user_id,
    }));
  }

  public async getAll(): Promise<DirectorySyncResponse> {
    const groups = await this.groups.list({ pageOffset: undefined, pageLimit: undefined });

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
  public async addGroupMembers(
    directory: Directory,
    group: Group,
    members: DirectorySyncGroupMember[] | undefined,
    sendWebhookEvent = true
  ): Promise<void> {
    if (members === undefined || (members && members.length === 0)) {
      return;
    }

    for (const member of members) {
      if (await this.groups.isUserInGroup(group.id, member.value)) {
        continue;
      }

      await this.groups.addUserToGroup(group.id, member.value);

      if (sendWebhookEvent) {
        // For custom Okta SAML app, we don't send webhook event for adding group members (IdP doesn't support it).
        await this.webhookEvents.send('group.user_added', {
          directory,
          group,
          user: await this.users.get(member.value),
        });
      }
    }

    return;
  }

  // Remove members from a group
  public async removeGroupMembers(directory: Directory, group: Group, members: DirectorySyncGroupMember[]) {
    if (members.length === 0) {
      return;
    }

    for (const member of members) {
      await this.groups.removeUserFromGroup(group.id, member.value);

      await this.webhookEvents.send('group.user_removed', {
        directory,
        group,
        user: await this.users.get(member.value),
      });
    }

    return;
  }

  // Add or remove users from a group
  public async addOrRemoveGroupMembers(
    directory: Directory,
    group: Group,
    members: DirectorySyncGroupMember[]
  ): Promise<void> {
    const users = await this.groups.getAllUsers(group.id);

    const usersToAdd = members.filter((member) => !users.some((user) => user.user_id === member.value));

    const usersToRemove = users
      .filter((user) => !members.some((member) => member.value === user.user_id))
      .map((user) => ({ value: user.user_id }));

    await this.addGroupMembers(directory, group, usersToAdd);
    await this.removeGroupMembers(directory, group, usersToRemove);
  }

  // Handle the request from the Identity Provider and route it to the appropriate method
  public async handleRequest(request: DirectorySyncGroupRequest): Promise<DirectorySyncResponse> {
    const { method, body, query } = request;
    const { directory_id: directoryId, group_id: groupId } = query;

    const directory = await this.directories.get(directoryId);

    this.users.setTenantAndProduct(directory.tenant, directory.product);
    this.groups.setTenantAndProduct(directory.tenant, directory.product);

    // Get a specific group
    if (method === 'GET' && groupId) {
      return await this.get(groupId);
    }

    // Get all groups
    if (method === 'GET' && query) {
      return await this.getAll();
    }

    if (method === 'POST' && body) {
      return await this.create(directory, body);
    }

    if (method === 'PUT' && groupId) {
      return await this.update(directory, groupId, body);
    }

    if (method === 'PATCH' && groupId) {
      return await this.updateOperation(directory, groupId, body);
    }

    if (method === 'DELETE' && groupId) {
      return await this.delete(directory, groupId);
    }

    return {
      status: 404,
      data: {},
    };
  }
}
