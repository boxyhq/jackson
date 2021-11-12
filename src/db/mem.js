// This is an in-memory implementation to be used with testing and prototyping only
const dbutils = require('./utils.js');

class Mem {
  constructor(/*options*/) {
    return (async () => {
      this.store = {}; // map of key, value
      this.indexes = {}; // map of key, Set
      this.cleanup = {}; // map of indexes for cleanup when store key is deleted
      this.ttlStore = {}; // map of key to ttl

      return this; // Return the newly-created instance
    })();
  }

  async get(namespace, key) {
    let res = this.store[dbutils.key(namespace, key)];
    if (res) {
      return JSON.parse(res);
    }

    return null;
  }

  async getByIndex(namespace, idx) {
    const dbKeys = await this.indexes[dbutils.keyForIndex(namespace, idx)];

    const ret = [];
    for (const dbKey of dbKeys || []) {
      ret.push(await this.get(namespace, dbKey));
    }

    return ret;
  }

  async put(namespace, key, val, ttl = 0, ...indexes) {
    const k = dbutils.key(namespace, key);

    this.store[k] = JSON.stringify(val);

    if (ttl) {
      // TODO: implement cleanup of TTL
      this.ttlStore[k] = Date.now() + ttl * 1000;
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

  async delete(namespace, key) {
    const k = dbutils.key(namespace, key);

    delete this.store[k];

    const idxKey = dbutils.keyFromParts(dbutils.indexPrefix, k);
    // delete secondary indexes and then the mapping of the seconary indexes
    const dbKeys = this.cleanup[idxKey];

    for (const dbKey of dbKeys || []) {
      this.indexes[dbKey] && this.indexes[dbKey].delete(key);
    }

    delete this.cleanup[idxKey];
  }
}

module.exports = {
  new: async (options) => {
    return new Mem(options);
  },
};
