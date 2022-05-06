import type { SCIMConfig, SCIMEventType } from '../typings';
import { transformUser, transformGroup } from './transform';
import crypto from 'crypto';
import axios from 'axios';

const sendEvent = async (type: SCIMEventType, payload: object, options: Pick<SCIMConfig, 'webhook'>) => {
  const objectType = getObjectType(type);
  const { webhook } = options;

  payload['event'] = type;

  if (objectType === 'user') {
    payload = transformUser(payload);
  }

  if (objectType === 'group') {
    payload = transformGroup(payload);
  }

  const headers = {
    'Content-Type': 'application/json',
    'BoxyHQ-Signature': await createSignatureString(webhook.secret, payload),
  };

  axios.post(webhook.endpoint, payload, { headers });

  return;
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
