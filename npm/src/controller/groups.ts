import type { Storable, Group, DatabaseStore } from '../typings';
import { v4 as uuidv4 } from 'uuid';

export class GroupsController {
  private _db: DatabaseStore;
  private _store: Storable | null = null;

  constructor({ db }: { db: DatabaseStore }) {
    this._db = db;
  }

  // Return the database store
  private store(): Storable {
    return this._store as Storable;
  }

  // Create the store using the tenant and product
  public with(tenant: string, product: string): GroupsController {
    this._store = this._store || this._db.store(`groups:${tenant}:${product}`);

    return this;
  }

  // Create a new group
  public async create(param: { name: string; members: []; raw: object }): Promise<Group> {
    const { name, members, raw } = param;

    const id = uuidv4();

    raw['id'] = id;

    const group: Group = { id, name, members, raw };

    await this.store().put(id, group);

    return group;
  }

  // Get a group by id
  public async get(id: string): Promise<Group | null> {
    const group: Group = await this.store().get(id);

    return group || null;
  }

  // Update the group data
  public async update(
    id: string,
    param: {
      name: string;
      members: [];
      raw: object;
    }
  ): Promise<Group> {
    const { name, members, raw } = param;

    raw['id'] = id;

    const group: Group = { id, name, members, raw };

    await this.store().put(id, group);

    return group;
  }

  // Delete a group by id
  public async delete(id: string): Promise<void> {
    await this.store().delete(id);

    return;
  }
}
