import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

import type {
  Directory,
  IDirectoryConfig,
  Group,
  User,
  GroupMember,
  IDirectoryProvider,
  JacksonOption,
} from '../../../typings';

interface GoogleProviderParams {
  opts: JacksonOption;
  directories: IDirectoryConfig;
}

export class GoogleProvider implements IDirectoryProvider {
  opts: JacksonOption;
  directories: IDirectoryConfig;
  groupFieldsToExcludeWhenCompare = ['etag'];
  userFieldsToExcludeWhenCompare = ['etag', 'lastLoginTime', 'thumbnailPhotoEtag'];

  constructor({ directories, opts }: GoogleProviderParams) {
    this.opts = opts;
    this.directories = directories;
  }

  createOAuth2Client(directory: Directory) {
    const googleProvider = this.opts.dsync?.providers.google;

    const authClient = new OAuth2Client(
      googleProvider?.clientId,
      googleProvider?.clientSecret,
      googleProvider?.callbackUrl
    );

    authClient.setCredentials({
      access_token: directory.google?.access_token,
      refresh_token: directory.google?.refresh_token,
    });

    return authClient;
  }

  async getDirectories() {
    const { data: directories } = await this.directories.getByProvider({
      provider: 'google',
    });

    if (!directories || directories.length === 0) {
      return [];
    }

    return directories.filter((directory) => {
      return (
        directory.google?.access_token && directory.google.refresh_token && directory.google.domain !== ''
      );
    });
  }

  async getGroups(directory: Directory) {
    const googleAdmin = google.admin({ version: 'directory_v1', auth: this.createOAuth2Client(directory) });

    const allGroups: Group[] = [];
    const query = {
      maxResults: 200,
      domain: directory.google?.domain,
    };

    let nextPageToken: string | undefined | null = null;

    do {
      if (nextPageToken) {
        query['pageToken'] = nextPageToken;
      }

      const response = await googleAdmin.groups.list(query);

      if (!response.data.groups) {
        break;
      }

      const groups: Group[] = response.data.groups.map((group) => {
        return {
          id: group.id as string,
          name: group.name as string,
          raw: group,
        };
      });

      allGroups.push(...groups);

      nextPageToken = response.data.nextPageToken;
    } while (nextPageToken);

    return allGroups;
  }

  async getUsers(directory: Directory) {
    const googleAdmin = google.admin({ version: 'directory_v1', auth: this.createOAuth2Client(directory) });

    const allUsers: User[] = [];
    const query = {
      maxResults: 200,
      domain: directory.google?.domain,
    };

    let nextPageToken: string | undefined | null = null;

    do {
      if (nextPageToken) {
        query['pageToken'] = nextPageToken;
      }

      const response = await googleAdmin.users.list(query);

      if (!response.data.users) {
        break;
      }

      const users = response.data.users.map((user) => {
        return {
          id: user.id as string,
          email: user.primaryEmail as string,
          first_name: user.name?.givenName as string,
          last_name: user.name?.familyName as string,
          active: !user.suspended,
          raw: user,
        };
      });

      allUsers.push(...users);

      nextPageToken = response.data.nextPageToken;
    } while (nextPageToken);

    return allUsers;
  }

  async getGroupMembers(directory: Directory, group: Group) {
    const googleAdmin = google.admin({ version: 'directory_v1', auth: this.createOAuth2Client(directory) });

    const allMembers: GroupMember[] = [];
    const query = {
      maxResults: 200,
      groupKey: group.id,
      domain: directory.google?.domain,
    };

    let nextPageToken: string | undefined | null = null;

    do {
      if (nextPageToken) {
        query['pageToken'] = nextPageToken;
      }

      const response = await googleAdmin.members.list(query);

      if (!response.data.members) {
        break;
      }

      const members = response.data.members.map((user) => {
        return {
          id: user.id as string,
          raw: user,
        };
      });

      allMembers.push(...members);

      nextPageToken = response.data.nextPageToken;
    } while (nextPageToken);

    return allMembers;
  }
}
