import type { Storable } from '../../typings';
import { eventLockKey, eventLockTTL } from '../utils';

const lockRenewalInterval = (eventLockTTL / 2) * 1000;

interface Lock {
  key: string;
  created_at: string;
}

interface LockParams {
  lockStore: Storable;
}

let globalLock: EventLock | undefined;
export const getGlobalLock = ({ lockStore }: LockParams) => {
  if (!globalLock) {
    globalLock = new EventLock({ lockStore });
  }
  return globalLock;
};

export class EventLock {
  private lockStore: Storable;
  private key: string | undefined;
  private intervalId: NodeJS.Timeout | undefined;

  constructor({ lockStore }: LockParams) {
    this.lockStore = lockStore;
  }

  public async acquire(key: string) {
    try {
      this.key = key;
      const lock = await this.get();

      if (lock && !this.isExpired(lock)) {
        return lock.key === key;
      }

      await this.add(key);

      // Renew the lock periodically
      this.intervalId = setInterval(async () => {
        this.renew(this.key!);
      }, lockRenewalInterval);

      return true;
    } catch (e: any) {
      console.error(`Error acquiring lock for ${key}: ${e}`);
      return false;
    }
  }

  private async renew(key: string) {
    try {
      const lock = await this.get();

      if (!lock) {
        return;
      }

      if (lock.key != key) {
        return;
      }

      await this.add(key);
    } catch (e: any) {
      console.error(`Error renewing lock for ${key}: ${e}`);
    }
  }

  private async add(key: string) {
    const record = {
      key,
      created_at: new Date().toISOString(),
    };

    await this.lockStore.put(eventLockKey, record);
  }

  private async get() {
    return (await this.lockStore.get(eventLockKey)) as Lock;
  }

  public async release(key: string) {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    const lock = await this.get();

    if (!lock) {
      return;
    }

    if (lock.key != key) {
      return;
    }

    await this.lockStore.delete(eventLockKey);
  }

  private isExpired(lock: Lock) {
    const lockDate = new Date(lock.created_at);
    const currentDate = new Date();
    const diffSeconds = (currentDate.getTime() - lockDate.getTime()) / 1000;

    return diffSeconds > eventLockTTL;
  }
}
