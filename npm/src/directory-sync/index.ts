import type { DatabaseStore, JacksonOption, IEventController } from '../typings';
import { DirectoryConfig } from './DirectoryConfig';
import { DirectoryUsers } from './DirectoryUsers';
import { DirectoryGroups } from './DirectoryGroups';
import { Users } from './Users';
import { Groups } from './Groups';
import { getDirectorySyncProviders } from './utils';
import { RequestHandler } from './request';
import { handleEventCallback } from './events';
import { WebhookEventsLogger } from './WebhookEventsLogger';
import initGoogleProvider from './provider/google';

const directorySync = async (params: {
  db: DatabaseStore;
  opts: JacksonOption;
  eventController: IEventController;
}) => {
  const { db, opts, eventController } = params;

  const users = new Users({ db });
  const groups = new Groups({ db });
  const logger = new WebhookEventsLogger({ db });
  const directories = new DirectoryConfig({ db, opts, users, groups, logger, eventController });

  const directoryUsers = new DirectoryUsers({ directories, users });
  const directoryGroups = new DirectoryGroups({ directories, users, groups });

  // Other Directory Providers
  const googleProvider = initGoogleProvider({ users, groups, directories, opts });

  const sync = async () => {
    await googleProvider.groups.sync();
  };

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
    google: googleProvider,
    sync,
  };
};

export default directorySync;
