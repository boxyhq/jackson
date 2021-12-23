const mem = require('./mem.js');
const mongo = require('./mongo.js');
const redis = require('./redis.js');
const sql = require('./sql/sql.js');
const store = require('./store.js');
const encrypter = require('./encrypter.js');

const decrypt = (res, encryptionKey) => {
  if (res.iv && res.tag) {
    return JSON.parse(
      encrypter.decrypt(res.value, res.iv, res.tag, encryptionKey)
    );
  }

  return JSON.parse(res.value);
};

class DB {
  db: any;
  encryptionKey: string;

  constructor(db, encryptionKey) {
    this.db = db;
    this.encryptionKey = encryptionKey;
  }

  async get(namespace, key) {
    const res = await this.db.get(namespace, key);
    if (!res) {
      return null;
    }

    return decrypt(res, this.encryptionKey);
  }

  async getByIndex(namespace, idx) {
    const res = await this.db.getByIndex(namespace, idx);
    const encryptionKey = this.encryptionKey;
    return res.map((r) => {
      return decrypt(r, encryptionKey);
    });
  }

  // ttl is in seconds
  async put(namespace, key, val, ttl = 0, ...indexes) {
    if (ttl > 0 && indexes && indexes.length > 0) {
      throw new Error('secondary indexes not allow on a store with ttl');
    }

    const dbVal = this.encryptionKey
      ? encrypter.encrypt(JSON.stringify(val), this.encryptionKey)
      : { value: JSON.stringify(val) };

    return await this.db.put(namespace, key, dbVal, ttl, ...indexes);
  }

  async delete(namespace, key) {
    return await this.db.delete(namespace, key);
  }

  store(namespace, ttl = 0) {
    return store.new(namespace, this, ttl);
  }
}

export = {
  new: async (options) => {
    const encryptionKey = options.encryptionKey
      ? Buffer.from(options.encryptionKey, 'latin1')
      : null;
    switch (options.engine) {
      case 'redis':
        return new DB(await redis.new(options), encryptionKey);
      case 'sql':
        return new DB(await sql.new(options), encryptionKey);
      case 'mongo':
        return new DB(await mongo.new(options), encryptionKey);
      case 'mem':
        return new DB(await mem.new(options), encryptionKey);
      default:
        throw new Error('unsupported db engine: ' + options.engine);
    }
  },
};
