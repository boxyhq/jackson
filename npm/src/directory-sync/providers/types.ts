import type { Directory, Group, User } from '../../typings';

export interface IDirectoryProvider {
  /**
   * Fields to exclude from the user payload while comparing the user to find if it is updated
   */
  userFieldsToExcludeWhenCompare?: string[];

  /**
   * Fields to exclude from the group payload while comparing the group to find if it is updated
   */
  groupFieldsToExcludeWhenCompare?: string[];

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
