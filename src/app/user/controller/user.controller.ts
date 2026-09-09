import { NextFunction, Request, Response } from 'express';
import { UserService } from '../service/user.service';
import { validateBody } from '../../../lib/validation/validate';
import { UpdateUserDTO } from '../dto/user.dto';
import { inject, injectable } from 'tsyringe';
import { tokens } from '../../../lib/di/tokens';
import { sendSuccess } from '../../../lib/http/response';

@injectable()
export class UserController {
  constructor(@inject(tokens.UserService) private readonly userService: UserService) {}

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const result = await this.userService.getUserById(userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const data = await validateBody(UpdateUserDTO, req.body);
      const result = await this.userService.updateProfile(userId, data);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };
}
