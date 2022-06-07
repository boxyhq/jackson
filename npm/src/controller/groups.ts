import type { Storable, Group, DatabaseStore } from '../typings';
import { v4 as uuidv4 } from 'uuid';
import * as dbutils from '../db/utils';

export class GroupsController {
  private db: DatabaseStore;
  private tenant = '';
  private product = '';

  constructor({ db }: { db: DatabaseStore }) {
    this.db = db;
  }

  // Return the database store
  private store(type: 'groups' | 'members'): Storable {
    if (!this.tenant || !this.product) {
      throw new Error('Set tenant and product before using store.');
    }

    return this.db.store(`${type}:${this.tenant}:${this.product}`);
  }

  public with(tenant: string, product: string): GroupsController {
    this.tenant = tenant;
    this.product = product;

    return this;
  }

  public setTenantAndProduct(tenant: string, product: string) {
    this.tenant = tenant;
    this.product = product;
  }

  // Create a new group
  public async create(param: { name: string; raw: any }): Promise<Group> {
    const { name, raw } = param;

    const id = uuidv4();

    const group: Group = {
      id,
      name,
      raw,
    };

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

    const group: Group = {
      id,
      name,
      raw,
    };

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
    const id = dbutils.keyDigest(dbutils.keyFromParts(groupId, userId));

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
    const id = dbutils.keyDigest(dbutils.keyFromParts(groupId, userId));

    await this.store('members').delete(id);
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
  }

  // Check if a user is a member of a group
  public async isUserInGroup(groupId: string, userId: string): Promise<boolean> {
    const id = dbutils.keyDigest(dbutils.keyFromParts(groupId, userId));

    return !!(await this.store('members').get(id));
  }

  // Get all groups in a directory
  public async getAll(): Promise<Group[]> {
    return (await this.store('groups').getAll()) as Group[];
  }

  // Get the groups by tenant and product
  public async list({ tenant, product }: { tenant: string; product: string }): Promise<Group[]> {
    return await this.with(tenant, product).getAll();
  }
}
