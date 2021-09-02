const store = require('./store.js');

class Mem {
  constructor(options) {
    this.records = {};
  }

  async _get(namespace, key) {
    return this.records[store.key(namespace, key)];
  }

  async _put(namespace, key, val, ttl = 0) {
    // TODO: ttl
    this.records[store.key(namespace, key)] = val;
  }

  async store(namespace, ttl = 0) {
    return store.new(namespace, this, ttl);
  }
}

module.exports = {
  new: async function (options) {
    return new Mem(options);
  },
};
