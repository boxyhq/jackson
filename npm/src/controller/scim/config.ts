import type { Storable, SCIMConfig, ISCIMController, JacksonOption, SCIMEventType } from '../../typings';
import * as dbutils from '../../db/utils';
import { createRandomString } from '../utils';
import { JacksonError } from '../error';
import events from '../../scim/events';

export class SCIMController implements ISCIMController {
  private scimStore: Storable;
  private opts: JacksonOption;

  constructor({ scimStore, opts }: { scimStore: Storable; opts: JacksonOption }) {
    this.scimStore = scimStore;
    this.opts = opts;
  }

  // Create a new SCIM configuration
  public async create({
    name,
    tenant,
    product,
    webhook_url,
  }: {
    name: string;
    tenant: string;
    product: string;
    webhook_url: string;
  }): Promise<SCIMConfig> {
    if (!name || !tenant || !product || !webhook_url) {
      throw new JacksonError('Missing required parameters.', 400);
    }

    const id = dbutils.keyDigest(dbutils.keyFromParts(name, tenant, product));

    const config = {
      id,
      name,
      tenant,
      product,
      webhook: {
        endpoint: webhook_url,
        bearer_token: await createRandomString(25),
      },
      scim: {
        endpoint: `${this.opts.externalUrl}/api/scim/v2.0/${id}`,
        bearer_token: await createRandomString(25),
      },
    };

    await this.scimStore.put(id, config);

    return config;
  }

  // Get a SCIM configuration by id
  public async getById(id: string): Promise<SCIMConfig> {
    if (!id) {
      throw new JacksonError('Missing required parameters.', 400);
    }

    const config = await this.scimStore.get(id);

    if (!config) {
      throw new JacksonError('Configuration not found.', 404);
    }

    return config;
  }

  // Send the webhook event to the SP endpoint
  public async sendEvent(id: string, event: SCIMEventType, payload: object): Promise<void> {
    const config = await this.getById(id);

    // Add additional data to the payload
    payload['tenant'] = config.tenant;
    payload['product'] = config.product;

    events.sendEvent(event, payload, {
      endpoint: config.webhook.endpoint,
    });

    return;
  }
}

// config: {
//   id: 'd41e5ae8148ba0c41fc4cc30e4e457ade44b65dd',
//   name: 'config-1',
//   tenant: 'product',
//   product: 'flex',
//   webhook: {
//     endpoint: 'https://auth0.com/',
//     bearer_token: 'DzccufgTksJOiyJJ8vSYTMI9e'
//   },
//   scim: {
//     endpoint: 'http://localhost:5225/api/scim/v2.0/d41e5ae8148ba0c41fc4cc30e4e457ade44b65dd',
//     bearer_token: 'TirF4dsQRQsbBHZG5OekgUIKE'
//   }
// }
