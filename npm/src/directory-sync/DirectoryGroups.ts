import type {
  Group,
  DirectoryConfig,
  DirectorySyncResponse,
  Directory,
  WebhookEvents,
  DirectorySyncGroupMember,
  DirectorySyncGroupRequest,
  Users,
  Groups,
  ApiError,
} from '../typings';
import { parseGroupOperations, toGroupMembers } from './utils';

export class DirectoryGroups {
  private directories: DirectoryConfig;
  private users: Users;
  private groups: Groups;
  private webhookEvents: WebhookEvents;

  constructor({
    directories,
    users,
    groups,
    webhookEvents,
  }: {
    directories: DirectoryConfig;
    users: Users;
    groups: Groups;
    webhookEvents: WebhookEvents;
  }) {
    this.directories = directories;
    this.users = users;
    this.groups = groups;
    this.webhookEvents = webhookEvents;
  }

  public async create(directory: Directory, body: any): Promise<DirectorySyncResponse> {
    const { displayName, members } = body;

    const { data: group } = await this.groups.create({
      name: displayName,
      raw: body,
    });

    await this.webhookEvents.send('group.created', { directory, group });

    // Okta SAML app doesn't send individual group membership events, so we need to add the members here
    // if (directory.type === 'okta-saml' && group) {
    //   await this.addGroupMembers(directory, group, members, false);
    // }

    return {
      status: 201,
      data: {
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
        id: group?.id,
        displayName: group?.name,
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

  public async getAll(queryParams: { filter?: string }): Promise<DirectorySyncResponse> {
    const { filter } = queryParams;

    let groups: Group[] | null = [];

    if (filter) {
      // Filter by group displayName
      // filter: displayName eq "Developer"
      const { data } = await this.groups.search(filter.split('eq ')[1].replace(/['"]+/g, ''));

      groups = data;
    } else {
      // Fetch all the existing group
      const { data } = await this.groups.list({ pageOffset: undefined, pageLimit: undefined });

      groups = data;
    }

    return {
      status: 200,
      data: {
        schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
        totalResults: groups ? groups.length : 0,
        itemsPerPage: groups ? groups.length : 0,
        startIndex: 1,
        Resources: groups ? groups.map((group) => group.raw) : [],
      },
    };
  }

  // Update group displayName
  public async updateDisplayName(directory: Directory, group: Group, body: any): Promise<Group> {
    const { displayName } = body;

    const { data: updatedGroup, error } = await this.groups.update(group.id, {
      name: displayName,
      raw: {
        ...group.raw,
        ...body,
      },
    });

    if (error || !updatedGroup) {
      throw error;
    }

    await this.webhookEvents.send('group.updated', { directory, group: updatedGroup });

    return updatedGroup;
  }

  public async patch(directory: Directory, group: Group, body: any): Promise<DirectorySyncResponse> {
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

    const { data: updatedGroup } = await this.groups.get(group.id);

    return {
      status: 200,
      data: {
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
        id: updatedGroup?.id,
        displayName: updatedGroup?.name,
        members: toGroupMembers(await this.groups.getAllUsers(group.id)),
      },
    };
  }

  public async update(directory: Directory, group: Group, body: any): Promise<DirectorySyncResponse> {
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

      const { data: user } = await this.users.get(member.value);

      if (sendWebhookEvent && user) {
        await this.webhookEvents.send('group.user_added', {
          directory,
          group,
          user,
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

      const { data: user } = await this.users.get(member.value);

      // User may not exist in the directory, so we need to check if the user exists
      if (sendWebhookEvent && user) {
        await this.webhookEvents.send('group.user_removed', {
          directory,
          group,
          user,
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

  private respondWithError(error: ApiError | null) {
    return {
      status: error ? error.code : 500,
      data: null,
    };
  }

  // Handle the request from the Identity Provider and route it to the appropriate method
  public async handleRequest(request: DirectorySyncGroupRequest): Promise<DirectorySyncResponse> {
    const { method, body, query } = request;
    const { directory_id: directoryId, group_id: groupId } = query;

    // Get the directory
    const { data: directory, error } = await this.directories.get(directoryId);

    if (error || !directory) {
      return this.respondWithError(error);
    }

    this.users.setTenantAndProduct(directory.tenant, directory.product);
    this.groups.setTenantAndProduct(directory.tenant, directory.product);

    // Get the group
    const { data: group } = groupId ? await this.groups.get(groupId) : { data: null };

    if (group) {
      // Get a specific group
      if (method === 'GET') {
        return await this.get(group);
      }

      if (method === 'PUT') {
        return await this.update(directory, group, body);
      }

      if (method === 'PATCH') {
        return await this.patch(directory, group, body);
      }

      if (method === 'DELETE') {
        return await this.delete(directory, group);
      }
    }

    // Create a group
    if (method === 'POST') {
      return await this.create(directory, body);
    }

    // Get all groups
    if (method === 'GET' && query) {
      return await this.getAll({
        filter: query.filter,
      });
    }

    return {
      status: 404,
      data: {},
    };
  }
}
