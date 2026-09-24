import { Knex } from 'knex';
import { db } from '../../../lib/knex/knex';
import { toMs } from '../../../pkg/utils/time';
import { createPasswordReset } from '../repository/auth.repository';
import { comparePassword, generateOTP, hashOTP, hashPassword } from '../utils';

export class CredentialsService {
  hashPassword = hashPassword;

  comparePassword = comparePassword;

  createOtp = async (userId: number, trx?: Knex.Transaction): Promise<string> => {
    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);

    await createPasswordReset(
      {
        userId,
        otpHash: hashedOTP,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + toMs(1, 'h')),
      },
      trx,
    );

    return otp;
  };
}
