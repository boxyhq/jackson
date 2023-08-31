import _ from 'lodash';
import { randomUUID } from 'crypto';

import { retryCount } from '../../event/axios';
import { sendPayloadToWebhook } from '../../event/webhook';
import { storeNamespacePrefix } from '../../controller/utils';
import type { DatabaseStore, DirectorySyncEvent, IDirectoryConfig, Storable } from '../../typings';

enum EventStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
}

interface WebhookEvent {
  event: DirectorySyncEvent;
  id: string;
  retry_count: number;
  status: EventStatus;
  created_at: string;
}

interface DirectoryEventsParams {
  db: DatabaseStore;
  directoryStore: IDirectoryConfig;
}

export class DirectoryEvents {
  private eventStore: Storable;
  private directoryStore: IDirectoryConfig;

  constructor({ db, directoryStore }: DirectoryEventsParams) {
    this.eventStore = db.store(storeNamespacePrefix.dsync.events);
    this.directoryStore = directoryStore;
  }

  // Push the new event to the database
  async push(event: DirectorySyncEvent): Promise<WebhookEvent> {
    const id = randomUUID();

    const record = {
      id,
      event,
      retry_count: 0,
      status: EventStatus.PENDING,
      created_at: new Date().toISOString(),
    };

    const index = [
      {
        name: 'directoryId',
        value: event.directory_id,
      },
    ];

    await this.eventStore.put(id, record, ...index);

    return record;
  }

  // Process the events and send them to the webhooks as a batch
  public async process() {
    const events = await this.pop();

    console.info(`Found ${events.length} events to process`);

    if (!events.length) {
      return;
    }

    // Group the events by directory
    const eventsByDirectory = _.groupBy(events, 'event.directory_id');

    // Fetch the connections corresponding to the directories it belongs to
    const fetchResults = await Promise.allSettled(
      Object.keys(eventsByDirectory).map((directoryId) => this.directoryStore.get(directoryId))
    );

    // Send the events to the webhooks
    for (const fetchResult of fetchResults) {
      if (fetchResult.status === 'rejected') {
        continue;
      }

      const directory = fetchResult.value.data;

      if (!directory) {
        continue;
      }

      if (!directory.webhook?.endpoint || !directory.webhook?.secret) {
        continue;
      }

      const events = eventsByDirectory[directory.id];

      try {
        await sendPayloadToWebhook(
          directory.webhook,
          events.map(({ event }) => event)
        );

        await this.deleteDelivered(events);
      } catch (err: any) {
        await this.markAsFailed(events);
      }
    }
  }

  // Fetch next batch of events from the database
  private async pop(limit = 50) {
    const { data: events } = (await this.eventStore.getAll(0, limit)) as { data: WebhookEvent[] };

    if (!events.length) {
      return [];
    }

    const promises = events.map((event) =>
      this.eventStore.put(event.id, { ...event, status: EventStatus.PROCESSING })
    );

    await Promise.allSettled(promises);

    return events;
  }

  // Mark the events as failed
  private async markAsFailed(events: WebhookEvent[]) {
    const promises = events.map((event) =>
      this.eventStore.put(event.id, {
        ...event,
        status: EventStatus.FAILED,
        retry_count: event.retry_count + retryCount,
      })
    );

    await Promise.allSettled(promises);
  }

  // Delete the delivered events
  private async deleteDelivered(events: WebhookEvent[]) {
    const promises = events.map((event) => this.eventStore.delete(event.id));

    await Promise.allSettled(promises);
  }
}
