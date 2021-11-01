const EntitySchema = require('typeorm').EntitySchema;
const JacksonStore = require('../model/JacksonStore.js');

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
    expiresAt: {
      type: 'bigint',
      nullable: true,
    }
  },
});
