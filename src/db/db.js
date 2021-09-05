const redis = require('./redis.js');
const ripemd160 = require('ripemd160');

module.exports = {
  new: async (engine, options) => {
    switch (engine) {
      case 'redis':
        return await redis.new(options);
    }
  },

  keyDigest: (...parts) => {
    let key = parts.join(':');
    return new ripemd160().update(key).digest('hex');
  },

  indexNames: {
    entityID: 'entityID',
    tenantProduct: 'tenantProduct',
  }
};
