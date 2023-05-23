import type { IDirectoryProvider } from './types';
import type {
  Directory,
  IDirectoryConfig,
  User,
  IUsers,
  IRequestHandler,
  DirectorySyncRequest,
} from '../../typings';

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

  // Do the sync
  async sync() {
    const directories = await this.provider.getDirectories();

    for (const directory of directories) {
      console.info(`Running the user sync for ${directory.name}`);
      await this.syncUserForDirectory(directory);
    }
  }

  // Sync users for a directory
  async syncUserForDirectory(directory: Directory) {
    this.users.setTenantAndProduct(directory.tenant, directory.product);

    const users = await this.provider.getUsers(directory);

    // delete users[0];

    for (const user of users) {
      const { data: existingUser } = await this.users.get(user.id);

      if (!existingUser) {
        await this.createUser(directory, user);
      } else if (isUserUpdated(existingUser, user)) {
        await this.updateUser(directory, user);
      }
    }
  }

  // New user found, create it
  async createUser(directory: Directory, user: User) {
    await this.handleRequest(directory, {
      method: 'POST',
      body: toSCIMPayload(user),
      resourceId: undefined,
    });
  }

  // User found, update it if needed
  async updateUser(directory: Directory, user: User) {
    await this.handleRequest(directory, {
      method: 'PUT',
      body: toSCIMPayload(user),
      resourceId: user.id,
    });
  }

  // Call the request handler
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

    console.info(`New request for ${directory.name} - ${payload.method} - ${payload.resourceId}`);

    await this.requestHandler.handle(request);
  }
}

// Map to SCIM payload
const toSCIMPayload = (user: User) => {
  return {
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
    userName: user.email,
    name: {
      givenName: user.first_name,
      familyName: user.last_name,
    },
    emails: [
      {
        primary: true,
        value: user.email,
        type: 'work',
      },
    ],
    userId: user.id,
    active: user.active,
  };
};

const isUserUpdated = (existingUser: User, userFromProvider: User) => {
  return (
    existingUser.first_name !== userFromProvider.first_name ||
    existingUser.last_name !== userFromProvider.last_name ||
    existingUser.email !== userFromProvider.email ||
    existingUser.active !== userFromProvider.active
  );
};

// const compareAndFindDeletedUsers = (existingUsers: User[], usersFromProvider: User[]) => {
//   const deletedGroups: Group[] = [];

//   if (existingGroup.length === 0) {
//     return deletedGroups;
//   }

//   const groupFromProviderIds = groupFromProvider.map((group) => group.id);

//   for (const group of existingGroup) {
//     if (!groupFromProviderIds.includes(group.id)) {
//       deletedGroups.push(group);
//     }
//   }

//   return deletedGroups;
// };
