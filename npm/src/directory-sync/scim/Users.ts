import type { User, DatabaseStore, PaginationParams, Response } from '../../typings';
import { apiError, JacksonError } from '../../controller/error';
import { Base } from './Base';
import { keyFromParts } from '../../db/utils';
import { indexNames } from './utils';

/**
 * @swagger
 * definitions:
 *   User:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *          description: User ID
 *        first_name:
 *          type: string
 *          description: First name
 *        last_name:
 *          type: string
 *          description: Last name
 *        email:
 *          type: string
 *          description: Email address
 *        active:
 *          type: boolean
 *          description: Indicates whether the user is active or not
 *        raw:
 *          type: object
 *          description: Raw user attributes from the Identity Provider
 */
export class Users extends Base {
  constructor({ db }: { db: DatabaseStore }) {
    super({ db });
  }

  // Create a new user
  public async create(user: User & { directoryId: string }): Promise<Response<User>> {
    const { directoryId, id, email } = user;

    try {
      await this.store('users').put(
        id,
        user,
        {
          name: indexNames.directoryIdUsername,
          value: keyFromParts(directoryId, email),
        },
        {
          name: indexNames.directoryId,
          value: directoryId,
        }
      );

      return { data: user, error: null };
    } catch (err: any) {
      return apiError(err);
    }
  }

  /**
   * @swagger
   * /api/v1/dsync/users/{userId}:
   *   get:
   *     summary: Get user by id from a directory
   *     parameters:
   *       - $ref: '#/parameters/tenant'
   *       - $ref: '#/parameters/product'
   *       - name: userId
   *         description: User ID
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
   *           $ref: '#/definitions/User'
   */
  public async get(id: string): Promise<Response<User>> {
    try {
      const user = await this.store('users').get(id);

      if (user === null) {
        throw new JacksonError('User not found', 404);
      }

      return { data: user, error: null };
    } catch (err: any) {
      return apiError(err);
    }
  }

  // Update the user data
  public async update(id: string, user: User): Promise<Response<User>> {
    const { raw } = user;

    raw['id'] = id;

    const updatedUser = {
      ...user,
      raw,
    };

    try {
      await this.store('users').put(id, updatedUser);
      return { data: updatedUser, error: null };
    } catch (err: any) {
      return apiError(err);
    }
  }

  // Delete a user by id
  public async delete(id: string): Promise<Response<null>> {
    try {
      const { data, error } = await this.get(id);

      if (error || !data) {
        throw error;
      }

      await this.store('users').delete(id);

      return { data: null, error: null };
    } catch (err: any) {
      return apiError(err);
    }
  }

  // Search users by userName
  public async search(userName: string, directoryId: string): Promise<Response<User[]>> {
    try {
      const { data: users } = await this.store('users').getByIndex({
        name: indexNames.directoryIdUsername,
        value: keyFromParts(directoryId, userName),
      });

      return { data: users, error: null };
    } catch (err: any) {
      return apiError(err);
    }
  }

  /**
   * @swagger
   * /api/v1/dsync/users:
   *   get:
   *     summary: Get users from a directory
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
   *         content:
   *           application/json:
   *              schema:
   *                type: object
   *                properties:
   *                  data:
   *                    type: array
   *                    items:
   *                      $ref: '#/definitions/User'
   *                  pageToken:
   *                    type: string
   *                    description: token for pagination
   */
  public async getAll({
    pageOffset,
    pageLimit,
    directoryId,
  }: PaginationParams & {
    directoryId?: string;
  } = {}): Promise<Response<User[]>> {
    try {
      let users: User[] = [];

      // Filter by directoryId
      if (directoryId) {
        users = (
          await this.store('users').getByIndex(
            {
              name: indexNames.directoryId,
              value: directoryId,
            },
            pageOffset,
            pageLimit
          )
        ).data as User[];
      } else {
        users = (await this.store('users').getAll(pageOffset, pageLimit)).data;
      }

      return { data: users, error: null };
    } catch (err: any) {
      return apiError(err);
    }
  }

  // Delete all users from a directory
  async deleteAll(directoryId: string) {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { data: users } = await this.store('users').getByIndex(
        {
          name: indexNames.directoryId,
          value: directoryId,
        },
        0,
        this.bulkDeleteBatchSize
      );

      if (!users || users.length === 0) {
        break;
      }

      await this.store('users').deleteMany(users.map((user) => user.id));
    }
  }
}
