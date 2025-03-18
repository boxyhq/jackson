export type ScheduledNotificationEvent = {
  id: string;
  type: string;
  payload: Record<string, any>;
  scheduledFor: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  updatedAt: Date;
  result?: any;
  error?: string;
};

export type NotificationEventHandler<T = any> = (payload: T) => Promise<any>;

export interface NotificationEventProcessor {
  registerHandler(eventType: string, handler: NotificationEventHandler): void;
  scheduleEvent(type: string, payload: any, scheduledFor: Date): Promise<ScheduledNotificationEvent>;
  processEvents(): Promise<void>;
  getEvent(id: string): Promise<ScheduledNotificationEvent | null>;
  rescheduleEvent(id: string, newScheduledFor: Date): Promise<ScheduledNotificationEvent>;
  cancelEvent(id: string): Promise<boolean>;
}
