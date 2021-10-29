const redis = require('./redis.js');
const sql = require('./sql/sql.js');
const store = require('./store.js');

class DB {
  constructor(db) {
    this.db = db;
  }

  async get(namespace, key) {
    return await this.db.get(namespace, key);
  }

  async getByIndex(namespace, idx) {
    return await this.db.getByIndex(namespace, idx);
  }

  // ttl is in seconds
  async put(namespace, key, val, ttl = 0, ...indexes) {
    return await this.db.put(namespace, key, val, ttl, ...indexes);
  }

  async delete(namespace, key) {
    return await this.db.delete(namespace, key);
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
      case 'sql':
        const sdb = await sql.new(options);
        return new DB(sdb);
      default:
        throw new Error('unsupported db engine: ' + engine);
    }
  },
};
