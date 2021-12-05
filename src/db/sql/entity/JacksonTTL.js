const EntitySchema = require('typeorm').EntitySchema;
const JacksonTTL = require('../model/JacksonTTL.js');

module.exports = new EntitySchema({
  name: 'JacksonTTL',
  target: JacksonTTL,
  columns: {
    key: {
      primary: true,
      type: 'varchar',
      length: 1500,
    },
    expiresAt: {
      type: 'bigint',
    },
  },
  indices: [
    {
      name: '_jackson_ttl_expires_at',
      columns: ['expiresAt'],
    },
  ],
});
