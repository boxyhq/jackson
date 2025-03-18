import { jacksonOptions } from '@lib/env';
import { NotificationEventProcessor } from './notification-event-processor';
import defaultDb from 'npm/src/db/defaultDb';
import DB from 'npm/src/db/db';
import { logger } from '@lib/logger';

// Singleton instance
let eventProcessor: NotificationEventProcessor | null = null;

export async function getEventProcessor() {
  if (!eventProcessor) {
    const _opts = defaultDb(jacksonOptions);
    const db = await DB.new({ db: _opts.db, logger });
    const notifcationEventStore = db.store('notification:event');
    eventProcessor = new NotificationEventProcessor(notifcationEventStore);
  }
  return eventProcessor;
}

// Scheduler initialization
export async function initializeScheduler() {
  const processor = getEventProcessor();

  (await processor).registerHandler('send-daily-notifications', async (payload) => {
    const { userId } = payload;
    console.log(`Sending notification to user ${userId}`);
    return { sent: true, timestamp: new Date() };
  });

  return processor;
}
