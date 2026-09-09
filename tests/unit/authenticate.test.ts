import { describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import { authenticate } from '../../src/lib/auth/authenticate';
import { generateAccessToken } from '../../src/app/auth/utils';
import { NotAuthenticated } from '../../src/lib/auth/errors';

function mockReq(cookies: Record<string, string> = {}) {
  return { cookies } as unknown as Request;
}

describe('authenticate middleware', () => {
  it('throws NotAuthenticated when the access token cookie is missing', () => {
    const req = mockReq();
    const next = vi.fn() as unknown as NextFunction;

    let thrown: unknown;
    try {
      authenticate(req, {} as Response, next);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBe(NotAuthenticated);
    expect(next).not.toHaveBeenCalled();
  });

  it('attaches the verified user to the request and calls next', () => {
    const token = generateAccessToken({
      userId: 7,
      email: 'a@b.c',
      role: 'customer',
    });
    const req = mockReq({ access_token: token });
    const next = vi.fn() as unknown as NextFunction;

    authenticate(req, {} as Response, next);

    expect(req.user).toMatchObject({ userId: 7, email: 'a@b.c', role: 'customer' });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('throws when the token is invalid', () => {
    const req = mockReq({ access_token: 'definitely-not-a-jwt' });
    const next = vi.fn() as unknown as NextFunction;

    expect(() => authenticate(req, {} as Response, next)).toThrow();
  });
});
