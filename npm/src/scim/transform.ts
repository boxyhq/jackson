const tenant = 'boxyhq.com';
const product = 'flex';

export const transformUser = (user: any) => {
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

export const transformGroup = (group: any) => {
  return group;
};
