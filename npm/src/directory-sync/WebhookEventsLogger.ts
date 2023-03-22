import type {
  Directory,
  DatabaseStore,
  WebhookEventLog,
  DirectorySyncEvent,
  PaginationParams,
} from '../typings';
import { Base } from './Base';

export class WebhookEventsLogger extends Base {
  constructor({ db }: { db: DatabaseStore }) {
    super({ db });
  }

  public async log(directory: Directory, event: DirectorySyncEvent): Promise<WebhookEventLog> {
    const id = this.createId();

    const log: WebhookEventLog = {
      ...event,
      id,
      webhook_endpoint: directory.webhook.endpoint,
      created_at: new Date(),
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

  public async getAll({
    pageOffset,
    pageLimit,
    directoryId,
  }: PaginationParams & {
    directoryId?: string;
  } = {}): Promise<WebhookEventLog[]> {
    if (directoryId) {
      return (
        await this.store('logs').getByIndex(
          {
            name: 'directoryId',
            value: directoryId,
          },
          pageOffset,
          pageLimit
        )
      ).data as WebhookEventLog[];
    }

    return (await this.store('logs').getAll(pageOffset, pageLimit)).data as WebhookEventLog[];
  }

  public async delete(id: string) {
    await this.store('logs').delete(id);
  }

  // Delete all events logs for a directory
  async deleteAll(directoryId: string) {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const index = {
        name: 'directoryId',
        value: directoryId,
      };

      const { data: events } = await this.store('logs').getByIndex(index, 0, this.bulkDeleteBatchSize);

      if (!events || events.length === 0) {
        break;
      }

      await this.store('logs').deleteMany(events.map((event) => event.id));
    }
  }

  public async updateStatus(log: WebhookEventLog, statusCode: number): Promise<WebhookEventLog> {
    const updatedLog = {
      ...log,
      status_code: statusCode,
      delivered: statusCode === 200,
    };

    await this.store('logs').put(log.id, updatedLog);

    return updatedLog;
  }
}
