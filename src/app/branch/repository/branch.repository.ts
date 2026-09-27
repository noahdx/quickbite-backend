import { db } from '../../../lib/knex/knex';
import { Branch } from '../entity/branch.entity';
import { Currency } from '../enums';

export interface NearbyBranch {
  id: number;
  restaurantId: number;
  addressText: string;
  label: string;
  lng: number;
  lat: number;
  isActive: boolean;
  acceptOrders: boolean;
  currency: string;
  restaurantName: string;
  restaurantLogoUrl: string;
}

const BRANCH_COLUMNS = [
  'id',
  'restaurant_id',
  'country_code',
  'address_text',
  'label',
  'lng',
  'lat',
  'is_active',
  'opens_at',
  'closes_at',
  'accept_orders',
  'created_at',
  'updated_at',
  'delivery_radius',
  'currency',
  'commission',
];

function toEntity(row: any) {
  return new Branch({
    id: row.id,
    restaurantId: row.restaurant_id,
    countryCode: row.country_code,
    addressText: row.address_text,
    label: row.label,
    lat: Number(row.lat),
    lng: Number(row.lng),
    isActive: row.is_active,
    opensAt: row.opens_at,
    closesAt: row.closes_at,
    acceptOrders: row.accept_orders,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deliveryRadius: row.delivery_radius,
    currency: row.currency as Currency,
    commission: row.commission,
  });
}

function toNearbyBranch(row: any) {
  return {
    id: Number(row.id),
    restaurantId: Number(row.restaurant_id),
    addressText: row.address_text,
    label: row.label,
    lng: Number(row.lng),
    lat: Number(row.lat),
    isActive: row.is_active,
    acceptOrders: row.accept_orders,
    currency: row.currency,
    restaurantName: row.restaurant_name,
    restaurantLogoUrl: row.restaurant_logo_url,
  };
}

export async function createBranch(data: Partial<Branch>): Promise<Branch> {
  const [row] = await db('restaurant_branches')
    .insert({
      restaurant_id: data.restaurantId,
      country_code: data.countryCode,
      address_text: data.addressText,
      label: data.label,
      lng: data.lng,
      lat: data.lat,
      is_active: data.isActive,
      accept_orders: data.acceptOrders,
      opens_at: data.opensAt,
      closes_at: data.closesAt,
      delivery_radius: data.deliveryRadius,
      commission: data.commission,
      currency: data.currency,
      created_at: data.createdAt,
      updated_at: data.updatedAt,
    })
    .returning(BRANCH_COLUMNS);

  return toEntity(row);
}

export async function updateBranch(id: number, data: Partial<Branch>): Promise<Branch> {
  const mapping: Record<string, unknown> = { updated_at: new Date() };

  if (data.lng !== null) mapping.lng = data.lng;
  if (data.lat !== null) mapping.lat = data.lat;
  if (data.label !== null) mapping.label = data.label;
  if (data.opensAt !== null) mapping.opens_at = data.opensAt;
  if (data.currency !== null) mapping.currency = data.currency;
  if (data.closesAt !== null) mapping.closes_at = data.closesAt;
  if (data.addressText !== null) mapping.address_text = data.addressText;
  if (data.acceptOrders !== null) mapping.accept_orders = data.acceptOrders;
  if (data.deliveryRadius !== null) mapping.delivery_radius = data.deliveryRadius;

  const [row] = await db('restaurant_branches').where('id', id).update(mapping).returning(BRANCH_COLUMNS);

  return toEntity(row);
}

export async function updateBranchStatus(id: number, data: { isActive?: boolean; commission?: number }): Promise<Branch> {
  const mapping: Record<string, unknown> = {};
  mapping.updated_at = new Date();

  if (data.isActive !== undefined) mapping.is_active = data.isActive;
  if (data.commission !== undefined) mapping.commission = data.commission;
  const [row] = await db('restaurant_branches').where('id', id).update(mapping).returning(BRANCH_COLUMNS);
  return toEntity(row);
}

export async function findBranchesByRestaurantId(restaurantId: number): Promise<Branch[]> {
  const rows = await db('restaurant_branches').select(BRANCH_COLUMNS).where('restaurant_id', restaurantId);

  return rows.map(toEntity);
}

export async function findBranchById(id: number): Promise<Branch | null> {
  const row = await db('restaurant_branches').select(BRANCH_COLUMNS).where('id', id).first();

  return row ? toEntity(row) : null;
}

export async function findBranchesIds(restaurantId: number, ids: number[]): Promise<Branch[]> {
  const rows = await db('restaurant_branches').whereIn('id', ids).andWhere('restaurant_id', restaurantId).select(BRANCH_COLUMNS);
  return rows.map(toEntity);
}

export async function findNearbyBranches(lng: number, lat: number): Promise<NearbyBranch[]> {
  const result = await db.raw(
    `
        SELECT 
            b.id, 
            b.restaurant_id,
            b.address_text,
            b.label,
            b.lng,
            b.lat,
            b.is_active,
            b.accept_orders,
            b.currency,
            r.name AS restaurant_name,
            r.logo_url AS restaurant_logo_url
        FROM restaurant_branches b
        JOIN restaurants r ON r.id = b.restaurant_id
        WHERE b.is_active = true AND r.status = 'active'
        AND ST_DWithin(b.location, ST_MakePoint(?, ?)::geography, b.delivery_radius * 1000)
    `,
    [lng, lat],
  );

  // const rows = result.rows as NearbyBranchRow[];
  return result.rows.map(toNearbyBranch);
}
