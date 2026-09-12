import { Knex } from 'knex';
import { db } from '../../../lib/knex/knex';
import { Product } from '../entity/product.entity';

interface ProductRow {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  restaurant_id: number;
  category_id: number | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

interface ProductByBranchRow {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  restaurant_id: number;
  category_id: number | null;
  category_name: string;
  price: string;
  stock: number;
  is_available: boolean;
}

export interface IProductByBranch {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  restaurantId: number;
  categoryId: number | null;
  categoryName: string;
  price: number;
  stock: number;
  isAvailable: boolean;
}

const PRODUCT_COLUMNS = [
  'id',
  'name',
  'description',
  'img_url',
  'restaurant_id',
  'category_id',
  'created_at',
  'updated_at',
  'deleted_at',
];

function toEntity(row: ProductRow): Product {
  return new Product({
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    imageUrl: row.image_url ?? '',
    restaurantId: row.restaurant_id,
    categoryId: row.category_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  });
}

function toProductByBranch(row: ProductByBranchRow): IProductByBranch {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    restaurantId: row.restaurant_id,
    categoryId: row.category_id,
    categoryName: row.category_name,
    price: Number(row.price),
    stock: row.stock,
    isAvailable: row.is_available,
  };
}

export async function createProduct(data: Partial<Product>, conn: Knex = db): Promise<Product> {
  const [row] = await conn('products')
    .insert({
      restaurant_id: data.restaurantId,
      category_id: data.categoryId,
      name: data.name,
      description: data.description,
      img_url: data.imageUrl,
      created_at: data.createdAt,
      updated_at: data.updatedAt,
    })
    .returning(PRODUCT_COLUMNS);

  return toEntity(row);
}

export async function updateProduct(id: number, data: Partial<Product>, conn: Knex = db): Promise<Product> {
  const mapping: Record<string, unknown> = {};
  mapping.updated_at = data.updatedAt;
  if (data.categoryId !== undefined) mapping.category_id = data.categoryId;
  if (data.name !== undefined) mapping.name = data.name;
  if (data.description !== undefined) mapping.description = data.description;
  if (data.imageUrl !== undefined) mapping.img_url = data.imageUrl;

  const [row] = await conn('products').where('id', id).update(mapping).returning(PRODUCT_COLUMNS);

  return toEntity(row);
}

export async function findProductById(id: number): Promise<Product | null> {
  const row = await db('products').select(PRODUCT_COLUMNS).where('id', id).whereNull('deleted_at').first();
  return row ? toEntity(row) : null;
}

export async function findProductsByRestaurant(restaurantId: number): Promise<Product[]> {
  const rows = await db('products')
    .select(PRODUCT_COLUMNS)
    .where('restaurant_id', restaurantId)
    .whereNull('deleted_at');
  return rows.map(toEntity);
}

export async function findProductsByBranch(branchId: number): Promise<IProductByBranch[]> {
  const rows = await db('products as p')
    .join('product_categories as pc', 'p.category_id', 'pc.id')
    .leftJoin('product_branch_details as pbd', 'p.id', 'pbd.product_id')
    .where('pbd.branch_id', branchId)
    .whereNull('deleted_at')
    .select(
      'p.id',
      'p.name',
      'p.description',
      'p.image_url',
      'p.restaurant_id',
      'p.category_id',
      'pc.name as category_name',
      'pbd.price',
      'pbd.stock',
      'pbd.is_available',
    );

  return rows.map(toProductByBranch);
}
