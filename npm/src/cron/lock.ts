import { randomUUID } from 'crypto';
import type { Storable } from '../typings';
import { eventLockTTL } from '../directory-sync/utils';

const lockRenewalInterval = (eventLockTTL / 2) * 1000;
const instanceKey = randomUUID();

interface Lock {
  key: string;
  created_at: string;
}

interface LockParams {
  lockStore: Storable;
  key: string;
}

export class CronLock {
  private lockStore: Storable;
  private key: string;
  private intervalId: NodeJS.Timeout | undefined;

  constructor({ key, lockStore }: LockParams) {
    this.lockStore = lockStore;
    this.key = key;
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

    await this.lockStore.put(this.key, record);
  }

  private async get() {
    return (await this.lockStore.get(this.key)) as Lock;
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

    await this.lockStore.delete(this.key);
  }

  private isExpired(lock: Lock) {
    const lockDate = new Date(lock.created_at);
    const currentDate = new Date();
    const diffSeconds = (currentDate.getTime() - lockDate.getTime()) / 1000;

    return diffSeconds > eventLockTTL;
  }
}
