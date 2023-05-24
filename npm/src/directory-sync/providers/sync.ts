import { SyncUsers } from './sync-users';
import { SyncGroups } from './sync-groups';
import { getGogleProvider } from './google';
import type { IDirectoryConfig, IGroups, IUsers, JacksonOption, IRequestHandler } from '../../typings';

interface SyncParams {
  users: IUsers;
  groups: IGroups;
  opts: JacksonOption;
  directories: IDirectoryConfig;
  requestHandler: IRequestHandler;
}

export const sync = async (params: SyncParams) => {
  const { users, groups, opts, directories, requestHandler } = params;

  // Add new providers here
  const googleProvider = getGogleProvider({ directories, opts });

  const providers = [googleProvider.provider];

  for (const provider of providers) {
    await new SyncUsers({ users, directories, provider, requestHandler }).sync();
    await new SyncGroups({ groups, directories, provider, requestHandler }).sync();
  }
};
