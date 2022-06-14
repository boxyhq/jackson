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

    // await this.addGroupMembers(directory, group, members, false);

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
    const users = await this.groups.getAllUsers(groupId);

    return {
      status: 200,
      data: {
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
        id: group.id,
        displayName: group.name,
        members: toGroupMembers(users),
      },
    };
  }

  // Update group displayName
  public async updateDisplayName(
    directory: Directory,
    group: Group,
    body: DirectorySyncGroupRequest['body']
  ) {
    const { displayName } = body;
    const { id: groupId } = group;

    const updatedGroup = await this.groups.update(groupId, {
      name: displayName,
      raw: {
        ...group.raw,
        ...body,
      },
    });

    await this.webhookEvents.send('group.updated', { directory, group: updatedGroup });
  }

  public async updatePATCH(directory: Directory, groupId: string, body: any): Promise<DirectorySyncResponse> {
    const { Operations } = body;

    const operation = parseGroupOperations(Operations);

    const group = await this.groups.get(groupId);

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

    const updatedGroup = await this.groups.get(groupId);
    const users = await this.groups.getAllUsers(groupId);

    return {
      status: 200,
      data: {
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
        id: updatedGroup.id,
        displayName: updatedGroup.name,
        members: toGroupMembers(users),
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

  private async addGroupMembers(
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

  private async removeGroupMembers(directory: Directory, group: Group, members: DirectorySyncGroupMember[]) {
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
  }

  // TODO: Need rework
  public async updatePUT(
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
      //  await this.addOrRemoveGroupMembers(directory, group, members);
    }

    await this.webhookEvents.send('group.updated', { directory, group });

    const users = await this.groups.getAllUsers(groupId);

    return {
      status: 200,
      data: {
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
        id: group.id,
        displayName: group.name,
        members: toGroupMembers(users),
      },
    };
  }

  // Add or remove users from a group
  // public async addOrRemoveGroupMembers(
  //   directory: Directory,
  //   group: Group,
  //   members: DirectorySyncGroupMember[]
  // ): Promise<void> {
  //   const users = await this.groups.getAllUsers(group.id);

  //   const usersToAdd = members.filter((member) => !users.some((user) => user.user_id === member.value));

  //   const usersToRemove = users
  //     .filter((user) => !members.some((member) => member.value === user.user_id))
  //     .map((user) => ({ value: user.user_id }));

  //   await this.addGroupMembers(directory, group, usersToAdd);
  //   await this.removeGroupMembers(directory, group, usersToRemove);
  // }

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
      return await this.updatePUT(directory, groupId, body);
    }

    if (method === 'PATCH' && groupId) {
      return await this.updatePATCH(directory, groupId, body);
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
