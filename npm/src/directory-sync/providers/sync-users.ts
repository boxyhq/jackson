import _ from 'lodash';

import type {
  Directory,
  IDirectoryConfig,
  User,
  IUsers,
  IRequestHandler,
  DirectorySyncRequest,
} from '../../typings';
import type { IDirectoryProvider } from './types';
import { compareAndFindDeletedUsers, isUserUpdated, toUserSCIMPayload } from './utils';

interface SyncUserParams {
  users: IUsers;
  provider: IDirectoryProvider;
  directories: IDirectoryConfig;
  requestHandler: IRequestHandler;
}

interface HandleRequestParams {
  method: string;
  body: any;
  resourceId: string | undefined;
}

export class SyncUsers {
  private users: IUsers;
  private provider: IDirectoryProvider;
  private requestHandler: IRequestHandler;

  constructor({ users, requestHandler, provider }: SyncUserParams) {
    this.users = users;
    this.provider = provider;
    this.requestHandler = requestHandler;
  }

  async sync() {
    const directories = await this.provider.getDirectories();

    for (const directory of directories) {
      await this.syncUserForDirectory(directory);
    }
  }

  async syncUserForDirectory(directory: Directory) {
    this.users.setTenantAndProduct(directory.tenant, directory.product);

    const users = await this.provider.getUsers(directory);

    if (!users || users.length === 0) {
      return;
    }

    const userFieldsToExcludeWhenCompare = this.provider.userFieldsToExcludeWhenCompare;

    // Create or update users
    for (const user of users) {
      const { data: existingUser } = await this.users.get(user.id);

      if (!existingUser) {
        await this.createUser(directory, user);
      } else if (isUserUpdated(existingUser, user, userFieldsToExcludeWhenCompare)) {
        await this.updateUser(directory, user);
      }
    }

    // Delete users that are not in the directory anymore
    // TODO: Add pagination
    const { data: existingUsers } = await this.users.getAll({ directoryId: directory.id });

    await this.deleteUsers(directory, compareAndFindDeletedUsers(existingUsers, users));
  }

  async createUser(directory: Directory, user: User) {
    await this.handleRequest(directory, {
      method: 'POST',
      body: toUserSCIMPayload(user),
      resourceId: undefined,
    });
  }

  async updateUser(directory: Directory, user: User) {
    await this.handleRequest(directory, {
      method: 'PUT',
      body: toUserSCIMPayload(user),
      resourceId: user.id,
    });
  }

  async deleteUsers(directory: Directory, users: User[]) {
    for (const user of users) {
      await this.handleRequest(directory, {
        method: 'DELETE',
        body: toUserSCIMPayload(user),
        resourceId: user.id,
      });
    }
  }

  async handleRequest(directory: Directory, payload: HandleRequestParams) {
    const request: DirectorySyncRequest = {
      query: {},
      body: payload.body,
      resourceType: 'users',
      method: payload.method,
      directoryId: directory.id,
      apiSecret: directory.scim.secret,
      resourceId: payload.resourceId,
    };

    console.info(`User request: ${payload.method} / ${payload.resourceId}`);

    await this.requestHandler.handle(request);
  }
}
