import { randomUUID } from 'crypto';

import type {
  Directory,
  DatabaseStore,
  WebhookEventLog,
  DirectorySyncEvent,
  PaginationParams,
  Records,
} from '../../typings';
import { Base } from './Base';
import { webhookLogsTTL } from '../utils';
import { indexNames } from './utils';

type GetAllParams = PaginationParams & {
  directoryId?: string;
};

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
      name: indexNames.directoryId,
      value: directory.id,
    });

    return log;
  }

  public async get(id: string): Promise<WebhookEventLog> {
    return await this.eventStore().get(id);
  }

  /**
   * @openapi
   * /api/v1/dsync/events:
   *   get:
   *     tags:
   *       - Directory Sync
   *     summary: Get event logs for a directory
   *     parameters:
   *       - name: directoryId
   *         in: query
   *         description: Directory ID (Optional if tenant/product is provided)
   *         schema:
   *           type: string
   *       - name: tenant
   *         in: query
   *         description: Tenant (Optional if directoryId is provided)
   *         schema:
   *           type: string
   *       - name: product
   *         in: query
   *         description: Product (Optional if directoryId is provided)
   *         schema:
   *           type: string
   *       - name: pageOffset
   *         in: query
   *         description: Starting point from which the set of records are retrieved
   *         schema:
   *           type: string
   *       - name: pageLimit
   *         in: query
   *         description: Number of records to be fetched for the page
   *         schema:
   *           type: string
   *       - name: pageToken
   *         in: query
   *         description: Token used for DynamoDB pagination
   *         schema:
   *           type: string
   *     responses:
   *       "200":
   *         description: Success
   *         content: {}
   */
  // Get the event logs for a directory paginated
  public async getAll(params: GetAllParams = {}) {
    const { pageOffset, pageLimit, pageToken, directoryId } = params;

    let result: Records<WebhookEventLog>;

    if (directoryId) {
      const index = {
        name: indexNames.directoryId,
        value: directoryId,
      };

      result = await this.eventStore().getByIndex(index, pageOffset, pageLimit, pageToken);
    } else {
      result = await this.eventStore().getAll(pageOffset, pageLimit, pageToken);
    }

    return { data: result.data, pageToken: result.pageToken };
  }

  public async delete(id: string) {
    await this.eventStore().delete(id);
  }

  // Delete all event logs for a directory
  async deleteAll(directoryId: string) {
    while (true) {
      const { data: events } = await this.eventStore().getByIndex(
        {
          name: indexNames.directoryId,
          value: directoryId,
        },
        0,
        this.bulkDeleteBatchSize
      );

      if (!events || events.length === 0) {
        break;
      }

      await this.eventStore().deleteMany(events.map((event) => event.id));
    }
  }

  // Get the store for the events
  private eventStore() {
    return this.store('logs', webhookLogsTTL);
  }
}
