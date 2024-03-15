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
  eventCallback: EventCallback;
}

let isJobRunning = false;
let timeoutId: NodeJS.Timeout;

export class SyncProviders {
  private userController: IUsers;
  private groupController: IGroups;
  private directories: IDirectoryConfig;
  private requestHandler: IRequestHandler;
  private opts: JacksonOption;
  private cronInterval: number | undefined;
  private eventCallback: EventCallback;

  constructor({
    userController,
    groupController,
    opts,
    directories,
    requestHandler,
    eventCallback,
  }: SyncParams) {
    this.userController = userController;
    this.groupController = groupController;
    this.directories = directories;
    this.requestHandler = requestHandler;
    this.eventCallback = eventCallback;
    this.opts = opts;
    this.cronInterval = this.opts.dsync?.providers?.google.cronInterval;

    if (this.cronInterval) {
      this.scheduleSync = this.scheduleSync.bind(this);
      this.scheduleSync();
    }
  }

  // Start the sync process
  public async startSync() {
    if (isJobRunning) {
      console.info('A sync process is already running. Skipping the sync process');
      return;
    }

    isJobRunning = true;

    const { directory: provider } = newGoogleProvider({ directories: this.directories, opts: this.opts });

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
          provider,
          userController: this.userController,
          groupController: this.groupController,
          requestHandler: this.requestHandler,
          callback: this.eventCallback,
        };

        await new SyncUsers(params).sync();
        await new SyncGroups(params).sync();
        await new SyncGroupMembers(params).sync();
      }
    } catch (e: any) {
      console.error(e);
    }

    const endTime = Date.now();
    console.info(`Sync process completed in ${(endTime - startTime) / 1000} seconds`);

    isJobRunning = false;

    if (this.cronInterval) {
      this.scheduleSync();
    }
  }

  // Schedule the next sync process
  private scheduleSync() {
    if (!this.cronInterval) {
      return;
    }

    if (isJobRunning) {
      return;
    }

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => this.startSync(), this.cronInterval * 1000);
  }
}
