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

    for (const user of users) {
      const { data: existingUser } = await this.users.get(user.id);

      // New user
      if (!existingUser) {
        await this.requestHandler.handle(createNewUserRequestPayload(directory, user));
      }
    }
  }
}

// export interface DirectorySyncRequest {
//   method: string; //'POST' | 'PUT' | 'DELETE' | 'GET' | 'PATCH';
//   body: any | undefined;
//   directoryId: Directory['id'];
//   resourceType: string; //'users' | 'groups';
//   resourceId: string | undefined;
//   apiSecret: string | null;
//   query: {
//     count?: number;
//     startIndex?: number;
//     filter?: string;
//   };
// }

const createNewUserRequestPayload = (directory: Directory, user: User): DirectorySyncRequest => {
  return {
    method: 'POST',
    body: toSCIMPayload(user),
    directoryId: directory.id,
    resourceType: 'users',
    resourceId: undefined,
    query: {},
    apiSecret: directory.scim.secret,
  };
};

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
    externalId: user.id,
    active: user.active,
  };
};
