import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { MeterProvider } from '@opentelemetry/sdk-metrics-base';

const exporter = new OTLPMetricExporter({
  // url: '<opentelemetry-collector-url>', // http://localhost:55681/v1/metrics
});

// Register the exporter
const meter = new MeterProvider({
  exporter,
  interval: 1000,
}).getMeter('saml-jackson');

export { meter };
