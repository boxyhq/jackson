import type { Directory, Group } from '../../typings';

export interface IGroupSync {
  getDirectories(): Promise<Directory[]>;
  getGroups(directory: Directory): Promise<Group[]>;
}
