const dbutils = require('./utils.js');

class Store {
  constructor(namespace, db, ttl = 0) {
    this.namespace = namespace;
    this.db = db;
    this.ttl = ttl;
  }

  async get(key) {
    return await this.db.get(this.namespace, dbutils.keyDigest(key));
  }

  async getByIndex(idx) {
    idx.value = dbutils.keyDigest(idx.value);
    return await this.db.getByIndex(this.namespace, idx);
  }

  async put(key, val, ...indexes) {
    indexes = (indexes || []).map((idx) => {
      idx.value = dbutils.keyDigest(idx.value);
      return idx;
    });
    return await this.db.put(
      this.namespace,
      dbutils.keyDigest(key),
      val,
      this.ttl,
      ...indexes
    );
  }

  async delete(key) {
    return await this.db.delete(this.namespace, dbutils.keyDigest(key));
  }
}

module.exports = {
  new: (namespace, db, ttl = 0) => {
    return new Store(namespace, db, ttl);
  },
};
