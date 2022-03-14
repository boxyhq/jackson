import * as redis from 'redis';
import { DatabaseDriver, DatabaseOption, Encrypted, Index } from '../typings';
import * as dbutils from './utils';

class Redis implements DatabaseDriver {
  private options: DatabaseOption;
  private client!: any;

  constructor(options: DatabaseOption) {
    this.options = options;
  }

  async init(): Promise<Redis> {
    const opts = {};

    if (this.options && this.options.url) {
      opts['socket'] = {
        url: this.options.url,
      };
    }

    this.client = redis.createClient(opts);
    this.client.on('error', (err: any) => console.log('Redis Client Error', err));

    await this.client.connect();

    return this;
  }

  async get(namespace: string, key: string): Promise<any> {
    const res = await this.client.get(dbutils.key(namespace, key));
    if (res) {
      return JSON.parse(res);
    }

    return null;
  }

  async getAll(namespace: string, pageOffset: number, pageLimit: number): Promise<unknown[]> {
    const offsetAndLimitValueCheck = !dbutils.isNumeric(pageOffset) && !dbutils.isNumeric(pageLimit);
    let take = Number(offsetAndLimitValueCheck ? this.options.pageLimit : pageLimit);
    const skip = Number(offsetAndLimitValueCheck ? 0 : pageOffset);
    const returnValue: string[] = [];
    const keyArray: string[] = [];
    let count = 0;
    take += skip;
    for await (const key of this.client.scanIterator({
      MATCH: dbutils.keyFromParts(namespace, '*'),
      COUNT: Math.min(take, 1000),
    })) {
      if (count >= take) {
        break;
      }
      if (count >= skip) {
        keyArray.push(key);
        count++;
      } else {
        count++;
      }
    }

    if (keyArray.length > 0) {
      const value = await this.client.MGET(keyArray);
      for (let i = 0; i < value.length; i++) {
        const valueObject = JSON.parse(value[i].toString());
        if (valueObject !== null && valueObject !== '') {
          returnValue.push(valueObject);
        }
      }
    }
    return returnValue || [];
  }

  async getByIndex(namespace: string, idx: Index): Promise<any> {
    const idxKey = dbutils.keyForIndex(namespace, idx);
    const dbKeys = await this.client.sMembers(dbutils.keyFromParts(dbutils.indexPrefix, idxKey));
    const ret: string[] = [];
    for (const dbKey of dbKeys || []) {
      ret.push(await this.get(namespace, dbKey));
    }

    return ret;
  }

  async put(namespace: string, key: string, val: Encrypted, ttl = 0, ...indexes: any[]): Promise<void> {
    let tx = this.client.multi();
    const k = dbutils.key(namespace, key);

    tx = tx.set(k, JSON.stringify(val));

    if (ttl) {
      tx = tx.expire(k, ttl);
    }

    // no ttl support for secondary indexes
    for (const idx of indexes || []) {
      const idxKey = dbutils.keyForIndex(namespace, idx);
      tx = tx.sAdd(dbutils.keyFromParts(dbutils.indexPrefix, idxKey), key);
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
      tx.sRem(dbutils.keyFromParts(dbutils.indexPrefix, dbKey), key);
    }

    tx.del(idxKey);

    return await tx.exec();
  }
}

export default {
  new: async (options: DatabaseOption): Promise<Redis> => {
    return await new Redis(options).init();
  },
};
