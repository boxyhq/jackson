import type { Storable, Group, DatabaseStore } from '../typings';
import { v4 as uuidv4 } from 'uuid';
import * as dbutils from '../db/utils';
import { JacksonError } from './error';

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

  public setTenantAndProduct(tenant: string, product: string): GroupsController {
    this.tenant = tenant;
    this.product = product;

    return this;
  }

  public with(tenant: string, product: string): GroupsController {
    return this.setTenantAndProduct(tenant, product);
  }

  // Create a new group
  public async create(param: { name: string; raw: any }): Promise<Group> {
    const { name, raw } = param;

    const id = uuidv4();

    raw['id'] = id;

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
    const group = await this.store('groups').get(id);

    if (!group) {
      throw new JacksonError(`Group with id ${id} not found.`, 404);
    }

    return group;
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
  public async delete(id: string) {
    await this.store('groups').delete(id);
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
  public async addUserToGroup(groupId: string, userId: string) {
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
  }

  // Remove a user from a group
  public async removeUserFromGroup(groupId: string, userId: string) {
    const id = dbutils.keyDigest(dbutils.keyFromParts(groupId, userId));

    await this.store('members').delete(id);
  }

  // Remove all users from a group
  public async removeAllUsers(groupId: string) {
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
  public async list({
    pageOffset,
    pageLimit,
  }: {
    pageOffset?: number;
    pageLimit?: number;
  }): Promise<Group[]> {
    return (await this.store('groups').getAll(pageOffset, pageLimit)) as Group[];
  }
}
