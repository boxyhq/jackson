// This is an in-memory implementation to be used with testing and prototyping only

import { DatabaseDriver, DatabaseOption, Index } from '../typings';
import * as dbutils from './utils';

class Mem implements DatabaseDriver {
  private options: DatabaseOption;
  private store: any;
  private indexes: any;
  private cleanup: any;
  private ttlStore: any;
  private ttlCleanup: any;
  private timerId: any;

  constructor(options: DatabaseOption) {
    this.options = options;
  }

  async init(): Promise<Mem> {
    this.store = {}; // map of key, value
    this.indexes = {}; // map of key, Set
    this.cleanup = {}; // map of indexes for cleanup when store key is deleted
    this.ttlStore = {}; // map of key to ttl

    if (this.options.ttl) {
      this.ttlCleanup = async () => {
        const now = Date.now();
        for (const k in this.ttlStore) {
          if (this.ttlStore[k].expiresAt < now) {
            await this.delete(this.ttlStore[k].namespace, this.ttlStore[k].key);
          }
        }

        this.timerId = setTimeout(this.ttlCleanup, this.options.ttl * 1000);
      };

      this.timerId = setTimeout(this.ttlCleanup, this.options.ttl * 1000);
    }

    return this;
  }

  async get(namespace: string, key: string): Promise<any> {
    let res = this.store[dbutils.key(namespace, key)];
    if (res) {
      return res;
    }

    return null;
  }

  async getByIndex(namespace: string, idx: Index): Promise<any> {
    const dbKeys = await this.indexes[dbutils.keyForIndex(namespace, idx)];

    const ret: string[] = [];
    for (const dbKey of dbKeys || []) {
      ret.push(await this.get(namespace, dbKey));
    }

    return ret;
  }

  async put(
    namespace: string,
    key: string,
    val: string,
    ttl: number = 0,
    ...indexes: any[]
  ): Promise<any> {
    const k = dbutils.key(namespace, key);

    this.store[k] = val;

    if (ttl) {
      this.ttlStore[k] = {
        namespace,
        key,
        expiresAt: Date.now() + ttl * 1000,
      };
    }

    // no ttl support for secondary indexes
    for (const idx of indexes || []) {
      const idxKey = dbutils.keyForIndex(namespace, idx);
      let set = this.indexes[idxKey];
      if (!set) {
        set = new Set();
        this.indexes[idxKey] = set;
      }

      set.add(key);

      const cleanupKey = dbutils.keyFromParts(dbutils.indexPrefix, k);
      let cleanup = this.cleanup[cleanupKey];
      if (!cleanup) {
        cleanup = new Set();
        this.cleanup[cleanupKey] = cleanup;
      }

      cleanup.add(idxKey);
    }
  }

  async delete(namespace: string, key: string): Promise<any> {
    const k = dbutils.key(namespace, key);

    delete this.store[k];

    const idxKey = dbutils.keyFromParts(dbutils.indexPrefix, k);
    // delete secondary indexes and then the mapping of the seconary indexes
    const dbKeys = this.cleanup[idxKey];

    for (const dbKey of dbKeys || []) {
      this.indexes[dbKey] && this.indexes[dbKey].delete(key);
    }

    delete this.cleanup[idxKey];
    delete this.ttlStore[k];
  }
}

export default {
  new: async (options: DatabaseOption) => {
    return await new Mem(options).init();
  },
};
