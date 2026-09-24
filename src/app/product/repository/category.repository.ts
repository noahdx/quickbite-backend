import { Knex } from 'knex';
import { db } from '../../../lib/knex/knex';
import { ProductCategory } from '../entity/product-category.entity';

const CATEGORY_COLUMNS = ['id', 'restaurant_id', 'name', 'created_at', 'updated_at'];

function toEntity(row: any) {
  return new ProductCategory({
    id: row.id,
    restaurantId: row.restaurant_id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export async function createCategory(data: Partial<ProductCategory>, conn: Knex = db): Promise<ProductCategory> {
  const [row] = await conn('product_categories').insert(data).returning(CATEGORY_COLUMNS);

  return toEntity(row);
}

export async function findCategoryByName(restaurantId: number, name: string): Promise<ProductCategory | null> {
  const row = await db('product_categories')
    .select(CATEGORY_COLUMNS)
    .where('name', name)
    .where('restaurant_id', restaurantId)
    .first();
  return row ? toEntity(row) : null;
}

export async function findCategoriesByRestaurant(restaurantId: number): Promise<ProductCategory[]> {
  const rows = await db('product_categories').select(CATEGORY_COLUMNS).where('restaurant_id', restaurantId);
  return rows.map(toEntity);
}
