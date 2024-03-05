import { randomUUID } from 'crypto';

import type { Group, DatabaseStore, PaginationParams, Response, GroupMembership } from '../../typings';
import * as dbutils from '../../db/utils';
import { apiError, JacksonError } from '../../controller/error';
import { Base } from './Base';

const indexNames = {
  directoryIdDisplayname: 'directoryIdDisplayname',
  directoryId: 'directoryId',
};

interface CreateGroupParams {
  directoryId: string;
  name: string;
  raw: any;
  id?: string;
}

/**
 * @swagger
 * definitions:
 *   Group:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *          description: Group ID
 *        name:
 *          type: string
 *          description: Group name
 *        raw:
 *          type: object
 *          description: Raw group attributes from the Identity Provider
 */
export class Groups extends Base {
  constructor({ db }: { db: DatabaseStore }) {
    super({ db });
  }

  // Create a new group
  public async create(params: CreateGroupParams): Promise<Response<Group>> {
    const { directoryId, name, raw, id: groupId } = params;

    const id = groupId || randomUUID();

    raw['id'] = id;

    const group: Group = {
      id,
      name,
      raw,
    };

    try {
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

  /**
   * @swagger
   * /api/v1/dsync/groups/{groupId}:
   *   get:
   *     summary: Get group by id from a directory
   *     parameters:
   *       - $ref: '#/parameters/tenant'
   *       - $ref: '#/parameters/product'
   *       - name: groupId
   *         description: Group ID
   *         in: path
   *         required: true
   *         type: string
   *     tags:
   *       - Directory Sync
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: Success
   *         schema:
   *           $ref: '#/definitions/Group'
   */
  public async get(id: string): Promise<Response<Group>> {
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
  ): Promise<Response<Group>> {
    const { name, raw } = param;

    const group: Group = {
      id,
      name,
      raw,
    };

    try {
      await this.store('groups').put(id, group);

      return { data: group, error: null };
    } catch (err: any) {
      return apiError(err);
    }
  }

  // Delete a group by id
  public async delete(id: string): Promise<Response<null>> {
    try {
      const { data, error } = await this.get(id);

      if (error || !data) {
        throw error;
      }

      await this.store('groups').delete(id);
      await this.removeAllUsers(id);

      return { data: null, error: null };
    } catch (err: any) {
      return apiError(err);
    }
  }

  // Add a user to a group
  public async addUserToGroup(groupId: string, userId: string) {
    const id = dbutils.keyDigest(dbutils.keyFromParts(groupId, userId));

    await this.store('members').put(
      id,
      {
        id: id,
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

  // Check if a user is a member of a group
  public async isUserInGroup(groupId: string, userId: string): Promise<boolean> {
    const id = dbutils.keyDigest(dbutils.keyFromParts(groupId, userId));

    return !!(await this.store('members').get(id));
  }

  // Search groups by displayName
  public async search(displayName: string, directoryId: string): Promise<Response<Group[]>> {
    try {
      const { data: groups } = await this.store('groups').getByIndex({
        name: indexNames.directoryIdDisplayname,
        value: dbutils.keyFromParts(directoryId, displayName),
      });

      return { data: groups, error: null };
    } catch (err: any) {
      return apiError(err);
    }
  }

  /**
   * @swagger
   * /api/v1/dsync/groups:
   *   get:
   *     summary: Get groups from a directory
   *     parameters:
   *       - $ref: '#/parameters/tenant'
   *       - $ref: '#/parameters/product'
   *       - $ref: '#/parameters/directoryId'
   *       - $ref: '#/parameters/pageOffset'
   *       - $ref: '#/parameters/pageLimit'
   *       - $ref: '#/parameters/pageToken'
   *     tags:
   *       - Directory Sync
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: Success
   *         schema:
   *           type: array
   *           items:
   *             $ref: '#/definitions/Group'
   */
  public async getAll(
    params: PaginationParams & {
      directoryId?: string;
    }
  ): Promise<Response<Group[]>> {
    const { pageOffset, pageLimit, directoryId } = params;

    try {
      let groups: Group[] = [];

      // Filter by directoryId
      if (directoryId) {
        const index = {
          name: indexNames.directoryId,
          value: directoryId,
        };

        groups = (await this.store('groups').getByIndex(index, pageOffset, pageLimit)).data;
      } else {
        groups = (await this.store('groups').getAll(pageOffset, pageLimit)).data;
      }

      return { data: groups, error: null };
    } catch (err: any) {
      return apiError(err);
    }
  }

  /**
   * Get members of a group paginated
   * @param groupId
   * @returns
   */
  public async getGroupMembers(
    parmas: { groupId: string } & PaginationParams
  ): Promise<Response<GroupMembership['user_id'][]>> {
    const { groupId, pageOffset, pageLimit } = parmas;

    try {
      const { data: members } = await this.store('members').getByIndex(
        {
          name: 'groupId',
          value: groupId,
        },
        pageOffset,
        pageLimit
      );

      return { data: members, error: null };
    } catch (err: any) {
      return apiError(err);
    }
  }

  // Delete all groups from a directory
  async deleteAll(directoryId: string) {
    const index = {
      name: indexNames.directoryId,
      value: directoryId,
    };

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { data: groups } = await this.store('groups').getByIndex(index, 0, this.bulkDeleteBatchSize);

      if (!groups || groups.length === 0) {
        break;
      }

      const keys = groups.map((group) => group.id);

      await this.store('groups').deleteMany(keys);

      for (const key of keys) {
        await this.removeAllUsers(key);
      }
    }
  }

  // Remove all users from a group
  public async removeAllUsers(groupId: string) {
    const index = {
      name: 'groupId',
      value: groupId,
    };

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { data: members } = await this.store('members').getByIndex(index, 0, this.bulkDeleteBatchSize);

      if (!members || members.length === 0) {
        break;
      }

      await this.store('members').deleteMany(members.map((member) => member.id));
    }
  }
}
