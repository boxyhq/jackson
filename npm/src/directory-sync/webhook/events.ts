import _ from 'lodash';
import { randomUUID } from 'crypto';

import { storeNamespacePrefix } from '../../controller/utils';
import type { DatabaseStore, Directory, DirectorySyncEvent, Storable } from '../../typings';

enum EventStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
}

interface EventRecord {
  id: string;
  event: DirectorySyncEvent;
  retry_count: number;
  status: EventStatus;
  created_at: string;
}

export class DirectoryEvents {
  // Directory events store
  private store: Storable;

  constructor({ db }: { db: DatabaseStore }) {
    this.store = db.store(storeNamespacePrefix.dsync.events);
  }

  // Push an event to the database
  async push(directory: Directory, event: DirectorySyncEvent) {
    const id = randomUUID();

    const record = {
      id,
      event,
      directory,
      retry_count: 0,
      status: EventStatus.PENDING,
      created_at: new Date().toISOString(),
    };

    const index = [
      {
        name: 'directoryId',
        value: directory.id,
      },
    ];

    await this.store.put(id, record, ...index);

    return record;
  }

  // Process the events
  public async process() {
    const events = await this.pop();

    if (!events.length) {
      return;
    }

    const eventsByDirectory = Object.entries(_.groupBy(events, 'directory.id')).map(
      ([directoryId, events]) => {
        return {
          directoryId,
          events,
        };
      }
    );

    console.log('eventsByDirectory', eventsByDirectory);
  }

  // Pop the next events from the database
  private async pop(limit = 50) {
    const { data: events } = (await this.store.getAll(0, limit)) as { data: EventRecord[] };

    if (!events.length) {
      return [];
    }

    const promises = events.map((event) =>
      this.store.put(event.id, { ...event, status: EventStatus.PROCESSING })
    );

    await Promise.allSettled(promises);

    // TODO: Do proper error handling if any of the promises fail

    return events;
  }

  // Send the events to the webhook
  private async processDirectoryEvents(directoryId: string, events: EventRecord[]) {
    //
  }
}
