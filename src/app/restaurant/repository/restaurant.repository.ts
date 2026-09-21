import { Knex } from 'knex';
import { db } from '../../../lib/knex/knex';
import { Restaurant } from '../entity/restaurant.entity';
import { RestaurantStatus } from '../enums';
import {
  applyCursorPagination,
  applyFilters,
  FilterParams,
  PaginationParams,
} from '../../../lib/http/pagination/cursor-pagination';

interface RestaurantRow {
  id: number;
  owner_id: number;
  name: string;
  logo_url: string;
  status: string;
  primary_country: string;
  created_at: Date;
  updated_at: Date;
  status_updated_at: Date;
}

const RESTAURANT_COLUMNS = [
  'id',
  'owner_id',
  'name',
  'logo_url',
  'status',
  'primary_country',
  'created_at',
  'updated_at',
  'status_updated_at',
];

function toEntity(row: RestaurantRow) {
  return new Restaurant({
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    logoURL: row.logo_url,
    status: row.status as RestaurantStatus,
    primaryCountry: row.primary_country,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    statusUpdatedAt: row.status_updated_at,
  });
}

export async function createRestaurant(data: Partial<Restaurant>, conn: Knex = db): Promise<Restaurant> {
  const [row] = await conn('restaurants')
    .insert({
      owner_id: data.ownerId,
      name: data.name,
      logo_url: data.logoURL,
      status: data.status,
      primary_country: data.primaryCountry,
      created_at: data.createdAt,
      updated_at: data.updatedAt,
      status_updated_at: data.statusUpdatedAt,
    })
    .returning(RESTAURANT_COLUMNS);
  return toEntity(row);
}

export async function updateRestaurant(id: number, data: Partial<Restaurant>): Promise<Restaurant> {
  const mapping: Record<string, unknown> = {};
  if (data.name !== undefined) mapping.name = data.name;
  if (data.logoURL !== undefined) mapping.logo_url = data.logoURL;
  if (data.primaryCountry !== undefined) mapping.primary_country = data.primaryCountry;

  const [row] = await db('restaurants').where('id', id).update(mapping).returning(RESTAURANT_COLUMNS);

  return toEntity(row);
}

export async function updateRestaurantStatus(id: number, status: string): Promise<Restaurant> {
  const [row] = await db('restaurants')
    .where('id', id)
    .update({
      status: status,
    })
    .returning(RESTAURANT_COLUMNS);

  return toEntity(row);
}

export async function findAllRestaurants(
  params: PaginationParams,
  filters: FilterParams[],
  allowedFields: Record<string, any>,
): Promise<Restaurant[]> {
  const query = db('restaurants').select(RESTAURANT_COLUMNS);
  applyFilters(query, filters);
  applyCursorPagination(query, params, allowedFields);
  const rows = await query;
  return rows.map(toEntity);
}

export async function findRestaurantById(id: number): Promise<Restaurant | null> {
  const row = await db('restaurants').select(RESTAURANT_COLUMNS).where('id', id).first();
  return row ? toEntity(row) : null;
}
