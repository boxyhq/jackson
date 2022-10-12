require('reflect-metadata');
import { DataSource, DatabaseType, DataSourceOptions } from 'typeorm';

const type =
  process.env.DB_ENGINE === 'planetscale'
    ? 'mysql'
    : <DatabaseType>process.env.DB_TYPE || <DatabaseType>'postgres';

const entitiesDir = process.env.DB_ENGINE === 'planetscale' ? 'planetscale' : 'sql';
const migrationsDir = process.env.DB_ENGINE === 'planetscale' ? 'planetscale' : type;

let ssl;
if (process.env.DB_SSL === 'true') {
  ssl = {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
  };
}

const AppDataSource = new DataSource(<DataSourceOptions>{
  type,
  url: process.env.DB_URL || 'postgresql://postgres:postgres@localhost:5432/postgres',
  synchronize: false,
  migrationsTableName: '_jackson_migrations',
  logging: 'all',
  entities: [`src/db/${entitiesDir}/entity/**/*.ts`],
  migrations: [`migration/${migrationsDir}/**/*.ts`, `migration/sql/**/*.ts`],
  ssl,
});

export default AppDataSource;
