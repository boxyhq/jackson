require('reflect-metadata');
const typeorm = require('typeorm');
const JacksonStore = require('./model/JacksonStore.js');
const JacksonIndex = require('./model/JacksonIndex.js');

const dbutils = require('../utils.js');

class Sql {
  constructor(options) {
    return (async () => {
      while (true) {
        try {
          this.connection = await typeorm.createConnection({
            name: options.type,
            type: options.type,
            url: options.url,
            synchronize: true,
            migrationsTableName: '_jackson_migrations',
            logging: false,
            entities: [
              require('./entity/JacksonStore.js'),
              require('./entity/JacksonIndex.js'),
            ],
            extra: {
              connectionTimeoutMillis: 1000,
              idleTimeoutMillis: 1500,
            },
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

      if (options.ttl && options.limit) {
        this.ttlCleanup = async () => {
          const now = Date.now();

          while (true) {
            const ids = await this.storeRepository.find({
              expiresAt: typeorm.MoreThan(now),
              take: options.limit,
            });

            if (ids.length <= 0) {
              break;
            }

            await this.storeRepository.remove(ids);
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

    if (res) {
      return JSON.parse(res.value);
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
        ret.push(JSON.parse(r.store.value));
      });
    }

    if (res && res.store) {
      return JSON.parse(res.store.value);
    }

    return ret;
  }

  async put(namespace, key, val, ttl = 0, ...indexes) {
    await this.connection.transaction(async (transactionalEntityManager) => {
      const store = new JacksonStore(
        dbutils.key(namespace, key),
        JSON.stringify(val),
        ttl > 0 ? Date.now() + ttl * 1000 : null
      );
      await transactionalEntityManager.save(store);

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
