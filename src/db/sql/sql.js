/*eslint no-constant-condition: ["error", { "checkLoops": false }]*/

require('reflect-metadata');
const typeorm = require('typeorm');
const JacksonStore = require('./model/JacksonStore.js');
const JacksonIndex = require('./model/JacksonIndex.js');
const JacksonTTL = require('./model/JacksonTTL.js');

const dbutils = require('../utils.js');

class Sql {
  constructor(options) {
    return (async () => {
      while (true) {
        try {
          this.connection = await typeorm.createConnection({
            name: options.type + Math.floor(Math.random() * 100000),
            type: options.type,
            url: options.url,
            synchronize: true,
            migrationsTableName: '_jackson_migrations',
            logging: false,
            entities: [
              require('./entity/JacksonStore.js')(options.type),
              require('./entity/JacksonIndex.js'),
              require('./entity/JacksonTTL.js'),
            ],
          });

          break;
        } catch (err) {
          console.error(`error connecting to ${options.type} db: ${err}`);
          await dbutils.sleep(1000);
          continue;
        }
      }

      this.storeRepository = this.connection.getRepository(JacksonStore);
      this.indexRepository = this.connection.getRepository(JacksonIndex);
      this.ttlRepository = this.connection.getRepository(JacksonTTL);

      if (options.ttl && options.limit) {
        this.ttlCleanup = async () => {
          const now = Date.now();

          while (true) {
            const ids = await this.ttlRepository
              .createQueryBuilder('jackson_ttl')
              .limit(options.limit)
              .where('jackson_ttl.expiresAt <= :expiresAt', { expiresAt: now })
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

          this.timerId = setTimeout(this.ttlCleanup, options.ttl * 1000);
        };

        this.timerId = setTimeout(this.ttlCleanup, options.ttl * 1000);
      } else {
        console.log(
          'Warning: ttl cleanup not enabled, set both "ttl" and "limit" options to enable it!'
        );
      }

      return this;
    })();
  }

  async get(namespace, key) {
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

  async getByIndex(namespace, idx) {
    const res = await this.indexRepository.find({
      key: dbutils.keyForIndex(namespace, idx),
    });

    const ret = [];

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

  async put(namespace, key, val, ttl = 0, ...indexes) {
    await this.connection.transaction(async (transactionalEntityManager) => {
      const dbKey = dbutils.key(namespace, key);
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

  async delete(namespace, key) {
    return await this.storeRepository.remove({
      key: dbutils.key(namespace, key),
    });
  }
}

module.exports = {
  new: async (options) => {
    return new Sql(options);
  },
};
