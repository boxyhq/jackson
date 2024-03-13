import { newGoogleProvider } from './google';
import type {
  IDirectoryConfig,
  IUsers,
  IGroups,
  IRequestHandler,
  JacksonOption,
  EventCallback,
} from '../../typings';
import { SyncUsers } from './syncUsers';
import { SyncGroups } from './syncGroups';
import { SyncGroupMembers } from './syncGroupMembers';

interface SyncParams {
  userController: IUsers;
  groupController: IGroups;
  opts: JacksonOption;
  directories: IDirectoryConfig;
  requestHandler: IRequestHandler;
}

let isJobRunning = false;
let timeoutId: NodeJS.Timeout;

// Method to start the directory sync process
// This method will be called by the directory sync cron job
export const startSync = async (syncParams: SyncParams, callback: EventCallback) => {
  const cronInterval = syncParams.opts.dsync?.providers?.google.cronInterval;

  const processWithTimeout = async () => {
    if (!cronInterval) {
      return;
    }

    if (isJobRunning) {
      return;
    }

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(async () => {
      await syncDirectories(syncParams, callback);
      processWithTimeout();
    }, cronInterval * 1000);
  };

  if (isJobRunning) {
    console.info('Sync job is already running. Skipping the current job');
    return;
  }

  if (cronInterval) {
    processWithTimeout();
  } else {
    await syncDirectories(syncParams, callback);
  }
};

const syncDirectories = async (syncParams: SyncParams, callback: EventCallback) => {
  if (isJobRunning) {
    return;
  }

  isJobRunning = true;

  const { userController, groupController, opts, directories, requestHandler } = syncParams;
  const { directory: provider } = newGoogleProvider({ directories, opts });

  const startTime = Date.now();

  console.info('Starting the sync process');

  const allDirectories = await provider.getDirectories();

  if (allDirectories.length === 0) {
    console.info('No directories found. Skipping the sync process');
    return;
  }

  try {
    for (const directory of allDirectories) {
      const params = {
        directory,
        userController,
        groupController,
        provider,
        requestHandler,
        callback,
      };

      await new SyncUsers(params).sync();
      await new SyncGroups(params).sync();
      await new SyncGroupMembers(params).sync();
    }
  } catch (e: any) {
    console.error(e);
  } finally {
    isJobRunning = false;
  }

  const endTime = Date.now();
  console.info(`Sync process completed in ${(endTime - startTime) / 1000} seconds`);
  isJobRunning = false;
};
