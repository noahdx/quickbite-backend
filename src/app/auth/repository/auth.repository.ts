import { Knex } from 'knex';
import { db } from '../../../lib/knex/knex';
import { PasswordReset } from '../entity/auth.entity';

interface PasswordResetRow {
  id: number;
  user_id: number;
  otp_hash: string;
  expires_at: Date;
  consumed_at: Date | null;
  created_at: Date;
}

const PASSWORD_RESET_COLUMNS = ['id', 'user_id', 'otp_hash', 'expires_at', 'consumed_at', 'created_at'];

function toEntity(row: PasswordResetRow) {
  return new PasswordReset({
    id: row.id,
    userId: row.user_id,
    otpHash: row.otp_hash,
    expiresAt: row.expires_at,
    consumedAt: row.consumed_at,
    createdAt: row.created_at,
  });
}

export async function createPasswordReset(
  data: Partial<PasswordReset>,
  conn: Knex = db,
): Promise<PasswordReset> {
  const [row] = await conn('password_resets')
    .insert({
      user_id: data.userId,
      otp_hash: data.otpHash,
      expires_at: data.expiresAt,
      created_at: data.createdAt,
    })
    .returning(PASSWORD_RESET_COLUMNS);

  return toEntity(row);
}

export async function findLatestPasswordResetByUserId(userId: number): Promise<PasswordReset | null> {
  const row = await db('password_resets')
    .select(PASSWORD_RESET_COLUMNS)
    .where('user_id', userId)
    .whereNull('consumed_at')
    .orderBy('id', 'desc')
    .first();

  return row ? toEntity(row) : null;
}

export async function updatePasswordResetConsumedAt(id: number) {
  await db('password_resets').where('id', id).update({
    consumed_at: new Date(),
  });
}
