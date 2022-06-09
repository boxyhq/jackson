import type { Storable, Directory, JacksonOption, DatabaseStore, DirectoryType } from '../typings';
import * as dbutils from '../db/utils';
import { createRandomSecret } from '../controller/utils';
import { JacksonError } from '../controller/error';

export class DirectoryConfig {
  private _store: Storable | null = null;
  private opts: JacksonOption;
  private db: DatabaseStore;

  constructor({ db, opts }: { db: DatabaseStore; opts: JacksonOption }) {
    this.opts = opts;
    this.db = db;
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
    type,
  }: {
    name: string;
    tenant: string;
    product: string;
    webhook_url?: string;
    webhook_secret?: string;
    type: DirectoryType;
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
      type,
      log_webhook_events: false,
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
      log_webhook_events: boolean;
    }
  ): Promise<Directory> {
    const { name, webhook_url, webhook_secret, log_webhook_events } = param;

    const directory = {
      ...(await this.get(id)),
      name,
      log_webhook_events,
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
  public async list({
    pageOffset,
    pageLimit,
  }: {
    pageOffset: number;
    pageLimit: number;
  }): Promise<Directory[]> {
    const directories = (await this.store().getAll(pageOffset, pageLimit)) as Directory[];

    return directories.map((directory) => {
      return this.transform(directory);
    });
  }

  // Delete a configuration by id
  // Note: This feature is not yet implemented
  public async delete(id: string): Promise<void> {
    if (!id) {
      throw new JacksonError('Missing required parameter.', 400);
    }

    // TODO: Delete the users and groups associated with the configuration

    await this.store().delete(id);

    return;
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
