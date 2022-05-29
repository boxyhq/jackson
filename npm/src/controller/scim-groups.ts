import type { SCIMConfig, SCIMEventType } from '../typings';
import { SCIMController } from './scim';
import { sendEvent } from '../scim';
import { GroupsController } from './groups';

export class SCIMGroups {
  private directory: SCIMConfig | null;
  private groups: InstanceType<typeof GroupsController>;
  private config: InstanceType<typeof SCIMController>;

  constructor({ scimController, groupsController }) {
    this.groups = groupsController;
    this.config = scimController;
    this.directory = null;
  }

  public async getDirectory(directoryId: string): Promise<SCIMConfig> {
    return this.directory || (this.directory = await this.config.get(directoryId));
  }

  public async create({ directory: directoryId, data }: { directory: string; data: any }) {
    await this.groups.create({ name: data.body.displayName, members: data.body.members, raw: data.body });
    console.log('create group', data, directoryId);
  }
}
