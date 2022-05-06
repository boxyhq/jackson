const transformUser = (user: any) => {
  return {
    id: user.id,
    firstName: user.name.givenName,
    lastName: user.name.familyName,
    email: user.emails[0],
    emails: user.emails,
    username: user.userName,
    groups: user.groups,
    active: user.active,
    tenant: user.tenant,
    product: user.product,
    event: user.event,
    raw: user,
  };
};

const transformGroup = (group: any) => {
  return group;
};

export { transformUser, transformGroup };
