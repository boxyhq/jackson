import type { DatabaseStore, DirectorySync, JacksonOption } from '../typings';
import { DirectoryConfig } from './DirectoryConfig';
import { DirectoryUsers } from './DirectoryUsers';
import { DirectoryGroups } from './DirectoryGroups';
import { Users } from './Users';
import { Groups } from './Groups';
import { getDirectorySyncProviders } from './utils';
import { UsersRequestHandler, GroupsRequestHandler } from './request';
import { Events } from './Events';

const directorySync = ({ db, opts }: { db: DatabaseStore; opts: JacksonOption }): DirectorySync => {
  const directories = new DirectoryConfig({ db, opts });

  const users = new Users({ db });
  const groups = new Groups({ db });

  const directoryUsers = new DirectoryUsers({ directories, users, groups });
  const directoryGroups = new DirectoryGroups({ directories, users, groups });

  return {
    directories,
    users,
    groups,
    events: new Events({ db, directories }),
    usersRequest: new UsersRequestHandler(directoryUsers),
    groupsRequest: new GroupsRequestHandler(directoryGroups),
    providers: () => {
      return getDirectorySyncProviders();
    },
  };
};

export default directorySync;
