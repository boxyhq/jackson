import os from 'os';

import type { Storable } from '../../typings';

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

  public async acquire() {
    const key = os.hostname();

    try {
      const lock = await this.get();

      if (lock) {
        return lock.key === key;
      }

      await this.add(key);

      console.log(`Acquired lock for ${key}`);

      return true;
    } catch (e: any) {
      console.log(`Error acquiring lock for ${key}: ${e}`);
      return false;
    }
  }

  public async renew() {
    const key = os.hostname();

    try {
      const lock = await this.get();

      if (!lock) {
        return;
      }

      if (lock.key != key) {
        return;
      }

      await this.add(key);
      console.log(`Renewed lock for ${key}`);
    } catch (e: any) {
      console.log(`Error renewing lock for ${key}: ${e}`);
    }
  }

  async add(key: string) {
    const record = {
      key,
      created_at: new Date().toISOString(),
    };

    await this.lockStore.put(key, record);
  }

  async get() {
    const { data } = (await this.lockStore.getAll()) as { data: Lock[] };

    return data.length > 0 ? data[0] : null;
  }
}
