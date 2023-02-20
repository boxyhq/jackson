import SAMLTracer from '.';

export type Trace = {
  traceId: string;
  timestamp: number;
  error: string;
  context: {
    tenant: string;
    product: string;
    clientID: string;
    samlResponse?: string;
    [key: string]: unknown;
  };
};

export type SAMLTracerInstance = InstanceType<typeof SAMLTracer>;
