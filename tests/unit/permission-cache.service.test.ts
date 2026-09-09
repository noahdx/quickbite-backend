import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { findPermissionsByRoleName } from '../../src/app/rbac/repository/permission.repository';
import { PermissionCacheService } from '../../src/app/rbac/service/permission-cache.service';

const mocks = vi.hoisted(() => ({
  findPermissionsByRoleName: vi.fn(),
}));

vi.mock('../../src/app/rbac/repository/permission.repository', () => ({
  findPermissionsByRoleName: mocks.findPermissionsByRoleName,
}));

describe('PermissionCacheService', () => {
  let service: PermissionCacheService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    service = new PermissionCacheService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fetches permissions and caches them within the TTL', async () => {
    mocks.findPermissionsByRoleName.mockResolvedValue(['core:product:update']);

    const first = await service.getPermissions('manager');
    const second = await service.getPermissions('manager');

    expect(first).toEqual(['core:product:update']);
    expect(second).toEqual(['core:product:update']);
    expect(mocks.findPermissionsByRoleName).toHaveBeenCalledTimes(1);
  });

  it('refetches permissions once the TTL expires', async () => {
    vi.useFakeTimers();
    mocks.findPermissionsByRoleName.mockResolvedValue(['core:product:update']);

    await service.getPermissions('manager');
    vi.advanceTimersByTime(60 * 60 * 1000 + 1);
    await service.getPermissions('manager');

    expect(mocks.findPermissionsByRoleName).toHaveBeenCalledTimes(2);
  });

  it('hasPermission matches resource:action entries', () => {
    const permissions = ['core:product:update', 'core:product:read'];
    expect(service.hasPermission(permissions, 'core:product', 'update')).toBe(true);
    expect(service.hasPermission(permissions, 'core:product', 'delete')).toBe(false);
  });
});
