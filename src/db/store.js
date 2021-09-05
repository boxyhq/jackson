class Store {
  constructor(namespace, db, ttl = 0) {
    this.namespace = namespace;
    this.db = db;
    this.ttl = ttl;
  }

  async get(key) {
    return this.db._get(this.namespace, key);
  }

  async put(key, val) {
    this.db._put(this.namespace, key, val, this.ttl);
  }
}

module.exports = {
  new: (namespace, db, ttl = 0) => {
    return new Store(namespace, db, ttl);
  },

  key: (namespace, key) => {
    return namespace + ':' + key;
  },
};
