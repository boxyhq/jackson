const EntitySchema = require('typeorm').EntitySchema;
const JacksonIndex = require('../model/JacksonIndex.js');
const JacksonStore = require('../model/JacksonStore.js');

module.exports = new EntitySchema({
  name: 'JacksonIndex',
  target: JacksonIndex,
  columns: {
    key: {
      primary: true,
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
