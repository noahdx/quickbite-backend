import { injectable } from 'tsyringe';
import { toMs } from '../../../pkg/utils/time';
import { findPermissionsByRoleName } from '../repository/permission.repository';

@injectable()
export class PermissionCacheService {
  private cache: Map<string, { permissions: string[]; cachedAt: number }> = new Map();
  private readonly TTL: number = toMs(1, 'h');

  getPermissions = async (restaurantRole: string) => {
    const cached = this.cache.get(restaurantRole);
    if (cached && Date.now() - cached.cachedAt < this.TTL) {
      return cached.permissions;
    }

    const permissions = await findPermissionsByRoleName(restaurantRole);
    this.cache.set(restaurantRole, { permissions, cachedAt: Date.now() });
    return permissions;
  };

  hasPermission = (permissions: string[], resource: string, action: string) => {
    return permissions.includes(`${resource}:${action}`);
  };
}
