import type { DirectorySync } from '../typings';
import { Directory } from './directory';
import { DirectoryUsers } from './users';
import { DirectoryGroups } from './groups';
import { UsersController } from '../controller/users';
import { GroupsController } from '../controller/groups';
import { UsersRequestHandler, GroupsRequestHandler } from './request';

const directorySync = ({ db, opts }): DirectorySync => {
  const users = new UsersController({ db });
  const groups = new GroupsController({ db });

  const directory = new Directory({ db, opts });
  const directoryUsers = new DirectoryUsers({ directory, users, groups });
  const directoryGroups = new DirectoryGroups({ directory, users, groups });

  return {
    directory,
    usersRequest: new UsersRequestHandler({ directoryUsers }),
    groupsRequest: new GroupsRequestHandler({ directoryGroups }),
  };
};

export default directorySync;
