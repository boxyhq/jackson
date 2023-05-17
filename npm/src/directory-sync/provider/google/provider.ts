import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

import type { IDirectoryProvider } from '../types';
import type { Directory, IDirectoryConfig, Group, User } from '../../../typings';

interface GoogleGroupsParams {
  authClient: OAuth2Client;
  directories: IDirectoryConfig;
}

export class GoogleProvider implements IDirectoryProvider {
  private directories: IDirectoryConfig;
  private authClient: OAuth2Client;

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

  async getUsers(directory: Directory) {
    return [] as User[];
  }

  async getUsersInGroup(directory: Directory, group: Group): Promise<User[]> {
    return [] as User[];
  }
}
