import type { Storable, DirectoryConfig, JacksonOption, DatabaseStore } from '../typings';
import * as dbutils from '../db/utils';
import { createRandomSecret } from '../controller/utils';
import { JacksonError } from '../controller/error';

export class Directory {
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

  // Create a new SCIM configuration
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
      throw new JacksonError('Missing required parameters.', 400);
    }

    const id = dbutils.keyDigest(dbutils.keyFromParts(tenant, product));

    const config: DirectoryConfig = {
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
      config.webhook = {
        endpoint: webhook_url,
        secret: webhook_secret,
      };
    }

    await this.store().put(id, config);

    config.scim.endpoint = `${this.opts.externalUrl}${config.scim.path}`;

    return config;
  }

  // Get a SCIM configuration by id
  public async get(id: string): Promise<DirectoryConfig> {
    if (!id) {
      throw new JacksonError('Missing required parameters.', 400);
    }

    const config: DirectoryConfig = await this.store().get(id);

    if (!config) {
      throw new JacksonError('Configuration not found.', 404);
    }

    config.scim.endpoint = `${this.opts.externalUrl}${config.scim.path}`;

    return config;
  }

  // Delete a SCIM configuration by id
  public async delete(id: string): Promise<void> {
    if (!id) {
      throw new JacksonError('Missing required parameters.', 400);
    }

    // TODO: Delete the users and groups associated with the configuration

    await this.store().delete(id);

    return;
  }

  // Validate the API secret
  public async validateAPISecret(id: string, bearerToken: string | null): Promise<boolean> {
    if (!id) {
      throw new JacksonError('Missing required parameters.', 400);
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
