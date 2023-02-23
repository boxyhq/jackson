import SAMLTracer from '.';

export interface Trace {
  traceId: string;
  timestamp: number;
  error: string;
  context: {
    [key: string]: unknown;
  };
}

export interface SAMLTrace extends Omit<Trace, 'traceId' | 'timestamp'> {
  timestamp?: number /** Can be passed in from outside else will be set to Date.now() */;
  context: Trace['context'] & {
    tenant: string;
    product: string;
    clientID: string;
    samlResponse?: string;
  };
}

export type SAMLTracerInstance = InstanceType<typeof SAMLTracer>;
