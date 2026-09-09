import { Request, Response, NextFunction } from 'express';
import { RestaurantService } from '../service/restaurant.service';
import { validateBody } from '../../../lib/validation/validate';
import { CreateRestaurantDTO, UpdatedRestaurantDTO, UpdateRestaurantStatusDTO } from '../dto/restaurant.dto';
import { SystemRole } from '../../user/enums';
import { inject, injectable } from 'tsyringe';
import { tokens } from '../../../lib/di/tokens';
import { sendSuccess } from '../../../lib/http/response';

@injectable()
export class RestaurantController {
  constructor(@inject(tokens.RestaurantService) private readonly restaurantService: RestaurantService) {}

  getAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.restaurantService.findAll();
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const restaurantId = Number(req.params.id);
      const result = await this.restaurantService.findByRestaurant(restaurantId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userRole = req.user?.role as SystemRole;
      const data = await validateBody(CreateRestaurantDTO, req.body);
      const result = await this.restaurantService.createWithOwner(userRole, data);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const restaurantId = Number(req.params.id);
      const data = await validateBody(UpdatedRestaurantDTO, req.body);
      const result = await this.restaurantService.update(restaurantId, data);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userRole = req.user?.role as SystemRole;
      const restaurantId = Number(req.params.id);
      const data = await validateBody(UpdateRestaurantStatusDTO, req.body);
      const result = await this.restaurantService.updateStatus(restaurantId, userRole, data);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };
}
