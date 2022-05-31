import { Group, User } from '../typings';

const transformUser = (user: User) => {
  return {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    raw: user.raw,
  };
};

const transformGroup = (group: Group) => {
  return {
    id: group.id,
    name: group.name,
  };
};

const transformUserGroup = (user: User, group: Group) => {
  return {
    ...transformUser(user),
    group: transformGroup(group),
  };
};

export { transformUser, transformGroup, transformUserGroup };
