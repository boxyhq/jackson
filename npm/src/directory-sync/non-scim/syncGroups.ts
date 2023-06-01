import _ from 'lodash';

import type {
  Directory,
  IGroups,
  Group,
  IRequestHandler,
  DirectorySyncRequest,
  EventCallback,
  IDirectoryProvider,
} from '../../typings';
import { compareAndFindDeletedGroups, isGroupUpdated, toGroupSCIMPayload } from './utils';

interface SyncGroupsParams {
  groupController: IGroups;
  provider: IDirectoryProvider;
  requestHandler: IRequestHandler;
  callback: EventCallback;
  directory: Directory;
}

type HandleRequestParams = Pick<DirectorySyncRequest, 'method' | 'body' | 'resourceId'>;

export class SyncGroups {
  private groupController: IGroups;
  private provider: IDirectoryProvider;
  private requestHandler: IRequestHandler;
  private callback: EventCallback;
  private directory: Directory;

  constructor({ directory, groupController, callback, requestHandler, provider }: SyncGroupsParams) {
    this.groupController = groupController;
    this.provider = provider;
    this.requestHandler = requestHandler;
    this.callback = callback;
    this.directory = directory;
  }

  async sync() {
    console.log(`Syncing groups for directory ${this.directory.id}`);

    this.groupController.setTenantAndProduct(this.directory.tenant, this.directory.product);

    const groups = await this.provider.getGroups(this.directory);

    // Create or update groups
    for (const group of groups) {
      const { data: existingGroup } = await this.groupController.get(group.id);

      if (!existingGroup) {
        await this.createGroup(this.directory, group);
      } else if (isGroupUpdated(existingGroup, group, this.provider.groupFieldsToExcludeWhenCompare)) {
        await this.updateGroup(this.directory, group);
      }
    }

    // Delete groups that are not in the directory anymore
    const { data: existingGroups } = await this.groupController.getAll({ directoryId: this.directory.id });

    await this.deleteGroups(this.directory, compareAndFindDeletedGroups(existingGroups, groups));
  }

  async createGroup(directory: Directory, group: Group) {
    console.info('Creating group: ', _.pick(group, ['id', 'name']));

    await this.handleRequest(directory, {
      method: 'POST',
      body: toGroupSCIMPayload(group),
      resourceId: undefined,
    });
  }

  async updateGroup(directory: Directory, group: Group) {
    console.info('Updating group: ', _.pick(group, ['id', 'name']));

    await this.handleRequest(directory, {
      method: 'PUT',
      body: toGroupSCIMPayload(group),
      resourceId: group.id,
    });
  }

  async deleteGroups(directory: Directory, groups: Group[]) {
    for (const group of groups) {
      console.info('Deleting group: ', _.pick(group, ['id', 'name']));

      await this.handleRequest(directory, {
        method: 'DELETE',
        body: toGroupSCIMPayload(group),
        resourceId: group.id,
      });
    }
  }

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

    await this.requestHandler.handle(request, this.callback);
  }
}
