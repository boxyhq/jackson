import type { Directory, Group, User } from '../../typings';

export interface Options {
  /**
   * Token to specify next page in the list
   */
  nextPageToken?: string | null;
}

export interface IDirectoryProvider {
  /**
   * Get all directories for the provider
   */
  getDirectories(): Promise<Directory[]>;

  /**
   * Get all groups for a directory
   * @param directory
   * @param options
   */
  getGroups(directory: Directory): Promise<Group[]>;

  /**
   * Get all users for a directory
   * @param directory
   */
  getUsers(directory: Directory): Promise<User[]>;

  /**
   * Get all users for a group
   * @param directory
   * @param group
   */
  getUsersInGroup(directory: Directory, group: Group): Promise<User[]>;
}
