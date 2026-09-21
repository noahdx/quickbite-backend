import { NextFunction, Request, Response } from 'express';
import { CustomerAddressService } from '../service/customer-address.service';
import { validateBody } from '../../../lib/validation/validate';
import { CreateAddressDTO, UpdateAddressDTO } from '../dto/customer-address.dto';
import { inject, injectable } from 'tsyringe';
import { tokens } from '../../../lib/di/tokens';
import { sendSuccess } from '../../../lib/http/response';

@injectable()
export class CustomerAddressController {
  constructor(@inject(tokens.CustomerAddressService) private readonly customerAddressService: CustomerAddressService) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = Number(req.user?.userId);
      const result = await this.customerAddressService.getByUserId(userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = Number(req.user?.userId);
      const data = await validateBody(CreateAddressDTO, req.body);
      const result = await this.customerAddressService.create(userId, data);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = Number(req.user?.userId);
      const addressId = Number(req.params.addressId);
      const data = await validateBody(UpdateAddressDTO, req.body);
      const result = await this.customerAddressService.update(userId, addressId, data);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = Number(req.user?.userId);
      const addressId = Number(req.params.addressId);
      const result = await this.customerAddressService.remove(userId, addressId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };
}
