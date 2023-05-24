import type { IDirectoryProvider } from './types';
import type {
  Directory,
  IDirectoryConfig,
  IGroups,
  Group,
  IRequestHandler,
  DirectorySyncRequest,
} from '../../typings';
import { isGroupUpdated, toGroupSCIMPayload } from './utils';

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

export class SyncGroups {
  private groups: IGroups;
  private provider: IDirectoryProvider;
  private requestHandler: IRequestHandler;

  constructor({ groups, requestHandler, provider }: SyncGroupsParams) {
    this.groups = groups;
    this.provider = provider;
    this.requestHandler = requestHandler;
  }

  async sync() {
    const directories = await this.provider.getDirectories();

    for (const directory of directories) {
      await this.syncGroup(directory);
    }
  }

  async syncGroup(directory: Directory) {
    console.info(`Running the group sync for ${directory.name}`);

    this.groups.setTenantAndProduct(directory.tenant, directory.product);

    const groups = await this.provider.getGroups(directory);

    for (const group of groups) {
      const { data: existingGroup } = await this.groups.get(group.id);

      if (!existingGroup) {
        await this.createGroup(directory, group);
      } else if (isGroupUpdated(existingGroup, group)) {
        await this.updateGroup(directory, group);
      }
    }
  }

  async createGroup(directory: Directory, group: Group) {
    console.info(`Creating group ${group.name} in ${directory.name}`);

    await this.handleRequest(directory, {
      method: 'POST',
      body: toGroupSCIMPayload(group),
      resourceId: undefined,
    });
  }

  async updateGroup(directory: Directory, group: Group) {
    console.info(`Updating group ${group.name} in ${directory.name}`);

    await this.handleRequest(directory, {
      method: 'PUT',
      body: toGroupSCIMPayload(group),
      resourceId: group.id,
    });
  }

  async handleRequest(directory: Directory, payload: HandleRequestParams) {
    console.info(`New group request for ${directory.name} - ${payload.method} - ${payload.resourceId}`);

    const request: DirectorySyncRequest = {
      query: {},
      body: payload.body,
      resourceType: 'groups',
      method: payload.method,
      directoryId: directory.id,
      apiSecret: directory.scim.secret,
      resourceId: payload.resourceId,
    };

    await this.requestHandler.handle(request);
  }
}
