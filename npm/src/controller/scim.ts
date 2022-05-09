import type { Storable, SCIMConfig, ISCIMController, JacksonOption, SCIMEventType } from '../typings';
import * as dbutils from '../db/utils';
import { createRandomString } from './utils';
import { JacksonError } from './error';
import { sendEvent } from '../scim';

export class SCIMController implements ISCIMController {
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
        secret: await createRandomString(25),
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

    config.scim.endpoint = `${this.opts.externalUrl}${config.scim.path}`;

    if (!config) {
      throw new JacksonError('Configuration not found.', 404);
    }

    return config;
  }

  // Delete a SCIM configuration by id
  public async delete(id: string): Promise<void> {
    if (!id) {
      throw new JacksonError('Missing required parameters.', 400);
    }
  }

  // Send the webhook event to the SP endpoint
  public async sendEvent(id: string, type: SCIMEventType, payload: object): Promise<void> {
    const config = await this.get(id);

    // Add additional data to the payload
    payload['tenant'] = config.tenant;
    payload['product'] = config.product;

    sendEvent(type, payload, {
      webhook: config.webhook,
    });

    return;
  }

  // Method to validate the API secret.
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
