import { GroupsController } from '../controller/groups';
import { DirectoryConfig } from './config';
import { sendEvent } from './events';

export class DirectoryGroups {
  private groups: InstanceType<typeof GroupsController>;
  private directory: InstanceType<typeof DirectoryConfig>;

  constructor({ directory, groups }) {
    this.groups = groups;
    this.directory = directory;
  }

  public async create({ directory: directoryId, data }: { directory: string; data: any }) {
    const { tenant, product, webhook } = await this.directory.get(directoryId);
    const { displayName, members } = data.body;

    const group = await this.groups.with(tenant, product).create({
      name: displayName,
    });

    if (members) {
      await this.addUsers(group.id, members);
    }

    sendEvent({
      action: 'group.created',
      payload: {
        tenant,
        product,
        data: group,
      },
      options: {
        webhook,
      },
    });

    return {
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
      id: group.id,
      displayName: group.name,
      members: members ?? [],
    };
  }

  public async get({ directory: directoryId, data }: { directory: string; data: any }) {
    const { tenant, product } = await this.directory.get(directoryId);
    const { group_id: groupId } = data;

    const group = await this.groups.with(tenant, product).get(groupId);

    return {
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
      id: group?.id,
      displayName: group?.name,
      members: await this.getUsers(groupId),
    };
  }

  public async update({ directory: directoryId, data }: { directory: string; data: any }) {
    const { tenant, product, webhook } = await this.directory.get(directoryId);
    const {
      group_id: groupId,
      body: { displayName, members },
    } = data;

    const group = await this.groups.with(tenant, product).update(groupId, {
      name: displayName,
    });

    if (members) {
      await this.addOrRemoveUsers(groupId, members);
    }

    sendEvent({
      action: 'group.updated',
      payload: {
        tenant,
        product,
        data: group,
      },
      options: {
        webhook,
      },
    });

    return {
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
      id: group.id,
      displayName: group.name,
      members: await this.getUsers(groupId),
    };
  }

  public async delete({ directory: directoryId, data }: { directory: string; data: any }) {
    const { tenant, product, webhook } = await this.directory.get(directoryId);
    const { group_id: groupId } = data;

    const group = await this.groups.with(tenant, product).get(groupId);

    await this.groups.with(tenant, product).delete(groupId);

    await this.removeUsers(groupId);

    sendEvent({
      action: 'group.deleted',
      payload: {
        tenant,
        product,
        data: group,
      },
      options: {
        webhook,
      },
    });

    return {};
  }

  private async addUsers(groupId: string, members: { value: string }[]): Promise<void> {
    for (const member of members) {
      await this.groups.addUser(groupId, member.value);
    }
  }

  private async removeUsers(groupId: string): Promise<void> {
    const users = await this.groups.getUsers(groupId);

    if (users.length === 0) {
      return;
    }

    for (const user of users) {
      await this.groups.removeUser(groupId, user.user_id);
    }
  }

  private async getUsers(groupId: string): Promise<{ value: string }[]> {
    const users = await this.groups.getUsers(groupId);

    return users.map((user) => ({
      value: user.user_id,
    }));
  }

  private async addOrRemoveUsers(groupId: string, members: { value: string }[]): Promise<void> {
    const users = await this.groups.getUsers(groupId);

    const usersToAdd = members.filter((member) => !users.some((user) => user.user_id === member.value));
    const usersToRemove = users.filter((user) => !members.some((member) => member.value === user.user_id));

    for (const user of usersToAdd) {
      await this.groups.addUser(groupId, user.value);
    }

    for (const user of usersToRemove) {
      await this.groups.removeUser(groupId, user.user_id);
    }
  }
}
