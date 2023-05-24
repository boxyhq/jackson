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
import { isUserUpdated, toUserSCIMPayload } from './utils';

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
    console.info(`Running the user sync for ${directory.name}`);

    this.users.setTenantAndProduct(directory.tenant, directory.product);

    const users = await this.provider.getUsers(directory);

    for (const user of users) {
      const { data: existingUser } = await this.users.get(user.id);

      if (!existingUser) {
        await this.createUser(directory, user);
      } else if (isUserUpdated(existingUser, user)) {
        await this.updateUser(directory, user);
      }
    }
  }

  async createUser(directory: Directory, user: User) {
    console.info(`Creating user ${user.first_name} in ${directory.name}`);

    await this.handleRequest(directory, {
      method: 'POST',
      body: toUserSCIMPayload(user),
      resourceId: undefined,
    });
  }

  async updateUser(directory: Directory, user: User) {
    console.info(`Updating user ${user.first_name} in ${directory.name}`);

    await this.handleRequest(directory, {
      method: 'PUT',
      body: toUserSCIMPayload(user),
      resourceId: user.id,
    });
  }

  async handleRequest(directory: Directory, payload: HandleRequestParams) {
    console.info(`New user request for ${directory.name} - ${payload.method} - ${payload.resourceId}`);

    const request: DirectorySyncRequest = {
      query: {},
      body: payload.body,
      resourceType: 'users',
      method: payload.method,
      directoryId: directory.id,
      apiSecret: directory.scim.secret,
      resourceId: payload.resourceId,
    };

    await this.requestHandler.handle(request);
  }
}
