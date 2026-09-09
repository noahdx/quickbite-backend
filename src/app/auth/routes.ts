import { Router } from 'express';
import { container } from '../../lib/di/container';
import { tokens } from '../../lib/di/tokens';
import { AuthController } from './controller/auth.controller';

export const authRouter = Router();

const authController = container.resolve<AuthController>(tokens.AuthController);

authRouter.post('/login', authController.login);
authRouter.post('/register', authController.register);
authRouter.post('/forget-password', authController.forgetPassword);
authRouter.post('/reset-password', authController.resetPassword);
authRouter.post('/refresh', authController.refresh);
authRouter.post('/accept-invite', authController.acceptInvite);
