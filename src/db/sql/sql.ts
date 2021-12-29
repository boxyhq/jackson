/*eslint no-constant-condition: ["error", { "checkLoops": false }]*/

require('reflect-metadata');

import { DatabaseDriver, DatabaseOption, Index } from 'saml-jackson';
import typeorm from 'typeorm';
import * as dbutils from '../utils';
import { JacksonIndex } from './model/JacksonIndex';
import { JacksonStore } from './model/JacksonStore';
import { JacksonTTL } from './model/JacksonTTL';

class Sql implements DatabaseDriver {
  private options: DatabaseOption;
  private connection!: typeorm.Connection;
  private storeRepository; //!: typeorm.Repository<JacksonStore>;
  private indexRepository; //!: typeorm.Repository<JacksonIndex>;
  private ttlRepository; //!: typeorm.Repository<JacksonTTL>;
  private ttlCleanup;
  private storeRepositor;
  private timerId;

  constructor(options: DatabaseOption) {
    this.options = options;
  }

  async init(): Promise<Sql> {
    while (true) {
      try {
        // TODO: Fix it
        // @ts-ignore
        this.connection = await typeorm.createConnection({
          name: this.options.type + Math.floor(Math.random() * 100000),
          type: this.options.type,
          url: this.options.url,
          synchronize: true,
          migrationsTableName: '_jackson_migrations',
          logging: false,
          entities: [
            require('./entity/JacksonStore.js')(this.options.type),
            require('./entity/JacksonIndex.js'),
            require('./entity/JacksonTTL.js'),
          ],
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

          await this.storeRepositor; //y.remove(ids);
          await this.ttlRepository.delete(delIds);
        }

        this.timerId = setTimeout(this.ttlCleanup, this.options.ttl * 1000);
      };

      this.timerId = setTimeout(this.ttlCleanup, this.options.ttl * 1000);
    } else {
      console.log(
        'Warning: ttl cleanup not enabled, set both "ttl" and "cleanupLimit" options to enable it!'
      );
    }

    return this;
  }

  async get(namespace: string, key: string): Promise<any> {
    let res = await this.storeRepository.findOne({
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

  async getByIndex(namespace: string, idx: Index): Promise<any> {
    const res = await this.indexRepository.find({
      key: dbutils.keyForIndex(namespace, idx),
    });

    const ret: string[] = [];

    if (res) {
      res.forEach((r) => {
        // @ts-ignore
        ret.push({
          value: r.store.value,
          iv: r.store.iv,
          tag: r.store.tag,
        });
      });
    }

    return ret;
  }

  async put(
    namespace: string,
    key: string,
    val: string,
    ttl: number = 0,
    ...indexes: any[]
  ): Promise<void> {
    await this.connection.transaction(async (transactionalEntityManager) => {
      const dbKey = dbutils.key(namespace, key);

      // @ts-ignore
      const store = new JacksonStore(dbKey, val.value, val.iv, val.tag);

      await transactionalEntityManager.save(store);

      if (ttl) {
        const ttlRec = new JacksonTTL(dbKey, Date.now() + ttl * 1000);
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
          await transactionalEntityManager.save(
            new JacksonIndex(0, key, store)
          );
        }
      }
    });
  }

  async delete(namespace: string, key: string): Promise<any> {
    return await this.storeRepository.remove({
      key: dbutils.key(namespace, key),
    });
  }
}

export default {
  new: async (options: DatabaseOption): Promise<Sql> => {
    return await new Sql(options).init();
  },
};
