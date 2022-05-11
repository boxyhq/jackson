import type { Storable, Group } from '../typings';

export class GroupsController {
  private _db: any;
  private _store: Storable | null = null;

  constructor({ db }: { db: any }) {
    this._db = db;
  }

  // Return the database store
  private store(): Storable {
    return this._store as Storable;
  }

  // Create the store using the tenant and product
  public with(tenant: string, product: string): GroupsController {
    const namespace = `groups:${tenant}:${product}`;

    this._store = this._store || this._db.store(namespace);

    return this;
  }

  // Create a new group
  public async create(param: { id: string; name: string; raw: object }): Promise<void> {
    const { id, name, raw } = param;

    await this.store().put(id, { id, name, raw });
  }

  // Get a group by id
  public async get(id: string): Promise<Group | null> {
    const user: Group = await this.store().get(id);

    return user || null;
  }

  // Update the group data
  public async update(
    id: string,
    param: {
      name: string;
      raw: object;
    }
  ): Promise<Group> {
    const { name, raw } = param;

    await this.store().put(id, { name, raw });

    return {
      id,
      name,
      raw,
    };
  }

  // Delete a group by id
  public async delete(id: string): Promise<void> {
    await this.store().delete(id);
  }
}
