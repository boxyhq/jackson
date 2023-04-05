import type { Attributes, MetricOptions, ObservableGauge } from '@opentelemetry/api';
import { acquireMeter } from 'src/lib/meter';

const gauges = {};

type operationParams = {
  meter: string;
  name: string;
  val: number;
  gaugeOptions?: MetricOptions;
  gaugeAttributes?: Attributes;
};

const observeGauge = ({ meter, name, val, gaugeOptions, gaugeAttributes }: operationParams) => {
  let gauge: ObservableGauge<Attributes> = gauges[name];
  if (gauge === undefined) {
    const _otelMeter = acquireMeter(meter);
    gauge = gauges[name] = _otelMeter.createObservableGauge(name, gaugeOptions);
  }
  gauge.addCallback((result) => {
    result.observe(val, gaugeAttributes);
  });
};

export { observeGauge };
