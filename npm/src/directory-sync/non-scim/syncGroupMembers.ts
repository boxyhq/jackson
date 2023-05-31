import _ from 'lodash';

import type { IDirectoryProvider } from './types';
import type {
  Directory,
  IDirectoryConfig,
  IGroups,
  Group,
  IRequestHandler,
  DirectorySyncRequest,
} from '../../typings';
import {
  compareAndFindDeletedMembers,
  compareAndFindNewMembers,
  toGroupMembershipSCIMPayload,
} from './utils';

interface SyncGroupMembersParams {
  groups: IGroups;
  provider: IDirectoryProvider;
  directories: IDirectoryConfig;
  requestHandler: IRequestHandler;
}

type HandleRequestParams = Pick<DirectorySyncRequest, 'method' | 'body' | 'resourceId'>;

export class SyncGroupMembers {
  private groups: IGroups;
  private provider: IDirectoryProvider;
  private requestHandler: IRequestHandler;

  constructor({ groups, requestHandler, provider }: SyncGroupMembersParams) {
    this.groups = groups;
    this.provider = provider;
    this.requestHandler = requestHandler;
  }

  async sync() {
    const directories = await this.provider.getDirectories();

    for (const directory of directories) {
      await this.syncMembers(directory);
    }
  }

  async syncMembers(directory: Directory) {
    this.groups.setTenantAndProduct(directory.tenant, directory.product);

    const groups = await this.provider.getGroups(directory);

    if (!groups || groups.length === 0) {
      return;
    }

    for (const group of groups) {
      const membersFromProvider = await this.provider.getGroupMembers(directory, group);
      const membersFromDB = await this.groups.getAllUsers(group.id);

      const idsFromDB = _.map(membersFromDB, 'user_id');
      const idsFromProvider = _.map(membersFromProvider, 'id');

      const deletedMembers = compareAndFindDeletedMembers(idsFromDB, idsFromProvider);
      const newMembers = compareAndFindNewMembers(idsFromDB, idsFromProvider);

      if (deletedMembers && deletedMembers.length > 0) {
        await this.deleteMembers(directory, group, deletedMembers);
      }

      if (newMembers && newMembers.length > 0) {
        await this.addMembers(directory, group, newMembers);
      }
    }
  }

  async addMembers(directory: Directory, group: Group, memberIds: string[]) {
    await this.handleRequest(directory, {
      method: 'PATCH',
      body: toGroupMembershipSCIMPayload(memberIds),
      resourceId: group.id,
    });
  }

  async deleteMembers(directory: Directory, group: Group, memberIds: string[]) {
    await this.handleRequest(directory, {
      method: 'PATCH',
      body: toGroupMembershipSCIMPayload(memberIds),
      resourceId: group.id,
    });
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

    console.info(`Group membership request: ${payload.method} / ${payload.resourceId}`);

    await this.requestHandler.handle(request);
  }
}
