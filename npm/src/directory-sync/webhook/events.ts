import { randomUUID } from 'crypto';

import { Base } from '../scim/Base';
import type { DatabaseStore, Directory, DirectorySyncEvent } from '../../typings';

enum EventStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
}

export class DirectoryEvents extends Base {
  constructor({ db }: { db: DatabaseStore }) {
    super({ db });
  }

  public async create(directory: Directory, event: DirectorySyncEvent) {
    const id = randomUUID();

    const record = {
      id,
      event,
      retry_count: 0,
      status: EventStatus.PENDING,
    };

    const index = [
      {
        name: 'directoryId',
        value: directory.id,
      },
    ];

    await this.setTenantAndProduct(directory.tenant, directory.product)
      .store('events')
      .put(id, record, ...index);

    return record;
  }

  public async getMany(params: { directoryId: string }) {
    //
  }
}
