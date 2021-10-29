const redis = require('redis');
const dbutils = require('./db-utils.js');

const indexPrefix = '_index';

class Redis {
  constructor(options) {
    return (async () => {
      let opts = {};
      if (options && options.url) {
        opts.socket = {
          url: options.url,
        };
      }
      this.client = redis.createClient(opts);

      this.client.on('error', (err) => console.log('Redis Client Error', err));

      await this.client.connect();

      return this; // Return the newly-created instance
    })();
  }

  async get(namespace, key) {
    let res = await this.client.get(dbutils.key(namespace, key));
    if (res) {
      return JSON.parse(res);
    }

    return null;
  }

  async getByIndex(namespace, idx) {
    const dbKeys = await this.client.sMembers(
      dbutils.keyForIndex(namespace, idx)
    );

    const ret = [];
    for (const dbKey of dbKeys || []) {
      ret.push(await this.get(namespace, dbKey));
    }

    return ret;
  }

  async put(namespace, key, val, ttl = 0, ...indexes) {
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
      tx = tx.sAdd(dbutils.keyFromParts(indexPrefix, k), idxKey);
    }

    await tx.exec();
  }

  async delete(namespace, key) {
    let tx = this.client.multi();
    const k = dbutils.key(namespace, key);
    tx = tx.del(k);

    const idxKey = dbutils.keyFromParts(indexPrefix, k);
    // delete secondary indexes and then the mapping of the seconary indexes
    const dbKeys = await this.client.sMembers(idxKey);

    for (const dbKey of dbKeys || []) {
      tx.sRem(dbKey, key);
    }

    tx.del(idxKey);

    return await tx.exec();
  }
}

module.exports = {
  new: async (options) => {
    return new Redis(options);
  },
};
