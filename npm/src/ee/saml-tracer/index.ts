import { Storable } from '../../typings';
import { randomUUID } from 'crypto';
import { IndexNames } from '../../controller/utils';
import { keyFromParts } from '../../db/utils';

// const TTL_1_WEEK = 604800;

type Trace = {
  timestamp: number;
  error: string;
  context: {
    tenant: string;
    product: string;
    clientID: string;
    [key: string]: unknown;
  };
};

class SAMLTracer {
  tracerStore: Storable;

  constructor({ db }) {
    this.tracerStore = db.store('saml:tracer');
  }

  public async saveTrace(payload: Trace) {
    const { context } = payload;

    await this.tracerStore.put(
      randomUUID(),
      payload,
      {
        name: IndexNames.TenantProduct,
        value: keyFromParts(context.tenant, context.product),
      },
      { name: IndexNames.SSOClientID, value: context.clientID }
    );
  }

  public async getAllTraces(pageOffset?: number, pageLimit?: number): Promise<Trace[]> {
    return (await this.tracerStore.getAll(pageOffset, pageLimit)) as Trace[];
  }
}

export default SAMLTracer;
