import type {
  Directory,
  DirectorySyncEventType,
  Group,
  User,
  DatabaseStore,
  WebhookEventLog,
  Storable,
  WebhookPayload,
} from '../typings';
import { transformUser, transformGroup, transformUserGroup } from './transform';
import crypto from 'crypto';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { storeNamespacePrefix } from '../controller/utils';

export class WebhookEvents {
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

    return this.db.store(`${storeNamespacePrefix.dsync.logs}:${this.tenant}:${this.product}`);
  }

  // Set the tenant and product
  public setTenantAndProduct(tenant: string, product: string): WebhookEvents {
    this.tenant = tenant;
    this.product = product;

    return this;
  }

  // Set the tenant and product
  public with(tenant: string, product: string): WebhookEvents {
    return this.setTenantAndProduct(tenant, product);
  }

  public async send(
    action: DirectorySyncEventType,
    payload: {
      directory: Directory;
      group?: Group;
      user?: User;
    }
  ) {
    const { directory } = payload;
    const { tenant, product, webhook } = directory;

    // If there is no webhook, then we don't need to send an event
    if (webhook.endpoint === '') {
      return;
    }

    this.setTenantAndProduct(tenant, product);

    const webhookPayload = createPayload(action, payload);
    const headers = await createHeader(webhook.secret, webhookPayload);

    // Log the events only if `log_webhook_events` is enabled
    const log = directory.log_webhook_events ? await this.log(directory, webhookPayload) : undefined;

    let status = 200;

    try {
      await axios.post(webhook.endpoint, webhookPayload, { headers });
    } catch (err: any) {
      status = err.response ? err.response.status : 500;
    }

    if (log) {
      await this.updateStatus(log, status);
    }

    return;
  }

  public async log(directory: Directory, webhookPayload: any): Promise<WebhookEventLog> {
    const id = uuidv4();

    const log: WebhookEventLog = {
      id,
      directory_id: directory.id,
      event: webhookPayload.event,
      webhook_endpoint: directory.webhook.endpoint,
      payload: webhookPayload,
      created_at: new Date(),
    };

    await this.store().put(id, log);

    return log;
  }

  public async updateStatus(log: WebhookEventLog, statusCode: number): Promise<WebhookEventLog> {
    const updatedLog = {
      ...log,
      status_code: statusCode,
      delivered: statusCode === 200,
    };

    await this.store().put(log.id, updatedLog);

    return updatedLog;
  }

  public async get(id: string): Promise<WebhookEventLog> {
    return await this.store().get(id);
  }

  public async getAll(): Promise<WebhookEventLog[]> {
    return (await this.store().getAll()) as WebhookEventLog[];
  }

  public async delete(id: string) {
    await this.store().delete(id);
  }

  // Clear all the events
  public async clear() {
    const events = await this.getAll();

    await Promise.all(
      events.map(async (event) => {
        await this.delete(event.id);
      })
    );
  }
}

// Create a webhook payload
export const createPayload = (
  action: string,
  payload: {
    directory: Directory;
    group?: Group;
    user?: User;
  }
): WebhookPayload => {
  const { directory, group, user } = payload;
  const { tenant, product } = directory;

  // Create a payload to send to the webhook
  const webhookPayload = {
    directory_id: directory.id,
    event: action,
    tenant,
    product,
  } as WebhookPayload;

  // User events
  if (['user.created', 'user.updated', 'user.deleted'].includes(action) && user) {
    webhookPayload['data'] = transformUser(user);
  }

  // Group events
  if (['group.created', 'group.updated', 'group.deleted'].includes(action) && group) {
    webhookPayload['data'] = transformGroup(group);
  }

  // Group membership events
  if (['group.user_added', 'group.user_removed'].includes(action) && user && group) {
    webhookPayload['data'] = transformUserGroup(user, group);
  }

  return webhookPayload;
};

// Create request headers
export const createHeader = async (secret: string, webhookPayload: any) => {
  return {
    'Content-Type': 'application/json',
    'BoxyHQ-Signature': await createSignatureString(secret, webhookPayload),
  };
};

// Create a signature string
export const createSignatureString = async (secret: string, payload: object) => {
  if (!secret) {
    return '';
  }

  const timestamp = new Date().getTime();

  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${JSON.stringify(payload)}`)
    .digest('hex');

  return `t=${timestamp},s=${signature}`;
};
