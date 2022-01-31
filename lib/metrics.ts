import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { MeterProvider } from '@opentelemetry/sdk-metrics-base';
import { metrics } from '@opentelemetry/api-metrics';

const meterProvider = new MeterProvider({
  exporter: new OTLPMetricExporter({}),
  interval: 1000,
});

metrics.setGlobalMeterProvider(meterProvider);

export {
  metrics,
  meterProvider
}