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
import {
  compareAndFindDeletedMembers,
  compareAndFindNewMembers,
  toGroupMembershipSCIMPayload,
} from './utils';

interface SyncGroupMembersParams {
  groupController: IGroups;
  provider: IDirectoryProvider;
  requestHandler: IRequestHandler;
  callback: EventCallback;
  directory: Directory;
}

type HandleRequestParams = Pick<DirectorySyncRequest, 'method' | 'body' | 'resourceId'>;

export class SyncGroupMembers {
  private groupController: IGroups;
  private provider: IDirectoryProvider;
  private requestHandler: IRequestHandler;
  private callback: EventCallback;
  private directory: Directory;

  constructor({ directory, groupController, requestHandler, provider, callback }: SyncGroupMembersParams) {
    this.groupController = groupController;
    this.provider = provider;
    this.requestHandler = requestHandler;
    this.callback = callback;
    this.directory = directory;
  }

  async sync() {
    this.groupController.setTenantAndProduct(this.directory.tenant, this.directory.product);

    const groups = await this.provider.getGroups(this.directory);

    if (!groups || groups.length === 0) {
      return;
    }

    for (const group of groups) {
      const membersFromProvider = await this.provider.getGroupMembers(this.directory, group);
      const membersFromDB = await this.groupController.getAllUsers(group.id);

      const idsFromDB = _.map(membersFromDB, 'user_id');
      const idsFromProvider = _.map(membersFromProvider, 'id');

      const deletedMembers = compareAndFindDeletedMembers(idsFromDB, idsFromProvider);
      const newMembers = compareAndFindNewMembers(idsFromDB, idsFromProvider);

      if (deletedMembers && deletedMembers.length > 0) {
        await this.deleteMembers(group, deletedMembers);
      }

      if (newMembers && newMembers.length > 0) {
        await this.addMembers(group, newMembers);
      }
    }
  }

  async addMembers(group: Group, memberIds: string[]) {
    await this.handleRequest({
      method: 'PATCH',
      body: toGroupMembershipSCIMPayload(memberIds),
      resourceId: group.id,
    });
  }

  async deleteMembers(group: Group, memberIds: string[]) {
    await this.handleRequest({
      method: 'PATCH',
      body: toGroupMembershipSCIMPayload(memberIds),
      resourceId: group.id,
    });
  }

  async handleRequest(payload: HandleRequestParams) {
    const request: DirectorySyncRequest = {
      query: {},
      body: payload.body,
      resourceType: 'groups',
      method: payload.method,
      directoryId: this.directory.id,
      apiSecret: this.directory.scim.secret,
      resourceId: payload.resourceId,
    };

    await this.requestHandler.handle(request, this.callback);
  }
}
