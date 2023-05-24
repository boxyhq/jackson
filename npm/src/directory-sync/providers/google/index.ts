import _ from 'lodash';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

import { GoogleAuth } from './oauth';
import type { IDirectoryProvider } from '../types';
import type { Directory, IDirectoryConfig, Group, User, JacksonOption } from '../../../typings';

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

    const response = await googleAdmin.groups.list({
      domain: directory.google?.domain,
      maxResults: 100,
    });

    if (!response.data.groups) {
      return [];
    }

    return response.data.groups.map((group) => {
      delete group.etag;

      return {
        id: group.id,
        name: group.name,
        raw: group,
      } as Group;
    });
  }

  async getUsers(directory: Directory) {
    this.authClient.setCredentials({
      access_token: directory.google?.access_token,
      refresh_token: directory.google?.refresh_token,
    });

    const googleAdmin = google.admin({ version: 'directory_v1', auth: this.authClient });

    const response = await googleAdmin.users.list({
      domain: directory.google?.domain,
      maxResults: 200,
    });

    if (!response.data.users) {
      return [];
    }

    return response.data.users.map((user) => {
      delete user.etag;
      delete user.lastLoginTime;
      delete user.thumbnailPhotoEtag;

      return {
        id: user.id,
        email: user.primaryEmail,
        first_name: user.name?.givenName,
        last_name: user.name?.familyName,
        active: !user.suspended,
        raw: user,
      } as User;
    });
  }

  async getUsersInGroup(directory: Directory, group: Group): Promise<User[]> {
    this.authClient.setCredentials({
      access_token: directory.google?.access_token,
      refresh_token: directory.google?.refresh_token,
    });

    const googleAdmin = google.admin({ version: 'directory_v1', auth: this.authClient });

    const response = await googleAdmin.members.list({
      groupKey: group.id,
      maxResults: 200,
    });

    const members = response.data.members || [];

    return members as User[];
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
