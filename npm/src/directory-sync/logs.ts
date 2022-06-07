import type { Storable, DatabaseStore, WebhookEventLog, DirectorySyncEventType } from '../typings';
import { v4 as uuidv4 } from 'uuid';

export class WebhookEventLogger {
  private db: DatabaseStore;
  private tenant = '';
  private product = '';

  constructor({ db }: { db: DatabaseStore }) {
    this.db = db;
  }

  // Return the database store
  private store(): Storable {
    if (!this.tenant || !this.product) {
      throw new Error('Set tenant and product before using store.');
    }

    return this.db.store(`dsync:logs:${this.tenant}:${this.product}`);
  }

  public setTenantAndProduct(tenant: string, product: string) {
    this.tenant = tenant;
    this.product = product;

    return this;
  }

  public async create(event: DirectorySyncEventType, payload: any): Promise<WebhookEventLog> {
    const id = uuidv4();

    const log = {
      id,
      event,
      payload,
      createdAt: new Date(),
    };

    await this.store().put(id, log);

    return log;
  }

  public async get(id: string): Promise<WebhookEventLog> {
    return await this.store().get(id);
  }

  public async getAll(): Promise<WebhookEventLog[]> {
    return (await this.store().getAll()) as WebhookEventLog[];
  }
}
