import type { Storable, Directory, JacksonOption, DatabaseStore, User, Group } from '../typings';
import type { GroupsController } from '../controller/groups';
import type { UsersController } from '../controller/users';
import * as dbutils from '../db/utils';
import { createRandomSecret } from '../controller/utils';
import { JacksonError } from '../controller/error';

export class DirectoryConfig {
  private _store: Storable | null = null;
  private opts: JacksonOption;
  private db: DatabaseStore;
  private users: UsersController;
  private groups: GroupsController;

  constructor({
    db,
    opts,
    users,
    groups,
  }: {
    db: DatabaseStore;
    opts: JacksonOption;
    users: UsersController;
    groups: GroupsController;
  }) {
    this.opts = opts;
    this.db = db;
    this.users = users;
    this.groups = groups;
  }

  // Return the database store
  private store(): Storable {
    return this._store || (this._store = this.db.store('dsync:config'));
  }

  // Create the configuration
  public async create({
    name,
    tenant,
    product,
    webhook_url,
    webhook_secret,
  }: {
    name: string;
    tenant: string;
    product: string;
    webhook_url?: string;
    webhook_secret?: string;
  }): Promise<Directory> {
    if (!name || !tenant || !product) {
      throw new JacksonError('Missing required parameters.', 400);
    }

    const id = dbutils.keyDigest(dbutils.keyFromParts(tenant, product));

    const hasWebhook = webhook_url && webhook_secret;

    const directory: Directory = {
      id,
      name,
      tenant,
      product,
      scim: {
        path: `/api/scim/v2.0/${id}`,
        secret: await createRandomSecret(16),
      },
      webhook: {
        endpoint: hasWebhook ? webhook_url : '',
        secret: hasWebhook ? webhook_secret : '',
      },
    };

    await this.store().put(id, directory);

    return this.transform(directory);
  }

  // Get the configuration by id
  public async get(id: string): Promise<Directory> {
    if (!id) {
      throw new JacksonError('Missing required parameters.', 400);
    }

    const directory: Directory = await this.store().get(id);

    if (!directory) {
      throw new JacksonError('Directory configuration not found.', 404);
    }

    return this.transform(directory);
  }

  // Update the configuration
  public async update(
    id: string,
    param: {
      name: string;
      webhook_url: string;
      webhook_secret: string;
    }
  ): Promise<Directory> {
    const { name, webhook_url, webhook_secret } = param;

    const directory = {
      ...(await this.get(id)),
      name,
      webhook: {
        endpoint: webhook_url,
        secret: webhook_secret,
      },
    };

    await this.store().put(id, directory);

    return directory;
  }

  // Get the configuration by tenant and product
  public async getByTenantAndProduct(tenant: string, product: string): Promise<Directory> {
    if (!tenant || !product) {
      throw new JacksonError('Missing required parameters.', 400);
    }

    return this.get(dbutils.keyDigest(dbutils.keyFromParts(tenant, product)));
  }

  // Get all configurations
  public async list(): Promise<Directory[]> {
    const directories = (await this.store().getAll()) as Directory[];

    return directories.map((directory) => {
      return this.transform(directory);
    });
  }

  // Delete a configuration by id
  public async delete(id: string): Promise<void> {
    if (!id) {
      throw new JacksonError('Missing required parameter.', 400);
    }

    // TODO: Delete the users and groups associated with the configuration

    await this.store().delete(id);

    return;
  }

  // Get all users in a directory
  public async listUsers({ directory }: { directory: string }): Promise<User[]> {
    const { tenant, product } = await this.get(directory);

    return await this.users.list({ tenant, product });
  }

  // Get all groups in a directory
  public async listGroups({ directory }: { directory: string }): Promise<Group[]> {
    const { tenant, product } = await this.get(directory);

    return await this.groups.list({ tenant, product });
  }

  // Validate the API secret
  public async validateAPISecret(id: string, bearerToken: string | null): Promise<boolean> {
    if (!id) {
      throw new JacksonError('Missing required parameter.', 400);
    }

    if (!bearerToken) {
      throw new JacksonError('Missing bearer token.', 400);
    }

    const config: Directory = await this.get(id);

    if (config.scim.secret === bearerToken) {
      return true;
    }

    return false;
  }

  private transform(directory: Directory): Directory {
    directory.scim.endpoint = `${this.opts.externalUrl}${directory.scim.path}`;

    return directory;
  }
}
