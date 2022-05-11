import type { Storable, User } from '../typings';

export class UsersController {
  private db: any;
  private _store: Storable | null = null;

  constructor({ db }: { db: any }) {
    this.db = db;
  }

  // Return the database store
  private store(): Storable {
    return this._store as Storable;
  }

  // Create the store using the tenant and product
  public with(tenant: string, product: string): UsersController {
    const namespace = `users:${tenant}:${product}`;

    this._store = this._store || this.db.store(namespace);

    return this;
  }

  // Create a new user
  public async create(param: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    raw: object;
  }): Promise<void> {
    const { id, first_name, last_name, email, raw } = param;

    await this.store().put(id, { id, first_name, last_name, email, raw });
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

    await this.store().put(id, { first_name, last_name, email, raw });

    return {
      id,
      first_name,
      last_name,
      email,
      raw,
    };
  }

  // Delete a user by id
  public async delete(id: string): Promise<void> {
    await this.store().delete(id);
  }
}
