import _ from 'lodash';
import axios from 'axios';
import { randomUUID } from 'crypto';

import { createSignatureString } from '../../event/webhook';
import { storeNamespacePrefix } from '../../controller/utils';
import type { DatabaseStore, Directory, DirectorySyncEvent, IDirectoryConfig, Storable } from '../../typings';

enum EventStatus {
  PENDING = 'PENDING',
  FAILED = 'FAILED',
  PROCESSING = 'PROCESSING',
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

    if (!events.length) {
      return;
    }

    // Group the events by directory
    const eventsByDirectory = _.groupBy(events, 'event.directory_id');

    const directoryIds = Object.keys(eventsByDirectory);
    const directoryCount = directoryIds.length;

    // Fetch the connections corresponding to the directories it belongs to
    const directoriesResult = await Promise.allSettled(
      directoryIds.map((directoryId) => this.directoryStore.get(directoryId))
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
        const response = await this.send(directory.webhook, events);

        if (response.status === 200) {
          await this.delete(events);
        } else {
          await this.markAsFailed(events);
        }
      } catch (err: any) {
        await this.markAsFailed(events);
      }
    }
  }

  // Send the events to the webhooks
  public async send(webhook: Directory['webhook'], events: WebhookEvent[]) {
    const payload = events.map(({ event }) => event);

    return await axios.post(webhook.endpoint, payload, {
      headers: {
        'Content-Type': 'application/json',
        'BoxyHQ-Signature': createSignatureString(webhook.secret, payload),
      },
    });
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

  // Delete the delivered events
  private async delete(events: WebhookEvent[]) {
    const promises = events.map((event) => this.eventStore.delete(event.id));

    await Promise.allSettled(promises);
  }

  // Mark the events as failed
  private async markAsFailed(events: WebhookEvent[]) {
    const promises = events.map((event) =>
      this.eventStore.put(event.id, {
        ...event,
        status: EventStatus.FAILED,
        retry_count: event.retry_count + 1,
      })
    );

    await Promise.allSettled(promises);
  }
}
