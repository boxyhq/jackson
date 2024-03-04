import tap from 'tap';
import SSOTracer from '../../src/sso-tracer';
import { jacksonOptions } from '../utils';
import DB from '../../src/db/db';

let ssoTracer: SSOTracer;
const INTERVAL_1_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

tap.before(async () => {
  const { db: dbOptions } = jacksonOptions;
  const db = await DB.new(dbOptions);
  const tracerStore = db.store('saml:tracer');
  ssoTracer = new SSOTracer({ tracerStore });
});

tap.test('SSOTracer', async () => {
  tap.test('able to save a trace in db', async (t) => {
    const test_trace = {
      error: 'Something wrong happened',
      context: { tenant: 'boxyhq.com', product: 'saml-demo.boxyhq.com', clientID: 'random-clientID' },
    };
    //save
    const traceId = await ssoTracer.saveTrace(test_trace);
    // retrieve
    const { data: traces } = await ssoTracer.getAllTraces(0, 50);
    // check if found trace has all the members of the test_trace saved
    t.hasStrict(traces[0], test_trace);
    // check if traceId follows the pattern expected from mnemonic
    t.match(traceId, /[a-z]+_[a-z]+_[a-z]+/);
    // check if returned traceId from save operation is same as the one in the retrieved record
    t.equal(traces[0].traceId, traceId);
    //cleanup
    traceId && (await ssoTracer.tracerStore.delete(traceId));
  });

  tap.test('calling cleanUpStaleTraces cleans traces older than 1 week', async (t) => {
    // Save traces older than 1 week for testing
    const STALE_TIMESTAMPS = [
      Date.now() - INTERVAL_1_WEEK_MS,
      Date.now() - INTERVAL_1_WEEK_MS - 500,
      Date.now() - INTERVAL_1_WEEK_MS - 1000,
      Date.now() - INTERVAL_1_WEEK_MS - 1500,
      Date.now() - INTERVAL_1_WEEK_MS - 2000,
    ];
    for (let i = 0; i < STALE_TIMESTAMPS.length; i++) {
      await ssoTracer.saveTrace({
        timestamp: STALE_TIMESTAMPS[i],
        error: 'Something wrong happened',
        context: { tenant: 'boxyhq.com', product: 'saml-demo.boxyhq.com', clientID: 'random-clientID' },
      });
    }
    // run cleanUpStaleTraces
    await ssoTracer.cleanUpStaleTraces();
    const { data: traces } = await ssoTracer.getAllTraces(0, 50);
    // should be empty
    t.equal(traces.length, 0);
  });
});

tap.teardown(async () => {
  process.exit(0);
});
