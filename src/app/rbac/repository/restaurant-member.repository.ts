import { Knex } from 'knex';
import { RestaurantMember } from '../entity/restaurant-member.entity';
import { db } from '../../../lib/knex/knex';
import { MemberStatus } from '../enums';
import { AppError } from '../../../lib/error/AppError';

interface RestaurantMemberRow {
  id: number;
  user_id: number;
  restaurant_id: number;
  role_id: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}

type MemberWithRoleRow = RestaurantMemberRow & { roleName: string };

const MEMBER_COLUMNS = ['id', 'user_id', 'restaurant_id', 'role_id', 'status', 'created_at', 'updated_at'];

function toEntity(row: RestaurantMemberRow) {
  return new RestaurantMember({
    id: row.id,
    userId: row.user_id,
    restaurantId: row.restaurant_id,
    roleId: row.role_id,
    status: row.status as MemberStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export async function createRestaurantMember(
  data: Partial<RestaurantMember>,
  conn: Knex = db,
): Promise<RestaurantMember> {
  const [row] = await conn('restaurant_members')
    .insert({
      user_id: data.userId,
      restaurant_id: data.restaurantId,
      role_id: data.roleId,
      status: data.status,
      created_at: data.createdAt,
      updated_at: data.updatedAt,
    })
    .returning(MEMBER_COLUMNS);

  return toEntity(row);
}

export async function updateRestaurantMember(
  memberId: number,
  data: Partial<RestaurantMember>,
): Promise<RestaurantMember> {
  const mapping: Record<string, unknown> = {};
  mapping.updated_at = data.updatedAt;
  if (data.roleId !== undefined) mapping.role_id = data.roleId;
  if (data.status !== undefined) mapping.status = data.status;

  const [row] = await db('restaurant_members')
    .where('id', memberId)
    .update(mapping)
    .returning(MEMBER_COLUMNS);

  return toEntity(row);
}

export async function activateMemberByUserId(userId: number): Promise<void> {
  await db('restaurant_members').where('user_id', userId).update({
    status: MemberStatus.ACTIVE,
    updated_at: new Date(),
  });
}

export async function findMemberById(memberId: number): Promise<RestaurantMember | null> {
  const row = await db('restaurant_members').where('id', memberId).select(MEMBER_COLUMNS).first();
  return row ? toEntity(row) : null;
}

export async function findMembersByRestaurantId(restaurantId: number): Promise<RestaurantMember[] | null> {
  const rows = await db('restaurant_members').where('restaurant_id', restaurantId).select(MEMBER_COLUMNS);
  return rows ? rows.map(toEntity) : null;
}

export async function findRestaurantMemberWithRole(
  userId: number,
  conn: Knex = db,
): Promise<{ member: RestaurantMember; roleName: string }> {
  const row = await conn('restaurant_members as rm')
    .select('rm.restaurant_id', 'r.name as roleName')
    .join('roles as r', 'rm.role_id', 'r.id')
    .where('rm.user_id', userId)
    .first();

  if (!row) throw new AppError('Restaurant membership not found', 404);

  return {
    member: toEntity(row as MemberWithRoleRow),
    roleName: row.roleName as string,
  };
}

export async function deleteMember(memberId: number) {
  await db('restaurant_members').where('id', memberId).delete();
}
