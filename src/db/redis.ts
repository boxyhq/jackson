import * as redis from 'redis';
import { DatabaseDriver, DatabaseOption, Index } from '../typings';
import * as dbutils from './utils';

class Redis implements DatabaseDriver {
  private options: DatabaseOption;
  private client!: any;

  constructor(options: DatabaseOption) {
    this.options = options;
  }

  async init(): Promise<Redis> {
    let opts = {};

    if (this.options && this.options.url) {
      opts['socket'] = {
        url: this.options.url,
      };
    }

    this.client = redis.createClient(opts);
    this.client.on('error', (err: any) =>
      console.log('Redis Client Error', err)
    );

    await this.client.connect();

    return this;
  }

  async get(namespace: string, key: string): Promise<any> {
    let res = await this.client.get(dbutils.key(namespace, key));
    if (res) {
      return JSON.parse(res);
    }

    return null;
  }

  async getByIndex(namespace: string, idx: Index): Promise<any> {
    const dbKeys = await this.client.sMembers(
      dbutils.keyForIndex(namespace, idx)
    );

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
  ): Promise<void> {
    let tx = this.client.multi();
    const k = dbutils.key(namespace, key);

    tx = tx.set(k, JSON.stringify(val));

    if (ttl) {
      tx = tx.expire(k, ttl);
    }

    // no ttl support for secondary indexes
    for (const idx of indexes || []) {
      const idxKey = dbutils.keyForIndex(namespace, idx);
      tx = tx.sAdd(idxKey, key);
      tx = tx.sAdd(dbutils.keyFromParts(dbutils.indexPrefix, k), idxKey);
    }

    await tx.exec();
  }

  async delete(namespace: string, key: string): Promise<any> {
    let tx = this.client.multi();
    const k = dbutils.key(namespace, key);
    tx = tx.del(k);

    const idxKey = dbutils.keyFromParts(dbutils.indexPrefix, k);
    // delete secondary indexes and then the mapping of the seconary indexes
    const dbKeys = await this.client.sMembers(idxKey);

    for (const dbKey of dbKeys || []) {
      tx.sRem(dbKey, key);
    }

    tx.del(idxKey);

    return await tx.exec();
  }
}

export default {
  new: async (options: DatabaseOption) => {
    return await new Redis(options).init();
  },
};
