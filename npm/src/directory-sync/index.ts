import type { DirectorySync } from '../typings';
import { DirectoryConfig } from './directories';
import { DirectoryUsers } from './users';
import { DirectoryGroups } from './groups';
import { UsersController } from '../controller/users';
import { GroupsController } from '../controller/groups';
import { UsersRequestHandler, GroupsRequestHandler } from './request';

const directorySync = ({ db, opts }): DirectorySync => {
  const users = new UsersController({ db });
  const groups = new GroupsController({ db });

  const directories = new DirectoryConfig({ db, opts, users, groups });
  const directoryUsers = new DirectoryUsers({ directories, users, groups });
  const directoryGroups = new DirectoryGroups({ directories, users, groups });

  return {
    directories,
    users,
    groups,
    usersRequest: new UsersRequestHandler({ directoryUsers }),
    groupsRequest: new GroupsRequestHandler({ directoryGroups }),
  };
};

export default directorySync;
