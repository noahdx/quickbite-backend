import { NextFunction, Request, Response } from 'express';
import { PermissionCacheService } from '../../app/rbac/service/permission-cache.service';
import { SystemRole } from '../../app/user/enums';
import { container } from '../di/container';
import { tokens } from '../di/tokens';
import { NotAuthenticated } from './errors';

interface IOptions {
  resource: string;
  action: string;
  allowSystemAdmin?: boolean;
}

// check for permissions
// system admin bypass this
// restaurant users must have permissions for their role

// router.post('/products', authenticate, rbac({resource:"product",action:"create"}), productController.create)
export function rbac(options: IOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // req.user is there , if not we will bail
      if (!req.user) throw NotAuthenticated;

      const { resource, action, allowSystemAdmin = true } = options;

      // if he is a system admin -> bypass
      if (req.user.role === SystemRole.SYSTEM_ADMIN && allowSystemAdmin) {
        return next();
      }

      // if restaurant user
      // 1. fetch permissions
      // 2. check if the permissions has the action for this resource
      if (req.user.role === SystemRole.RESTAURANT_USER) {
        const permissionService = container.resolve<PermissionCacheService>(tokens.PermissionCacheService);
        const permission = await permissionService.getPermissions(req.user.restaurantRole!);
        if (!permissionService.hasPermission(permission, resource, action)) {
          return res.status(403).json({
            message: 'Permission denied',
          });
        }
        // pass
        return next();
      }

      // if not restaurant ser -> throw err
      return res.status(403).json({
        message: 'Permission denied',
      });
    } catch (error) {
      next(error);
    }
  };
}

export function requireRestaurantMember(paramName: string = 'restaurantId') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) throw NotAuthenticated;

    if (req.user.role === SystemRole.SYSTEM_ADMIN) {
      return next();
    }

    if (req.user.role === SystemRole.RESTAURANT_USER) {
      if (Number(req.user.restaurantId) !== Number(req.params[paramName])) {
        return res.status(403).json({
          message: 'Permission denied',
        });
      }
      return next();
    }

    return res.status(403).json({
      message: 'Permission denied',
    });
  };
}

export function requireBranchAccess(paramName: string = 'branchId') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw NotAuthenticated;

      if (req.user.role === SystemRole.SYSTEM_ADMIN) {
        return next();
      }

      if (req.user.role === SystemRole.RESTAURANT_USER) {
        const raw = req.params[paramName] ?? req.query[paramName];
        const id = Number(raw);
        if (!req.user.branchIds?.includes(id)) {
          return res.status(403).json({ message: 'Permission denied 1' });
        }
        return next();
      }

      return res.status(403).json({
        message: 'Permission denied',
      });
    } catch (error) {
      next(error);
    }
  };
}
