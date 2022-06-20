import type { DirectorySync } from '../typings';
import { DirectoryConfig } from './DirectoryConfig';
import { DirectoryUsers } from './DirectoryUsers';
import { DirectoryGroups } from './DirectoryGroups';
import { Users } from './Users';
import { Groups } from './Groups';
import { WebhookEvents } from './WebhookEvents';
import { getDirectorySyncProviders } from './utils';
import { UsersRequestHandler, GroupsRequestHandler } from './request';

const directorySync = ({ db, opts }): DirectorySync => {
  const users = new Users({ db });
  const groups = new Groups({ db });

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
