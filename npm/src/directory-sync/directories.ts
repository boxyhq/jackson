import type { Storable, DirectoryConfig, JacksonOption, DatabaseStore } from '../typings';
import * as dbutils from '../db/utils';
import { createRandomSecret } from '../controller/utils';
import { JacksonError } from '../controller/error';

export class Directories {
  private _store: Storable | null = null;
  private opts: JacksonOption;
  private db: DatabaseStore;

  constructor({ db, opts }: { db: DatabaseStore; opts: JacksonOption }) {
    this.opts = opts;
    this.db = db;
  }

  // Return the database store
  private store(): Storable {
    return this._store || (this._store = this.db.store(`scim:config`));
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
  }): Promise<DirectoryConfig> {
    if (!name || !tenant || !product) {
      throw new JacksonError('Missing required parameters name or tenant or product.', 400);
    }

    const id = dbutils.keyDigest(dbutils.keyFromParts(tenant, product));

    const directory: DirectoryConfig = {
      id,
      name,
      tenant,
      product,
      scim: {
        path: `/api/scim/v2.0/${id}`,
        secret: await createRandomSecret(16),
      },
    };

    // Webhook is optional. If webhook_url is provided, create a webhook.
    if (webhook_url && webhook_secret) {
      directory.webhook = {
        endpoint: webhook_url,
        secret: webhook_secret,
      };
    }

    await this.store().put(id, directory);

    return this.transform(directory);
  }

  // Get the configuration by id
  public async get(id: string): Promise<DirectoryConfig> {
    if (!id) {
      throw new JacksonError('Missing required parameters.', 400);
    }

    const directory: DirectoryConfig = await this.store().get(id);

    if (!directory) {
      throw new JacksonError('Directory configuration not found.', 404);
    }

    return this.transform(directory);
  }

  // Get all configurations
  public async list(): Promise<DirectoryConfig[]> {
    const directories = (await this.store().getAll()) as DirectoryConfig[];

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

  private transform(directory: DirectoryConfig): DirectoryConfig {
    directory.scim.endpoint = `${this.opts.externalUrl}${directory.scim.path}`;

    return directory;
  }

  // Validate the API secret
  public async validateAPISecret(id: string, bearerToken: string | null): Promise<boolean> {
    if (!id) {
      throw new JacksonError('Missing required parameter.', 400);
    }

    if (!bearerToken) {
      throw new JacksonError('Missing bearer token.', 400);
    }

    const config: DirectoryConfig = await this.get(id);

    if (config.scim.secret === bearerToken) {
      return true;
    }

    return false;
  }
}
