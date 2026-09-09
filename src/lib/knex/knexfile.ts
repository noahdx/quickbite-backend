import { Knex } from 'knex';
import { env } from '../config/env';

const config: Knex.Config = {
  client: 'pg',
  connection: {
    host: env.db.host,
    port: env.db.port,
    database: env.db.name,
    user: env.db.userName,
    password: env.db.password,
  },
  pool: {
    min: env.db.minPool,
    max: env.db.maxPool,
  },
  migrations: {
    directory: env.migration.directory,
    extension: env.migration.extension,
  },
};

export default config;
