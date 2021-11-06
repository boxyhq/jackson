const mem = require('./mem.js');
const mongo = require('./mongo.js');
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
    if (this.ttl > 0 && indexes && indexes.length > 0) {
      throw new Error('secondary indexes not allow on a store with ttl');
    }

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
  new: async (options) => {
    switch (options.engine) {
      case 'redis':
        return new DB(await redis.new(options));
      case 'sql':
        return new DB(await sql.new(options));
      case 'mongo':
        return new DB(await mongo.new(options));
      case 'mem':
        return new DB(await mem.new(options));
      default:
        throw new Error('unsupported db engine: ' + options.engine);
    }
  },
};
