import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

import type { IDirectoryProvider } from '../types';
import type { Directory, IDirectoryConfig, Group, User } from '../../../typings';

interface GoogleGroupsParams {
  authClient: OAuth2Client;
  directories: IDirectoryConfig;
}

export class GoogleProvider implements IDirectoryProvider {
  name = 'google';
  private authClient: OAuth2Client;
  private directories: IDirectoryConfig;

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
      return directory.googleAuth?.access_token && directory.googleAuth.refresh_token && directory.domain;
    });
  }

  async getGroups(directory: Directory) {
    this.authClient.setCredentials({
      access_token: directory.googleAuth?.access_token,
      refresh_token: directory.googleAuth?.refresh_token,
    });

    const googleAdmin = google.admin({ version: 'directory_v1', auth: this.authClient });

    const response = await googleAdmin.groups.list({
      domain: directory.domain,
      maxResults: 100,
    });

    const groups = response.data.groups || [];

    return groups as Group[];
  }

  async getUsersInGroup(directory: Directory, group: Group): Promise<User[]> {
    this.authClient.setCredentials({
      access_token: directory.googleAuth?.access_token,
      refresh_token: directory.googleAuth?.refresh_token,
    });

    const googleAdmin = google.admin({ version: 'directory_v1', auth: this.authClient });

    const response = await googleAdmin.members.list({
      groupKey: group.id,
      maxResults: 200,
    });

    const members = response.data.members || [];

    return members as User[];
  }

  async getUsers(directory: Directory) {
    this.authClient.setCredentials({
      access_token: directory.googleAuth?.access_token,
      refresh_token: directory.googleAuth?.refresh_token,
    });

    const googleAdmin = google.admin({ version: 'directory_v1', auth: this.authClient });

    const response = await googleAdmin.users.list({
      domain: directory.domain,
      maxResults: 200,
    });

    if (!response.data.users) {
      return [];
    }

    return response.data.users.map((user) => {
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
}
