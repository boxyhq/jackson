import type { DirectoryConfig, DirectorySyncEventType, Group, User } from '../typings';
import { transformUser, transformGroup, transformUserGroup } from './transform';
import crypto from 'crypto';
import axios from 'axios';

const sendEvent = async (
  action: DirectorySyncEventType,
  payload: {
    directory: DirectoryConfig;
    group?: Group;
    user?: User;
  }
) => {
  const { directory, group, user } = payload;
  const { tenant, product, webhook } = directory;

  // If there is no webhook, then we don't need to send an event
  if (webhook === undefined) {
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

  console.log(webhookPayload);

  const headers = {
    'Content-Type': 'application/json',
    'BoxyHQ-Signature': await createSignatureString(webhook.secret, webhookPayload),
  };

  axios.post(webhook.endpoint, webhookPayload, { headers });

  return;
};

const createSignatureString = async (secret: string, payload: object) => {
  const timestamp = new Date().getTime();

  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${JSON.stringify(payload)}`)
    .digest('hex');

  return `t=${timestamp},s=${signature}`;
};

export { sendEvent };
