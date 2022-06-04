import type { DirectorySync } from '../typings';
import { Directories } from './directories';
import { DirectoryUsers } from './users';
import { DirectoryGroups } from './groups';
import { UsersController } from '../controller/users';
import { GroupsController } from '../controller/groups';
import { UsersRequestHandler, GroupsRequestHandler } from './request';

const directorySync = ({ db, opts }): DirectorySync => {
  const users = new UsersController({ db });
  const groups = new GroupsController({ db });

  const directory = new Directories({ db, opts });
  const directoryUsers = new DirectoryUsers({ directory, users, groups });
  const directoryGroups = new DirectoryGroups({ directory, users, groups });

  return {
    directories: directory,
    usersRequest: new UsersRequestHandler({ directoryUsers }),
    groupsRequest: new GroupsRequestHandler({ directoryGroups }),
    users: {},
    groups: {},
  };
};

export default directorySync;

// Example
// users.list()
// users.retrieve()
