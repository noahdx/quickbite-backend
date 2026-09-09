import { Knex } from 'knex';
import { db } from '../../../lib/knex/knex';

export async function findPermissionsByRoleName(roleName: string, conn: Knex = db): Promise<string[]> {
  const rows = await conn('permissions as p')
    .select('p.id', 'p.resource', 'p.action')
    .join('role_permissions as rp', 'p.id', 'rp.permission_id')
    .join('roles as r', 'r.id', 'rp.role_id')
    .where('r.name', roleName);

  return rows.map((row) => `${row.resource}:${row.action}`);
}
