import { EntitySchema } from 'typeorm';
import { JacksonTTL } from '../model/JacksonTTL';

export default new EntitySchema({
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
