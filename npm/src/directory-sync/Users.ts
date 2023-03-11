import type { User, DatabaseStore, ApiError, PaginationParams } from '../typings';
import { apiError, JacksonError } from '../controller/error';
import { Base } from './Base';
import { keyFromParts } from '../db/utils';

type CreateUserPayload = {
  directoryId: string;
  first_name: string;
  last_name: string;
  email: string;
  active: boolean;
  raw: any;
};

const indexNames = {
  directoryIdUsername: 'directoryIdUsername',
  directoryId: 'directoryId',
};

export class Users extends Base {
  constructor({ db }: { db: DatabaseStore }) {
    super({ db });
  }

  // Create a new user
  public async create({
    directoryId,
    first_name,
    last_name,
    email,
    active,
    raw,
  }: CreateUserPayload): Promise<{ data: User | null; error: ApiError | null }> {
    try {
      const id = this.createId();

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
  public async get(id: string): Promise<{ data: User | null; error: ApiError | null }> {
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
  ): Promise<{ data: User | null; error: ApiError | null }> {
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
  public async delete(id: string): Promise<{ data: null; error: ApiError | null }> {
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
  public async search(
    userName: string,
    directoryId: string
  ): Promise<{ data: User[] | null; error: ApiError | null }> {
    try {
      const users = (
        await this.store('users').getByIndex({
          name: indexNames.directoryIdUsername,
          value: keyFromParts(directoryId, userName),
        })
      ).data;

      return { data: users, error: null };
    } catch (err: any) {
      return apiError(err);
    }
  }

  // Get all users in a directory
  public async getAll({
    pageOffset,
    pageLimit,
    directoryId,
  }: PaginationParams & {
    directoryId?: string;
  } = {}): Promise<{
    data: User[] | null;
    error: ApiError | null;
  }> {
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

  // Clear all the users
  // This is used for testing
  public async clear() {
    const { data: users, error } = await this.getAll();

    if (!users || error) {
      return;
    }

    await Promise.all(
      users.map(async (user) => {
        return this.delete(user.id);
      })
    );
  }
}
