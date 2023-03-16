import { Records, Storable } from '../typings';
import { generateMnemonic } from '@boxyhq/error-code-mnemonic';
import { IndexNames } from '../controller/utils';
import { keyFromParts } from '../db/utils';
import type { SAMLTrace, Trace } from './types';

const INTERVAL_1_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const INTERVAL_1_DAY_MS = 24 * 60 * 60 * 1000;

class SAMLTracer {
  tracerStore: Storable;

  constructor({ db }) {
    this.tracerStore = db.store('saml:tracer');
    // Clean up stale traces at the start
    this.cleanUpStaleTraces();
    // Set timer to run every day
    setInterval(async () => {
      this.cleanUpStaleTraces();
    }, INTERVAL_1_DAY_MS);
  }

  public async saveTrace(payload: SAMLTrace) {
    try {
      const { context } = payload;
      // Friendly trace id
      const traceId: string = await generateMnemonic();
      // If timestamp present in payload use that value, else generate the current timestamp
      const timestamp = typeof payload.timestamp === 'number' ? payload.timestamp : Date.now();
      const traceValue: Trace = { ...payload, traceId, timestamp };
      const { tenant, product, clientID } = context;

      const indices = [
        {
          name: IndexNames.TenantProduct,
          value: keyFromParts(tenant, product),
          filterLogic: ({ tenant, product }) => !!(tenant && product),
        },
        {
          name: IndexNames.SSOClientID,
          value: clientID,
          filterLogic: ({ clientID }) => !!clientID,
        },
      ]
        .filter(({ filterLogic }) => filterLogic(context))
        .map(({ name, value }) => ({ name, value }));

      await this.tracerStore.put(traceId, traceValue, ...indices);
      return traceId;
    } catch (err: unknown) {
      console.error(`Failed to save trace`, err);
    }
  }

  public async getByTraceId(traceId: string) {
    return (await this.tracerStore.get(traceId)) as Trace;
  }

  public async getAllTraces(
    pageOffset?: number,
    pageLimit?: number,
    pageToken?: string
  ): Promise<Records<Trace>> {
    return await this.tracerStore.getAll(pageOffset || 0, pageLimit || 0, pageToken);
  }

  /** Cleans up stale traces older than 1 week */
  public async cleanUpStaleTraces() {
    let staleTraces: Trace[] = [];
    for (let pageOffset = 0, pageTokenMap = {}; ; pageOffset += 50) {
      const { data: page, pageToken: nextPageToken } = await this.getAllTraces(
        pageOffset,
        50,
        pageTokenMap[pageOffset]
      );
      pageTokenMap[pageOffset + 50] = nextPageToken;
      if (page.length === 0) {
        break;
      }
      staleTraces = staleTraces.concat(
        page.filter(({ timestamp }) => Date.now() - timestamp > INTERVAL_1_WEEK_MS)
      );
    }

    for (let i = 0; i < staleTraces.length; i++) {
      await this.tracerStore.delete(staleTraces[i].traceId);
    }
  }
}

export default SAMLTracer;
