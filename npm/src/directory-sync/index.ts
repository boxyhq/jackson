import { Users } from './Users';
import { Groups } from './Groups';
import { sync } from './provider/sync';
import { RequestHandler } from './request';
import { dsyncEventEmitter, handleEventCallback } from './events';
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
  const requestHandler = new RequestHandler(directoryUsers, directoryGroups);

  const syncDirectories = async () => {
    return await sync({
      directories,
      users,
      groups,
      opts,
      requestHandler,
    });
  };

  // Other Directory Providers
  const googleProvider = getGogleProvider({ directories, opts });

  // Fetch the supported providers
  const getProviders = () => {
    return getDirectorySyncProviders();
  };

  return {
    users,
    groups,
    directories,
    webhookLogs: logger,
    requests: requestHandler,
    events: dsyncEventEmitter,
    providers: getProviders,
    sync: syncDirectories,
    directoryProviders: {
      google: googleProvider,
    },
    // events: {
    //   callback: await handleEventCallback(directories, logger),
    // },
  };
};

export default directorySync;
