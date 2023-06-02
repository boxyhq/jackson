import { randomUUID } from 'crypto';

import type { User, DatabaseStore, ApiError, PaginationParams, Response } from '../../typings';
import { apiError, JacksonError } from '../../controller/error';
import { Base } from './Base';
import { keyFromParts } from '../../db/utils';

const indexNames = {
  directoryIdUsername: 'directoryIdUsername',
  directoryId: 'directoryId',
};

interface CreateUserParams {
  directoryId: string;
  first_name: string;
  last_name: string;
  email: string;
  active: boolean;
  raw: any;
  id?: string;
}

export class Users extends Base {
  constructor({ db }: { db: DatabaseStore }) {
    super({ db });
  }

  // Create a new user
  public async create(params: CreateUserParams): Promise<Response<User>> {
    const { directoryId, first_name, last_name, email, active, raw, id: userId } = params;

    try {
      const id = userId || randomUUID();

      raw['id'] = id;

      const user = {
        id,
        first_name,
        last_name,
        email,
        active,
        raw,
      };

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

  // Get a user by id
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
  public async update(
    id: string,
    param: {
      first_name: string;
      last_name: string;
      email: string;
      active: boolean;
      raw: object;
    }
  ): Promise<Response<User>> {
    try {
      const { first_name, last_name, email, active, raw } = param;

      raw['id'] = id;

      const user = {
        id,
        first_name,
        last_name,
        email,
        active,
        raw,
      };

      await this.store('users').put(id, user);

      return { data: user, error: null };
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

  // Get all users in a directory paginated
  public async getAll(params: { directoryId: string } & PaginationParams): Promise<Response<User[]>> {
    const { pageOffset, pageLimit, directoryId } = params;

    try {
      const { data: users } = await this.store('users').getByIndex(
        {
          name: indexNames.directoryId,
          value: directoryId,
        },
        pageOffset,
        pageLimit
      );

      return { data: users, error: null };
    } catch (err: any) {
      return apiError(err);
    }
  }

  // Delete all users from a directory
  async deleteAll(directoryId: string) {
    const index = {
      name: indexNames.directoryId,
      value: directoryId,
    };

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { data: users } = await this.store('users').getByIndex(index, 0, this.bulkDeleteBatchSize);

      if (!users || users.length === 0) {
        break;
      }

      await this.store('users').deleteMany(users.map((user) => user.id));
    }
  }
}
