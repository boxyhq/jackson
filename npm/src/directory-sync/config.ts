import type { Storable, SCIMConfig, JacksonOption } from '../typings';
import * as dbutils from '../db/utils';
import { createRandomSecret } from '../controller/utils';
import { JacksonError } from '../controller/error';

export class DirectoryConfig {
  private store: Storable;
  private opts: JacksonOption;

  constructor({ scimStore, opts }: { scimStore: Storable; opts: JacksonOption }) {
    this.store = scimStore;
    this.opts = opts;
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
    webhook_url: string;
    webhook_secret: string;
  }): Promise<SCIMConfig> {
    if (!name || !tenant || !product || !webhook_url || !webhook_secret) {
      throw new JacksonError('Missing required parameters.', 400);
    }

    const id = dbutils.keyDigest(dbutils.keyFromParts(tenant, product));

    const config: SCIMConfig = {
      id,
      name,
      tenant,
      product,
      webhook: {
        endpoint: webhook_url,
        secret: webhook_secret,
      },
      scim: {
        path: `/api/scim/v2.0/${id}`,
        secret: await createRandomSecret(16),
      },
    };

    await this.store.put(id, config);

    config.scim.endpoint = `${this.opts.externalUrl}${config.scim.path}`;

    return config;
  }

  // Get a SCIM configuration by id
  public async get(id: string): Promise<SCIMConfig> {
    if (!id) {
      throw new JacksonError('Missing required parameters.', 400);
    }

    const config: SCIMConfig = await this.store.get(id);

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

    await this.store.delete(id);

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

    const config: SCIMConfig = await this.get(id);

    if (config.scim.secret === bearerToken) {
      return true;
    }

    return false;
  }
}
