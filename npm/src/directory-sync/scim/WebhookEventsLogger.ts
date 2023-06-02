import { randomUUID } from 'crypto';

import type {
  Directory,
  DatabaseStore,
  WebhookEventLog,
  DirectorySyncEvent,
  PaginationParams,
} from '../../typings';
import { Base } from './Base';

export class WebhookEventsLogger extends Base {
  constructor({ db }: { db: DatabaseStore }) {
    super({ db });
  }

  public async log(directory: Directory, event: DirectorySyncEvent, status: number) {
    const id = randomUUID();

    const log: WebhookEventLog = {
      ...event,
      id,
      webhook_endpoint: directory.webhook.endpoint,
      created_at: new Date(),
      status_code: status,
      delivered: status === 200,
    };

    await this.store('logs').put(id, log, {
      name: 'directoryId',
      value: directory.id,
    });

    return log;
  }

  public async get(id: string): Promise<WebhookEventLog> {
    return await this.store('logs').get(id);
  }

  // Get the event logs for a directory paginated
  public async getAll(params: { directoryId: string } & PaginationParams) {
    const { pageOffset, pageLimit, directoryId } = params;

    const { data: eventLogs } = await this.store('logs').getByIndex(
      {
        name: 'directoryId',
        value: directoryId,
      },
      pageOffset,
      pageLimit
    );

    return eventLogs;
  }

  public async delete(id: string) {
    await this.store('logs').delete(id);
  }

  // Delete all event logs for a directory
  async deleteAll(directoryId: string) {
    const index = {
      name: 'directoryId',
      value: directoryId,
    };

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { data: events } = await this.store('logs').getByIndex(index, 0, this.bulkDeleteBatchSize);

      if (!events || events.length === 0) {
        break;
      }

      await this.store('logs').deleteMany(events.map((event) => event.id));
    }
  }
}
