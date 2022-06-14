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
import { parseGroupOperations, toGroupMembers } from './utils';

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

    // Okta SAML app doesn't send individual group membership events, so we need to add the members here
    if (directory.type === 'okta-saml') {
      await this.addGroupMembers(directory, group, members, false);
    }

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

  public async get(group: Group): Promise<DirectorySyncResponse> {
    return {
      status: 200,
      data: {
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
        id: group.id,
        displayName: group.name,
        members: toGroupMembers(await this.groups.getAllUsers(group.id)),
      },
    };
  }

  public async delete(directory: Directory, group: Group): Promise<DirectorySyncResponse> {
    await this.groups.removeAllUsers(group.id);
    await this.groups.delete(group.id);

    await this.webhookEvents.send('group.deleted', { directory, group });

    return {
      status: 200,
      data: {},
    };
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

  // Update group displayName
  public async updateDisplayName(
    directory: Directory,
    group: Group,
    body: DirectorySyncGroupRequest['body']
  ): Promise<Group> {
    const { displayName } = body;

    const updatedGroup = await this.groups.update(group.id, {
      name: displayName,
      raw: {
        ...group.raw,
        ...body,
      },
    });

    await this.webhookEvents.send('group.updated', { directory, group: updatedGroup });

    return updatedGroup;
  }

  public async updatePATCH(directory: Directory, group: Group, body: any): Promise<DirectorySyncResponse> {
    const { Operations } = body;

    const operation = parseGroupOperations(Operations);

    // Add group members
    if (operation.action === 'addGroupMember') {
      await this.addGroupMembers(directory, group, operation.members);
    }

    // Remove group members
    if (operation.action === 'removeGroupMember') {
      await this.removeGroupMembers(directory, group, operation.members);
    }

    // Update group name
    if (operation.action === 'updateGroupName') {
      await this.updateDisplayName(directory, group, {
        displayName: operation.displayName,
      });
    }

    const updatedGroup = await this.groups.get(group.id);

    return {
      status: 200,
      data: {
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
        id: updatedGroup.id,
        displayName: updatedGroup.name,
        members: toGroupMembers(await this.groups.getAllUsers(group.id)),
      },
    };
  }

  public async updatePUT(
    directory: Directory,
    group: Group,
    body: DirectorySyncGroupRequest['body']
  ): Promise<DirectorySyncResponse> {
    const { displayName, members } = body;

    // Update group name
    const updatedGroup = await this.updateDisplayName(directory, group, {
      displayName,
    });

    // Update group members
    if (members) {
      await this.addOrRemoveGroupMembers(directory, group, members);
    }

    return {
      status: 200,
      data: {
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
        id: group.id,
        displayName: updatedGroup.name,
        members: toGroupMembers(await this.groups.getAllUsers(group.id)),
      },
    };
  }

  public async addGroupMembers(
    directory: Directory,
    group: Group,
    members: DirectorySyncGroupMember[] | undefined,
    sendWebhookEvent = true
  ) {
    if (members === undefined || (members && members.length === 0)) {
      return;
    }

    for (const member of members) {
      if (await this.groups.isUserInGroup(group.id, member.value)) {
        continue;
      }

      await this.groups.addUserToGroup(group.id, member.value);

      if (sendWebhookEvent) {
        await this.webhookEvents.send('group.user_added', {
          directory,
          group,
          user: await this.users.get(member.value),
        });
      }
    }
  }

  public async removeGroupMembers(
    directory: Directory,
    group: Group,
    members: DirectorySyncGroupMember[],
    sendWebhookEvent = true
  ) {
    if (members.length === 0) {
      return;
    }

    for (const member of members) {
      await this.groups.removeUserFromGroup(group.id, member.value);

      if (sendWebhookEvent) {
        await this.webhookEvents.send('group.user_removed', {
          directory,
          group,
          user: await this.users.get(member.value),
        });
      }
    }
  }

  // Add or remove users from a group
  public async addOrRemoveGroupMembers(
    directory: Directory,
    group: Group,
    members: DirectorySyncGroupMember[]
  ) {
    const users = toGroupMembers(await this.groups.getAllUsers(group.id));

    const usersToAdd = members.filter((member) => !users.some((user) => user.value === member.value));

    const usersToRemove = users
      .filter((user) => !members.some((member) => member.value === user.value))
      .map((user) => ({ value: user.value }));

    await this.addGroupMembers(directory, group, usersToAdd, false);
    await this.removeGroupMembers(directory, group, usersToRemove, false);
  }

  // Handle the request from the Identity Provider and route it to the appropriate method
  public async handleRequest(request: DirectorySyncGroupRequest): Promise<DirectorySyncResponse> {
    const { method, body, query } = request;
    const { directory_id: directoryId, group_id: groupId } = query;

    const directory = await this.directories.get(directoryId);
    const group = groupId ? await this.groups.get(groupId) : null;

    this.users.setTenantAndProduct(directory.tenant, directory.product);
    this.groups.setTenantAndProduct(directory.tenant, directory.product);

    // Get a specific group
    if (method === 'GET' && group) {
      return await this.get(group);
    }

    // Get all groups
    if (method === 'GET' && query) {
      return await this.getAll();
    }

    if (method === 'POST' && body) {
      return await this.create(directory, body);
    }

    if (method === 'PUT' && group) {
      return await this.updatePUT(directory, group, body);
    }

    if (method === 'PATCH' && group) {
      return await this.updatePATCH(directory, group, body);
    }

    if (method === 'DELETE' && group) {
      return await this.delete(directory, group);
    }

    return {
      status: 404,
      data: {},
    };
  }
}
