const dbutils = require('../db-utils.js');

class RedisStore {
  constructor(namespace, db, ttl = 0) {
    this.namespace = namespace;
    this.db = db;
    this.ttl = ttl;
  }

  async get(key) {
    return this.db.get(this.namespace, dbutils.keyDigest(key));
  }

  async getByIndex(idx) {
    idx.value = dbutils.keyDigest(idx.value);
    return this.db.getByIndex(this.namespace, idx);
  }

  async put(key, val, ...indexes) {
    indexes = (indexes || []).map((idx) => {
      idx.value = dbutils.keyDigest(idx.value);
      return idx;
    });
    this.db.put(this.namespace, dbutils.keyDigest(key), val, this.ttl, ...indexes);
  }

  async delete(key) {
    return this.db.delete(this.namespace, dbutils.keyDigest(key));
  }
}

module.exports = {
  new: (namespace, db, ttl = 0) => {
    return new RedisStore(namespace, db, ttl);
  },
};
