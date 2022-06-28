import type { Storable, Directory, JacksonOption, DatabaseStore, DirectoryType, ApiError } from '../typings';
import * as dbutils from '../db/utils';
import { createRandomSecret } from '../controller/utils';
import { JacksonError } from '../controller/error';
import { storeNamespacePrefix } from '../controller/utils';

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
    return this._store || (this._store = this.db.store(storeNamespacePrefix.dsync.config));
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
  }): Promise<{ data: Directory | null; error: ApiError | null }> {
    try {
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

      return { data: this.transform(directory), error: null };
    } catch (err: any) {
      const { message, statusCode = 500 } = err;

      return { data: null, error: { message, code: statusCode } };
    }
  }

  // Get the configuration by id
  public async get(id: string): Promise<{ data: Directory | null; error: ApiError | null }> {
    try {
      if (!id) {
        throw new JacksonError('Missing required parameters.', 400);
      }

      const directory: Directory = await this.store().get(id);

      if (!directory) {
        throw new JacksonError('Directory configuration not found.', 404);
      }

      return { data: this.transform(directory), error: null };
    } catch (err: any) {
      const { message, statusCode = 500 } = err;

      return { data: null, error: { message, code: statusCode } };
    }
  }

  // Update the configuration. Partial updates are supported
  public async update(
    id: string,
    param: Omit<Partial<Directory>, 'id' | 'tenant' | 'prodct' | 'scim'>
  ): Promise<{ data: Directory | null; error: ApiError | null }> {
    try {
      const { name, log_webhook_events, webhook, type } = param;

      const { data: directory, error } = await this.get(id);

      if (error || !directory) {
        throw error;
      }

      if (name) {
        directory.name = name;
      }

      if (log_webhook_events !== undefined) {
        directory.log_webhook_events = log_webhook_events;
      }

      if (webhook) {
        directory.webhook = webhook;
      }

      if (type) {
        directory.type = type;
      }

      await this.store().put(id, { ...directory });

      return { data: this.transform(directory), error: null };
    } catch (err: any) {
      const { message, statusCode = 500 } = err;

      return { data: null, error: { message, code: statusCode } };
    }
  }

  // Get the configuration by tenant and product
  public async getByTenantAndProduct(
    tenant: string,
    product: string
  ): Promise<{ data: Directory | null; error: ApiError | null }> {
    try {
      if (!tenant || !product) {
        throw new JacksonError('Missing required parameters.', 400);
      }

      return await this.get(dbutils.keyDigest(dbutils.keyFromParts(tenant, product)));
    } catch (err: any) {
      const { message, statusCode = 500 } = err;

      return { data: null, error: { message, code: statusCode } };
    }
  }

  // Get all configurations
  public async list({
    pageOffset,
    pageLimit,
  }: {
    pageOffset: number;
    pageLimit: number;
  }): Promise<{ data: Directory[] | null; error: ApiError | null }> {
    try {
      const directories = (await this.store().getAll(pageOffset, pageLimit)) as Directory[];

      const transformedDirectories = directories
        ? directories.map((directory) => this.transform(directory))
        : [];

      return {
        data: transformedDirectories,
        error: null,
      };
    } catch (err: any) {
      const { message, statusCode = 500 } = err;

      return { data: null, error: { message, code: statusCode } };
    }
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

    const { data: directory, error } = await this.get(id);

    if (error || !directory) {
      return false;
    }

    if (directory.scim.secret === bearerToken) {
      return true;
    }

    return false;
  }

  private transform(directory: Directory): Directory {
    directory.scim.endpoint = `${this.opts.externalUrl}${directory.scim.path}`;

    return directory;
  }
}
