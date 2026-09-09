import { Router } from 'express';
import { healthRouter } from './app/health/healthRouter';
import { authRouter } from './app/auth/routes';
import { restaurantRouter } from './app/restaurant/routes';
import { branchRouter } from './app/branch/routes';
import { userRouter } from './app/user/routes';
import { customerAddressRouter } from './app/customer-address/routes';
import { productRouter } from './app/product/routes';
import { rbacRouter } from './app/rbac/routes';

const router = Router();

router.use('/health', healthRouter);
// auth
router.use('/auth', authRouter);
// user
router.use('/user', userRouter);
// customer addresses
router.use('/customer/address', customerAddressRouter);
// restaurant
router.use('/restaurants', restaurantRouter);
// branches
router.use('/', branchRouter);
// products
router.use('/', productRouter);
// rbac
router.use('/', rbacRouter);
export default router;
