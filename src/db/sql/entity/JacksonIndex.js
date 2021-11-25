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
      type: 'varchar',
      length: 1500,
    },
    storeKey: {
      type: 'varchar',
      length: 1500,
    }
  },
  relations: {
    store: {
      target: () => JacksonStore,
      type: 'many-to-one',
      inverseSide: 'indexes',
      eager: true,
      onDelete: 'CASCADE',
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
