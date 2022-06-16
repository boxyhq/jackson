import type { Storable, User, DatabaseStore } from '../typings';
import { v4 as uuidv4 } from 'uuid';
import { JacksonError } from './error';
import { storeNamespacePrefix } from '../controller/utils';

export class UsersController {
  private db: DatabaseStore;
  private tenant = '';
  private product = '';

  constructor({ db }: { db: DatabaseStore }) {
    this.db = db;
  }

  // Return the database store
  private store(): Storable {
    if (!this.tenant || !this.product) {
      throw new Error('Set tenant and product before using store.');
    }

    return this.db.store(`${storeNamespacePrefix.dsync.users}:${this.tenant}:${this.product}`);
  }

  public setTenantAndProduct(tenant: string, product: string): UsersController {
    this.tenant = tenant;
    this.product = product;

    return this;
  }

  public with(tenant: string, product: string): UsersController {
    return this.setTenantAndProduct(tenant, product);
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

    const user = {
      id,
      first_name,
      last_name,
      email,
      raw,
    };

    await this.store().put(id, user, {
      name: 'userName',
      value: email,
    });

    return user;
  }

  // Get a user by id
  public async get(id: string): Promise<User> {
    const user = await this.store().get(id);

    if (!user) {
      throw new JacksonError(`User with id ${id} not found.`, 404);
    }

    return user;
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

    const user = {
      id,
      first_name,
      last_name,
      email,
      raw,
    };

    await this.store().put(id, user);

    return user;
  }

  // Delete a user by id
  public async delete(id: string): Promise<void> {
    await this.store().delete(id);
  }

  // Get all users in a directory
  public async list({ pageOffset, pageLimit }: { pageOffset?: number; pageLimit?: number }): Promise<User[]> {
    return (await this.store().getAll(pageOffset, pageLimit)) as User[];
  }

  // Search users by userName
  public async search(userName: string): Promise<User[]> {
    return (await this.store().getByIndex({ name: 'userName', value: userName })) as User[];
  }
}
