import type { DirectorySync } from '../typings';
import { DirectoryConfig } from './directories';
import { DirectoryUsers } from './users';
import { DirectoryGroups } from './groups';
import { UsersController } from '../controller/users';
import { GroupsController } from '../controller/groups';
import { UsersRequestHandler, GroupsRequestHandler } from './request';
import { WebhookEvents } from './events';
import { getDirectorySyncProviders } from './utils';

const directorySync = ({ db, opts }): DirectorySync => {
  const users = new UsersController({ db });
  const groups = new GroupsController({ db });

  const webhookEvents = new WebhookEvents({ db });
  const directories = new DirectoryConfig({ db, opts });
  const directoryUsers = new DirectoryUsers({ directories, users, groups, webhookEvents });
  const directoryGroups = new DirectoryGroups({ directories, users, groups, webhookEvents });

  return {
    directories,
    users,
    groups,
    usersRequest: new UsersRequestHandler({ directoryUsers }),
    groupsRequest: new GroupsRequestHandler({ directoryGroups }),
    events: webhookEvents,
    providers: () => {
      return getDirectorySyncProviders();
    },
  };
};

export default directorySync;
