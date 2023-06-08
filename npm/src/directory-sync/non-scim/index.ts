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

// Method to start the directory sync process
// This method will be called by the directory sync cron job
export const startSync = async (params: SyncParams, callback: EventCallback) => {
  const { userController, groupController, opts, directories, requestHandler } = params;

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
      // await new SyncGroupMembers(params).sync();
    }
  } catch (e: any) {
    console.error(e);
  }

  const endTime = Date.now();

  console.info(`Sync process completed in ${(endTime - startTime) / 1000} seconds`);
};
