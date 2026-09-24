import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../service/product.service';
import { validateBody } from '../../../lib/validation/validate';
import { CreateProductDTO, UpdateProductDTO } from '../dto/product.dto';
import { inject, injectable } from 'tsyringe';
import { tokens } from '../../../lib/di/tokens';
import { sendPagination, sendSuccess } from '../../../lib/http/response';
import { parseFilters, parsePaginationQuery } from '../../../lib/http/pagination/parse-query';

@injectable()
export class ProductController {
  constructor(@inject(tokens.ProductService) private readonly productService: ProductService) {}

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
      const params = parsePaginationQuery(req.query);
      const filters = parseFilters(req.query, ['restaurant_id', 'name', 'category_id', 'created_at']);
      const allowedFields = {
        name: 'name',
        restaurantId: 'restaurant_id',
        categoryId: 'category_id',
        createdAt: 'created_at',
      };

      const result = await this.productService.findByRestaurant(restaurantId, params, filters, allowedFields);
      sendPagination(res, result.data, result.meta);
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
      const branchId = Number(req.params.branchId);
      const data = await validateBody(UpdateProductDTO, req.body);
      const result = await this.productService.update(productId, data, branchId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };
}
