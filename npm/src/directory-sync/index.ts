import type { DatabaseStore, JacksonOption } from '../typings';
import { DirectoryConfig } from './DirectoryConfig';
import { DirectoryUsers } from './DirectoryUsers';
import { DirectoryGroups } from './DirectoryGroups';
import { Users } from './Users';
import { Groups } from './Groups';
import { getDirectorySyncProviders } from './utils';
import { RequestHandler } from './request';
import { handleEventCallback } from './events';
import { WebhookEventsLogger } from './WebhookEventsLogger';

const directorySync = async ({ db, opts }: { db: DatabaseStore; opts: JacksonOption }) => {
  const users = new Users({ db });
  const groups = new Groups({ db });
  const logger = new WebhookEventsLogger({ db });
  const directories = new DirectoryConfig({ db, opts, users, groups, logger });

  const directoryUsers = new DirectoryUsers({ directories, users });
  const directoryGroups = new DirectoryGroups({ directories, users, groups });

  return {
    users,
    groups,
    directories,
    webhookLogs: logger,
    requests: new RequestHandler(directoryUsers, directoryGroups),
    events: {
      callback: await handleEventCallback(directories, logger),
    },
    providers: () => {
      return getDirectorySyncProviders();
    },
  };
};

export default directorySync;
