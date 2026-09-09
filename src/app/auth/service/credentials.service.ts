import { Knex } from 'knex';
import { db } from '../../../lib/knex/knex';
import { toMs } from '../../../pkg/utils/time';
import { createPasswordReset } from '../repository/auth.repository';
import { comparePassword, generateOTP, hashOTP, hashPassword } from '../utils';

export class CredentialsService {
  hashPassword = hashPassword;

  comparePassword = comparePassword;

  /** Generates an OTP, persists its hash and returns the plain-text OTP (to be emailed/logged). */
  createOtp = async (userId: number, ttlMs: number, conn: Knex = db): Promise<string> => {
    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);

    await createPasswordReset(
      {
        userId,
        otpHash: hashedOTP,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + ttlMs),
      },
      conn,
    );

    return otp;
  };

  createInviteOtp = async (userId: number, conn: Knex = db): Promise<string> => {
    return this.createOtp(userId, toMs(1, 'h'), conn);
  };
}
