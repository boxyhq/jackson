import type { Group, DatabaseStore, ApiError, PaginationParams } from '../typings';
import * as dbutils from '../db/utils';
import { apiError, JacksonError } from '../controller/error';
import { Base } from './Base';

const indexNames = {
  directoryIdDisplayname: 'directoryIdDisplayname',
  directoryId: 'directoryId',
};

export class Groups extends Base {
  constructor({ db }: { db: DatabaseStore }) {
    super({ db });
  }

  // Create a new group
  public async create({
    directoryId,
    name,
    raw,
  }: {
    directoryId: string;
    name: string;
    raw: any;
  }): Promise<{ data: Group | null; error: ApiError | null }> {
    try {
      const id = this.createId();

      raw['id'] = id;

      const group: Group = {
        id,
        name,
        raw,
      };

      await this.store('groups').put(
        id,
        group,
        {
          name: indexNames.directoryIdDisplayname,
          value: dbutils.keyFromParts(directoryId, name),
        },
        {
          name: indexNames.directoryId,
          value: directoryId,
        }
      );

      return { data: group, error: null };
    } catch (err: any) {
      return apiError(err);
    }
  }

  // Get a group by id
  public async get(id: string): Promise<{ data: Group | null; error: ApiError | null }> {
    try {
      const group = await this.store('groups').get(id);

      if (!group) {
        throw new JacksonError(`Group with id ${id} not found.`, 404);
      }

      return { data: group, error: null };
    } catch (err: any) {
      return apiError(err);
    }
  }

  // Update the group data
  public async update(
    id: string,
    param: {
      name: string;
      raw: any;
    }
  ): Promise<{ data: Group | null; error: ApiError | null }> {
    try {
      const { name, raw } = param;

      const group: Group = {
        id,
        name,
        raw,
      };

      await this.store('groups').put(id, group);

      return { data: group, error: null };
    } catch (err: any) {
      return apiError(err);
    }
  }

  // Delete a group by id
  public async delete(id: string): Promise<{ data: null; error: ApiError | null }> {
    try {
      const { data, error } = await this.get(id);

      if (error || !data) {
        throw error;
      }

      await this.store('groups').delete(id);

      return { data: null, error: null };
    } catch (err: any) {
      return apiError(err);
    }
  }

  // Get all users in a group
  public async getAllUsers(groupId: string): Promise<{ user_id: string }[]> {
    const users: { user_id: string }[] = await this.store('members').getByIndex({
      name: 'groupId',
      value: groupId,
    });

    if (users.length === 0) {
      return [];
    }

    return users;
  }

  // Add a user to a group
  public async addUserToGroup(groupId: string, userId: string) {
    const id = dbutils.keyDigest(dbutils.keyFromParts(groupId, userId));

    await this.store('members').put(
      id,
      {
        group_id: groupId,
        user_id: userId,
      },
      {
        name: 'groupId',
        value: groupId,
      }
    );
  }

  // Remove a user from a group
  public async removeUserFromGroup(groupId: string, userId: string) {
    const id = dbutils.keyDigest(dbutils.keyFromParts(groupId, userId));

    await this.store('members').delete(id);
  }

  // Remove all users from a group
  public async removeAllUsers(groupId: string) {
    const users = await this.getAllUsers(groupId);

    if (users.length === 0) {
      return;
    }

    for (const user of users) {
      await this.removeUserFromGroup(groupId, user.user_id);
    }
  }

  // Check if a user is a member of a group
  public async isUserInGroup(groupId: string, userId: string): Promise<boolean> {
    const id = dbutils.keyDigest(dbutils.keyFromParts(groupId, userId));

    return !!(await this.store('members').get(id));
  }

  // Search groups by displayName
  public async search(
    displayName: string,
    directoryId: string
  ): Promise<{ data: Group[] | null; error: ApiError | null }> {
    try {
      const groups = await this.store('groups').getByIndex({
        name: indexNames.directoryIdDisplayname,
        value: dbutils.keyFromParts(directoryId, displayName),
      });

      return { data: groups, error: null };
    } catch (err: any) {
      return apiError(err);
    }
  }

  // Get all groups in a directory
  public async getAll({
    pageOffset,
    pageLimit,
    directoryId,
  }: PaginationParams & {
    directoryId?: string;
  } = {}): Promise<{
    data: Group[] | null;
    error: ApiError | null;
  }> {
    try {
      let groups: Group[] = [];

      // Filter by directoryId
      if (directoryId) {
        groups = await this.store('groups').getByIndex(
          {
            name: indexNames.directoryId,
            value: directoryId,
          },
          pageOffset,
          pageLimit
        );
      } else {
        groups = await this.store('groups').getAll(pageOffset, pageLimit);
      }

      return { data: groups, error: null };
    } catch (err: any) {
      return apiError(err);
    }
  }
}
