const transformUser = (user: any) => {
  return {
    id: user.id,
    first_name: user.name.givenName,
    last_name: user.name.familyName,
    email: user.emails[0].value,
    raw: user,
  };
};

const transformGroup = (group: any) => {
  return {
    id: group.id,
    name: group.displayName,
    members: group.members,
    raw: group,
  };
};

export { transformUser, transformGroup };
