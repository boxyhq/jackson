import { Storable } from '../../typings';
import { randomUUID } from 'crypto';

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
    await this.tracerStore.put(randomUUID(), payload);
  }

  public async getAllTraces(pageOffset?: number, pageLimit?: number): Promise<Trace[]> {
    return (await this.tracerStore.getAll(pageOffset, pageLimit)) as Trace[];
  }
}

export default SAMLTracer;
