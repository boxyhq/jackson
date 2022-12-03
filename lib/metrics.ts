import { metrics } from '@opentelemetry/api';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

import packageInfo from '../package.json';

if (process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT) {
  const meterProvider = new MeterProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: `${packageInfo.name}`,
      [SemanticResourceAttributes.SERVICE_VERSION]: `${packageInfo.version}`,
    }),
  });

  const metricExporter = new OTLPMetricExporter({});

  meterProvider.addMetricReader(
    new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 1000,
    })
  );

  metrics.setGlobalMeterProvider(meterProvider);
}

// Optional and only needed to see the internal diagnostic logging (during development)
//import { DiagConsoleLogger, DiagLogLevel, diag } from '@opentelemetry/api';
// diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
