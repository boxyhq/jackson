import type { IUsersController, Storable, User } from '../typings';

export class UsersController implements IUsersController {
  private db: any;
  private _store: Storable | null = null;

  constructor({ db }: { db: any }) {
    this.db = db;
  }

  private store(): Storable {
    return this._store as Storable;
  }

  public with(tenant: string, product: string): IUsersController {
    const namespace = `users:${tenant}:${product}`;

    this._store = this._store || this.db.store(namespace);

    return this;
  }

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

  public async get(id: string): Promise<User | null> {
    const user: User = await this.store().get(id);

    return user || null;
  }

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
}
