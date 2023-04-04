import { incrementOtelCounter } from './counter';
import { recordOtelHistogram } from './histogram';

type instrumentParams = {
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
async function instrument({ meter, name, delegate }: instrumentParams) {
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

/**
 * Decorator that instruments a class method
 */
function instrumented(meter: string, target: any, key: string, descriptor?: PropertyDescriptor) {
  if (descriptor === undefined) {
    descriptor = Object.getOwnPropertyDescriptor(target, key);
  }
  if (descriptor === undefined) {
    return descriptor;
  }

  const originalMethod = descriptor.value;
  const klass = target.constructor.name;

  // this needs to be a non-arrow function or we'll get the wrong `this`
  function overrideMethod(...args) {
    return instrument({
      meter,
      name: `${klass}.${key}`,
      delegate: async () => {
        return await originalMethod.apply(this, args);
      },
    });
  }

  descriptor.value = overrideMethod;

  return descriptor;
}

export { instrument, instrumented };
