import { Collection, Db, MongoClient, UpdateOptions } from 'mongodb';
import { DatabaseDriver, DatabaseOption, Encrypted, Index } from '../typings';
import * as dbutils from './utils';

type _Document = {
  value: Encrypted;
  expiresAt?: Date;
  modifiedAt: string;
  indexes: string[];
};

class Mongo implements DatabaseDriver {
  private options: DatabaseOption;
  private client!: MongoClient;
  private collection!: Collection;
  private db!: Db;

  constructor(options: DatabaseOption) {
    this.options = options;
  }

  async init(): Promise<Mongo> {
    const dbUrl = this.options.url as string;
    this.client = new MongoClient(dbUrl);
    await this.client.connect();

    this.db = this.client.db();
    this.collection = this.db.collection('jacksonStore');

    await this.collection.createIndex({ indexes: 1 });
    await this.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 1 });

    return this;
  }

  async get(namespace: string, key: string): Promise<any> {
    const res = await this.collection.findOne({
      _id: dbutils.key(namespace, key),
    });
    if (res && res.value) {
      return res.value;
    }

    return null;
  }

  async getAll(namespace: string, offset: number, limit: number): Promise<unknown[]> {
    const _namespaceMatch = new RegExp(`^${namespace}:.*`);
    const docs = await this.collection
      .find({ _id: _namespaceMatch }, { sort: { createdAt: -1 }, skip: offset, limit: limit })
      .toArray();

    if (docs) {
      return docs.map(({ value }) => value);
    }
    return [];
  }

  async getByIndex(namespace: string, idx: Index): Promise<any> {
    const docs = await this.collection
      .find({
        indexes: dbutils.keyForIndex(namespace, idx),
      })
      .toArray();

    const ret: string[] = [];
    for (const doc of docs || []) {
      ret.push(doc.value);
    }

    return ret;
  }

  async put(namespace: string, key: string, val: Encrypted, ttl = 0, ...indexes: any[]): Promise<void> {
    const doc = <_Document>{
      value: val,
    };

    if (ttl) {
      doc.expiresAt = new Date(Date.now() + ttl * 1000);
    }

    // no ttl support for secondary indexes
    for (const idx of indexes || []) {
      const idxKey = dbutils.keyForIndex(namespace, idx);

      if (!doc.indexes) {
        doc.indexes = [];
      }
      doc.indexes.push(idxKey);
    }

    doc.modifiedAt = new Date().toISOString();
    await this.collection.updateOne(
      { _id: dbutils.key(namespace, key) },
      {
        $set: doc,
        $setOnInsert: {
          createdAt: new Date().toISOString(),
        },
      },
      { upsert: true } as UpdateOptions
    );
  }

  async delete(namespace: string, key: string): Promise<any> {
    return await this.collection.deleteOne({
      _id: dbutils.key(namespace, key),
    });
  }
}

export default {
  new: async (options: DatabaseOption): Promise<Mongo> => {
    return await new Mongo(options).init();
  },
};
