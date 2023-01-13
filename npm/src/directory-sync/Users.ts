import type { User, DatabaseStore, ApiError, PaginationParams } from '../typings';
import { apiError, JacksonError } from '../controller/error';
import { Base } from './Base';

type CreateUserPayload = {
  directoryId: string;
  first_name: string;
  last_name: string;
  email: string;
  active: boolean;
  raw: any;
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
          name: 'userName',
          value: email,
        },
        {
          name: 'directoryId',
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
  public async search(userName: string): Promise<{ data: User[] | null; error: ApiError | null }> {
    try {
      const users = (await this.store('users').getByIndex({ name: 'userName', value: userName })) as User[];

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
        users = await this.store('users').getByIndex(
          {
            name: 'directoryId',
            value: directoryId,
          },
          pageOffset,
          pageLimit
        );
      } else {
        users = await this.store('users').getAll(pageOffset, pageLimit);
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
