import { ColumnType, EntitySchema } from 'typeorm';
import { DatabaseType } from 'saml-jackson';
import { JacksonStore } from '../model/JacksonStore';

const valueType = (type: DatabaseType): ColumnType => {
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

export default (type: DatabaseType) => {
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
      iv: {
        type: 'varchar',
        length: 64,
        nullable: true,
      },
      tag: {
        type: 'varchar',
        length: 64,
        nullable: true,
      },
    },
  });
};
