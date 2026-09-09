import { Router } from 'express';
import { UserController } from './controller/user.controller';
import { authenticate } from '../../lib/auth/authenticate';
import { container } from '../../lib/di/container';
import { tokens } from '../../lib/di/tokens';

export const userRouter = Router();
const userController = container.resolve<UserController>(tokens.UserController);
userRouter.get('/me', authenticate, userController.getProfile);
userRouter.patch('/me', authenticate, userController.updateProfile);
