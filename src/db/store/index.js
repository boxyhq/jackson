const redisStore = require('./redisStore');
const mysqlStore = require('./mysqlStore');

module.exports = (engine) => {
    switch (engine) {
        case 'redis':
          return redisStore;
      case 'mysql':
          return mysqlStore;
        default:
          throw new Error('unsupported db engine: ' + engine);
      }
}