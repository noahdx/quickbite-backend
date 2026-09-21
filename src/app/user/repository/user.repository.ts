import { Knex } from 'knex';
import { db } from '../../../lib/knex/knex';
import { User } from '../entity/user.entity';
import { SystemRole } from '../enums';

interface UserRow {
  id: number;
  email: string;
  phone: string;
  name: string;
  password_hash: string;
  system_role: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

const USER_COLUMNS = ['id', 'email', 'phone', 'name', 'password_hash', 'system_role', 'created_at', 'updated_at', 'deleted_at'];

function toEntity(row: UserRow): User {
  return new User({
    id: row.id,
    email: row.email,
    phone: row.phone,
    name: row.name,
    passwordHash: row.password_hash,
    systemRole: row.system_role as SystemRole,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  });
}

export async function createUser(data: Partial<User>, conn: Knex = db): Promise<User> {
  const [row] = await conn('users')
    .insert({
      email: data.email,
      phone: data.phone,
      name: data.name,
      password_hash: data.passwordHash,
      system_role: data.systemRole,
      created_at: data.createdAt,
      updated_at: data.updatedAt,
    })
    .returning(USER_COLUMNS);
  return toEntity(row);
}

export async function updateUser(id: number, data: Partial<{ name: string; phone: string }>): Promise<User> {
  const mapping: Record<string, unknown> = { updated_at: new Date() };
  if (data.name !== undefined) mapping.name = data.name;
  if (data.phone !== undefined) mapping.phone = data.phone;

  const [row] = await db('users').where('id', id).update(mapping).returning(USER_COLUMNS);

  return toEntity(row);
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const row = await db('users').select(USER_COLUMNS).where('email', email).first();

  return row ? toEntity(row) : null;
}

export async function findUserById(id: number): Promise<User | null> {
  const row = await db('users').select(USER_COLUMNS).where('id', id).first();
  return row ? toEntity(row) : null;
}

export async function findUserExistsByEmail(email: string): Promise<boolean> {
  const result = await db.raw(`SELECT EXISTS (SELECT 1 FROM users WHERE email = ?) AS "exists"`, [email]);
  return result.rows[0]?.exists ?? false;
}

export async function updateUserPassword(id: number, password: string) {
  await db('users').where('id', id).update({
    password_hash: password,
  });
}
