import knex from 'knex';
import config from './knexfile';
import { types } from 'pg';

types.setTypeParser(20, (value) => Number(value));

export const db = knex(config);

export async function pingDB() {
  await db.raw(`
            SELECT 1;
    `);
}
