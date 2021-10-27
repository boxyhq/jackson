const EntitySchema = require('typeorm').EntitySchema;
const JacksonIndex = require('../model/JacksonIndex.js');
const JacksonStore = require('../model/JacksonStore.js');

module.exports = new EntitySchema({
  name: 'JacksonIndex',
  target: JacksonIndex,
  indices: [
    {
      name: 'namespace_key_index',
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
  },
  relations: {
    store: {
      target: () => JacksonStore,
      type: 'many-to-one',
      inverseSide: 'indexes',
    },
  },
});
