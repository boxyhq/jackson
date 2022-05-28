import type { Storable, User, DatabaseStore } from '../typings';
import { v4 as uuidv4 } from 'uuid';

export class UsersController {
  private db: DatabaseStore;
  private _store: Storable | null = null;

  constructor({ db }: { db: DatabaseStore }) {
    this.db = db;
    console.log('UsersController');
  }

  // Return the database store
  private store(): Storable {
    return this._store as Storable;
  }

  // Create the store using the tenant and product
  public with(tenant: string, product: string): UsersController {
    this._store = this._store || this.db.store(`users:${tenant}:${product}`);

    return this;
  }

  // Create a new user
  public async create(param: {
    first_name: string;
    last_name: string;
    email: string;
    raw: any;
  }): Promise<User> {
    const { first_name, last_name, email, raw } = param;

    const id = uuidv4();

    raw['id'] = id;

    const user = { id, first_name, last_name, email, raw };

    await this.store().put(id, user);

    return user;
  }

  // Get a user by id
  public async get(id: string): Promise<User | null> {
    const user: User = await this.store().get(id);

    return user || null;
  }

  // Update the user data
  public async update(
    id: string,
    param: {
      first_name: string;
      last_name: string;
      email: string;
      raw: object;
    }
  ): Promise<User> {
    const { first_name, last_name, email, raw } = param;

    raw['id'] = id;

    const user = { id, first_name, last_name, email, raw };

    await this.store().put(id, user);

    return user;
  }

  // Delete a user by id
  public async delete(id: string): Promise<void> {
    await this.store().delete(id);
  }
}
