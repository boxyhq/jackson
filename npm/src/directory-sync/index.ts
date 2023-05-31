import type { DatabaseStore, JacksonOption, IEventController } from '../typings';
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
import { SyncUsers } from './non-scim/syncUsers';
import { SyncGroups } from './non-scim/syncGroups';
import { SyncGroupMembers } from './non-scim/syncGroupMembers';

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
  const providers = [googleProvider.directory];

  const sync = async () => {
    for (const provider of providers) {
      await new SyncUsers({ users, directories, provider, requestHandler }).sync();
      await new SyncGroups({ groups, directories, provider, requestHandler }).sync();
      await new SyncGroupMembers({ groups, directories, provider, requestHandler }).sync();
    }
  };

  const nonSCIM = {
    google: googleProvider.oauth,
    sync,
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
