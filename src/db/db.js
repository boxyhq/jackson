const redis = require('./redis.js');

module.exports = {
  new: async (engine, options) => {
    switch (engine) {
      case 'redis':
        return await redis.new(options);
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
