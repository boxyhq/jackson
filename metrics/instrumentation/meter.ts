import { metrics } from '@opentelemetry/api';

/**
 * Acquires a `Meter` and returns it.
 * @param name - The name of the meter
 * @returns Meter
 *
 */
function acquireMeter(name: string) {
  return metrics.getMeter(name);
}

export { acquireMeter };
