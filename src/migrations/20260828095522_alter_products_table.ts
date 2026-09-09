import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
            ALTER TABLE products ALTER COLUMN category_id DROP NOT NULL;
            ALTER TABLE products ALTER COLUMN deleted_at DROP NOT NULL;
        `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
            ALTER TABLE products ALTER COLUMN category_id SET NOT NULL;
            ALTER TABLE products ALTER COLUMN deleted_at SET NOT NULL;

        `);
}
