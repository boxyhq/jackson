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

  // Get all users in a group
  public async getAllUsers(groupId: string): Promise<{ user_id: string }[]> {
    const users: { user_id: string }[] = await this.store('members').getByIndex({
      name: 'groupId',
      value: groupId,
    });

    if (users.length === 0) {
      return [];
    }

    return users;
  }

  // Add a user to a group
  public async addUserToGroup(groupId: string, userId: string): Promise<void> {
    const id = `${groupId}-${userId}`;

    await this.store('members').put(
      id,
      {
        group_id: groupId,
        user_id: userId,
      },
      {
        name: 'groupId',
        value: groupId,
      }
    );

    return;
  }

  // Remove a user from a group
  public async removeUserFromGroup(groupId: string, userId: string): Promise<void> {
    const id = `${groupId}-${userId}`;

    await this.store('members').delete(id);

    return;
  }

  // Remove all users from a group
  public async removeAllUsers(groupId: string): Promise<void> {
    const users = await this.getAllUsers(groupId);

    if (users.length === 0) {
      return;
    }

    for (const user of users) {
      await this.removeUserFromGroup(groupId, user.user_id);
    }

    return;
  }

  // Check if a user is a member of a group
  public async isUserInGroup(groupId: string, userId: string): Promise<boolean> {
    const id = `${groupId}-${userId}`;

    return !!(await this.store('members').get(id));
  }
}
