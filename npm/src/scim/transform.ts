const transformUser = (user: any) => {
  return {
    event: user.event,
    tenant: user.tenant,
    product: user.product,
    data: {
      id: user.externalId,
      first_name: user.name.givenName,
      last_name: user.name.familyName,
      email: user.emails[0].value,
      raw: user,
    },

    // firstName: user.name.givenName,
    // lastName: user.name.familyName,
    // emails: user.emails,
    // username: user.userName,
    // groups: user.groups,
    // active: user.active,
  };
};

const transformGroup = (group: any) => {
  return {
    event: group.event,
    tenant: group.tenant,
    product: group.product,
    data: {
      id: group.id,
      name: group.name,
    },
  };
};

export { transformUser, transformGroup };
