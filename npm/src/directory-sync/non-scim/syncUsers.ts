import _ from 'lodash';

import type {
  Directory,
  User,
  IUsers,
  IRequestHandler,
  DirectorySyncRequest,
  EventCallback,
  IDirectoryProvider,
} from '../../typings';
import { compareAndFindDeletedUsers, isUserUpdated, toUserSCIMPayload } from './utils';

interface SyncUserParams {
  directory: Directory;
  userController: IUsers;
  callback: EventCallback;
  provider: IDirectoryProvider;
  requestHandler: IRequestHandler;
}

type HandleRequestParams = Pick<DirectorySyncRequest, 'method' | 'body' | 'resourceId'>;

export class SyncUsers {
  private directory: Directory;
  private userController: IUsers;
  private callback: EventCallback;
  private provider: IDirectoryProvider;
  private requestHandler: IRequestHandler;

  constructor({ directory, userController, callback, provider, requestHandler }: SyncUserParams) {
    this.callback = callback;
    this.provider = provider;
    this.directory = directory;
    this.requestHandler = requestHandler;
    this.userController = userController;
  }

  async sync() {
    console.log(`Syncing users for directory ${this.directory.id}`);

    this.userController.setTenantAndProduct(this.directory.tenant, this.directory.product);

    const users = await this.provider.getUsers(this.directory);

    // Create or update users
    for (const user of users) {
      const { data: existingUser } = await this.userController.get(user.id);

      if (!existingUser) {
        await this.createUser(user);
      } else if (isUserUpdated(existingUser, user, this.provider.userFieldsToExcludeWhenCompare)) {
        await this.updateUser(user);
      }
    }

    // Delete users that are not in the directory anymore
    const existingUsers = await this.getAllExistingUsers();
    const usersToDelete = compareAndFindDeletedUsers(existingUsers, users);

    await this.deleteUsers(usersToDelete);
  }

  // Get all the existing users from the Jackson store
  async getAllExistingUsers() {
    this.userController.setTenantAndProduct(this.directory.tenant, this.directory.product);

    const existingUsers: User[] = [];
    const pageLimit = 1;
    let pageOffset = 0;

    while (true) {
      const { data: users } = await this.userController.getAll({
        directoryId: this.directory.id,
        pageOffset,
        pageLimit,
      });

      if (!users || users.length === 0) {
        break;
      }

      existingUsers.push(...users);

      if (users.length < pageLimit) {
        break;
      }

      pageOffset += pageLimit;
    }

    return existingUsers;
  }

  async createUser(user: User) {
    console.info('Creating user: ', _.pick(user, ['id', 'email']));

    await this.handleRequest({
      method: 'POST',
      body: toUserSCIMPayload(user),
      resourceId: undefined,
    });
  }

  async updateUser(user: User) {
    console.info('Updating user: ', _.pick(user, ['id', 'email']));

    await this.handleRequest({
      method: 'PUT',
      body: toUserSCIMPayload(user),
      resourceId: user.id,
    });
  }

  async deleteUsers(users: User[]) {
    for (const user of users) {
      console.info('Deleting user: ', _.pick(user, ['id', 'email']));

      await this.handleRequest({
        method: 'DELETE',
        body: toUserSCIMPayload(user),
        resourceId: user.id,
      });
    }
  }

  async handleRequest(payload: HandleRequestParams) {
    const request: DirectorySyncRequest = {
      query: {},
      body: payload.body,
      resourceType: 'users',
      method: payload.method,
      directoryId: this.directory.id,
      apiSecret: this.directory.scim.secret,
      resourceId: payload.resourceId,
    };

    await this.requestHandler.handle(request, this.callback);
  }
}
