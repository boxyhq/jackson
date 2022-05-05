import type { SCIMEventType } from '../typings';
import axios from 'axios';
import { transformUser, transformGroup } from './transform';

const sendEvent = async (event: SCIMEventType, payload: object, options: any) => {
  const type = getEventType(event);
  const { endpoint } = options;

  // TODO
  // Implement webhook security

  if (type === 'user') {
    payload = transformUser(payload);
  }

  if (type === 'group') {
    payload = transformGroup(payload);
  }

  axios.post(endpoint, {
    event,
    payload,
  });

  return;
};

// Get the event type
const getEventType = (event: SCIMEventType) => {
  if (event.startsWith('user.')) {
    return 'user';
  }

  if (event.startsWith('group.')) {
    return 'group';
  }

  throw new Error('Unknown event type');
};

export default {
  sendEvent,
};
