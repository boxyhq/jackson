import type { Storable } from '../../typings';
import { eventLockKey, eventLockTTL } from '../utils';

interface Lock {
  key: string;
  created_at: string;
}

interface LockParams {
  lockStore: Storable;
}

export class EventLock {
  private lockStore: Storable;

  constructor({ lockStore }: LockParams) {
    this.lockStore = lockStore;
  }

  public async acquire(key: string) {
    try {
      const lock = await this.get();

      if (lock) {
        return lock.key === key;
      }

      await this.add(key);

      return true;
    } catch (e: any) {
      console.error(`Error acquiring lock for ${key}: ${e}`);
      return false;
    }
  }

  public async renew(key: string) {
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

  async add(key: string) {
    const record = {
      key,
      created_at: new Date().toISOString(),
    };

    await this.lockStore.put(eventLockKey, record);
  }

  async get() {
    return (await this.lockStore.get(eventLockKey)) as Lock;
  }

  async release(key: string) {
    const lock = await this.get();

    if (!lock) {
      return;
    }

    if (lock.key != key) {
      return;
    }

    await this.lockStore.delete(eventLockKey);
  }

  isExpired(lock: Lock) {
    const lockDate = new Date(lock.created_at);
    const currentDate = new Date();
    const diffSeconds = (currentDate.getTime() - lockDate.getTime()) / 1000;

    return diffSeconds > eventLockTTL;
  }
}
