import { randomUUID } from 'crypto';
import {
  NotificationEventProcessor as EventProcessor,
  NotificationEventHandler as EventHandler,
  ScheduledNotificationEvent as ScheduledEvent,
} from './types';
import { Storable } from '@boxyhq/saml-jackson';

export class NotificationEventProcessor implements EventProcessor {
  private db: Storable;
  private handlers: Map<string, EventHandler> = new Map();
  private isProcessing = false;

  constructor(db: Storable) {
    this.db = db;
  }

  registerHandler(eventType: string, handler: EventHandler): void {
    this.handlers.set(eventType, handler);
  }

  async scheduleEvent(type: string, payload: any, scheduledFor: Date): Promise<ScheduledEvent> {
    const eventId = randomUUID();
    return this.db.put(eventId, {
      type,
      payload,
      scheduledFor,
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    }) as unknown as ScheduledEvent;
  }

  async processEvents(): Promise<void> {
    if (this.isProcessing) return;

    try {
      this.isProcessing = true;

      // Get all pending events that are due
      const allEvents = await this.db.getAll();
      const pendingEvents = allEvents.data.filter((item) => item['status'] === 'pending');

      for (const event of pendingEvents) {
        await this.processEvent(event as unknown as ScheduledEvent);
      }
    } catch (error) {
      console.error('Error processing events:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processEvent(event: ScheduledEvent): Promise<void> {
    if (!this.handlers.has(event.type)) {
      await this.markEventFailed(event.id, `No handler registered for event type: ${event.type}`);
      return;
    }

    const handler = this.handlers.get(event.type)!;

    try {
      // Mark as processing
      await this.db.put(event.id, {
        status: 'processing',
        attempts: { increment: 1 },
        updatedAt: new Date(),
      });

      // Execute the handler
      const result = await handler(event.payload);

      // Mark as completed
      await this.db.put(event.id, {
        status: 'completed',
        result,
        updatedAt: new Date(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Check if max attempts reached
      if (event.attempts + 1 >= event.maxAttempts) {
        await this.markEventFailed(event.id, errorMessage);
        return;
      }

      // If not max attempts, keep as pending for retry
      await this.db.put(event.id, {
        status: 'pending',
        error: errorMessage,
        updatedAt: new Date(),
      });
    }
  }

  private async markEventFailed(id: string, error: string): Promise<void> {
    await this.db.put(id, {
      status: 'failed',
      error,
      updatedAt: new Date(),
    });
  }

  async getEvent(id: string): Promise<ScheduledEvent | null> {
    return this.db.get(id) as unknown as ScheduledEvent | null;
  }

  async rescheduleEvent(id: string, newScheduledFor: Date): Promise<ScheduledEvent> {
    return this.db.put(id, {
      scheduledFor: newScheduledFor,
      status: 'pending',
      updatedAt: new Date(),
    }) as unknown as ScheduledEvent;
  }

  async cancelEvent(id: string): Promise<boolean> {
    try {
      await this.db.delete(id);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}
