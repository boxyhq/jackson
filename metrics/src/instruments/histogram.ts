import type { Attributes, MetricOptions, Histogram } from '@opentelemetry/api';
import { acquireMeter } from 'src/lib/meter';

const histograms = {};

type operationParams = {
  meter: string;
  name: string;
  val: number;
  histogramOptions?: MetricOptions;
  histogramAttributes?: Attributes;
};

const recordOtelHistogram = ({
  meter,
  name,
  val,
  histogramOptions,
  histogramAttributes,
}: operationParams) => {
  let histogram: Histogram<Attributes> = histograms[name];
  if (histogram === undefined) {
    const _otelMeter = acquireMeter(meter);
    histogram = histograms[name] = _otelMeter.createHistogram(name, histogramOptions);
  }
  histogram.record(val, histogramAttributes);
};

export { recordOtelHistogram };
