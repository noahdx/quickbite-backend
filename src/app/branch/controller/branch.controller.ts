import { NextFunction, Request, Response } from 'express';
import { BranchService } from '../service/branch.service';
import { validateBody } from '../../../lib/validation/validate';
import { CreateBranchDTO, UpdateBranchDTO, UpdateBranchStatusDTO } from '../dto/branch.dto';
import { inject, injectable } from 'tsyringe';
import { tokens } from '../../../lib/di/tokens';
import { sendSuccess } from '../../../lib/http/response';

@injectable()
export class BranchController {
  constructor(@inject(tokens.BranchService) private readonly branchService: BranchService) {}

  findByRestaurant = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const restaurantId = Number(req.params.restaurantId);
      const result = await this.branchService.findByRestaurant(restaurantId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  findNearby = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lng = Number(req.query.lng);
      const lat = Number(req.query.lat);
      const result = await this.branchService.findNearby(lng, lat);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const restaurantId = Number(req.params.restaurantId);
      const userId = Number(req.user?.userId);
      const data = await validateBody(CreateBranchDTO, req.body);
      const result = await this.branchService.create(userId, restaurantId, data);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const branchId = Number(req.params.branchId);
      const data = await validateBody(UpdateBranchDTO, req.body);
      const result = await this.branchService.update(branchId, data);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const branchId = Number(req.params.branchId);
      const data = await validateBody(UpdateBranchStatusDTO, req.body);
      const result = await this.branchService.updateStatus(branchId, data);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };
}
