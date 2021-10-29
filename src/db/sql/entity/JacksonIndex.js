const EntitySchema = require('typeorm').EntitySchema;
const JacksonIndex = require('../model/JacksonIndex.js');
const JacksonStore = require('../model/JacksonStore.js');

module.exports = new EntitySchema({
  name: 'JacksonIndex',
  target: JacksonIndex,
  columns: {
    id: {
      primary: true,
      generated: true,
      type: 'int',
    },
    key: {
      primary: true,
      type: 'varchar',
    },
    storeKey: {
      type: 'varchar',
    }
  },
  relations: {
    store: {
      target: () => JacksonStore,
      type: 'many-to-one',
      inverseSide: 'indexes',
      eager: true,
    },
  },
  indices: [
    {
      name: '_jackson_index_key',
      columns: ['key'],
    },
    {
      name: '_jackson_index_key_store',
      columns: ['key', 'storeKey'],
    },
  ],
});
