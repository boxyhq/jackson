require('reflect-metadata');
import { DataSource, DatabaseType, DataSourceOptions } from 'typeorm';

const type = <DatabaseType>process.env.DB_TYPE || <DatabaseType>'postgres';

const AppDataSource = new DataSource(<DataSourceOptions>{
  type,
  url: process.env.DB_URL || 'postgresql://postgres:postgres@localhost:5432/postgres',
  synchronize: false,
  migrationsTableName: '_jackson_migrations',
  logging: 'all',
  entities: ['src/db/sql/entity/**/*.ts'],
  migrations: [`migration/${type}/**/*.ts`],
});

export default AppDataSource;
