import { Index, Storable } from 'saml-jackson';
import * as dbutils from './utils';

class Store implements Storable {
  private namespace: string;
  private db: any;
  private ttl: number;

  constructor(namespace: string, db: any, ttl: number = 0) {
    this.namespace = namespace;
    this.db = db;
    this.ttl = ttl;
  }

  async get(key: string): Promise<any> {
    return await this.db.get(this.namespace, dbutils.keyDigest(key));
  }

  async getByIndex(idx: Index): Promise<any> {
    idx.value = dbutils.keyDigest(idx.value);

    return await this.db.getByIndex(this.namespace, idx);
  }

  async put(key: string, val: any, ...indexes: any): Promise<any> {
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

  async delete(key: string): Promise<any> {
    return await this.db.delete(this.namespace, dbutils.keyDigest(key));
  }
}

export default {
  new: (namespace: string, db: any, ttl: number = 0) => {
    return new Store(namespace, db, ttl);
  },
};
