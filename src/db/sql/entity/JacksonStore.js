const EntitySchema = require('typeorm').EntitySchema;
const JacksonStore = require('../model/JacksonStore.js');
const JacksonIndex = require('../model/JacksonIndex.js');

module.exports = new EntitySchema({
  name: 'JacksonStore',
  target: JacksonStore,
  columns: {
    key: {
      primary: true,
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
