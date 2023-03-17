import type {
  Directory,
  DatabaseStore,
  WebhookEventLog,
  DirectorySyncEvent,
  PaginationParams,
} from '../typings';
import { Base } from './Base';

type GetAllParams = PaginationParams & {
  directoryId?: string;
};

export class WebhookEventsLogger extends Base {
  constructor({ db }: { db: DatabaseStore }) {
    super({ db });
  }

  public async log(directory: Directory, event: DirectorySyncEvent, status: number) {
    const id = this.createId();

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

  public async getAll(params: GetAllParams = {}) {
    const { pageOffset, pageLimit, directoryId } = params;

    let eventLogs: WebhookEventLog[] = [];

    if (directoryId) {
      const index = {
        name: 'directoryId',
        value: directoryId,
      };

      eventLogs = await this.store('logs').getByIndex(index, pageOffset, pageLimit);
    } else {
      eventLogs = await this.store('logs').getAll(pageOffset, pageLimit);
    }

    return eventLogs;
  }

  public async delete(id: string) {
    await this.store('logs').delete(id);
  }

  public async clear() {
    const events = await this.getAll({});

    await Promise.all(
      events.map(async (event) => {
        await this.delete(event.id);
      })
    );
  }
}
