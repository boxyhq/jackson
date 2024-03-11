import type { EventPayloadSchema, Webhook } from '../typings';
import crypto from 'crypto';
import axios from './axios';

export const createSignatureString = (secret: string, payload: any) => {
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

export const sendPayloadToWebhook = async (
  webhook: Webhook,
  payload: EventPayloadSchema | EventPayloadSchema[],
  debugWebhooks: boolean | undefined
) => {
  if (debugWebhooks) {
    console.log('Sending payload to webhook:', JSON.stringify(payload, null, 2));
  }

  return await axios.post(webhook.endpoint, payload, {
    headers: {
      'Content-Type': 'application/json',
      'BoxyHQ-Signature': createSignatureString(webhook.secret, payload),
    },
  });
};
