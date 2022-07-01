import { Group, User } from '../typings';

const transformUser = (user: User): User => {
  return {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    active: user.active,
    raw: user.raw,
  };
};

const transformGroup = (group: Group): Group => {
  return {
    id: group.id,
    name: group.name,
    raw: group.raw,
  };
};

const transformUserGroup = (user: User, group: Group): User | { group: Group } => {
  return {
    ...transformUser(user),
    group: transformGroup(group),
  };
};

export { transformUser, transformGroup, transformUserGroup };
