import { randomUUID } from 'crypto';

import type {
  Storable,
  Directory,
  JacksonOption,
  DatabaseStore,
  DirectoryType,
  ApiError,
  PaginationParams,
  IUsers,
  IGroups,
  IWebhookEventsLogger,
  IEventController,
} from '../typings';
import * as dbutils from '../db/utils';
import { createRandomSecret, isConnectionActive, validateTenantAndProduct } from '../controller/utils';
import { apiError, JacksonError } from '../controller/error';
import { storeNamespacePrefix } from '../controller/utils';
import { IndexNames } from '../controller/utils';
import { getDirectorySyncProviders } from './utils';

type ConstructorParams = {
  db: DatabaseStore;
  opts: JacksonOption;
  users: IUsers;
  groups: IGroups;
  logger: IWebhookEventsLogger;
  eventController: IEventController;
};

type GetByTypeParams = {
  provider: DirectoryType;
  pageOffset?: number;
  pageLimit?: number;
  pageToken?: string;
};

export class DirectoryConfig {
  private _store: Storable | null = null;
  private opts: JacksonOption;
  private db: DatabaseStore;
  private users: IUsers;
  private groups: IGroups;
  private logger: IWebhookEventsLogger;
  private eventController: IEventController;

  constructor({ db, opts, users, groups, logger, eventController }: ConstructorParams) {
    this.opts = opts;
    this.db = db;
    this.users = users;
    this.groups = groups;
    this.logger = logger;
    this.eventController = eventController;
  }

  // Return the database store
  private store(): Storable {
    return this._store || (this._store = this.db.store(storeNamespacePrefix.dsync.config));
  }

  // Create the configuration
  public async create(params: {
    name?: string;
    tenant: string;
    product: string;
    webhook_url?: string;
    webhook_secret?: string;
    type?: DirectoryType;
  }): Promise<{ data: Directory | null; error: ApiError | null }> {
    try {
      const { name, tenant, product, webhook_url, webhook_secret, type = 'generic-scim-v2' } = params;

      if (!tenant || !product) {
        throw new JacksonError('Missing required parameters.', 400);
      }

      // Validate the directory type
      if (!Object.keys(getDirectorySyncProviders()).includes(type)) {
        throw new JacksonError('Invalid directory type.', 400);
      }

      validateTenantAndProduct(tenant, product);

      const directoryName = name || `scim-${tenant}-${product}`;
      const id = randomUUID();
      const hasWebhook = webhook_url && webhook_secret;

      const directory: Directory = {
        id,
        name: directoryName,
        tenant,
        product,
        type,
        log_webhook_events: false,
        scim: {
          path: `${this.opts.scimPath}/${id}`,
          secret: await createRandomSecret(16),
        },
        webhook: {
          endpoint: hasWebhook ? webhook_url : '',
          secret: hasWebhook ? webhook_secret : '',
        },
      };

      const indexes = [
        {
          name: IndexNames.TenantProduct as string,
          value: dbutils.keyFromParts(tenant, product),
        },
      ];

      // Secondary indexes on the non-scim directories
      if (type === 'google') {
        indexes.push({
          name: storeNamespacePrefix.dsync.providers,
          value: type,
        });
      }

      await this.store().put(id, directory, ...indexes);

      const connection = this.transform(directory);

      await this.eventController.notify('dsync.created', connection);

      return { data: connection, error: null };
    } catch (err: any) {
      return apiError(err);
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
      return apiError(err);
    }
  }

