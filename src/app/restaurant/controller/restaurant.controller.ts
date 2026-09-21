import { Request, Response, NextFunction } from 'express';
import { RestaurantService } from '../service/restaurant.service';
import { validateBody } from '../../../lib/validation/validate';
import { CreateRestaurantDTO, UpdatedRestaurantDTO, UpdateRestaurantStatusDTO } from '../dto/restaurant.dto';
import { SystemRole } from '../../user/enums';
import { inject, injectable } from 'tsyringe';
import { tokens } from '../../../lib/di/tokens';
import { sendPagination, sendSuccess } from '../../../lib/http/response';
import { parseFilters, parsePaginationQuery } from '../../../lib/http/pagination/parse-query';

@injectable()
export class RestaurantController {
  constructor(@inject(tokens.RestaurantService) private readonly restaurantService: RestaurantService) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = parsePaginationQuery(req.query);
      const filters = parseFilters(req.query, ['id', 'name', 'status']);
      const allowedFields = {
        id: 'id',
        name: 'name',
        status: 'status',
      };
      const result = await this.restaurantService.findAll(params, filters, allowedFields);
      sendPagination(res, result.data, result.meta);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const restaurantId = Number(req.params.restaurantId);
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
      const restaurantId = Number(req.params.restaurantId);
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
      const restaurantId = Number(req.params.restaurantId);
      const data = await validateBody(UpdateRestaurantStatusDTO, req.body);
      const result = await this.restaurantService.updateStatus(restaurantId, userRole, data);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };
}
