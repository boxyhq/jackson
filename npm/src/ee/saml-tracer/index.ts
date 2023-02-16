import { Storable } from '../../typings';
import { randomUUID } from 'crypto';
import { IndexNames } from '../../controller/utils';
import * as dbutils from '../../db/utils';

const TTL_1_WEEK = 604800;

type Trace = {
  timestamp: number;
  error: string;
  context: {
    tenant: string;
    product: string;
    [key: string]: unknown;
  };
};

class SAMLTracer {
  tracerStore: Storable;

  constructor({ db }) {
    this.tracerStore = db.store('saml:tracer', TTL_1_WEEK);
  }

  public async saveTrace(payload: Trace) {
    const { context } = payload;

    await this.tracerStore.put(randomUUID(), payload, {
      name: IndexNames.TenantProduct,
      value: dbutils.keyFromParts(context.tenant, context.product),
    });
  }

  public async getAllTraces() {
    await this.tracerStore.getAll();
  }
}

export default SAMLTracer;
