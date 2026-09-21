import { db } from '../../../lib/knex/knex';
import { AddressType } from '../enums';
import { CustomerAddress } from '../entity/customer-address.entity';

interface CustomerAddressRow {
  id: number;
  user_id: number;
  label: string;
  country: string;
  city: string;
  street: string;
  building: string | null;
  apartment_number: string | null;
  type: string;
  lat: string;
  lng: string;
  is_default: boolean;
}

const ADDRESS_COLUMNS = [
  'id',
  'user_id',
  'label',
  'country',
  'city',
  'street',
  'building',
  'apartment_number',
  'type',
  'lat',
  'lng',
  'is_default',
];

function toEntity(row: CustomerAddressRow) {
  return new CustomerAddress({
    id: row.id,
    userId: row.user_id,
    label: row.label,
    country: row.country,
    city: row.city,
    street: row.street,
    building: row.building,
    apartmentNumber: row.apartment_number,
    type: row.type as AddressType,
    lat: Number(row.lat),
    lng: Number(row.lng),
    isDefault: row.is_default,
  });
}

export async function createAddress(data: Partial<CustomerAddress>): Promise<CustomerAddress> {
  const [row] = await db('customer_addresses')
    .insert({
      user_id: data.userId,
      label: data.label,
      country: data.country,
      city: data.city,
      street: data.street,
      building: data.building,
      apartment_number: data.apartmentNumber,
      type: data.type,
      lat: data.lat,
      lng: data.lng,
      is_default: data.isDefault,
    })
    .returning(ADDRESS_COLUMNS);

  return toEntity(row);
}

export async function updateAddress(id: number, data: Partial<CustomerAddress>): Promise<CustomerAddress> {
  const mapping: Record<string, unknown> = {};
  if (data.label !== undefined) mapping.label = data.label;
  if (data.country !== undefined) mapping.country = data.country;
  if (data.city !== undefined) mapping.city = data.city;
  if (data.street !== undefined) mapping.street = data.street;
  if (data.building !== undefined) mapping.building = data.building;
  if (data.apartmentNumber !== undefined) mapping.apartment_number = data.apartmentNumber;
  if (data.type !== undefined) mapping.type = data.type;
  if (data.lng !== undefined) mapping.lng = data.lng;
  if (data.lat !== undefined) mapping.lat = data.lat;
  if (data.isDefault !== undefined) mapping.is_default = data.isDefault;

  const [row] = await db('customer_addresses').where('id', id).update(mapping).returning(ADDRESS_COLUMNS);
  return toEntity(row);
}

export async function findAddressById(id: number): Promise<CustomerAddress | null> {
  const row = await db('customer_addresses').where('id', id).select(ADDRESS_COLUMNS).first();
  return row ? toEntity(row) : null;
}

export async function findAddressesByUserId(userId: number): Promise<CustomerAddress[]> {
  const row = await db('customer_addresses').where('user_id', userId).select(ADDRESS_COLUMNS);
  return row.map(toEntity);
}

export async function clearDefaultByUserId(userId: number): Promise<void> {
  await db('customer_addresses').where('user_id', userId).where('is_default', true).update({ is_default: false });
}

export async function deleteAddress(id: number): Promise<void> {
  await db('customer_addresses').where('id', id).delete();
}
