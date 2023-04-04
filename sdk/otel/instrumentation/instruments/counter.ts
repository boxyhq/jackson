import type { Attributes, Counter, MetricOptions } from '@opentelemetry/api';
import { acquireMeter } from '../meter';

const counters = {};

type operationParams = {
  meter: string;
  name: string;
  inc: number;
  counterOptions?: MetricOptions;
  counterAttributes?: Attributes;
};

const incrementOtelCounter = ({
  meter,
  name,
  inc = 1,
  counterOptions,
  counterAttributes,
}: operationParams) => {
  let counter: Counter<Attributes> = counters[name];
  if (counter === undefined) {
    const _otelMeter = acquireMeter(meter);
    counter = counters[name] = _otelMeter.createCounter(name, counterOptions);
  }
  counter.add(inc, counterAttributes);
};

export { incrementOtelCounter };
