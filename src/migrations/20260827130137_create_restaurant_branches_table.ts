import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`

            CREATE EXTENSION IF NOT EXISTS postgis;

            CREATE TABLE restaurant_branches (
                id BIGSERIAL PRIMARY KEY,
                restaurant_id BIGINT NOT NULL REFERENCES restaurants(id),
                country_code TEXT NOT NULL,
                address_text TEXT NOT NULL,
                label TEXT NOT NULL,
                lng DECIMAL(9,6) NOT NULL,
                lat DECIMAL(9,6) NOT NULL,
                is_active BOOLEAN NOT NULL,
                accept_orders BOOLEAN NOT NULL,
                opens_at TIME NOT NULL,
                closes_at TIME NOT NULL,
                delivery_radius INT NOT NULL,
                currency CHAR(3) NOT NULL,
                commission INT NOT NULL,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                location geography(point, 4326) GENERATED ALWAYS AS (ST_MakePoint(lng::float, lat::float)::geography) STORED
            );

            CREATE INDEX idx_restaurant_branches_restaurant_id ON restaurant_branches(restaurant_id);
            CREATE INDEX idx_restaurant_branches_is_active ON restaurant_branches(is_active);
            CREATE INDEX idx_restaurant_branches_location ON restaurant_branches USING GIST(location);


        `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
            DROP TABLE IF EXISTS restaurant_branches;
            DROP EXTENSION postgis;
        `);
}
