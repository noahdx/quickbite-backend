import { Router } from 'express';
import { MemberController } from './controller/member.controller';
import { authenticate } from '../../lib/auth/authenticate';
import { rbac, requireRestaurantMember } from '../../lib/auth/rbac';
import { container } from '../../lib/di/container';
import { tokens } from '../../lib/di/tokens';

export const rbacRouter = Router();
const memberController = container.resolve<MemberController>(tokens.MemberController);

rbacRouter.get(
  '/restaurants/:restaurantId/members',
  authenticate,
  requireRestaurantMember('restaurantId'),
  rbac({ action: 'read', resource: 'core:member' }),

  memberController.listMembers,
);

rbacRouter.post(
  '/restaurants/:restaurantId/members',
  authenticate,
  requireRestaurantMember('restaurantId'),
  rbac({ action: 'create', resource: 'core:member' }),

  memberController.create,
);

rbacRouter.put(
  '/restaurants/:restaurantId/members/:memberId',
  authenticate,
  requireRestaurantMember('restaurantId'),
  rbac({ resource: 'core:member', action: 'update' }),

  memberController.update,
);

rbacRouter.delete(
  '/restaurants/:restaurantId/members/:memberId',
  authenticate,
  requireRestaurantMember('restaurantId'),
  rbac({ action: 'delete', resource: 'core:member' }),
  memberController.deleteMember,
);
