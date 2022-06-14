import type {
  DirectoryConfig,
  Directory,
  DirectorySyncResponse,
  WebhookEvents,
  User,
  DirectorySyncUserRequest,
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

  public async updatePUT(directory: Directory, userId: string, body: any): Promise<DirectorySyncResponse> {
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
      return await this.delete(directory, userId, false);
    }

    return {
      status: 200,
      data: null,
    };
  }

  public async updatePATCH(directory: Directory, userId: string, body: any): Promise<DirectorySyncResponse> {
    const { Operations } = body;
    const operation = Operations[0];

    // Delete the user
    if (operation.op === 'replace' && operation.value.active === false) {
      return await this.delete(directory, userId, false);
    }

    return {
      status: 200,
      data: null,
    };
  }

  public async delete(directory: Directory, userId: string, active = true): Promise<DirectorySyncResponse> {
    const user = await this.users.get(userId);

    await this.users.delete(userId);

    user.raw.active = active;

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
      totalResults = (await this.users.list({})).length; // At this moment, we don't have method to count the database records.
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
  public async handleRequest(request: DirectorySyncUserRequest): Promise<DirectorySyncResponse> {
    const { method, body, query } = request;
    const { directory_id: directoryId, user_id: userId } = query;

    const directory = await this.directories.get(directoryId);

    this.users.setTenantAndProduct(directory.tenant, directory.product);

    // Get a specific user
    if (method === 'GET' && userId) {
      return await this.get(userId);
    }

    // Get all the users
    if (method === 'GET' && query) {
      return await this.getAll({
        count: query.count as number,
        startIndex: query.startIndex as number,
        filter: query.filter,
      });
    }

    if (method === 'POST') {
      return this.create(directory, body);
    }

    if (method === 'PUT' && userId) {
      return await this.updatePUT(directory, userId, body);
    }

    if (method === 'PATCH' && userId) {
      return await this.updatePATCH(directory, userId, body);
    }

    if (method === 'DELETE' && userId) {
      return await this.delete(directory, userId);
    }

    return {
      status: 404,
      data: {},
    };
  }
}
