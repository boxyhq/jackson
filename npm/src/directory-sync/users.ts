import type { DirectorySyncRequest, DirectoryConfig, DirectorySyncResponse } from '../typings';
import { GroupsController } from '../controller/groups';
import { UsersController } from '../controller/users';
import { sendEvent } from './events';
import { Directories } from './directories';

export class DirectoryUsers {
  private directory: InstanceType<typeof Directories>;
  private users: InstanceType<typeof UsersController>;
  private groups: InstanceType<typeof GroupsController>;

  constructor({ directory, users, groups }) {
    this.directory = directory;
    this.users = users;
    this.groups = groups;
  }

  public async create(directory: DirectoryConfig, body: any): Promise<DirectorySyncResponse> {
    const { name, emails } = body;

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

  public async get(userId: string): Promise<DirectorySyncResponse> {
    const user = await this.users.get(userId);

    return {
      status: 200,
      data: user.raw,
    };
  }

  public async update(directory: DirectoryConfig, userId: string, body: any): Promise<DirectorySyncResponse> {
    const { active, name, emails } = body;

    // Update the user
    if (active === true) {
      const user = await this.users.update(userId, {
        first_name: name.givenName,
        last_name: name.familyName,
        email: emails[0].value,
        raw: body,
      });

      sendEvent('user.updated', { directory, user });

      return {
        status: 200,
        data: user.raw,
      };
    }

    // Delete the user
    if (active === false) {
      return await this.delete(directory, userId);
    }

    return {
      status: 200,
      data: null,
    };
  }

  public async updateOperation(
    directory: DirectoryConfig,
    userId: string,
    body: any
  ): Promise<DirectorySyncResponse> {
    const { Operations } = body;
    const operation = Operations[0];

    // Delete the user
    if (operation.op === 'replace' && operation.value.active === false) {
      return await this.delete(directory, userId);
    }

    return {
      status: 200,
      data: null,
    };
  }

  public async delete(directory: DirectoryConfig, userId: string) {
    const user = await this.users.get(userId);

    await this.users.delete(userId);

    sendEvent('user.deleted', { directory, user });

    return {
      status: 200,
      data: user.raw,
    };
  }

  public async getAll(queryParams: {
    count: number;
    startIndex: number;
    filter?: string;
  }): Promise<DirectorySyncResponse> {
    const { count, startIndex, filter } = queryParams;

    // Retrieve a list of Users
    if (count && startIndex && filter === undefined) {
      const users = await this.users.getAll();

      return {
        status: 200,
        data: {
          schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
          startIndex: 1,
          totalResults: users.length,
          itemsPerPage: users.length,
          Resources: users.map((user) => user.raw),
        },
      };
    }

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
  public async handleRequest(request: DirectorySyncRequest): Promise<DirectorySyncResponse> {
    const { method, directory_id: directoryId, user_id: userId, body, query_params: queryParams } = request;

    const directory = await this.directory.get(directoryId);
    const { tenant, product } = directory;

    this.users.setTenantAndProduct(tenant, product);

    if (userId) {
      // Retrieve a specific User
      // GET /Users/$userId
      if (method === 'GET') {
        return await this.get(userId);
      }

      // Update a specific User
      // PUT /Users/$userId
      if (method === 'PUT') {
        return await this.update(directory, userId, body);
      }

      // Update a specific User
      // PATCH /Users/$userId
      if (method === 'PATCH') {
        return await this.updateOperation(directory, userId, body);
      }
      3;

      // Delete a user
      // DELETE /Users/$userId
      if (method === 'DELETE') {
        return await this.delete(directory, userId);
      }
    }

    // Create a new user
    // POST /Users
    if (method === 'POST') {
      return await this.create(directory, body);
    }

    // Retrieve Users
    // GET /Users
    if (method === 'GET' && queryParams) {
      return await this.getAll(queryParams);
    }

    return {
      status: 404,
      data: {},
    };
  }
}
