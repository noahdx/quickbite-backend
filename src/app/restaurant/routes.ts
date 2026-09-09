import { Router } from 'express';
import { RestaurantController } from './controller/restaurant.controller';
import { authenticate } from '../../lib/auth/authenticate';
import { rbac, requireRestaurantMember } from '../../lib/auth/rbac';
import { container } from '../../lib/di/container';
import { tokens } from '../../lib/di/tokens';

export const restaurantRouter = Router();
const restaurantController = container.resolve<RestaurantController>(tokens.RestaurantController);

restaurantRouter.get('/', restaurantController.getAll);
restaurantRouter.get('/:id', restaurantController.getById);
restaurantRouter.post(
  '/',
  authenticate,
  rbac({ resource: 'core:restaurant', action: 'create' }),
  restaurantController.create,
);

restaurantRouter.patch(
  '/:restaurantId',
  authenticate,
  requireRestaurantMember('restaurantId'),
  rbac({ resource: 'core:restaurant', action: 'update' }),
  restaurantController.update,
);

restaurantRouter.patch(
  '/:restaurantId/status',
  authenticate,
  requireRestaurantMember('restaurantId'),
  rbac({ resource: 'core:restaurant', action: 'update' }),
  restaurantController.updateStatus,
);
