import type { IDirectoryProvider } from './types';
import type {
  Directory,
  IDirectoryConfig,
  IGroups,
  Group,
  IRequestHandler,
  DirectorySyncRequest,
} from '../../typings';

interface SyncGroupsParams {
  groups: IGroups;
  provider: IDirectoryProvider;
  directories: IDirectoryConfig;
  requestHandler: IRequestHandler;
}

interface HandleRequestParams {
  method: string;
  body: any;
  resourceId: string | undefined;
}

interface SCIMGroupSchema {
  schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'];
  displayName: string;
  groupId: string;
  [key: string]: any;
}

export class SyncGroups {
  private groups: IGroups;
  private provider: IDirectoryProvider;
  private requestHandler: IRequestHandler;

  constructor({ groups, requestHandler, provider }: SyncGroupsParams) {
    this.groups = groups;
    this.provider = provider;
    this.requestHandler = requestHandler;
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
    console.info(`Running the group sync for ${directory.name}`);

    this.groups.setTenantAndProduct(directory.tenant, directory.product);

    const groups = await this.provider.getGroups(directory);

    for (const group of groups) {
      const { data: existingGroup } = await this.groups.get(group.id);

      // New group found, create it
      if (!existingGroup) {
        await this.createGroup(directory, group);
      }

      // Group info is updated, update it
      else if (isGroupUpdated(existingGroup, group)) {
        await this.updateGroup(directory, group);
      }
    }
  }

  // Create a group in the directory
  async createGroup(directory: Directory, group: Group) {
    console.info(`Creating group ${group.name} in ${directory.name}`);

    await this.handleRequest(directory, {
      method: 'POST',
      body: toSCIMPayload(group),
      resourceId: undefined,
    });
  }

  // Update a group in the directory
  async updateGroup(directory: Directory, group: Group) {
    console.info(`Updating group ${group.name} in ${directory.name}`);

    await this.handleRequest(directory, {
      method: 'PUT',
      body: toSCIMPayload(group),
      resourceId: group.id,
    });
  }

  // Call the request handler
  async handleRequest(directory: Directory, payload: HandleRequestParams) {
    const request: DirectorySyncRequest = {
      query: {},
      body: payload.body,
      resourceType: 'groups',
      method: payload.method,
      directoryId: directory.id,
      apiSecret: directory.scim.secret,
      resourceId: payload.resourceId,
    };

    console.info(`New request for ${directory.name} - ${payload.method} - ${payload.resourceId}`);

    await this.requestHandler.handle(request);
  }

  // // Delete groups from the directory
  // async delete(directory: Directory, groupsToBeRemoved: Group[]) {
  //   if (groupsToBeRemoved.length === 0) {
  //     return;
  //   }

  //   this.groups.setTenantAndProduct(directory.tenant, directory.product);

  //   for (const group of groupsToBeRemoved) {
  //     console.info(`Deleting group ${group.name} in ${directory.name}`);
  //     await this.groups.delete(group.id);
  //     await sendEvent('group.deleted', { directory, group }, this.callback);
  //   }
  // }

  // // Sync group members from Google to the directory
  // async syncGroupMembers(directory: Directory) {
  //   const groups = await this.provider.getGroups(directory);

  //   for (const group of groups) {
  //     if (group.name !== 'Staff') {
  //       continue;
  //     }

  //     const members = await this.provider.getUsersInGroup(directory, group);
  //     console.log(`Got ${members.length} members in ${group.name} group`);

  //     console.log('members', members);
  //   }
  // }
}

// Map to SCIM payload
const toSCIMPayload = (group: Group): SCIMGroupSchema => {
  return {
    ...group.raw,
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
    displayName: group.name,
    groupId: group.id,
  };
};

// Find if a group is updated by comparing the name
const isGroupUpdated = (existingGroup: Group, groupFromProvider: Group) => {
  return existingGroup.name !== groupFromProvider.name;
};

// Compare existing groups with groups from provider and find the groups that were deleted
const compareAndFindDeletedGroups = (existingGroup: Group[], groupFromProvider: Group[]) => {
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
};
