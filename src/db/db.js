const mem = require('./mem');
const redis = require('./redis.js');

module.exports = {
  new: async function (engine, options) {
    switch (engine) {
      case 'mem':
        return await mem.new(options);
      case 'redis':
        return await redis.new(options);
    }
  },
};
