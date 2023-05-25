import _ from 'lodash';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

import { GoogleAuth } from './oauth';
import type { IDirectoryProvider } from '../types';
import type { Directory, IDirectoryConfig, Group, User, JacksonOption, GroupMember } from '../../../typings';

interface GetGoogleProviderParams {
  directories: IDirectoryConfig;
  opts: JacksonOption;
}

interface GoogleGroupsParams {
  authClient: OAuth2Client;
  directories: IDirectoryConfig;
}

class GoogleProvider implements IDirectoryProvider {
  authClient: OAuth2Client;
  directories: IDirectoryConfig;
  groupFieldsToExcludeWhenCompare = ['etag'];
  userFieldsToExcludeWhenCompare = ['etag', 'lastLoginTime', 'thumbnailPhotoEtag'];

  constructor({ directories, authClient }: GoogleGroupsParams) {
    this.directories = directories;
    this.authClient = authClient;
  }

  async getDirectories() {
    const { data: directories } = await this.directories.getAll();

    if (!directories) {
      return [];
    }

    return directories.filter((directory) => {
      return (
        directory.google?.access_token && directory.google.refresh_token && directory.google.domain !== ''
      );
    });
  }

  async getGroups(directory: Directory) {
    this.authClient.setCredentials({
      access_token: directory.google?.access_token,
      refresh_token: directory.google?.refresh_token,
    });

    const googleAdmin = google.admin({ version: 'directory_v1', auth: this.authClient });

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
    this.authClient.setCredentials({
      access_token: directory.google?.access_token,
      refresh_token: directory.google?.refresh_token,
    });

    const googleAdmin = google.admin({ version: 'directory_v1', auth: this.authClient });

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
    this.authClient.setCredentials({
      access_token: directory.google?.access_token,
      refresh_token: directory.google?.refresh_token,
    });

    const googleAdmin = google.admin({ version: 'directory_v1', auth: this.authClient });

    const allMembers: GroupMember[] = [];
    const query = {
      maxResults: 1,
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

// Initialize Google Provider
export const getGogleProvider = (params: GetGoogleProviderParams) => {
  const { directories, opts } = params;
  const { dsync } = opts;

  if (!dsync?.google?.clientId) {
    throw new Error('Google Provider: Missing Google Client ID');
  }

  if (!dsync?.google?.clientSecret) {
    throw new Error('Google Provider: Missing Google Client Secret');
  }

  if (!dsync?.google?.callbackUrl) {
    throw new Error('Google Provider: Missing Google Callback URL');
  }

  const authClient = new OAuth2Client(
    dsync.google.clientId,
    dsync.google.clientSecret,
    dsync.google.callbackUrl
  );

  return {
    auth: new GoogleAuth({ directories, authClient }),
    provider: new GoogleProvider({ directories, authClient }),
  };
};
