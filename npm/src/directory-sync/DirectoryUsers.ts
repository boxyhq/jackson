import type {
  DirectoryConfig,
  Directory,
  DirectorySyncResponse,
  WebhookEvents,
  User,
  DirectorySyncUserRequest,
  Groups,
  Users,
  ApiError,
} from '../typings';

export class DirectoryUsers {
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
    const { name, emails } = body;

    const { data: user } = await this.users.create({
      first_name: name && 'givenName' in name ? name.givenName : '',
      last_name: name && 'familyName' in name ? name.familyName : '',
      email: emails[0].value,
      active: true,
      raw: body,
    });

    await this.webhookEvents.send('user.created', { directory, user });

    return {
      status: 201,
      data: user?.raw,
    };
  }

  public async get(user: User): Promise<DirectorySyncResponse> {
    return {
      status: 200,
      data: user.raw,
    };
  }

  public async update(directory: Directory, user: User, body: any): Promise<DirectorySyncResponse> {
    const { name, emails, active } = body;

    const { data: updatedUser } = await this.users.update(user.id, {
      first_name: name.givenName,
      last_name: name.familyName,
      email: emails[0].value,
      active,
      raw: body,
    });

    await this.webhookEvents.send('user.updated', { directory, user: updatedUser });

    return {
      status: 200,
      data: updatedUser?.raw,
    };
  }

  public async patch(directory: Directory, user: User, body: any): Promise<DirectorySyncResponse> {
    const { Operations } = body;
    const operation = Operations[0];

    // Update the user
    if (operation.op === 'replace') {
      const { data: updatedUser } = await this.users.update(user.id, {
        ...user,
        ...operation.value,
        raw: { ...user.raw, ...operation.value },
      });

      await this.webhookEvents.send('user.updated', { directory, user: updatedUser });

      return {
        status: 200,
        data: updatedUser?.raw,
      };
    }

    return {
      status: 200,
      data: null,
    };
  }

  public async delete(directory: Directory, user: User): Promise<DirectorySyncResponse> {
    await this.users.delete(user.id);

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

    let users: User[] | null = [];
    let totalResults = 0;

    if (filter) {
      // Search users by userName
      // filter: userName eq "john@example.com"
      const { data } = await this.users.search(filter.split('eq ')[1].replace(/['"]+/g, ''));

      users = data;
      totalResults = users ? users.length : 0;
    } else {
      // Fetch all the existing Users (Paginated)
      // At this moment, we don't have method to count the database records.
      const { data: allUsers } = await this.users.list({});
      const { data } = await this.users.list({ pageOffset: startIndex - 1, pageLimit: count });

      users = data;
      totalResults = allUsers ? allUsers.length : 0;
    }

    return {
      status: 200,
      data: {
        schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
        startIndex: startIndex ? startIndex : 1,
        totalResults: totalResults ? totalResults : 0,
        itemsPerPage: count ? count : 0,
        Resources: users ? users.map((user) => user.raw) : [],
      },
    };
  }

  private respondWithError(error: ApiError | null) {
    return {
      status: error ? error.code : 500,
      data: null,
    };
  }

  // Handle the request from the Identity Provider and route it to the appropriate method
  public async handleRequest(request: DirectorySyncUserRequest): Promise<DirectorySyncResponse> {
    const { method, body, query } = request;
    const { directory_id: directoryId, user_id: userId } = query;

    // Get the directory
    const { data: directory, error } = await this.directories.get(directoryId);

    if (error || !directory) {
      return this.respondWithError(error);
    }

    this.users.setTenantAndProduct(directory.tenant, directory.product);

    // Get the user
    const { data: user } = userId ? await this.users.get(userId) : { data: null };

    if (user) {
      // Get a specific user
      if (method === 'GET') {
        return await this.get(user);
      }

      if (method === 'PUT') {
        return await this.update(directory, user, body);
      }

      if (method === 'PATCH') {
        return await this.patch(directory, user, body);
      }

      if (method === 'DELETE') {
        return await this.delete(directory, user);
      }
    }

    if (method === 'POST') {
      return this.create(directory, body);
    }

    // Get all the users
    if (method === 'GET') {
      return await this.getAll({
        count: query.count as number,
        startIndex: query.startIndex as number,
        filter: query.filter,
      });
    }

    return {
      status: 404,
      data: {},
    };
  }
}