  // Update the configuration. Partial updates are supported
  public async update(
    id: string,
    param: Omit<Partial<Directory>, 'id' | 'tenant' | 'prodct' | 'scim'>
  ): Promise<{ data: Directory | null; error: ApiError | null }> {
    try {
      if (!id) {
        throw new JacksonError('Missing required parameters.', 400);
      }

      const { name, log_webhook_events, webhook, type, google } = param;

      let directory: Directory = await this.store().get(id);

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

      if ('deactivated' in param) {
        directory['deactivated'] = param.deactivated;
      }

      if (google) {
        directory.google = google;
      }

      await this.store().put(id, { ...directory });

      directory = this.transform(directory);

      if ('deactivated' in param) {
        if (isConnectionActive(directory)) {
          await this.eventController.notify('dsync.activated', directory);
        } else {
          await this.eventController.notify('dsync.deactivated', directory);
        }
      }

      return { data: directory, error: null };
    } catch (err: any) {
      return apiError(err);
    }
  }

  // Get the configuration by tenant and product
  public async getByTenantAndProduct(
    tenant: string,
    product: string
  ): Promise<{ data: Directory[] | null; error: ApiError | null }> {
    try {
      if (!tenant || !product) {
        throw new JacksonError('Missing required parameters.', 400);
      }

      const { data: directories } = await this.store().getByIndex({
        name: IndexNames.TenantProduct,
        value: dbutils.keyFromParts(tenant, product),
      });

      const transformedDirectories = directories.map((directory) => this.transform(directory));

      return { data: transformedDirectories, error: null };
    } catch (err: any) {
      return apiError(err);
    }
  }

  // Get all configurations
  public async getAll({ pageOffset, pageLimit, pageToken }: PaginationParams = {}): Promise<{
    data: Directory[] | null;
    pageToken?: string;
    error: ApiError | null;
  }> {
    try {
      const { data: directories, pageToken: nextPageToken } = await this.store().getAll(
        pageOffset,
        pageLimit,
        pageToken
      );

      const transformedDirectories = directories
        ? directories.map((directory) => this.transform(directory))
        : [];

      return {
        data: transformedDirectories,
        pageToken: nextPageToken,
        error: null,
      };
    } catch (err: any) {
      return apiError(err);
    }
  }

  // Delete a configuration by id
  public async delete(id: string): Promise<{ data: null; error: ApiError | null }> {
    try {
      if (!id) {
        throw new JacksonError('Missing required parameter.', 400);
      }

      const { data: directory } = await this.get(id);

      if (!directory) {
        throw new JacksonError('Directory configuration not found.', 404);
      }

      const { tenant, product } = directory;

      // Delete the configuration
      await this.store().delete(id);

      // Delete the groups
      await this.groups.setTenantAndProduct(tenant, product).deleteAll(id);

      // Delete the users
      await this.users.setTenantAndProduct(tenant, product).deleteAll(id);

      // Delete the webhook events
      await this.logger.setTenantAndProduct(tenant, product).deleteAll(id);

      await this.eventController.notify('dsync.deleted', directory);

      return { data: null, error: null };
    } catch (err: any) {
      return apiError(err);
    }
  }

  // Get the connections by directory provider
  public async getByProvider(params: GetByTypeParams): Promise<{
    data: Directory[] | null;
    error: ApiError | null;
    pageToken?: string;
  }> {
    const { provider, pageOffset, pageLimit, pageToken } = params;

    const index = {
      name: storeNamespacePrefix.dsync.providers,
      value: provider,
    };

    try {
      const { data: directories, pageToken: nextPageToken } = await this.store().getByIndex(
        index,
        pageOffset,
        pageLimit,
        pageToken
      );

      return {
        data: directories.map((directory) => this.transform(directory)),
        pageToken: nextPageToken,
        error: null,
      };
    } catch (err: any) {
      return apiError(err);
    }
  }

  private transform(directory: Directory): Directory {
    // Add the flag to ensure SCIM compliance when using Azure AD
    if (directory.type === 'azure-scim-v2') {
      directory.scim.path = `${directory.scim.path}/?aadOptscim062020`;
    }

    directory.scim.endpoint = `${this.opts.externalUrl}${directory.scim.path}`;

    if (!('deactivated' in directory)) {
      directory.deactivated = false;
    }

    return directory;
  }
}
