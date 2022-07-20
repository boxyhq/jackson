import type {
  DirectorySyncEventType,
  Directory,
  User,
  Group,
  EventCallback,
  DirectorySyncEvent,
  DatabaseStore,
  DirectoryConfig,
} from '../typings';
import { createHeader, transformEventPayload } from './utils';
import { WebhookEvents } from './WebhookEvents';
import axios from 'axios';

export class Events {
  private db: DatabaseStore;
  private directories: DirectoryConfig;
  private _webhookEvents: WebhookEvents;

  constructor({ db, directories }: { db: DatabaseStore; directories: DirectoryConfig }) {
    this.db = db;
    this.directories = directories;
    this._webhookEvents = new WebhookEvents({ db: this.db });
  }

  get webhookEvents() {
    return this._webhookEvents || new WebhookEvents({ db: this.db });
  }

  public async handle(event: DirectorySyncEvent) {
    return await this.send('webhook', event);
  }

  private async send(channel: 'webhook', event: DirectorySyncEvent) {
    if (channel === 'webhook') {
      return await this.sendWebhook(event);
    }
  }

  private async sendWebhook(event: DirectorySyncEvent) {
    const { tenant, product, directory_id: directoryId } = event;

    const { data: directory } = await this.directories.get(directoryId);

    if (!directory) {
      return;
    }

    const { webhook } = directory;

    // If there is no webhook, then we don't need to send an event
    if (webhook.endpoint === '') {
      return;
    }

    this.webhookEvents.setTenantAndProduct(tenant, product);

    const headers = await createHeader(webhook.secret, event);

    // Log the events only if `log_webhook_events` is enabled
    const log = directory.log_webhook_events ? await this.webhookEvents.log(directory, event) : undefined;

    let status = 200;

    try {
      await axios.post(webhook.endpoint, event, { headers });
    } catch (err: any) {
      status = err.response ? err.response.status : 500;
    }

    if (log) {
      await this.webhookEvents.updateStatus(log, status);
    }
  }
}

export const sendEvent = async (
  event: DirectorySyncEventType,
  payload: { directory: Directory; group?: Group | null; user?: User | null },
  callback?: EventCallback
) => {
  const eventTransformed = transformEventPayload(event, payload);

  return callback ? callback(eventTransformed) : Promise.resolve();
};
