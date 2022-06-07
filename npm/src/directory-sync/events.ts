import type {
  Directory,
  DirectorySyncEventType,
  Group,
  User,
  DatabaseStore,
  WebhookEventLog,
} from '../typings';
import { transformUser, transformGroup, transformUserGroup } from './transform';
import crypto from 'crypto';
import axios from 'axios';
import { WebhookEventLogger } from './logs';

export class WebhookEvents {
  private logger: WebhookEventLogger;

  constructor({ db }: { db: DatabaseStore }) {
    this.logger = new WebhookEventLogger({ db });
  }

  public async send(
    action: DirectorySyncEventType,
    payload: {
      directory: Directory;
      group?: Group;
      user?: User;
    }
  ) {
    const { directory, group, user } = payload;
    const { tenant, product, webhook } = directory;

    // If there is no webhook, then we don't need to send an event
    if (!webhook.endpoint) {
      return;
    }

    // Create a payload to send to the webhook
    const webhookPayload = {
      directory_id: directory.id,
      event: action,
      tenant,
      product,
    };

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

    const headers = {
      'Content-Type': 'application/json',
      'BoxyHQ-Signature': await createSignatureString(webhook.secret, webhookPayload),
    };

    // Log the event
    await this.logger.setTenantAndProduct(tenant, product).create(action, webhookPayload);

    // Send the event
    axios.post(webhook.endpoint, webhookPayload, { headers });

    return;
  }

  // public async getAll(): Promise<WebhookEventLog[]> {
  //   //
  // }
}

const createSignatureString = async (secret: string, payload: object) => {
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
