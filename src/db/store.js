const ripemd160 = require('ripemd160');

class Store {
  constructor(namespace, db, ttl = 0) {
    this.namespace = namespace;
    this.db = db;
    this.ttl = ttl;
  }

  async get(key) {
    return this.db._get(this.namespace, keyDigest(key));
  }

  async getByIndex(idx) {
    idx.value = keyDigest(idx.value);
    return this.db._getByIndex(this.namespace, idx);
  }

  async put(key, val, ...indexes) {
    indexes = (indexes || []).map((idx) => {
      idx.value = keyDigest(idx.value);
      return idx;
    });
    this.db._put(this.namespace, keyDigest(key), val, this.ttl, ...indexes);
  }
}

const key = (namespace, key) => {
  return namespace + ':' + key;
};

const keyForIndex = (namespace, idx) => {
  return key(key(namespace, idx.name), idx.value);
};

const keyDigest = (key) => {
  return new ripemd160().update(key).digest('hex');
};

module.exports = {
  new: (namespace, db, ttl = 0) => {
    return new Store(namespace, db, ttl);
  },

  key,

  keyForIndex,

  keyDigest,
};
