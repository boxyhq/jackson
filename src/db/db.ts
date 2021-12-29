import {
  DatabaseDriver,
  DatabaseOption,
  Encrypted,
  EncryptionKey,
  Index,
  Storable,
} from 'saml-jackson';
import * as encrypter from './encrypter';
import mem from './mem';
import mongo from './mongo';
import redis from './redis';
import sql from './sql/sql';
import store from './store';

const decrypt = (res: Encrypted, encryptionKey: EncryptionKey): any => {
  if (res.iv && res.tag) {
    return JSON.parse(
      encrypter.decrypt(res.value, res.iv, res.tag, encryptionKey)
    );
  }

  return JSON.parse(res.value);
};

class DB implements DatabaseDriver {
  private db: any;
  private encryptionKey: EncryptionKey;

  constructor(db: any, encryptionKey: EncryptionKey) {
    this.db = db;
    this.encryptionKey = encryptionKey;
  }

  async get(namespace: string, key: string): Promise<any> {
    const res = await this.db.get(namespace, key);

    if (!res) {
      return null;
    }

    return decrypt(res, this.encryptionKey);
  }

  async getByIndex(namespace: string, idx: Index): Promise<any> {
    const res = await this.db.getByIndex(namespace, idx);
    const encryptionKey = this.encryptionKey;
    return res.map((r) => {
      return decrypt(r, encryptionKey);
    });
  }

  // ttl is in seconds
  async put(
    namespace: string,
    key: string,
    val: any,
    ttl: number = 0,
    ...indexes: any[]
  ): Promise<any> {
    if (ttl > 0 && indexes && indexes.length > 0) {
      throw new Error('secondary indexes not allow on a store with ttl');
    }

    const dbVal = this.encryptionKey
      ? encrypter.encrypt(JSON.stringify(val), this.encryptionKey)
      : { value: JSON.stringify(val) };

    return await this.db.put(namespace, key, dbVal, ttl, ...indexes);
  }

  async delete(namespace: string, key: string): Promise<any> {
    return await this.db.delete(namespace, key);
  }

  store(namespace: string, ttl: number = 0): Storable {
    return store.new(namespace, this, ttl);
  }
}

export = {
  new: async (options: DatabaseOption) => {
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
