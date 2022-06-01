import type { DirectorySyncRequest, Group, SCIMConfig } from '../typings';
import { GroupsController } from '../controller/groups';
import { UsersController } from '../controller/users';
import { Directory } from './directory';
import { sendEvent } from './events';

export class DirectoryGroups {
  private directory: InstanceType<typeof Directory>;
  private users: InstanceType<typeof UsersController>;
  private groups: InstanceType<typeof GroupsController>;

  constructor({ directory, users, groups }) {
    this.directory = directory;
    this.users = users;
    this.groups = groups;
  }

  public async create(directoryId: string, body: any) {
    const directory = await this.directory.get(directoryId);
    const { tenant, product } = directory;
    const { displayName, members } = body;

    this.groups.setTenantAndProduct(tenant, product);

    const group = await this.groups.create({
      name: displayName,
      raw: body,
    });

    sendEvent('group.created', { directory, group });

    this.addGroupMembers(directory, group, members, false);

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

  public async get(directoryId: string, groupId: string) {
    const { tenant, product } = await this.directory.get(directoryId);

    this.groups.setTenantAndProduct(tenant, product);

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

  public async update(directoryId: string, groupId: string, body: any) {
    const directory = await this.directory.get(directoryId);
    const { tenant, product } = directory;
    const { displayName, members } = body;

    this.groups.setTenantAndProduct(tenant, product);

    const group = await this.groups.update(groupId, {
      name: displayName,
      raw: body,
    });

    if (members && members.length > 0) {
      await this.addOrRemoveMembers(directory, group, members);
    }

    sendEvent('group.updated', { directory, group });

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
  public async updateOperation(directoryId: string, groupId: string, body: any) {
    const directory = await this.directory.get(directoryId);
    const { tenant, product } = directory;
    const { Operations } = body;
    const { op, path, value } = Operations[0];

    this.groups.setTenantAndProduct(tenant, product);

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

      sendEvent('group.updated', { directory, group: updatedGroup });
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

  public async delete(directoryId: string, groupId: string) {
    const directory = await this.directory.get(directoryId);
    const { tenant, product } = directory;

    this.groups.setTenantAndProduct(tenant, product);

    const group = await this.groups.get(groupId);

    await this.groups.removeAllUsers(groupId);
    await this.groups.delete(groupId);

    sendEvent('group.deleted', { directory, group });

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

  public async getAll() {
    return {
      status: 200,
      data: {
        schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
        totalResults: 0,
        startIndex: 1,
        itemsPerPage: 0,
        Resources: [],
      },
    };
  }

  // Add members to a group
  public async addGroupMembers(
    directory: SCIMConfig,
    group: Group,
    members: { value: string }[],
    sendWebhookEvent = true
  ) {
    if (members.length === 0) {
      return;
    }

    const { tenant, product } = directory;

    this.groups.setTenantAndProduct(tenant, product);
    this.users.setTenantAndProduct(tenant, product);

    for (const member of members) {
      const user = await this.users.get(member.value);

      await this.groups.addUserToGroup(group.id, member.value);

      if (sendWebhookEvent) {
        sendEvent('group.user_added', { directory, group, user });
      }
    }

    return;
  }

  // Remove members from a group
  public async removeGroupMembers(directory: SCIMConfig, group: Group, members: { user_id: string }[]) {
    const { tenant, product } = directory;

    this.users.setTenantAndProduct(tenant, product);

    for (const member of members) {
      const user = await this.users.get(member.user_id);

      await this.groups.removeUserFromGroup(group.id, member.user_id);

      sendEvent('group.user_removed', { directory, group, user });
    }

    return;
  }

  // Add or remove users from a group
  public async addOrRemoveMembers(
    directory: SCIMConfig,
    group: Group,
    members: { value: string }[]
  ): Promise<void> {
    const { tenant, product } = directory;

    const users = await this.groups.with(tenant, product).getAllUsers(group.id);

    const usersToAdd = members.filter((member) => !users.some((user) => user.user_id === member.value));
    const usersToRemove = users.filter((user) => !members.some((member) => member.value === user.user_id));

    await this.addGroupMembers(directory, group, usersToAdd);
    await this.removeGroupMembers(directory, group, usersToRemove);
  }

  // Handle the request from the Identity Provider and route it to the appropriate method
  public async handleRequest(request: DirectorySyncRequest) {
    const { method, directory_id: directoryId, group_id: groupId, body } = request;

    if (groupId) {
      // Get a user
      if (method === 'GET') {
        return await this.get(directoryId, groupId);
      }

      // Update a group
      if (method === 'PUT') {
        return await this.update(directoryId, groupId, body);
      }

      // Update a group (using patch)
      if (method === 'PATCH') {
        return await this.updateOperation(directoryId, groupId, body);
      }

      // Delete a group
      if (method === 'DELETE') {
        return await this.delete(directoryId, groupId);
      }
    }

    // Create a new group
    if (method === 'POST') {
      return await this.create(directoryId, body);
    }

    // Get all groups
    if (method === 'GET') {
      return await this.getAll();
    }
  }
}
