import type { DirectorySyncRequest, DirectorySyncEventType } from '../typings';
import { UsersController } from '../controller/users';
import { sendEvent } from './events';
import { Directory } from './directory';

export class DirectoryUsers {
  private directory: InstanceType<typeof Directory>;
  private users: InstanceType<typeof UsersController>;

  constructor({ directory, users }) {
    this.directory = directory;
    this.users = users;
  }

  public async create(directoryId: string, body: any) {
    const directory = await this.directory.get(directoryId);
    const { tenant, product } = directory;
    const { name, emails } = body;

    this.users.setTenantAndProduct(tenant, product);

    const user = await this.users.create({
      first_name: name.givenName,
      last_name: name.familyName,
      email: emails[0].value,
      raw: body,
    });

    sendEvent('user.created', { directory, user });

    return {
      status: 201,
      data: user.raw,
    };
  }

  public async get(directoryId: string, userId: string) {
    const directory = await this.directory.get(directoryId);
    const { tenant, product } = directory;

    this.users.setTenantAndProduct(tenant, product);

    const user = await this.users.get(userId);

    return {
      status: 200,
      data: user.raw,
    };
  }

  public async update(directoryId: string, userId: string, body: any) {
    const directory = await this.directory.get(directoryId);
    const { tenant, product } = directory;
    const { active, Operations } = body;

    this.users.setTenantAndProduct(tenant, product);

    let action: DirectorySyncEventType = 'user.updated';

    // For PATCH
    if ('Operations' in body) {
      const operation = Operations[0];

      if (operation.op === 'replace' && operation.value.active === false) {
        action = 'user.deleted';
      }
    }

    // For PUT
    if ('active' in body) {
      action = active ? 'user.updated' : 'user.deleted';
    }

    let user = await this.users.get(userId);

    if (action === 'user.updated') {
      const { name, emails } = body;

      user = await this.users.update(userId, {
        first_name: name.givenName,
        last_name: name.familyName,
        email: emails[0].value,
        raw: body,
      });
    } else if (action === 'user.deleted') {
      await this.users.delete(userId);
    }

    sendEvent(action, { directory, user });

    return {
      status: 200,
      data: user.raw,
    };
  }

  public async delete(directoryId: string, userId: string) {
    const directory = await this.directory.get(directoryId);
    const { tenant, product } = directory;

    this.users.setTenantAndProduct(tenant, product);

    const user = await this.users.get(userId);

    await this.users.delete(userId);

    sendEvent('user.deleted', { directory, user });

    return {
      status: 200,
      data: user.raw,
    };
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
    const { method, directory_id: directoryId, user_id: userId, body } = request;

    if (userId) {
      // Update an existing user
      if (method === 'PUT' || method === 'PATCH') {
        return await this.update(directoryId, userId, body);
      }

      // Get a user
      if (method === 'GET') {
        return await this.get(directoryId, userId);
      }

      // Delete a user
      if (method === 'DELETE') {
        return await this.delete(directoryId, userId);
      }
    }

    // Create a new user
    if (method === 'POST') {
      return await this.create(directoryId, body);
    }

    // Get all users
    if (method === 'GET') {
      return await this.getAll();
    }
  }
}
