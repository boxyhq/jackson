import type { JacksonOption, IEventController, EventCallback, DB } from '../typings';
import { DirectoryConfig } from './scim/DirectoryConfig';
import { DirectoryUsers } from './scim/DirectoryUsers';
import { DirectoryGroups } from './scim/DirectoryGroups';
import { Users } from './scim/Users';
import { Groups } from './scim/Groups';
import { getDirectorySyncProviders } from './scim/utils';
import { RequestHandler } from './request';
import { WebhookEventsLogger } from './scim/WebhookEventsLogger';
import { newGoogleProvider } from './non-scim/google';
import { startSync } from './non-scim';
import { storeNamespacePrefix } from '../controller/utils';
import { eventLockTTL, handleEventCallback } from './event/utils';
import { EventProcessor } from './event/queue';
import { EventLock } from './event/lock';

const directorySync = async (params: { db: DB; opts: JacksonOption; eventController: IEventController }) => {
  const { db, opts, eventController } = params;

  const users = new Users({ db });
  const groups = new Groups({ db });
  const webhookLogs = new WebhookEventsLogger({ db });
  const directories = new DirectoryConfig({
    db,
    opts,
    users,
    groups,
    logger: webhookLogs,
    eventController,
  });

  const directoryUsers = new DirectoryUsers({ directories, users });
  const directoryGroups = new DirectoryGroups({ directories, users, groups });
  const requestHandler = new RequestHandler(directoryUsers, directoryGroups);

  // Fetch the supported providers
  const getProviders = () => {
    return getDirectorySyncProviders();
  };

  const googleProvider = newGoogleProvider({ directories, opts });

  // Batch send events
  const eventStore = db.store(storeNamespacePrefix.dsync.events);
  const lockStore = db.store(storeNamespacePrefix.dsync.lock, eventLockTTL);
  const eventLock = new EventLock({ lockStore });
  const eventProcessor = new EventProcessor({
    opts,
    eventStore,
    eventLock,
    directories,
    webhookLogs,
  });

  return {
    users,
    groups,
    directories,
    webhookLogs,
    requests: requestHandler,
    providers: getProviders,
    events: {
      callback: await handleEventCallback({
        opts,
        directories,
        webhookLogs,
        eventProcessor,
      }),
      batch: eventProcessor,
    },
    google: googleProvider.oauth,
    sync: async (callback: EventCallback) => {
      return await startSync(
        {
          userController: users,
          groupController: groups,
          opts,
          directories,
          requestHandler,
        },
        callback
      );
    },
  };
};

export default directorySync;
