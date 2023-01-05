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
    this.client.on('error', (err: any) => console.info('Redis Client Error', err));

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
    for await (const { score, value } of this.client.zScanIterator(
      dbutils.keyFromParts(dbutils.createdAtPrefix, namespace),
      Math.min(take, 1000)
    )) {
      if (count >= take) {
        break;
      }
      if (count >= skip) {
        keyArray.push(dbutils.keyFromParts(namespace, value));
      }
      count++;
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

  async getByIndex(namespace: string, idx: Index, pageOffset?: number, pageLimit?: number): Promise<any> {
    const offsetAndLimitValueCheck = !dbutils.isNumeric(pageOffset) && !dbutils.isNumeric(pageLimit);
    let take = Number(offsetAndLimitValueCheck ? this.options.pageLimit : pageLimit);
    const skip = Number(offsetAndLimitValueCheck ? 0 : pageOffset);
    let count = 0;
    take += skip;
    const idxKey = dbutils.keyForIndex(namespace, idx);
    const dbKeys = await this.client.sMembers(dbutils.keyFromParts(dbutils.indexPrefix, idxKey));
    const ret: string[] = [];
    for (const dbKey of dbKeys || []) {
      if (offsetAndLimitValueCheck) {
        ret.push(await this.get(namespace, dbKey));
      } else {
        if (count >= skip) {
          ret.push(await this.get(namespace, dbKey));
        }
        if (count >= take) {
          break;
        }
        count++;
      }
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
    const timestamp = Number(Date.now());
    //Converting Timestamp in negative so that when we get the value, it will be found in reverse order (descending order).
    const negativeTimestamp = -Math.abs(timestamp);
    const value = await this.client.get(k);
    if (!value) {
      tx = tx.zAdd(dbutils.keyFromParts(dbutils.createdAtPrefix, namespace), [
        { score: negativeTimestamp, value: key },
      ]);
    }
    tx = tx.zAdd(dbutils.keyFromParts(dbutils.modifiedAtPrefix, namespace), [
      { score: negativeTimestamp, value: key },
    ]);
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
    tx.ZREM(dbutils.keyFromParts(dbutils.createdAtPrefix, namespace), key);
    tx.ZREM(dbutils.keyFromParts(dbutils.modifiedAtPrefix, namespace), key);
    tx.del(idxKey);

    return await tx.exec();
  }
}

export default {
  new: async (options: DatabaseOption): Promise<Redis> => {
    return await new Redis(options).init();
  },
};
