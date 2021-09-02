const store = require('./store.js');
const redis = require('redis');

class Redis {
  constructor(options) {
    return (async () => {
      this.client = redis.createClient();

      this.client.on('error', (err) => console.log('Redis Client Error', err));

      await this.client.connect();

      return this; // Return the newly-created instance
    })(); 
  }

  async _get(namespace, key) {
    return JSON.parse(await this.client.get(store.key(namespace, key)));
  }

  async _put(namespace, key, val, ttl = 0) {
    const k = store.key(namespace, key);
    await this.client.set(k, JSON.stringify(val));
    if (ttl) {
      await this.client.expire(k, ttl)
    }
  }

  store(namespace, ttl = 0) {
    return store.new(namespace, this, ttl);
  }
}

module.exports = {
  new: async function (options) {
    return new Redis(options);
  },
};
