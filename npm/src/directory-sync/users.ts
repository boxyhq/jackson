import type { DirectorySyncRequest, SCIMEventType } from '../typings';
import { UsersController } from '../controller/users';
import { sendEvent } from './events';
import { DirectoryConfig } from './config';

export class DirectoryUsers {
  private users: InstanceType<typeof UsersController>;
  private directory: InstanceType<typeof DirectoryConfig>;

  constructor({ directory, users }) {
    this.users = users;
    this.directory = directory;
  }

  public async create(directoryId: string, body: any) {
    const { tenant, product, webhook } = await this.directory.get(directoryId);
    const { name, emails } = body;

    const user = await this.users.with(tenant, product).create({
      first_name: name.givenName,
      last_name: name.familyName,
      email: emails[0].value,
      raw: body,
    });

    sendEvent({
      action: 'user.created',
      payload: {
        tenant,
        product,
        data: user,
      },
      options: {
        webhook,
      },
    });

    return {
      status: 201,
      data: user.raw,
    };
  }

  public async get(directoryId: string, userId: string) {
    const { tenant, product } = await this.directory.get(directoryId);

    const user = await this.users.with(tenant, product).get(userId);

    if (user === null) {
      return {
        status: 404,
        data: {
          schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
          detail: 'User not found',
          status: 404,
        },
      };
    }

    return {
      status: 200,
      data: user.raw,
    };
  }

  public async update(directoryId: string, userId: string, body: any) {
    const { tenant, product, webhook } = await this.directory.get(directoryId);
    const { active, Operations } = body;

    let user = await this.users.with(tenant, product).get(userId);

    if (user === null) {
      return {
        status: 404,
        data: {
          schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
          detail: 'User not found',
          status: 404,
        },
      };
    }

    let action: SCIMEventType = 'user.updated';

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

    if (action === 'user.updated') {
      const { name, emails } = body;

      user = await this.users.with(tenant, product).update(userId, {
        first_name: name.givenName,
        last_name: name.familyName,
        email: emails[0].value,
        raw: body,
      });
    } else if (action === 'user.deleted') {
      await this.users.with(tenant, product).delete(userId);
    }

    sendEvent({
      action,
      payload: {
        tenant,
        product,
        data: user,
      },
      options: {
        webhook,
      },
    });

    return {
      status: 200,
      data: user.raw,
    };
  }

  public async delete(directoryId: string, userId: string) {
    const { tenant, product, webhook } = await this.directory.get(directoryId);

    const user = await this.users.with(tenant, product).get(userId);

    if (user === null) {
      return {
        status: 404,
        data: {
          schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
          detail: 'User not found',
          status: 404,
        },
      };
    }

    await this.users.with(tenant, product).delete(userId);

    sendEvent({
      action: 'user.deleted',
      payload: {
        tenant,
        product,
        data: user,
      },
      options: {
        webhook,
      },
    });

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

    // Create a new user
    if (method === 'POST') {
      return await this.create(directoryId, body);
    }

    // Update an existing user
    if ((method === 'PUT' || method === 'PATCH') && userId) {
      return await this.update(directoryId, userId, body);
    }

    // Get a user
    if (method === 'GET' && userId) {
      return await this.get(directoryId, userId);
    }

    // Delete a user
    if (method === 'DELETE' && userId) {
      return await this.delete(directoryId, userId);
    }

    // Get all users
    if (method === 'GET') {
      return await this.getAll();
    }
  }
}
