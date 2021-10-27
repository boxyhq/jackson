const EntitySchema = require('typeorm').EntitySchema;
const JacksonStore = require('../model/JacksonStore.js');
const JacksonIndex = require('../model/JacksonIndex.js');

module.exports = new EntitySchema({
  name: 'JacksonStore',
  target: JacksonStore,
  indices: [
    {
      name: 'namespace_key_store',
      columns: ['namespace', 'key'],
      unique: true,
    },
  ],
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
  relations: {
    indexes: {
      target: () => JacksonIndex,
      type: 'one-to-many',
      inverseSide: 'store',
    },
  },
});
