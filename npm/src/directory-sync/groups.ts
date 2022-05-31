import { GroupsController } from '../controller/groups';
import { DirectorySyncRequest } from '../typings';
import { DirectoryConfig } from './config';
import { sendEvent } from './events';

export class DirectoryGroups {
  private groups: InstanceType<typeof GroupsController>;
  private directory: InstanceType<typeof DirectoryConfig>;

  constructor({ directory, groups }) {
    this.groups = groups;
    this.directory = directory;
  }

  public async create(directoryId: string, body: any) {
    const { tenant, product, webhook } = await this.directory.get(directoryId);
    const { displayName, members } = body;

    this.groups.setTenantAndProduct(tenant, product);

    const group = await this.groups.create({
      name: displayName,
    });

    if (members) {
      await this.addUsers(group.id, members);
    }

    sendEvent({
      action: 'group.created',
      payload: {
        tenant,
        product,
        data: group,
      },
      options: {
        webhook,
      },
    });

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

    sendEvent({
      action: 'group.updated',
      payload: {
        tenant,
        product,
        data: group,
      },
      options: {
        webhook,
      },
    });

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

  public async updateOp(directoryId: string, groupId: string, body: any) {
    const { tenant, product, webhook } = await this.directory.get(directoryId);
    const { Operations } = body;
    const { op, path, value } = Operations[0];

    this.groups.setTenantAndProduct(tenant, product);

    const group = await this.groups.get(groupId);

    // Add group members
    if (op === 'add' && path === 'members') {
      await this.addUsers(groupId, value);
    }

    // Update group name
    if (op === 'replace') {
      await this.groups.update(groupId, {
        name: value.displayName,
      });
    }

    sendEvent({
      action: 'group.updated',
      payload: {
        tenant,
        product,
        data: group,
      },
      options: {
        webhook,
      },
    });

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

    await this.groups.delete(groupId);
    await this.removeUsers(groupId);

    sendEvent({
      action: 'group.deleted',
      payload: {
        tenant,
        product,
        data: group,
      },
      options: {
        webhook,
      },
    });

    return {
      status: 200,
      data: {},
    };
  }

  private async addUsers(groupId: string, members: { value: string }[]): Promise<void> {
    for (const member of members) {
      await this.groups.addUser(groupId, member.value);
    }
  }

  private async removeUsers(groupId: string): Promise<void> {
    const users = await this.groups.getUsers(groupId);

    if (users.length === 0) {
      return;
    }

    for (const user of users) {
      await this.groups.removeUser(groupId, user.user_id);
    }
  }

  private async getUsers(groupId: string): Promise<{ value: string }[]> {
    const users = await this.groups.getUsers(groupId);

    return users.map((user) => ({
      value: user.user_id,
    }));
  }

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

  // Handle the request from the Identity Provider and route it to the appropriate method
  public async handleRequest(request: DirectorySyncRequest) {
    const { method, directory_id: directoryId, group_id: groupId, body } = request;

    // Create a new group
    if (method === 'POST') {
      return await this.create(directoryId, body);
    }

    // Get a user
    if (method === 'GET' && groupId) {
      return await this.get(directoryId, groupId);
    }

    // Update a group
    if (method === 'PUT' && groupId) {
      return await this.update(directoryId, groupId, body);
    }

    // Update a group (using patch)
    if (method === 'PATCH' && groupId) {
      return await this.updateOp(directoryId, groupId, body);
    }

    // Delete a group
    if (method === 'DELETE' && groupId) {
      return await this.delete(directoryId, groupId);
    }

    // Get all groups
    if (method === 'GET') {
      return await this.getAll();
    }
  }
}
