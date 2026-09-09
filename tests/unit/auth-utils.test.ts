import { describe, expect, it } from 'vitest';
import { comparePassword, generateOTP, hashOTP, hashPassword } from '../../src/app/auth/utils';

describe('auth utils', () => {
  describe('generateOTP', () => {
    it('returns a 6-digit numeric string', () => {
      const otp = generateOTP();
      expect(otp).toMatch(/^\d{6}$/);
    });

    it('generates different values on subsequent calls', () => {
      const first = generateOTP();
      const second = generateOTP();
      expect(first).not.toBe(second);
    });
  });

  describe('hashOTP', () => {
    it('returns a hex sha-256 digest', () => {
      const digest = hashOTP('123456');
      expect(digest).toMatch(/^[a-f0-9]{64}$/);
    });

    it('is deterministic for the same input', () => {
      expect(hashOTP('123456')).toBe(hashOTP('123456'));
    });

    it('differs for different inputs', () => {
      expect(hashOTP('123456')).not.toBe(hashOTP('654321'));
    });
  });

  describe('password hashing', () => {
    it('hashes and verifies a password round-trip', async () => {
      const hashed = await hashPassword('super-secret');
      expect(hashed).not.toBe('super-secret');
      await expect(comparePassword('super-secret', hashed)).resolves.toBe(true);
    });

    it('rejects an incorrect password', async () => {
      const hashed = await hashPassword('super-secret');
      await expect(comparePassword('wrong-password', hashed)).resolves.toBe(false);
    });
  });
});
