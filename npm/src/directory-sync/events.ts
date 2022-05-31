import type { SCIMConfig, SCIMEventType } from '../typings';
import { transformUser, transformGroup, transformUserGroup } from './transform';
import crypto from 'crypto';
import axios from 'axios';

const sendEvent = async (action: SCIMEventType, payload: any, options: Pick<SCIMConfig, 'webhook'>) => {
  const { webhook } = options;
  const { tenant, product } = payload;

  // Create a payload to send to the webhook
  const webhookPayload = {
    event: action,
    tenant,
    product,
  };

  if (['user.created', 'user.updated', 'user.deleted'].includes(action)) {
    webhookPayload['data'] = transformUser(payload.user);
  }

  if (['group.created', 'group.updated', 'group.deleted'].includes(action)) {
    webhookPayload['data'] = transformGroup(payload.group);
  }

  if (['group.user_added', 'group.user_removed'].includes(action)) {
    webhookPayload['data'] = transformUserGroup(payload.user, payload.group);
  }

  const headers = {
    'Content-Type': 'application/json',
    'BoxyHQ-Signature': await createSignatureString(webhook.secret, webhookPayload),
  };

  // TODO: Handle the error like timeout, etc

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
