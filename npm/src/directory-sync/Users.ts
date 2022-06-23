import type { User, DatabaseStore } from '../typings';
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
  }): Promise<User> {
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

    return user;
  }

  // Get a user by id
  public async get(id: string): Promise<User | null> {
    const user = await this.store('users').get(id);

    return user || null;
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
  ): Promise<User> {
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

    return user;
  }

  // Delete a user by id
  public async delete(id: string): Promise<void> {
    await this.store('users').delete(id);
  }

  // Get all users in a directory
  public async list({ pageOffset, pageLimit }: { pageOffset?: number; pageLimit?: number }): Promise<User[]> {
    return (await this.store('users').getAll(pageOffset, pageLimit)) as User[];
  }

  // Search users by userName
  public async search(userName: string): Promise<User[]> {
    return (await this.store('users').getByIndex({ name: 'userName', value: userName })) as User[];
  }

  // Clear all the users
  public async clear() {
    const users = await this.list({});

    await Promise.all(
      users.map(async (user) => {
        return this.delete(user.id);
      })
    );
  }
}
