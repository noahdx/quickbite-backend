import { Router } from 'express';
import { ProductController } from './controller/product.controller';
import { authenticate } from '../../lib/auth/authenticate';
import { rbac, requireRestaurantMember, requireBranchAccess } from '../../lib/auth/rbac';
import { container } from '../../lib/di/container';
import { tokens } from '../../lib/di/tokens';
import { cacheLayer } from '../../lib/cache/cacheLayer';

export const productRouter = Router();
const productController = container.resolve<ProductController>(tokens.ProductController);

productRouter.get('/products/:productId', productController.findById);
productRouter.get(
  '/branches/:branchId/products',
  cacheLayer({ branchScoped: true }),
  productController.findByBranch,
);
productRouter.get(
  '/restaurants/:restaurantId/categories',
  cacheLayer({ restaurantScoped: true }),
  productController.findCategories,
);

productRouter.get(
  '/restaurants/:restaurantId/products',
  authenticate,
  requireRestaurantMember('restaurantId'),
  rbac({ resource: 'core:product', action: 'read' }),
  cacheLayer({ restaurantScoped: true }),
  productController.findByRestaurant,
);

productRouter.post(
  '/restaurants/:restaurantId/products',
  authenticate,
  requireRestaurantMember('restaurantId'),
  rbac({ resource: 'core:product', action: 'create' }),
  productController.create,
);

productRouter.patch(
  '/products/:productId',
  authenticate,
  requireBranchAccess('branchId'),
  rbac({ resource: 'core:product', action: 'update' }),
  productController.update,
);
