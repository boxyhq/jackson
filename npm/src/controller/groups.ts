import type { Storable, Group, DatabaseStore } from '../typings';
import { v4 as uuidv4 } from 'uuid';

export class GroupsController {
  private _db: DatabaseStore;
  private _tenant = '';
  private _product = '';

  constructor({ db }: { db: DatabaseStore }) {
    this._db = db;
  }

  public with(tenant: string, product: string): GroupsController {
    this._tenant = tenant;
    this._product = product;

    return this;
  }

  public setTenantAndProduct(tenant: string, product: string) {
    this._tenant = tenant;
    this._product = product;
  }

  // Return the database store
  private store(type: 'groups' | 'members'): Storable {
    return this._db.store(`${type}:${this._tenant}:${this._product}`);
  }

  // Create a new group
  public async create(param: { name: string; raw: any }): Promise<Group> {
    const { name, raw } = param;

    const id = uuidv4();

    const group: Group = { id, name, raw };

    await this.store('groups').put(id, group);

    return group;
  }

  // Get a group by id
  public async get(id: string): Promise<Group> {
    return await this.store('groups').get(id);
  }

  // Update the group data
  public async update(
    id: string,
    param: {
      name: string;
      raw: any;
    }
  ): Promise<Group> {
    const { name, raw } = param;

    const group: Group = { id, name, raw };

    await this.store('groups').put(id, group);

    return group;
  }

  // Delete a group by id
  public async delete(id: string): Promise<void> {
    await this.store('groups').delete(id);

    return;
  }

  public async addUser(groupId: string, userId: string): Promise<void> {
    const id = `${groupId}-${userId}`;

    const data = {
      group_id: groupId,
      user_id: userId,
    };

    await this.store('members').put(id, data, {
      name: 'groupId',
      value: groupId,
    });

    return;
  }

  public async getUsers(groupId: string): Promise<{ user_id: string }[]> {
    const users: { user_id: string }[] = await this.store('members').getByIndex({
      name: 'groupId',
      value: groupId,
    });

    if (users.length === 0) {
      return [];
    }

    return users;
  }

  public async removeUser(groupId: string, userId: string): Promise<void> {
    const id = `${groupId}-${userId}`;

    await this.store('members').delete(id);

    return;
  }

  public async removeAllUsers(groupId: string): Promise<void> {
    const users = await this.getUsers(groupId);

    if (users.length === 0) {
      return;
    }

    for (const user of users) {
      await this.removeUser(groupId, user.user_id);
    }

    // TODO: Remove users from the group

    return;
  }
}
