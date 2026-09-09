import { NextFunction, Request, Response } from 'express';
import { AuthService } from '../service/auth.service';
import { validateBody } from '../../../lib/validation/validate';
import { ForgetResetDTO, LoginDTO, RegisterDTO, ResetPasswordDTO } from '../dto/auth.dto';
import { setCookie } from '../../../lib/utils/cookie';
import { env } from '../../../lib/config/env';
import { toMs } from '../../../pkg/utils/time';
import { inject, injectable } from 'tsyringe';
import { tokens } from '../../../lib/di/tokens';
import { sendSuccess } from '../../../lib/http/response';

@injectable()
export class AuthController {
  constructor(@inject(tokens.AuthService) private readonly authService: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await validateBody(RegisterDTO, req.body);
      const result = await this.authService.register(data);
      setCookie(res, result.accessToken, result.refreshToken);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await validateBody(LoginDTO, req.body);
      const result = await this.authService.login(data);
      setCookie(res, result.accessToken, result.refreshToken);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  forgetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await validateBody(ForgetResetDTO, req.body);
      const result = await this.authService.forgetPassword(data);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await validateBody(ResetPasswordDTO, req.body);
      const result = await this.authService.resetPassword(data);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies.refresh_token;
      const result = await this.authService.refresh(refreshToken);
      res.cookie('access_token', result.accessToken, {
        httpOnly: true,
        secure: env.isProduction,
        maxAge: toMs(1, 'h'),
      });

      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  acceptInvite = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await validateBody(ResetPasswordDTO, req.body);
      const result = await this.authService.acceptInvite(data);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };
}
