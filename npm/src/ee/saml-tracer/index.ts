import { Storable } from '../../typings';
import { randomUUID } from 'crypto';
import { IndexNames } from '../../controller/utils';
import { keyFromParts } from '../../db/utils';

const MILLISECONDS_1_WEEK = 604800000;
const INTERVAL_1_DAY_MS = 86400000;

type Trace = {
  traceId: string;
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
    this.cleanUpStaleTraces();
  }

  public async saveTrace(payload: Omit<Trace, 'traceId'>) {
    const { context } = payload;
    const traceId = randomUUID();
    await this.tracerStore.put(
      traceId,
      { ...payload, traceId },
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

  private cleanUpStaleTraces() {
    setInterval(async () => {
      const traces: Trace[] = [];
      for (let pageOffset = 0; ; pageOffset++) {
        const page = await this.getAllTraces(pageOffset, 50);
        if (page.length === 0) {
          break;
        }
        traces.concat(page.filter(({ timestamp }) => Date.now() - timestamp > MILLISECONDS_1_WEEK));
      }

      for (let i = 0; i < traces.length; i++) {
        this.tracerStore.delete(traces[i].traceId);
      }
    }, INTERVAL_1_DAY_MS);
  }
}

export default SAMLTracer;
