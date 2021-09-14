const store = require('./store.js');
const redis = require('redis');

class Redis {
  constructor(options) {
    return (async () => {
      this.client = redis.createClient();

      this.client.on('error', (err) => console.log('Redis Client Error', err));

      await this.client.connect();

      return this; // Return the newly-created instance
    })();
  }

  async _get(namespace, key) {
    let res = await this.client.get(store.key(namespace, key));
    if (res) {
      return JSON.parse(res);
    }
    return res;
  }

  async _getByIndex(namespace, idx) {
    const dbKeys = await this.client.sMembers(
      store.keyForIndex(namespace, idx)
    );

    const ret = [];
    for (const dbKey of dbKeys || []) {
      ret.push(await this._get(namespace, dbKey));
    }

    return ret;
  }

  async _put(namespace, key, val, ttl = 0, ...indexes) {
    let tx = this.client.multi();
    const k = store.key(namespace, key);

    tx = tx.set(k, JSON.stringify(val));

    if (ttl) {
      tx = tx.expire(k, ttl);
    }

    // no ttl support for secondary indexes
    for (const idx of indexes || []) {
      tx = tx.sAdd(store.keyForIndex(namespace, idx), key);
    }

    await tx.exec();
  }

  store(namespace, ttl = 0) {
    return store.new(namespace, this, ttl);
  }
}

module.exports = {
  new: async (options) => {
    return new Redis(options);
  },
};
