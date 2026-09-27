import { Router } from 'express';
import { container } from '../../lib/di/container';
import { tokens } from '../../lib/di/tokens';
import { AuthController } from './controller/auth.controller';
import { idempotency } from '../../lib/idempotency/idempotency';
import { rateLimiter } from '../../lib/rate-limit/rate-limit';
import { toMs } from '../../pkg/utils/time';

export const authRouter = Router();

const authController = container.resolve<AuthController>(tokens.AuthController);

authRouter.post('/login', rateLimiter({ windowMs: toMs(10, 'm'), limit: 10 }), authController.login);
authRouter.post('/register', rateLimiter({ windowMs: toMs(10, 'm'), limit: 10 }), authController.register);
authRouter.post(
  '/forget-password',
  rateLimiter({ windowMs: toMs(10, 'm'), limit: 5 }),
  idempotency({ strict: true }),
  authController.forgetPassword,
);
authRouter.post('/reset-password', rateLimiter({ windowMs: toMs(10, 'm'), limit: 10 }), authController.resetPassword);
authRouter.post('/accept-invite', rateLimiter({ windowMs: toMs(10, 'm'), limit: 10 }), authController.acceptInvite);
authRouter.post('/refresh', authController.refresh);
