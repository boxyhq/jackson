import { randomUUID } from 'crypto';

import type {
  Directory,
  DatabaseStore,
  WebhookEventLog,
  DirectorySyncEvent,
  PaginationParams,
} from '../../typings';
import { Base } from './Base';

type GetAllParams = PaginationParams & {
  directoryId?: string;
};

export const eventTTL = 60; // 7 days

export class WebhookEventsLogger extends Base {
  constructor({ db }: { db: DatabaseStore }) {
    super({ db });
  }

  public async log(directory: Directory, event: DirectorySyncEvent | DirectorySyncEvent[], status: number) {
    const id = randomUUID();

    const log: WebhookEventLog = {
      id,
      payload: event,
      webhook_endpoint: directory.webhook.endpoint,
      created_at: new Date(),
      status_code: status,
      delivered: status === 200,
    };

    await this.eventStore().put(id, log, {
      name: 'directoryId',
      value: directory.id,
    });

    return log;
  }

  public async get(id: string): Promise<WebhookEventLog> {
    return await this.eventStore().get(id);
  }

  // Get the event logs for a directory paginated
  public async getAll(params: GetAllParams = {}) {
    const { pageOffset, pageLimit, directoryId } = params;

    let eventLogs: WebhookEventLog[] = [];

    if (directoryId) {
      const index = {
        name: 'directoryId',
        value: directoryId,
      };

      eventLogs = (await this.eventStore().getByIndex(index, pageOffset, pageLimit)).data;
    } else {
      eventLogs = (await this.eventStore().getAll(pageOffset, pageLimit)).data;
    }

    return eventLogs;
  }

  public async delete(id: string) {
    await this.eventStore().delete(id);
  }

  // Delete all event logs for a directory
  async deleteAll(directoryId: string) {
    const index = {
      name: 'directoryId',
      value: directoryId,
    };

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { data: events } = await this.eventStore().getByIndex(index, 0, this.bulkDeleteBatchSize);

      if (!events || events.length === 0) {
        break;
      }

      await this.eventStore().deleteMany(events.map((event) => event.id));
    }
  }

  // Get the store for the logs
  private eventStore() {
    return this.store('logs', eventTTL);
  }
}
