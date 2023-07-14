import * as redis from 'redis';
import { DatabaseDriver, DatabaseOption, Encrypted, Index, Records } from '../typings';
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getAll(namespace: string, pageOffset?: number, pageLimit?: number, _?: string): Promise<Records> {
    const offsetAndLimitValueCheck = !dbutils.isNumeric(pageOffset) && !dbutils.isNumeric(pageLimit);
    let take = Number(offsetAndLimitValueCheck ? this.options.pageLimit : pageLimit);
    const skip = Number(offsetAndLimitValueCheck ? 0 : pageOffset);
    const returnValue: string[] = [];
    const keyArray: string[] = [];
    let count = 0;
    take += skip;
    for await (const { value } of this.client.zScanIterator(
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
    return { data: returnValue || [] };
  }

  async getByIndex(
    namespace: string,
    idx: Index,
    pageOffset?: number,
    pageLimit?: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _?: string
  ): Promise<Records> {
    const offsetAndLimitValueCheck = !dbutils.isNumeric(pageOffset) && !dbutils.isNumeric(pageLimit);
    let take = Number(offsetAndLimitValueCheck ? this.options.pageLimit : pageLimit);
    const skip = Number(offsetAndLimitValueCheck ? 0 : pageOffset);
    let count = 0;
    take += skip;
    const returnValue: string[] = [];
    const keyArray: string[] = [];
    const idxKey = dbutils.keyForIndex(namespace, idx);
    const dbKeys = await this.client.sMembers(dbutils.keyFromParts(dbutils.indexPrefix, idxKey));
    if (!offsetAndLimitValueCheck) {
      for await (const { value } of this.client.zScanIterator(
        dbutils.keyFromParts(dbutils.createdAtPrefix, namespace),
        count + 1
      )) {
        if (dbKeys.indexOf(value) !== -1) {
          if (count >= take) {
            break;
          }
          if (count >= skip) {
            keyArray.push(dbutils.keyFromParts(namespace, value));
          }
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
      return { data: returnValue || [] };
    } else {
      const ret: string[] = [];
      for (const dbKey of dbKeys || []) {
        if (offsetAndLimitValueCheck) {
          ret.push(await this.get(namespace, dbKey));
        }
      }
      return { data: ret };
    }
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

  async deleteMany(namespace: string, keys: string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }

    let tx = this.client.multi();

    for (const key of keys) {
      const k = dbutils.key(namespace, key);

      tx = tx.del(k);

      const idxKey = dbutils.keyFromParts(dbutils.indexPrefix, k);
      const dbKeys = await this.client.sMembers(idxKey);

      for (const dbKey of dbKeys || []) {
        tx.sRem(dbutils.keyFromParts(dbutils.indexPrefix, dbKey), key);
      }

      tx.ZREM(dbutils.keyFromParts(dbutils.createdAtPrefix, namespace), key);
      tx.ZREM(dbutils.keyFromParts(dbutils.modifiedAtPrefix, namespace), key);

      tx.del(idxKey);
    }

    await tx.exec();
  }
}

export default {
  new: async (options: DatabaseOption): Promise<Redis> => {
    return await new Redis(options).init();
  },
};
