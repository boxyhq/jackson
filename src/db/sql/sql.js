require('reflect-metadata');
const typeorm = require('typeorm');
const JacksonStore = require('./model/JacksonStore.js');
const JacksonIndex = require('./model/JacksonIndex.js');

const dbutils = require('../db-utils.js');

class Sql {
  constructor(options) {
    return (async () => {
      let opts = {};
      if (options && options.url) {
        opts.socket = {
          url: options.url,
        };
      }

      this.connection = await typeorm.createConnection({
        type: 'postgres',
        host: 'localhost',
        port: 5450,
        username: 'postgres',
        password: 'postgres',
        database: 'calendso',
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
    let res = await this.storeRepository.findOne(
      new JacksonStore(dbutils.key(namespace, key))
    );

    if (res) {
      return JSON.parse(res);
    }
    return res;
  }

  async getByIndex(namespace, idx) {
    const dbKeys = await this.client.sMembers(
      dbutils.keyForIndex(namespace, idx)
    );

    const ret = [];
    for (const dbKey of dbKeys || []) {
      ret.push(await this.get(namespace, dbKey));
    }

    return ret;
  }

  async put(namespace, key, val, ttl = 0, ...indexes) {
    await typeorm
      .getManager()
      .transaction(async (transactionalEntityManager) => {
        const store = new JacksonStore(
          dbutils.key(namespace, key),
          JSON.stringify(val)
        );
        await transactionalEntityManager.save(store);

        // TODO: ttl
        // if (ttl) {
        //   tx = tx.expire(k, ttl);
        // }

        // no ttl support for secondary indexes
        for (const idx of indexes || []) {
          const index = new JacksonIndex(
            dbutils.keyForIndex(namespace, idx),
            store
          );
          await transactionalEntityManager.save(index);
        }
      });
  }

  async delete(namespace, key) {
    return this.client.del(dbutils.key(namespace, key));
  }
}

module.exports = {
  new: async (options) => {
    return new Sql(options);
  },
};
