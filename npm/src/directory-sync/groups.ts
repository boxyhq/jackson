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

    // If members are provided, add them to the group
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
      members: [],
    };
  }

  public async update({ directory: directoryId, data }: { directory: string; data: any }) {
    const { tenant, product, webhook } = await this.directory.get(directoryId);
    const { group_id: groupId, body } = data;

    const group = await this.groups.with(tenant, product).update(groupId, {
      name: body.displayName,
    });

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
      members: [],
    };
  }

  public async delete({ directory: directoryId, data }: { directory: string; data: any }) {
    const { tenant, product, webhook } = await this.directory.get(directoryId);
    const { group_id: groupId } = data;

    const group = await this.groups.with(tenant, product).get(groupId);

    await this.groups.with(tenant, product).delete(groupId);

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
}
