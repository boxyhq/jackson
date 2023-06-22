import { randomUUID } from 'crypto';

import type {
  Storable,
  Directory,
  JacksonOption,
  DatabaseStore,
  DirectoryType,
  PaginationParams,
  IUsers,
  IGroups,
  IWebhookEventsLogger,
  IEventController,
  Response,
  Index,
} from '../../typings';
import * as dbutils from '../../db/utils';
import {
  createRandomSecret,
  isConnectionActive,
  validateTenantAndProduct,
  storeNamespacePrefix,
  IndexNames,
} from '../../controller/utils';
import { apiError, JacksonError } from '../../controller/error';
import { getDirectorySyncProviders, isSCIMEnabledProvider } from './utils';

interface DirectoryConfigParams {
  db: DatabaseStore;
  opts: JacksonOption;
  users: IUsers;
  groups: IGroups;
  logger: IWebhookEventsLogger;
  eventController: IEventController;
}

interface FilterByParams extends PaginationParams {
  product?: string;
  provider?: DirectoryType;
}

export class DirectoryConfig {
  private _store: Storable | null = null;
  private opts: JacksonOption;
  private db: DatabaseStore;
  private users: IUsers;
  private groups: IGroups;
  private logger: IWebhookEventsLogger;
  private eventController: IEventController;

  constructor({ db, opts, users, groups, logger, eventController }: DirectoryConfigParams) {
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
    google_domain?: string;
    google_access_token?: string;
    google_refresh_token?: string;
  }): Promise<Response<Directory>> {
    try {
      const {
        name,
        tenant,
        product,
        webhook_url,
        webhook_secret,
        type = 'generic-scim-v2',
        google_domain,
        google_access_token,
        google_refresh_token,
      } = params;

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
      const isSCIMProvider = isSCIMEnabledProvider(type);

      let directory: Directory = {
        id,
        name: directoryName,
        tenant,
        product,
        type,
        log_webhook_events: false,
        webhook: {
          endpoint: hasWebhook ? webhook_url : '',
          secret: hasWebhook ? webhook_secret : '',
        },
        scim: isSCIMProvider
          ? {
              path: `${this.opts.scimPath}/${id}`,
              secret: await createRandomSecret(16),
            }
          : {
              path: '',
              secret: '',
            },
      };

      if (type === 'google') {
        directory = {
          ...directory,
          google_domain: google_domain || '',
          google_access_token: google_access_token || '',
          google_refresh_token: google_refresh_token || '',
        };
      }

      const indexes: Index[] = [
        {
          name: IndexNames.TenantProduct,
          value: dbutils.keyFromParts(tenant, product),
        },
        {
          name: IndexNames.Product,
          value: product,
        },
      ];

      // Add secondary index for Non-SCIM providers
      if (!isSCIMProvider) {
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
  public async get(id: string): Promise<Response<Directory>> {
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
    param: Omit<Partial<Directory>, 'id' | 'tenant' | 'prodct' | 'scim' | 'type'>
  ): Promise<Response<Directory>> {
    try {
      if (!id) {
        throw new JacksonError('Missing required parameters.', 400);
      }

      const {
        name,
        log_webhook_events,
        webhook,
        deactivated,
        google_domain,
        google_access_token,
        google_refresh_token,
      } = param;

      const directory: Directory = await this.store().get(id);

      let updatedDirectory: Directory = {
        ...directory,
        name: name || directory.name,
        webhook: webhook || directory.webhook,
        deactivated: deactivated !== undefined ? deactivated : directory.deactivated,
        log_webhook_events:
          log_webhook_events !== undefined ? log_webhook_events : directory.log_webhook_events,
        google_domain: google_domain || directory.google_domain,
        google_access_token: google_access_token || directory.google_access_token,
        google_refresh_token: google_refresh_token || directory.google_refresh_token,
      };

      await this.store().put(id, updatedDirectory);

      updatedDirectory = this.transform(updatedDirectory);

      if ('deactivated' in param) {
        if (isConnectionActive(updatedDirectory)) {
          await this.eventController.notify('dsync.activated', updatedDirectory);
        } else {
          await this.eventController.notify('dsync.deactivated', updatedDirectory);
        }
      }

      return { data: updatedDirectory, error: null };
    } catch (err: any) {
      return apiError(err);
    }
  }

  // Get the configuration by tenant and product
  public async getByTenantAndProduct(tenant: string, product: string): Promise<Response<Directory[]>> {
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

  // Get directory connections with pagination
  public async getAll(
    params: PaginationParams = {}
  ): Promise<Response<Directory[]> & { pageToken?: string }> {
    const { pageOffset, pageLimit, pageToken } = params;

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
  public async delete(id: string): Promise<Response<null>> {
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

  private transform(directory: Directory): Directory {
    if (directory.scim.path) {
      // Add the flag to ensure SCIM compliance when using Azure AD
      if (directory.type === 'azure-scim-v2') {
        directory.scim.path = `${directory.scim.path}/?aadOptscim062020`;
      }

      // Construct the SCIM endpoint
      directory.scim.endpoint = `${this.opts.externalUrl}${directory.scim.path}`;
    }

    if (!('deactivated' in directory)) {
      directory.deactivated = false;
    }

    return directory;
  }

  // Filter connections by product or provider
  public async filterBy(
    params: FilterByParams = {}
  ): Promise<Response<Directory[]> & { pageToken?: string }> {
    const { product, provider, pageOffset, pageLimit, pageToken } = params;
    let index: Index | null = null;

    if (product) {
      // Filter by product
      index = {
        name: IndexNames.Product,
        value: product,
      };
    } else if (provider) {
      // Filter by provider
      index = {
        name: storeNamespacePrefix.dsync.providers,
        value: provider,
      };
    }

    try {
      if (!index) {
        throw new JacksonError('Please provider a product or provider.', 400);
      }

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
}
