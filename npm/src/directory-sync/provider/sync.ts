import { SyncGroup } from './groupSync';
import { getGogleProvider } from './google';
import type { EventCallback, IDirectoryConfig, IGroups, JacksonOption } from '../../typings';

interface SyncParams {
  groups: IGroups;
  opts: JacksonOption;
  directories: IDirectoryConfig;
  callback?: EventCallback | undefined;
}

export const sync = (params: SyncParams) => {
  const { groups, opts, directories, callback } = params;

  const googleProvider = getGogleProvider({ directories, opts });

  // Add new providers here
  const providers = [googleProvider.provider];

  const start = async () => {
    for (const provider of providers) {
      new SyncGroup({ groups, directories, callback, provider }).sync();
    }
  };

  return {
    start,
  };
};
