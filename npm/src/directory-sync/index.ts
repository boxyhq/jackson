import type { DirectorySync } from '../typings';

import { UsersController } from '../controller/users';
import { GroupsController } from '../controller/groups';
import { Directory } from './directory';
import { DirectoryUsers } from './users';
import { DirectoryGroups } from './groups';

const directorySync = ({ db, opts }): DirectorySync => {
  const scimStore = db.store('scim:config');

  const directory = new Directory({ scimStore, opts });
  const users = new UsersController({ db });
  const groups = new GroupsController({ db });

  return {
    directory,
    users: new DirectoryUsers({ directory, users }),
    groups: new DirectoryGroups({ directory, users, groups }),
  };
};

export default directorySync;
