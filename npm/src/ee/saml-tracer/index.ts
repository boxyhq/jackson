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

  async saveTrace(payload) {
    this.tracerStore.put(randomUUID(), payload);
  }

  async getTrace() {
    this.tracerStore.getAll();
  }
}

export default SAMLTracer;
