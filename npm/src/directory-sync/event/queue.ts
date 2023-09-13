import os from 'os';
import _ from 'lodash';
import axios from 'axios';
import { randomUUID } from 'crypto';

import { createSignatureString } from '../../event/webhook';
import type {
  Directory,
  DirectorySyncEvent,
  IDirectoryConfig,
  Storable,
  JacksonOption,
  EventLock,
  IWebhookEventsLogger,
} from '../../typings';
import { eventLockTTL } from './utils';

enum EventStatus {
  PENDING = 'PENDING',
  FAILED = 'FAILED',
  PROCESSING = 'PROCESSING',
}

interface QueuedEvent {
  event: DirectorySyncEvent;
  id: string;
  retry_count: number;
  status: EventStatus;
  created_at: string;
}

interface DirectoryEventsParams {
  opts: JacksonOption;
  eventStore: Storable;
  eventLock: EventLock;
  directories: IDirectoryConfig;
  webhookLogs: IWebhookEventsLogger;
}

const lockKey = os.hostname();
const lockRenewalInterval = (eventLockTTL / 2) * 1000;

export class EventProcessor {
  private eventStore: Storable;
  private eventLock: EventLock;
  private opts: JacksonOption;
  private directories: IDirectoryConfig;
  private webhookLogs: IWebhookEventsLogger;

  constructor({ opts, eventStore, eventLock, directories, webhookLogs }: DirectoryEventsParams) {
    this.opts = opts;
    this.eventLock = eventLock;
    this.eventStore = eventStore;
    this.directories = directories;
    this.webhookLogs = webhookLogs;
  }

  // Push the new event to the database
  public async push(event: DirectorySyncEvent): Promise<QueuedEvent> {
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
    // Acquire the lock
    if (!(await this.eventLock.acquire(lockKey))) {
      return;
    }

    // Renew the lock periodically
    const intervalId = setInterval(async () => {
      this.eventLock.renew(lockKey);
    }, lockRenewalInterval);

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const events = await this.fetch();
      const eventsCount = events.length;

      if (eventsCount === 0) {
        clearInterval(intervalId);
        break;
      }

      // TODO: Handle events that have reached the max retry count

      // Group the events by directory
      const eventsByDirectory = _.groupBy(events, 'event.directory_id');

      const directoryIds = Object.keys(eventsByDirectory);
      const directoryCount = directoryIds.length;

      // Fetch the connections corresponding to the directories it belongs to
      const directoriesResult = await Promise.allSettled(
        directoryIds.map((directoryId) => this.directories.get(directoryId))
      );

      // Iterate over the directories and send the events to the webhooks
      // For each directory, we will send the events in a batch
      // directoryIds and directoriesResult are in the same order
      for (let i = 0; i < directoryCount; i++) {
        const directoryId = directoryIds[i];
        const directoryResult = directoriesResult[i];
        const events = eventsByDirectory[directoryId];

        if (directoryResult.status === 'rejected') {
          await this.markAsFailed(events);
          continue;
        }

        const directory = directoryResult.value.data as Directory;

        if (!directory) {
          await this.markAsFailed(events);
          continue;
        }

        if (!directory.webhook?.endpoint || !directory.webhook?.secret) {
          await this.markAsFailed(events);
          continue;
        }

        try {
          const { status } = await this.send(directory.webhook, events);

          status === 200 ? await this.delete(events) : await this.markAsFailed(events);

          await this.logWebhookEvent(directory, events, status);
        } catch (err: any) {
          await this.markAsFailed(events);
        }
      }
    }
  }

  // Fetch next batch of events from the database
  public async fetch() {
    const { data: events } = (await this.eventStore.getAll(0, this.batchSize(), undefined)) as {
      data: QueuedEvent[];
    };

    if (!events.length) {
      return [];
    }

    const promises = events.map((event) =>
      this.eventStore.put(event.id, { ...event, status: EventStatus.PROCESSING })
    );

    await Promise.allSettled(promises);

    return events;
  }

  public async getAll() {
    return (await this.eventStore.getAll()) as { data: QueuedEvent[] };
  }

  // Send the events to the webhooks
  private async send(webhook: Directory['webhook'], events: QueuedEvent[]) {
    const payload = events.map(({ event }) => event);

    return await axios.post(webhook.endpoint, payload, {
      headers: {
        'Content-Type': 'application/json',
        'BoxyHQ-Signature': createSignatureString(webhook.secret, payload),
      },
    });
  }

  // Delete the delivered events
  private async delete(events: QueuedEvent[]) {
    const promises = events.map((event) => this.eventStore.delete(event.id));

    await Promise.allSettled(promises);
  }

  // Mark the events as failed
  private async markAsFailed(events: QueuedEvent[]) {
    const promises = events.map((event) =>
      this.eventStore.put(event.id, {
        ...event,
        status: EventStatus.FAILED,
        retry_count: event.retry_count + 1,
      })
    );

    await Promise.allSettled(promises);
  }

  private batchSize() {
    return this.opts.dsync?.webhookBatchSize;
  }

  private async logWebhookEvent(directory: Directory, events: QueuedEvent[], status: number) {
    if (!directory.log_webhook_events) {
      return;
    }

    const payload = events.map(({ event }) => event);

    await this.webhookLogs
      .setTenantAndProduct(directory.tenant, directory.product)
      .log(directory, payload, status);
  }
}
