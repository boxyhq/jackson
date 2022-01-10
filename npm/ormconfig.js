const type = process.env.DB_TYPE || 'postgres';

module.exports = {
  type,
  url: process.env.DB_URL || 'postgresql://postgres:postgres@localhost:5432/postgres',
  synchronize: false,
  logging: true,
  entities: ['src/db/sql/entity/**/*.ts'],
  migrations: [`migration/${type}/**/*.ts`],
  cli: {
    entitiesDir: 'src/db/sql/entity',
    migrationsDir: `migration/${type}`,
  },
  extra: {
    ssl: true,
  },
};
