import { Knex } from 'knex';
import { db } from '../../../lib/knex/knex';
import { RestaurantMember } from '../entity/restaurant-member.entity';
import { MemberStatus } from '../enums';

const MEMBER_COLUMNS = ['id', 'user_id', 'restaurant_id', 'role_id', 'status', 'created_at', 'updated_at'];

function toEntity(row: any) {
  return new RestaurantMember({
    id: row.id,
    userId: row.user_id,
    restaurantId: row.restaurant_id,
    roleId: row.role_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export async function createRestaurantMember(data: Partial<RestaurantMember>, conn: Knex = db): Promise<RestaurantMember> {
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

export async function activateMemberByUserId(userId: number): Promise<void> {
  await db('restaurant_members').where('user_id', userId).update({
    status: MemberStatus.ACTIVE,
    updated_at: new Date(),
  });
}

export async function findRestaurantMemberWithRole(
  userId: number,
): Promise<{ memberId: number; restaurantId: number; roleName: string }> {
  const row = await db('restaurant_members as  rm')
    .select('rm.id', 'rm.restaurant_id', 'r.name as roleName')
    .leftJoin('roles as r', 'r.id', 'rm.role_id')
    .where('rm.user_id', userId)
    .andWhere('rm.status', MemberStatus.ACTIVE)
    .first();

  return {
    memberId: row.id,
    restaurantId: row.restaurant_id,
    roleName: row.roleName,
  };
}

export async function findMembersByRestaurantId(restaurantId: number): Promise<any[]> {
  const rows = await db('restaurant_members as rm')
    .select(
      'rm.user_id',
      'rm.id',
      'rm.status',
      'u.name',
      'u.email',
      'u.phone',
      'r.name as role',
      'r.display_name as roleDisplayName',
    )
    .join('users as u', 'u.id', 'rm.user_id')
    .join('roles as r', 'r.id', 'rm.role_id')
    .where('restaurant_id', restaurantId);

  return rows.map((row) => ({
    userId: row.user_id,
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    roleDisplayName: row.roleDisplayName,
    status: row.status,
  }));
}

export async function findMemberById(memberId: number): Promise<RestaurantMember | null> {
  const row = await db('restaurant_members').where('id', memberId).select(MEMBER_COLUMNS).first();
  return row ? toEntity(row) : null;
}

export async function findMemberByUserId(userId: number): Promise<RestaurantMember | null> {
  const row = await db('restaurant_members').where('user_id', userId).select(MEMBER_COLUMNS).first();
  return row ? toEntity(row) : null;
}

export async function updateRestaurantMember(memberId: number, data: Partial<RestaurantMember>): Promise<any> {
  const mapping: Record<string, unknown> = {};
  mapping.updated_at = data.updatedAt;
  if (data.roleId !== undefined) mapping.role_id = data.roleId;
  if (data.status !== undefined) mapping.status = data.status;

  await db('restaurant_members').where('id', memberId).update(mapping);
}

export async function deleteMember(memberId: number) {
  await db('member_branches').where('member_id', memberId).delete();
  await db('restaurant_members').where('id', memberId).delete();
}
