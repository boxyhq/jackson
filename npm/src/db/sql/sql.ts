/*eslint no-constant-condition: ["error", { "checkLoops": false }]*/

require('reflect-metadata');

import { DatabaseDriver, DatabaseOption, Index, Encrypted } from '../../typings';
import { Connection, createConnection, Like } from 'typeorm';
import * as dbutils from '../utils';

import { JacksonStore } from './entity/JacksonStore';
import { JacksonIndex } from './entity/JacksonIndex';
import { JacksonTTL } from './entity/JacksonTTL';

class Sql implements DatabaseDriver {
  private options: DatabaseOption;
  private connection!: Connection;
  private storeRepository;
  private indexRepository;
  private ttlRepository;
  private ttlCleanup;
  private timerId;

  constructor(options: DatabaseOption) {
    this.options = options;
  }

  async init(): Promise<Sql> {
    while (true) {
      try {
        this.connection = await createConnection({
          name: this.options.type! + Math.floor(Math.random() * 100000),
          type: this.options.type!,
          url: this.options.url,
          synchronize: true,
          migrationsTableName: '_jackson_migrations',
          logging: ['error'],
          entities: [JacksonStore, JacksonIndex, JacksonTTL],
        });

        break;
      } catch (err) {
        console.error(`error connecting to ${this.options.type} db: ${err}`);
        await dbutils.sleep(1000);
        continue;
      }
    }

    this.storeRepository = this.connection.getRepository(JacksonStore);
    this.indexRepository = this.connection.getRepository(JacksonIndex);
    this.ttlRepository = this.connection.getRepository(JacksonTTL);

    if (this.options.ttl && this.options.cleanupLimit) {
      this.ttlCleanup = async () => {
        const now = Date.now();

        while (true) {
          const ids = await this.ttlRepository
            .createQueryBuilder('jackson_ttl')
            .limit(this.options.cleanupLimit)
            .where('jackson_ttl.expiresAt <= :expiresAt', {
              expiresAt: now,
            })
            .getMany();

          if (ids.length <= 0) {
            break;
          }

          const delIds = ids.map((id) => {
            return id.key;
          });

          await this.storeRepository.remove(ids);
          await this.ttlRepository.delete(delIds);
        }

        this.timerId = setTimeout(this.ttlCleanup, this.options.ttl! * 1000);
      };

      this.timerId = setTimeout(this.ttlCleanup, this.options.ttl! * 1000);
    } else {
      console.log(
        'Warning: ttl cleanup not enabled, set both "ttl" and "cleanupLimit" options to enable it!'
      );
    }

    return this;
  }

  async get(namespace: string, key: string): Promise<any> {
    const res = await this.storeRepository.findOne({
      key: dbutils.key(namespace, key),
    });

    if (res && res.value) {
      return {
        value: res.value,
        iv: res.iv,
        tag: res.tag,
      };
    }

    return null;
  }

  async getAll(namespace: string): Promise<unknown[]> {
    const response = await this.storeRepository.find({
      where: { key: Like(`%${namespace}%`) },
      select: ['value', 'iv', 'tag'],
      order: {
        ['createdAt']: 'DESC',
        // ['createdAt']: 'ASC',
      },
    });

    const returnValue = JSON.parse(JSON.stringify(response));
    if (returnValue) return returnValue;
    return [];
  }

  async getByIndex(namespace: string, idx: Index): Promise<any> {
    const res = await this.indexRepository.find({
      key: dbutils.keyForIndex(namespace, idx),
    });

    const ret: Encrypted[] = [];

    if (res) {
      res.forEach((r) => {
        ret.push({
          value: r.store.value,
          iv: r.store.iv,
          tag: r.store.tag,
        });
      });
    }

    return ret;
  }

  async put(namespace: string, key: string, val: Encrypted, ttl = 0, ...indexes: any[]): Promise<void> {
    await this.connection.transaction(async (transactionalEntityManager) => {
      const dbKey = dbutils.key(namespace, key);

      const store = new JacksonStore();
      store.key = dbKey;
      store.value = val.value;
      store.iv = val.iv;
      store.tag = val.tag;
      store.modifiedAt = new Date().toISOString();
      await transactionalEntityManager.save(store);

      if (ttl) {
        const ttlRec = new JacksonTTL();
        ttlRec.key = dbKey;
        ttlRec.expiresAt = Date.now() + ttl * 1000;
        await transactionalEntityManager.save(ttlRec);
      }

      // no ttl support for secondary indexes
      for (const idx of indexes || []) {
        const key = dbutils.keyForIndex(namespace, idx);
        const rec = await this.indexRepository.findOne({
          key,
          storeKey: store.key,
        });
        if (!rec) {
          const ji = new JacksonIndex();
          ji.key = key;
          ji.store = store;
          await transactionalEntityManager.save(ji);
        }
      }
    });
  }

  async delete(namespace: string, key: string): Promise<any> {
    const dbKey = dbutils.key(namespace, key);
    await this.ttlRepository.remove({ key: dbKey });
    return await this.storeRepository.remove({
      key: dbKey,
    });
  }
}

export default {
  new: async (options: DatabaseOption): Promise<Sql> => {
    return await new Sql(options).init();
  },
};
