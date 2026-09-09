import { Router } from 'express';
import { BranchController } from './controller/branch.controller';
import { authenticate } from '../../lib/auth/authenticate';
import { rbac, requireBranchAccess, requireRestaurantMember } from '../../lib/auth/rbac';
import { container } from '../../lib/di/container';
import { tokens } from '../../lib/di/tokens';

export const branchRouter = Router();
const branchController = container.resolve<BranchController>(tokens.BranchController);

branchRouter.get('/branches/nearby', branchController.findNearby);

branchRouter.get('/restaurants/:restaurantId/branches', branchController.findByRestaurant);

branchRouter.post(
  '/restaurants/:restaurantId/branches',
  authenticate,
  requireRestaurantMember('restaurantId'),
  rbac({ resource: 'core:branch', action: 'create' }),
  branchController.create,
);

branchRouter.patch(
  '/branches/:branchId',
  authenticate,
  requireBranchAccess('branchId'),
  rbac({ resource: 'core:branch', action: 'update' }),
  branchController.update,
);

branchRouter.patch(
  '/branches/:branchId/status',
  authenticate,
  requireBranchAccess('branchId'),
  rbac({ resource: 'core:branch', action: 'update' }),

  branchController.updateStatus,
);
