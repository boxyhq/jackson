import { sendEvent } from '../events';
import type { Directory, EventCallback, IDirectoryConfig, IGroups, Group } from '../../typings';

export interface GroupSyncInterface {
  getDirectories(): Promise<Directory[]>;
  getGroups(directory: Directory): Promise<Group[]>;
}

interface GroupSyncParams {
  groups: IGroups;
  directories: IDirectoryConfig;
  callback?: EventCallback | undefined;
  provider: GroupSyncInterface;
}

export class SyncGroup {
  private groups: IGroups;
  private directories: IDirectoryConfig;
  private callback: EventCallback | undefined;
  private provider: GroupSyncInterface;

  constructor({ directories, groups, callback, provider }: GroupSyncParams) {
    this.groups = groups;
    this.directories = directories;
    this.callback = callback;
    this.provider = provider;
  }

  // Do the sync
  async sync() {
    const directories = await this.provider.getDirectories();

    for (const directory of directories) {
      await this.syncGroup(directory);
    }
  }

  // Sync groups from Google to the directory
  async syncGroup(directory: Directory) {
    const groups = await this.provider.getGroups(directory);

    this.groups.setTenantAndProduct(directory.tenant, directory.product);

    for (const group of groups) {
      const { data: existingGroup } = await this.groups.get(group.id);

      // New group found, create it
      if (!existingGroup) {
        await this.createGroup(directory, group);
        continue;
      }

      // Group info is updated, update it
      if (this.isGroupUpdated(existingGroup, group)) {
        await this.updateGroup(directory, group);
        continue;
      }
    }

    // Let's check if any groups were deleted
    const { data: existingGroups } = await this.groups.getAll({});

    if (!existingGroups) {
      return;
    }

    await this.deleteGroups(directory, this.compareAndFindDeletedGroups(existingGroups, groups));
  }

  // Find if a group is updated by comparing the name
  isGroupUpdated(existingGroup: Group, groupFromProvider: Group) {
    return existingGroup.name !== groupFromProvider.name;
  }

  // Compare existing groups with groups from provider and find the groups that were deleted
  compareAndFindDeletedGroups(existingGroup: Group[], groupFromProvider: Group[]) {
    const deletedGroups: Group[] = [];

    if (existingGroup.length === 0) {
      return deletedGroups;
    }

    const groupFromProviderIds = groupFromProvider.map((group) => group.id);

    for (const group of existingGroup) {
      if (!groupFromProviderIds.includes(group.id)) {
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
}
