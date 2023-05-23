import type { Directory, Group, User } from '../../typings';

export interface IDirectoryProvider {
  /**
   * Get all directories for the provider
   */
  getDirectories(): Promise<Directory[]>;

  /**
   * Get all groups for a directory
   * @param directory
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
