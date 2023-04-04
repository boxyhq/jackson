import { incrementOtelCounter } from './counter';
import { recordOtelHistogram } from './histogram';

type operationParams = {
  /** OTel meter name */
  meter: string;
  /** Function name being instrumented */
  name: string;
  /** Handle to execute the function */
  delegate: () => unknown;
};

/**
 * Run the given function, recording throughput, latency and errors
 *
 * @param operationParams
 */
async function instrumentFunction({ meter, name, delegate }: operationParams) {
  const start = process.hrtime();

  try {
    return await delegate();
  } catch (err) {
    incrementOtelCounter({ meter, name: 'function.errors', counterAttributes: { function: name } });
    throw err;
  } finally {
    const elapsed = process.hrtime(start);
    const elapsedNanos = elapsed[0] * 1000000000 + elapsed[1];
    recordOtelHistogram({
      meter,
      name: 'function.executionTime',
      val: elapsedNanos,
      histogramAttributes: { function: name },
    });
  }
}

export { instrumentFunction };
