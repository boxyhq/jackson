const redis = require('./redis.js');
const store = require('./store.js');

class DB {
  constructor(db) {
    this.db = db;
  }

  async get(namespace, key) {
    return this.db.get(namespace, key);
  }

  async getByIndex(namespace, idx) {
    return this.db.getByIndex(namespace, idx);
  }

  async put(namespace, key, val, ttl = 0, ...indexes) {
    this.db.put(namespace, key, val, ttl, ...indexes);
  }

  async delete(namespace, key) {
    return this.db.delete(namespace, key);
  }

  store(namespace, ttl = 0) {
    return store.new(namespace, this, ttl);
  }
}

module.exports = {
  new: async (engine, options) => {
    switch (engine) {
      case 'redis':
        const rdb = await redis.new(options);
        return new DB(rdb);
      default:
        throw new Error('unsupported db engine: ' + engine);
    }
  },

  keyFromParts: (...parts) => {
    return parts.join(':');
  },

  indexNames: {
    entityID: 'entityID',
    tenantProduct: 'tenantProduct',
  },
};
