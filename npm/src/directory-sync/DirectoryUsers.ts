import type {
  DirectoryConfig,
  Directory,
  DirectorySyncResponse,
  DirectorySyncRequest,
  User,
  Users,
  ApiError,
  IDirectoryUsers,
  EventCallback,
  HTTPMethod,
} from '../typings';
import { parseUserOperations } from './utils';
import { sendEvent } from './events';

export class DirectoryUsers implements IDirectoryUsers {
  private directories: DirectoryConfig;
  private users: Users;
  private callback: EventCallback | undefined;

  constructor({ directories, users }: { directories: DirectoryConfig; users: Users }) {
    this.directories = directories;
    this.users = users;
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

    await sendEvent('user.created', { directory, user }, this.callback);

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

    await sendEvent('user.updated', { directory, user: updatedUser }, this.callback);

    return {
      status: 200,
      data: updatedUser?.raw,
    };
  }

  public async patch(directory: Directory, user: User, body: any): Promise<DirectorySyncResponse> {
    const { Operations } = body;

    const operation = parseUserOperations(Operations);

    if (operation.action === 'updateUser') {
      const { data: updatedUser } = await this.users.update(user.id, {
        ...user,
        ...operation.attributes,
        raw: { ...user.raw, ...operation.raw },
      });

      await sendEvent('user.updated', { directory, user: updatedUser }, this.callback);

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

    await sendEvent('user.deleted', { directory, user }, this.callback);

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
  public async handleRequest(
    request: DirectorySyncRequest,
    callback?: EventCallback
  ): Promise<DirectorySyncResponse> {
    const { body, query, resourceId: userId, directoryId, apiSecret } = request;

    const method = request.method.toUpperCase() as HTTPMethod;

    // Get the directory
    const { data: directory, error } = await this.directories.get(directoryId);

    if (error || !directory) {
      return this.respondWithError(error);
    }

    // Validate the request
    if (directory.scim.secret != apiSecret) {
      return this.respondWithError({ code: 401, message: 'Unauthorized' });
    }

    this.callback = callback;
    this.users.setTenantAndProduct(directory.tenant, directory.product);

    // Get the user
    const { data: user } = userId ? await this.users.get(userId) : { data: null };

    if (user) {
      switch (method) {
        case 'GET':
          return await this.get(user);
        case 'PATCH':
          return await this.patch(directory, user, body);
        case 'PUT':
          return await this.update(directory, user, body);
        case 'DELETE':
          return await this.delete(directory, user);
      }
    }

    switch (method) {
      case 'POST':
        return await this.create(directory, body);
      case 'GET':
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
