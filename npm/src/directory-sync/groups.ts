import { GroupsController } from '../controller/groups';
import { DirectoryConfig } from './config';

export class DirectoryGroups {
  private groups: InstanceType<typeof GroupsController>;
  private directory: InstanceType<typeof DirectoryConfig>;

  constructor({ directory, groups }) {
    this.groups = groups;
    this.directory = directory;
  }

  public async create({ directory: directoryId, data }: { directory: string; data: any }) {
    console.log({ directory: directoryId, data });
  }
}
