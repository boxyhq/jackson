import { randomUUID } from 'crypto';

import type { DatabaseStore, Directory, DirectorySyncEvent, Storable } from '../../typings';
import { storeNamespacePrefix } from '../../controller/utils';

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
  public async push(directory: Directory, event: DirectorySyncEvent) {
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
        value: directory.id,
      },
    ];

    await this.store.put(id, record, ...index);

    return record;
  }

  // Pop the next events from the database
  public async pop(limit = 50) {
    const { data: events } = await this.store.getAll(0, limit);

    if (!events.length) {
      return [];
    }

    // const ids = events.map((event: EventRecord) => event.id);

    const promises = events.map((id) => {
      return this.store.put(id, { status: EventStatus.PROCESSING });
    });

    return events as EventRecord[];
  }

  // Process the events
  public async process() {
    //
  }
}
