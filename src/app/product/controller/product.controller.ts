import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../service/product.service';
import { validateBody } from '../../../lib/validation/validate';
import { CreateProductDTO, UpdateProductDTO } from '../dto/product.dto';
import { inject, injectable } from 'tsyringe';
import { tokens } from '../../../lib/di/tokens';
import { sendSuccess } from '../../../lib/http/response';

@injectable()
export class ProductController {
  constructor(@inject(tokens.ProductService) private readonly productService: ProductService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const restaurantId = Number(req.params.restaurantId);
      const data = await validateBody(CreateProductDTO, req.body);
      const result = await this.productService.create(restaurantId, data);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const productId = Number(req.params.productId);
      const branchId = Number(req.query.branchId);
      const data = await validateBody(UpdateProductDTO, req.body);
      const result = await this.productService.update(productId, branchId, data);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const productId = Number(req.params.productId);
      const result = await this.productService.findById(productId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  findByRestaurant = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const restaurantId = Number(req.params.restaurantId);
      const result = await this.productService.findByRestaurant(restaurantId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  findByBranch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const branchId = Number(req.params.branchId);
      const result = await this.productService.findByBranch(branchId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  findCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const restaurantId = Number(req.params.restaurantId);
      const result = await this.productService.findCategories(restaurantId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };
}
