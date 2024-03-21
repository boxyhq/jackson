import { randomUUID } from 'crypto';
import type { Storable } from '../../typings';
import { eventLockTTL } from '../utils';

const lockRenewalInterval = (eventLockTTL / 2) * 1000;
const instanceKey = randomUUID();

interface Lock {
  key: string;
  created_at: string;
}

interface LockParams {
  lockStore: Storable;
  lockKey: string;
}

export class EventLock {
  private lockStore: Storable;
  private lockKey: string;
  private intervalId: NodeJS.Timeout | undefined;

  constructor({ lockKey, lockStore }: LockParams) {
    this.lockStore = lockStore;
    this.lockKey = lockKey;
  }

  public async acquire() {
    try {
      const lock = await this.get();

      if (lock && !this.isExpired(lock)) {
        return lock.key === instanceKey;
      }

      await this.add();

      // Renew the lock periodically
      if (!this.intervalId) {
        this.intervalId = setInterval(async () => {
          this.renew();
        }, lockRenewalInterval);
      }

      return true;
    } catch (e: any) {
      console.error(`Error acquiring lock for ${instanceKey}: ${e}`);
      return false;
    }
  }

  private async renew() {
    try {
      const lock = await this.get();

      if (!lock) {
        return;
      }

      if (lock.key != instanceKey) {
        return;
      }

      await this.add();
    } catch (e: any) {
      console.error(`Error renewing lock for ${instanceKey}: ${e}`);
    }
  }

  private async add() {
    const record = {
      key: instanceKey,
      created_at: new Date().toISOString(),
    };

    await this.lockStore.put(this.lockKey, record);
  }

  private async get() {
    return (await this.lockStore.get(this.lockKey)) as Lock;
  }

  public async release() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    const lock = await this.get();

    if (!lock) {
      return;
    }

    if (lock.key != instanceKey) {
      return;
    }

    await this.lockStore.delete(this.lockKey);
  }

  private isExpired(lock: Lock) {
    const lockDate = new Date(lock.created_at);
    const currentDate = new Date();
    const diffSeconds = (currentDate.getTime() - lockDate.getTime()) / 1000;

    return diffSeconds > eventLockTTL;
  }
}
