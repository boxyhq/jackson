import type { DirectorySync } from '../typings';
import { Directory } from './directory';
import { DirectoryUsers } from './users';
import { DirectoryGroups } from './groups';
import { UsersController } from '../controller/users';
import { GroupsController } from '../controller/groups';

const directorySync = ({ db, opts }): DirectorySync => {
  const directory = new Directory({ db, opts });
  const users = new UsersController({ db });
  const groups = new GroupsController({ db });

  return {
    directory,
    users: new DirectoryUsers({ directory, users, groups }),
    groups: new DirectoryGroups({ directory, users, groups }),
  };
};

export default directorySync;
