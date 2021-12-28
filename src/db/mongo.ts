import { MongoClient } from 'mongodb';
import { DatabaseDriver, DatabaseOption, Index } from '../typings';
import * as dbutils from './utils';

type Document = {
  value: string;
  expiresAt: Date;
  indexes: string[];
};

class Mongo implements DatabaseDriver {
  private options: DatabaseOption;
  private client!: MongoClient;
  private collection: any;
  private db: any;

  constructor(options: DatabaseOption) {
    this.options = options;
  }

  async init(): Promise<Mongo> {
    this.client = new MongoClient(this.options.url);

    await this.client.connect();

    this.db = this.client.db();
    this.collection = this.db.collection('jacksonStore');

    await this.collection.createIndex({ indexes: 1 });
    await this.collection.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 1 }
    );

    return this;
  }

  async get(namespace: string, key: string): Promise<any> {
    let res = await this.collection.findOne({
      _id: dbutils.key(namespace, key),
    });
    if (res && res.value) {
      return res.value;
    }

    return null;
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

  async put(
    namespace: string,
    key: string,
    val: any,
    ttl: number = 0,
    ...indexes: any[]
  ): Promise<void> {
    const doc = <Document>{
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

    await this.collection.updateOne(
      { _id: dbutils.key(namespace, key) },
      {
        $set: doc,
      },
      { upsert: true }
    );
  }

  async delete(namespace: string, key: string): Promise<any> {
    return await this.collection.deleteOne({
      _id: dbutils.key(namespace, key),
    });
  }
}

export default {
  new: async (options: DatabaseOption) => {
    return await new Mongo(options).init();
  },
};
