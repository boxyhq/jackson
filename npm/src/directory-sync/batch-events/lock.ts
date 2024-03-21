import { randomUUID } from 'crypto';
import type { Storable } from '../../typings';
import { eventLockKey, eventLockTTL } from '../utils';

const lockRenewalInterval = (eventLockTTL / 2) * 1000;
const lockKey = randomUUID();

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
  private intervalId: NodeJS.Timeout | undefined;
  private count: number = 0;

  constructor({ lockStore }: LockParams) {
    this.lockStore = lockStore;
  }

  public async acquire() {
    try {
      const lock = await this.get();

      if (lock && !this.isExpired(lock)) {
        return lock.key === lockKey;
      }

      await this.add();

      // Renew the lock periodically
      if (!this.intervalId) {
        this.intervalId = setInterval(async () => {
          this.renew();
        }, lockRenewalInterval);
      }

      this.count++;

      return true;
    } catch (e: any) {
      console.error(`Error acquiring lock for ${lockKey}: ${e}`);
      return false;
    }
  }

  private async renew() {
    try {
      const lock = await this.get();

      if (!lock) {
        return;
      }

      if (lock.key != lockKey) {
        return;
      }

      await this.add();
    } catch (e: any) {
      console.error(`Error renewing lock for ${lockKey}: ${e}`);
    }
  }

  private async add() {
    const record = {
      key: lockKey,
      created_at: new Date().toISOString(),
    };

    await this.lockStore.put(eventLockKey, record);
  }

  private async get() {
    return (await this.lockStore.get(eventLockKey)) as Lock;
  }

  public async release() {
    this.count--;

    if (this.intervalId && this.count === 0) {
      clearInterval(this.intervalId);
    }

    const lock = await this.get();

    if (!lock) {
      return;
    }

    if (lock.key != lockKey) {
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
