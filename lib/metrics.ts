import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { MeterProvider } from '@opentelemetry/sdk-metrics-base';
import { metrics } from '@opentelemetry/api-metrics';
import { Resource } from '@opentelemetry/resources';
import packageInfo from '../package.json';

if (process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT) {
  const meterProvider = new MeterProvider({
    exporter: new OTLPMetricExporter(),
    interval: 1000,
    resource: new Resource({
      'service.name': `${packageInfo.name}`,
      'service.version': `${packageInfo.version}`,
    }),
  });

  metrics.setGlobalMeterProvider(meterProvider);
}
