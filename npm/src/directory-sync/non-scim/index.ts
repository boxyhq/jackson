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
  users: IUsers;
  groups: IGroups;
  opts: JacksonOption;
  directories: IDirectoryConfig;
  requestHandler: IRequestHandler;
}

// Method to start the directory sync process
// This method will be called by the directory sync cron job
export const startSync = async (params: SyncParams, callback: EventCallback) => {
  const { users, groups, opts, directories, requestHandler } = params;

  const { directory: provider } = newGoogleProvider({ directories, opts });

  const startTime = Date.now();

  console.info('Starting the sync process');

  await new SyncUsers({ users, directories, provider, requestHandler, callback }).sync();
  await new SyncGroups({ groups, directories, provider, requestHandler, callback }).sync();
  await new SyncGroupMembers({ groups, directories, provider, requestHandler, callback }).sync();

  const endTime = Date.now();

  console.info(`Sync process completed in ${(endTime - startTime) / 1000} seconds`);
};
