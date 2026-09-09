import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPasswordReset } from '../../src/app/auth/repository/auth.repository';
import { CredentialsService } from '../../src/app/auth/service/credentials.service';
import { hashOTP } from '../../src/app/auth/utils';

const mocks = vi.hoisted(() => ({
  createPasswordReset: vi.fn(),
}));

vi.mock('../../src/app/auth/repository/auth.repository', () => ({
  createPasswordReset: mocks.createPasswordReset,
}));

describe('CredentialsService', () => {
  let service: CredentialsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CredentialsService();
  });

  it('creates an OTP and persists its sha-256 hash', async () => {
    const conn = { insert: vi.fn() } as never;
    mocks.createPasswordReset.mockResolvedValue({});

    const otp = await service.createOtp(42, 600_000, conn);

    expect(otp).toMatch(/^\d{6}$/);
    expect(mocks.createPasswordReset).toHaveBeenCalledTimes(1);

    const [record] = mocks.createPasswordReset.mock.calls[0];
    expect(record.userId).toBe(42);
    expect(record.otpHash).toBe(hashOTP(otp));
    expect(record.expiresAt.getTime()).toBeGreaterThanOrEqual(Date.now() + 600_000 - 5);
    expect(record.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 600_000 + 5);
  });

  it('uses a 1-hour TTL for invite OTPs', async () => {
    const conn = { insert: vi.fn() } as never;
    mocks.createPasswordReset.mockResolvedValue({});

    const otp = await service.createInviteOtp(7, conn);

    expect(otp).toMatch(/^\d{6}$/);
    const [record] = mocks.createPasswordReset.mock.calls[0];
    const expected = 60 * 60 * 1000;
    expect(record.expiresAt.getTime()).toBeGreaterThanOrEqual(Date.now() + expected - 5);
    expect(record.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + expected + 5);
  });
});
