const EntitySchema = require('typeorm').EntitySchema;
const JacksonIndex = require('../model/JacksonIndex.js').JacksonIndex;

module.exports = new EntitySchema({
  name: 'JacksonIndex',
  target: JacksonIndex,
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
    fKey: {
      type: 'varchar',
    },
  },
});
