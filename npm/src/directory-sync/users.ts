import type {
  DirectorySyncRequest,
  DirectoryConfig,
  Directory,
  DirectorySyncResponse,
  WebhookEvents,
  User,
} from '../typings';
import type { GroupsController } from '../controller/groups';
import type { UsersController } from '../controller/users';

export class DirectoryUsers {
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

  public async create(directory: Directory, body: any): Promise<DirectorySyncResponse> {
    const { name, emails } = body;

    const user = await this.users.create({
      first_name: name.givenName,
      last_name: name.familyName,
      email: emails[0].value,
      raw: body,
    });

    await this.webhookEvents.send('user.created', { directory, user });

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

  public async update(directory: Directory, userId: string, body: any): Promise<DirectorySyncResponse> {
    const { active, name, emails } = body;

    // Update the user
    if (active === true) {
      const user = await this.users.update(userId, {
        first_name: name.givenName,
        last_name: name.familyName,
        email: emails[0].value,
        raw: body,
      });

      await this.webhookEvents.send('user.updated', { directory, user });

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
    directory: Directory,
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

  public async delete(directory: Directory, userId: string) {
    const user = await this.users.get(userId);

    await this.users.delete(userId);

    await this.webhookEvents.send('user.deleted', { directory, user });

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
    const { startIndex, filter, count } = queryParams;

    let users: User[] = [];
    let totalResults = 0;

    if (filter) {
      // Search users by userName
      // filter: userName eq "john@example.com"
      users = await this.users.search(filter.split('eq ')[1].replace(/['"]+/g, ''));
      totalResults = users.length;
    } else {
      // Fetch all the existing Users (Paginated)
      totalResults = (await this.users.list({})).length;
      users = await this.users.list({ pageOffset: startIndex - 1, pageLimit: count });
    }

    return {
      status: 200,
      data: {
        schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
        startIndex,
        totalResults,
        itemsPerPage: count,
        Resources: users.map((user) => user.raw),
      },
    };
  }

  // Handle the request from the Identity Provider and route it to the appropriate method
  public async handleRequest(request: DirectorySyncRequest): Promise<DirectorySyncResponse> {
    const { method, directory_id: directoryId, user_id: userId, body, query_params: queryParams } = request;

    const directory = await this.directories.get(directoryId);

    this.users.setTenantAndProduct(directory.tenant, directory.product);

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
