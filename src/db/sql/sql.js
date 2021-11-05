require('reflect-metadata');
const typeorm = require('typeorm');
const JacksonStore = require('./model/JacksonStore.js');
const JacksonIndex = require('./model/JacksonIndex.js');

const dbutils = require('../utils.js');

class Sql {
  constructor(options) {
    return (async () => {
      this.connection = await typeorm.createConnection({
        type: options.type,
        url: options.url,
        synchronize: true,
        logging: false,
        entities: [
          require('./entity/JacksonStore.js'),
          require('./entity/JacksonIndex.js'),
        ],
      });

      this.storeRepository = this.connection.getRepository(JacksonStore);
      this.indexRepository = this.connection.getRepository(JacksonIndex);

      return this; // Return the newly-created instance
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
