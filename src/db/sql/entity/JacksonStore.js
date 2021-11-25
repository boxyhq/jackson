const EntitySchema = require('typeorm').EntitySchema;
const JacksonStore = require('../model/JacksonStore.js');

const valueType = (type) => {
  switch (type) {
    case 'postgres':
    case 'cockroachdb':
      return 'text';
    case 'mysql':
    case 'mariadb':
      return 'mediumtext';
    default:
      return 'varchar';
  }
};

module.exports = (type) => {
  return new EntitySchema({
    name: 'JacksonStore',
    target: JacksonStore,
    columns: {
      key: {
        primary: true,
        type: 'varchar',
        length: 1500,
      },
      value: {
        type: valueType(type),
      },
      expiresAt: {
        type: 'bigint',
        nullable: true,
      },
    },
  });
};
