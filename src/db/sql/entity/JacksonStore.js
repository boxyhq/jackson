const EntitySchema = require('typeorm').EntitySchema;
const JacksonStore = require('../model/JacksonStore.js').JacksonStore;

module.exports = new EntitySchema({
  name: 'JacksonStore',
  target: JacksonStore,
  uniques: [{ name: 'namespace_key', columns: ['namespace', 'key'] }],
  columns: {
    id: {
      primary: true,
      type: 'int',
      generated: true,
    },
    namespace: {
      type: 'varchar',
    },
    key: {
      type: 'varchar',
    },
    value: {
      type: 'varchar',
    },
  },
});
