import type { User, DatabaseStore, ApiError } from '../typings';
import { JacksonError } from '../controller/error';
import { Base } from './Base';

export class Users extends Base {
  constructor({ db }: { db: DatabaseStore }) {
    super({ db });
  }

  // Create a new user
  public async create(param: {
    first_name: string;
    last_name: string;
    email: string;
    active: boolean;
    raw: any;
  }): Promise<{ data: User | null; error: ApiError | null }> {
    try {
      const { first_name, last_name, email, active, raw } = param;

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

      await this.store('users').put(id, user, {
        name: 'userName',
        value: email,
      });

      return { data: user, error: null };
    } catch (err: any) {
      const { message, statusCode = 500 } = err;

      return { data: null, error: { message, code: statusCode } };
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
      const { message, statusCode = 500 } = err;

      return { data: null, error: { message, code: statusCode } };
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
      const { message, statusCode = 500 } = err;

      return { data: null, error: { message, code: statusCode } };
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
      const { message, statusCode = 500 } = err;

      return { data: null, error: { message, code: statusCode } };
    }
  }

  // Get all users in a directory
  public async list({
    pageOffset,
    pageLimit,
  }: {
    pageOffset?: number;
    pageLimit?: number;
  }): Promise<{ data: User[] | null; error: ApiError | null }> {
    try {
      const users = (await this.store('users').getAll(pageOffset, pageLimit)) as User[];

      return { data: users, error: null };
    } catch (err: any) {
      const { message, statusCode = 500 } = err;

      return { data: null, error: { message, code: statusCode } };
    }
  }

  // Search users by userName
  public async search(userName: string): Promise<{ data: User[] | null; error: ApiError | null }> {
    try {
      const users = (await this.store('users').getByIndex({ name: 'userName', value: userName })) as User[];

      return { data: users, error: null };
    } catch (err: any) {
      const { message, statusCode = 500 } = err;

      return { data: null, error: { message, code: statusCode } };
    }
  }

  // Clear all the users
  public async clear() {
    const { data: users, error } = await this.list({});

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
