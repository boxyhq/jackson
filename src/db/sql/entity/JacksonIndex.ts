import { EntitySchema } from 'typeorm';
import { JacksonIndex } from '../model/JacksonIndex';
import { JacksonStore } from '../model/JacksonStore';

export default new EntitySchema({
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
    },
  },
  relations: {
    // TODO: Remove the below line to see the error
    // @ts-ignore
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
