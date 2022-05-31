import { User } from 'next-auth';
import { GroupsController } from '../controller/groups';
import { UsersController } from '../controller/users';
import { DirectorySyncRequest, Group, SCIMConfig } from '../typings';
import { DirectoryConfig } from './config';
import { sendEvent } from './events';

export class DirectoryGroups {
  private directory: InstanceType<typeof DirectoryConfig>;
  private users: InstanceType<typeof UsersController>;
  private groups: InstanceType<typeof GroupsController>;

  constructor({ directory, users, groups }) {
    this.directory = directory;
    this.users = users;
    this.groups = groups;
  }

  public async create(directoryId: string, body: any) {
    const directory = await this.directory.get(directoryId);
    const { tenant, product, webhook } = directory;
    const { displayName, members } = body;

    this.groups.setTenantAndProduct(tenant, product);

    const group = await this.groups.create({
      name: displayName,
    });

    sendEvent('group.created', { tenant, product, group }, { webhook });

    this.addGroupMembers(directory, group, members);

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
    const { tenant, product, webhook } = await this.directory.get(directoryId);
    const { displayName, members } = body;

    this.groups.setTenantAndProduct(tenant, product);

    const group = await this.groups.update(groupId, {
      name: displayName,
    });

    if (members) {
      await this.addOrRemoveUsers(groupId, members);
    }

    sendEvent('group.updated', { tenant, product, group }, { webhook });

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
    const { tenant, product, webhook } = directory;
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

      await this.removeGroupMember(directory, group, userId);
    }

    // Update group name
    else if (op === 'replace') {
      const group = await this.groups.update(groupId, {
        name: value.displayName,
      });

      sendEvent('group.updated', { tenant, product, group }, { webhook });
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
    const { tenant, product, webhook } = await this.directory.get(directoryId);

    this.groups.setTenantAndProduct(tenant, product);

    const group = await this.groups.get(groupId);

    await this.groups.removeAllUsers(groupId);
    await this.groups.delete(groupId);

    sendEvent('group.deleted', { tenant, product, group }, { webhook });

    return {
      status: 200,
      data: {},
    };
  }

  // Add or remove users from a group
  private async addOrRemoveUsers(groupId: string, members: { value: string }[]): Promise<void> {
    const users = await this.groups.getUsers(groupId);

    const usersToAdd = members.filter((member) => !users.some((user) => user.user_id === member.value));
    const usersToRemove = users.filter((user) => !members.some((member) => member.value === user.user_id));

    for (const user of usersToAdd) {
      await this.groups.addUser(groupId, user.value);
    }

    for (const user of usersToRemove) {
      await this.groups.removeUser(groupId, user.user_id);
    }
  }

  private async getUsers(groupId: string): Promise<{ value: string }[]> {
    const users = await this.groups.getUsers(groupId);

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
  public async addGroupMembers(directory: SCIMConfig, group: Group, members: { value: string }[]) {
    const { tenant, product, webhook } = directory;

    if (members.length === 0) {
      return;
    }

    this.groups.setTenantAndProduct(tenant, product);
    this.users.setTenantAndProduct(tenant, product);

    for (const member of members) {
      const userId = member.value;

      await this.groups.addUser(group.id, userId);
      const user = await this.users.get(userId);

      sendEvent('group.user_added', { tenant, product, user, group }, { webhook });
    }

    return;
  }

  // Remove member from a group
  public async removeGroupMember(directory: SCIMConfig, group: Group, userId) {
    const { tenant, product, webhook } = directory;

    this.users.setTenantAndProduct(tenant, product);

    const user = await this.users.get(userId);

    await this.groups.removeUser(group.id, userId);

    sendEvent('group.user_removed', { tenant, product, group, user }, { webhook });
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
