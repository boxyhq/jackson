import { admin_directory_v1, google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

import { sendEvent } from '../../events';
import type { Directory, EventCallback, IDirectoryConfig, IUsers, IGroups, Group } from '../../../typings';

interface GoogleGroupsParams {
  users: IUsers;
  groups: IGroups;
  directories: IDirectoryConfig;
}

export class GoogleGroups {
  private users: IUsers;
  private groups: IGroups;
  private directories: IDirectoryConfig;
  private callback: EventCallback | undefined;
  private googleAdmin: admin_directory_v1.Admin;
  private auth2Client: OAuth2Client;

  constructor({ users, groups, directories }: GoogleGroupsParams) {
    this.users = users;
    this.groups = groups;
    this.directories = directories;
    // Add client_id and client_secret to make withAuth work
    this.auth2Client = new OAuth2Client();
    this.googleAdmin = google.admin({ version: 'directory_v1', auth: this.auth2Client });
  }

  // Set credentials for the Google API for a directory
  setCredentials(directory: Directory) {
    if (!directory.googleAuth?.access_token) {
      throw new Error('Google Provider: Missing Google Access Token');
    }

    if (!directory.googleAuth?.refresh_token) {
      throw new Error('Google Provider: Missing Google Refresh Token');
    }

    this.auth2Client.setCredentials({
      access_token: directory.googleAuth.access_token,
      refresh_token: directory.googleAuth.refresh_token,
    });

    this.googleAdmin = google.admin({ version: 'directory_v1', auth: this.auth2Client });
  }

  // Get all directories that have Google as the type and have all the required fields
  async getDirectories() {
    const { data: directories } = await this.directories.getAll();

    if (!directories) {
      return [];
    }

    return directories.filter((directory) => {
      return directory.googleAuth?.access_token && directory.googleAuth.refresh_token && directory.domain;
    });
  }

  // Find if a group is updated by comparing the name
  isGroupUpdated(existingGroup: Group, groupFromGoogle: Group) {
    return existingGroup.name !== groupFromGoogle.name;
  }

  // Compare existing groups with groups from Google and find the groups that were deleted
  compareAndFindDeletedGroups(groupsFromDirectory: Group[], groupsFromGoogle: Group[]) {
    const deletedGroups: Group[] = [];

    if (groupsFromDirectory.length === 0) {
      return deletedGroups;
    }

    const groupFromGoogleIds = groupsFromGoogle.map((group) => group.id);

    for (const group of groupsFromDirectory) {
      if (!groupFromGoogleIds.includes(group.id)) {
        deletedGroups.push(group);
      }
    }

    return deletedGroups;
  }

  // Create a group in the directory
  async createGroup(directory: Directory, group: Group) {
    this.groups.setTenantAndProduct(directory.tenant, directory.product);

    await this.groups.create({
      directoryId: directory.id,
      name: group.name,
      externalId: group.id,
      raw: group,
    });

    await sendEvent('group.created', { directory, group }, this.callback);
  }

  // Update a group in the directory
  async updateGroup(directory: Directory, group: Group) {
    this.groups.setTenantAndProduct(directory.tenant, directory.product);

    await this.groups.update(group.id, {
      name: group.name,
      raw: group,
    });

    await sendEvent('group.updated', { directory, group }, this.callback);
  }

  // Delete groups from the directory
  async deleteGroups(directory: Directory, groupsToBeRemoved: Group[]) {
    if (groupsToBeRemoved.length === 0) {
      return;
    }

    this.groups.setTenantAndProduct(directory.tenant, directory.product);

    for (const group of groupsToBeRemoved) {
      await this.groups.delete(group.id);
      await sendEvent('group.deleted', { directory, group }, this.callback);
    }
  }

  // Sync groups from Google to the directory
  async syncGroup(directory: Directory) {
    let groups: Group[] = [];

    this.setCredentials(directory);

    const response = await this.googleAdmin.groups.list({
      domain: directory.domain,
      maxResults: 100,
    });

    console.log('Group response', response.data);

    // try {
    //   const response = await this.googleAdmin.groups.list({
    //     customer: directory.domain,
    //     maxResults: 100,
    //   });

    //   console.log('Group response', response);

    //   if (!response.data.groups) {
    //     return;
    //   }

    //   // groups = response.data.groups;
    // } catch (err) {
    //   console.log('Failed to fetch groups from Google', err);
    //   return;
    // }

    // if (!groups) {
    //   return;
    // }

    // this.groups.setTenantAndProduct(directory.tenant, directory.product);

    // for (const group of groups) {
    //   const { data: existingGroup } = await this.groups.get(group.id);

    //   // New group found, create it
    //   if (!existingGroup) {
    //     await this.createGroup(directory, group);
    //     continue;
    //   }

    //   // Group info is updated, update it
    //   if (this.isGroupUpdated(existingGroup, group)) {
    //     await this.updateGroup(directory, group);
    //     continue;
    //   }
    // }

    // // Let's check if any groups were deleted
    // const { data: existingGroups } = await this.groups.getAll({});

    // if (!existingGroups) {
    //   return;
    // }

    // await this.deleteGroups(directory, this.compareAndFindDeletedGroups(existingGroups, groups));

    // return;
  }

  // Sync groups for each directory
  async sync() {
    const directories = await this.getDirectories();

    if (directories.length === 0) {
      return;
    }

    const promises = [] as Promise<void>[];

    for (const directory of directories) {
      promises.push(this.syncGroup(directory));
    }

    const results = await Promise.all(promises);

    console.log('Synced groups for all directories', results);
  }
}
