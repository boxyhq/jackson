import { Users } from './Users';
import { Groups } from './Groups';
import { sync } from './provider/sync';
import { RequestHandler } from './request';
import { handleEventCallback } from './events';
import { DirectoryUsers } from './DirectoryUsers';
import { DirectoryGroups } from './DirectoryGroups';
import { DirectoryConfig } from './DirectoryConfig';
import { getDirectorySyncProviders } from './utils';
import { getGogleProvider } from './provider/google';
import { WebhookEventsLogger } from './WebhookEventsLogger';
import type { DatabaseStore, JacksonOption, IEventController } from '../typings';

interface DirectorySyncParams {
  db: DatabaseStore;
  opts: JacksonOption;
  eventController: IEventController;
}

const directorySync = async (params: DirectorySyncParams) => {
  const { db, opts, eventController } = params;

  const users = new Users({ db });
  const groups = new Groups({ db });
  const logger = new WebhookEventsLogger({ db });
  const directories = new DirectoryConfig({ db, opts, users, groups, logger, eventController });

  const directoryUsers = new DirectoryUsers({ directories, users });
  const directoryGroups = new DirectoryGroups({ directories, users, groups });

  // Other Directory Providers
  const googleProvider = getGogleProvider({ directories, opts });

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
    sync: async () => {
      return await sync({ directories, groups, opts });
    },
    google: googleProvider,
  };
};

export default directorySync;
