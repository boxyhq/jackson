import tap from 'tap';
import SAMLTracer from '../../src/ee/saml-tracer';
import { jacksonOptions } from '../utils';
import DB from '../../src/db/db';

let samlTracer: SAMLTracer;
const MILLISECONDS_1_WEEK = 7 * 24 * 60 * 60 * 1000;

tap.before(async () => {
  const { db: dbOptions } = jacksonOptions;
  const db = await DB.new(dbOptions);
  samlTracer = new SAMLTracer({ db });
});

tap.test('SAMLTracer', async () => {
  tap.test('able to save a trace in db', async (t) => {
    const test_trace = {
      timestamp: Date.now(),
      error: 'Something wrong happened',
      context: { tenant: 'boxyhq.com', product: 'saml-demo.boxyhq.com', clientID: 'random-clientID' },
    };
    await samlTracer.saveTrace(test_trace);

    const traces = await samlTracer.getAllTraces(0, 50);
    t.hasStrict(traces[0], test_trace);
    await samlTracer.tracerStore.delete(traces[0].traceId);
  });

  tap.test('calling cleanUpStaleTraces cleans traces older than 1 week', async (t) => {
    const STALE_TIMESTAMPS = [
      Date.now() - MILLISECONDS_1_WEEK,
      Date.now() - MILLISECONDS_1_WEEK - 500,
      Date.now() - MILLISECONDS_1_WEEK - 1000,
      Date.now() - MILLISECONDS_1_WEEK - 1500,
      Date.now() - MILLISECONDS_1_WEEK - 2000,
    ];
    for (let i = 0; i < STALE_TIMESTAMPS.length; i++) {
      await samlTracer.saveTrace({
        timestamp: STALE_TIMESTAMPS[i],
        error: 'Something wrong happened',
        context: { tenant: 'boxyhq.com', product: 'saml-demo.boxyhq.com', clientID: 'random-clientID' },
      });
    }

    await samlTracer.cleanUpStaleTraces();

    const traces = await samlTracer.getAllTraces(0, 50);

    t.equal(traces.length, 0);
  });
});

tap.teardown(async () => {
  process.exit(0);
});
