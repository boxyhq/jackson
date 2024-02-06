// Interface for a Sink
export interface Sink {
  // HealthCheck returns true if the sink is healthy
  healthCheck(): Promise<boolean>;
  // TransformEvent transforms an event before sending it to the sink
  transformEvent(event: any): any;
  // SendEvent sends an event to the sink
  sendEvent(event: any): Promise<any>;
  // SendEvents sends events to the sink
  sendEvents(events: any[], batchSize: number): Promise<any>;
}

export interface Logger {
  info: (message: string) => void;
  error: (message: string) => void;
}
