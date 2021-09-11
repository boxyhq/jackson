const redis = require('./redis.js');

module.exports = {
  newAsync: async (engine, options) => {
    switch (engine) {
      case 'redis':
        return await redis.newAsync(options);
    }
  },

  keyFromParts: (...parts) => {
    return parts.join(':');
  },

  indexNames: {
    entityID: 'entityID',
    tenantProduct: 'tenantProduct',
  },
};
