import type { Storable, SCIMConfig, ISCIMController, JacksonOption } from '../../typings';

import * as dbutils from '../../db/utils';
import { createRandomString } from '../utils';
import { JacksonError } from '../error';

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

    const record = {
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

    await this.scimStore.put(id, record);

    return record;
  }
}
