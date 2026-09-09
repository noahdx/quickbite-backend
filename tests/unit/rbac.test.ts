import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import { rbac, requireBranchAccess } from '../../src/lib/auth/rbac';
import { SystemRole } from '../../src/app/user/enums';

const mocks = vi.hoisted(() => ({
  resolve: vi.fn(),
}));

vi.mock('../../src/lib/di/container', () => ({
  container: { resolve: mocks.resolve },
}));

function mockReq(partial: Partial<Request> = {}) {
  return {
    user: undefined,
    params: {},
    query: {},
    ...partial,
  } as unknown as Request;
}

function mockRes() {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function mockPermissionService(permissions: string[]) {
  mocks.resolve.mockReturnValue({
    getPermissions: vi.fn().mockResolvedValue(permissions),
    hasPermission: (perms: string[], resource: string, action: string) =>
      perms.includes(`${resource}:${action}`),
  });
}

describe('rbac middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows system admins to bypass permission checks', async () => {
    const req = mockReq({ user: { userId: 1, email: 'a@b.c', role: SystemRole.SYSTEM_ADMIN } });
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    await rbac({ resource: 'core:product', action: 'update' })(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(mocks.resolve).not.toHaveBeenCalled();
  });

  it('bails with an error when no user is attached', async () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    await rbac({ resource: 'core:product', action: 'update' })(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]?.statusCode).toBe(401);
  });

  it('allows a restaurant user with the required permission', async () => {
    mockPermissionService(['core:product:update']);
    const req = mockReq({
      user: {
        userId: 1,
        email: 'a@b.c',
        role: SystemRole.RESTAURANT_USER,
        restaurantId: 3,
        restaurantRole: 'manager',
      },
    });
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    await rbac({ resource: 'core:product', action: 'update' })(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('denies a restaurant user missing the required permission', async () => {
    mockPermissionService(['core:product:read']);
    const req = mockReq({
      user: {
        userId: 1,
        email: 'a@b.c',
        role: SystemRole.RESTAURANT_USER,
        restaurantId: 3,
        restaurantRole: 'cashier',
      },
    });
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    await rbac({ resource: 'core:product', action: 'update' })(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('requireBranchAccess middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows system admins unconditionally', () => {
    const req = mockReq({ user: { userId: 1, email: 'a@b.c', role: SystemRole.SYSTEM_ADMIN } });
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    requireBranchAccess('branchId')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('allows a restaurant user with access to the branch in params', () => {
    const req = mockReq({
      params: { branchId: '9' },
      user: {
        userId: 1,
        email: 'a@b.c',
        role: SystemRole.RESTAURANT_USER,
        restaurantId: 3,
        branchIds: [9, 12],
      },
    });
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    requireBranchAccess('branchId')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('allows a restaurant user with access to the branch in query', () => {
    const req = mockReq({
      query: { branchId: '9' },
      user: {
        userId: 1,
        email: 'a@b.c',
        role: SystemRole.RESTAURANT_USER,
        restaurantId: 3,
        branchIds: [9],
      },
    });
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    requireBranchAccess('branchId')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('denies a restaurant user without access to the branch', () => {
    const req = mockReq({
      params: { branchId: '99' },
      user: {
        userId: 1,
        email: 'a@b.c',
        role: SystemRole.RESTAURANT_USER,
        restaurantId: 3,
        branchIds: [9],
      },
    });
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    requireBranchAccess('branchId')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
