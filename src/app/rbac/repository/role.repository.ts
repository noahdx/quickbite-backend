import { Knex } from 'knex';
import { db } from '../../../lib/knex/knex';
import { Role } from '../entity/role.entity';

interface RoleRow {
  id: number;
  name: string;
  display_name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

const ROLE_COLUMNS = ['id', 'name', 'display_name', 'created_at', 'updated_at'];

function toEntity(row: RoleRow): Role {
  return new Role({
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    description: row.description ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export async function findRoleByName(name: string, conn: Knex = db): Promise<number | null> {
  const row = await conn('roles').where('name', name).select('id').first();
  return row ? (row.id as number) : null;
}

export async function findAllRoles(): Promise<Role[]> {
  const rows = await db('roles').select(ROLE_COLUMNS);
  return rows.map(toEntity);
}
