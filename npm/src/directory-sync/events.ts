import type { SCIMConfig, SCIMEventType } from '../typings';
import { transformUser, transformGroup } from './transform';
import crypto from 'crypto';
import axios from 'axios';

interface Event {
  action: SCIMEventType;
  payload: {
    tenant: string;
    product: string;
    data: any;
  };
  options: Pick<SCIMConfig, 'webhook'>;
}

const sendEvent = async (event: Event) => {
  const { action, payload, options } = event;
  console.log({ action, payload, options });

  // const objectType: 'user' | 'group' = getObjectType(type);
  // const { webhook } = options;
  // const { tenant, product, data } = payload;

  // // Create a payload to send to the webhook
  // const webhookPayload = {
  //   event: type,
  //   object: objectType,
  //   tenant,
  //   product,
  // };

  // if (objectType === 'user') {
  //   webhookPayload['data'] = transformUser(data);
  // }

  // if (objectType === 'group') {
  //   webhookPayload['data'] = transformGroup(data);
  // }

  // const headers = {
  //   'Content-Type': 'application/json',
  //   'BoxyHQ-Signature': await createSignatureString(webhook.secret, webhookPayload),
  // };

  // // TODO: Handle the error like timeout, etc

  // axios.post(webhook.endpoint, webhookPayload, { headers });

  // return;
};

const getObjectType = (type: SCIMEventType) => {
  if (type.startsWith('user.')) {
    return 'user';
  }

  if (type.startsWith('group.')) {
    return 'group';
  }

  throw new Error('Unknown event type');
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
