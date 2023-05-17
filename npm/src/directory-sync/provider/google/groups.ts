import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

import type { GroupSyncInterface } from '../groupSync';
import type { Directory, IDirectoryConfig, Group } from '../../../typings';

interface GoogleGroupsParams {
  authClient: OAuth2Client;
  directories: IDirectoryConfig;
}

export class GoogleGroup implements GroupSyncInterface {
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
}
