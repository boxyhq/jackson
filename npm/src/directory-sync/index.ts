import type { DatabaseStore, JacksonOption, IEventController, EventCallback } from '../typings';
import { DirectoryConfig } from './scim/DirectoryConfig';
import { DirectoryUsers } from './scim/DirectoryUsers';
import { DirectoryGroups } from './scim/DirectoryGroups';
import { Users } from './scim/Users';
import { Groups } from './scim/Groups';
import { getDirectorySyncProviders } from './scim/utils';
import { RequestHandler } from './request';
import { handleEventCallback } from './scim/events';
import { WebhookEventsLogger } from './scim/WebhookEventsLogger';
import { newGoogleProvider } from './non-scim/google';
import { startSync } from './non-scim';

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
  const requestHandler = new RequestHandler(directoryUsers, directoryGroups);

  // Fetch the supported providers
  const getProviders = () => {
    return getDirectorySyncProviders();
  };

  // Non-SCIM directory providers
  const googleProvider = newGoogleProvider({ directories, opts });

  const nonSCIM = {
    google: googleProvider.oauth,
    sync: async (callback: EventCallback) => {
      return await startSync({ users, groups, opts, directories, requestHandler }, callback);
    },
  };

  return {
    users,
    groups,
    directories,
    webhookLogs: logger,
    requests: requestHandler,
    providers: getProviders,
    events: {
      callback: await handleEventCallback(directories, logger),
    },
    ...nonSCIM,
  };
};

export default directorySync;
