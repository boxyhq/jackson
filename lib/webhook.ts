import axios from 'axios';

const endpoint = 'http://localhost:5225/api/webhook';
const tenant = 'boxyhq.com';
const product = 'flex';

export const sendEvent = ({ event, type, payload }) => {
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
};

const transformUser = (user: any) => {
  return {
    id: user.id,
    first_name: user.name.givenName,
    last_name: user.name.familyName,
    username: user.userName,
    emails: user.emails,
    groups: user.groups,
    state: user.active,
    tenant,
    product,
    raw: user,
  };
};

const transformGroup = (group: any) => {
  return group;
};
