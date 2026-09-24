import { buildPaginationResult, FilterParams, PaginationParams } from '../../../lib/http/pagination/cursor-pagination';
import { CreateProductDTO, UpdateProductDTO } from '../dto/product.dto';
import { ProductNotFoundError } from '../errors';
import { createCategory, findCategoriesByRestaurant, findCategoryByName } from '../repository/category.repository';
import { updateBranchDetails } from '../repository/product-branch-details.repository';
import {
  createProduct,
  findProductById,
  findProductsByBranch,
  findProductsByRestaurant,
  updateProduct,
} from '../repository/product.repository';
import { injectable } from 'tsyringe';
import { RestaurantAccessService } from '../../restaurant/service/restaurant-access.service';
import { RestaurantNotFoundError } from '../../restaurant/errors';

@injectable()
export class ProductService {
  constructor(private readonly restaurantAccessService: RestaurantAccessService) {}

  findById = async (productId: number) => {
    const product = await findProductById(productId);
    return {
      message: 'Product retrieved successfully',
      data: product,
    };
  };

  findByRestaurant = async (
    restaurantId: number,
    params: PaginationParams,
    filters: FilterParams[],
    allowedFields: Record<string, any>,
  ) => {
    const products = await findProductsByRestaurant(restaurantId, params, filters, allowedFields);

    return buildPaginationResult(products, params.limit, params.field);
  };

  findByBranch = async (branchId: number) => {
    const products = await findProductsByBranch(branchId);
    return {
      message: 'Products retrieved successfully',
      data: products,
    };
  };

  findCategories = async (restaurantId: number) => {
    const categories = await findCategoriesByRestaurant(restaurantId);
    return {
      message: 'Categories retrieved successfully',
      data: categories,
    };
  };

  create = async (restaurantId: number, data: CreateProductDTO) => {
    const restaurant = await this.restaurantAccessService.findById(restaurantId);
    if (!restaurant) {
      throw RestaurantNotFoundError;
    }

    let categoryId = null;
    const now = new Date();

    if (data.categoryName) {
      let category = await findCategoryByName(restaurantId, data.categoryName);
      if (!category) {
        category = await createCategory({
          restaurantId: restaurantId,
          name: data.categoryName,
          createdAt: now,
          updatedAt: now,
        });
      }
      categoryId = category.id;
    }

    const product = await createProduct({
      restaurantId,
      categoryId,
      name: data.name,
      description: data.description,
      imageUrl: data.imageUrl,
      createdAt: now,
      updatedAt: now,
    });

    return {
      message: 'Product created successfully',
      data: product,
    };
  };

  update = async (productId: number, data: UpdateProductDTO, branchId?: number) => {
    const product = await findProductById(productId);
    if (!product) {
      throw ProductNotFoundError;
    }

    const restaurant = await this.restaurantAccessService.findById(product.restaurantId);
    if (!restaurant) {
      throw RestaurantNotFoundError;
    }

    const now = new Date();

    let categoryId = null;
    if (data.categoryName) {
      let category = await findCategoryByName(restaurant.id, data.categoryName);
      if (!category) {
        category = await createCategory({
          restaurantId: restaurant.id,
          name: data.categoryName,
          createdAt: now,
          updatedAt: now,
        });
      }
      categoryId = category.id;
    }

    const updatedProduct = await updateProduct(productId, {
      categoryId,
      name: data.name,
      description: data.description,
      imageUrl: data.imageUrl,
      updatedAt: now,
    });

    let branchDetails;
    if (branchId && (data.price !== undefined || data.stock !== undefined || data.isAvailable !== undefined)) {
      branchDetails = await updateBranchDetails({
        branchId: branchId,
        productId: productId,
        price: data.price,
        stock: data.stock,
        isAvailable: data.isAvailable,
      });
    }

    return {
      message: 'Product updated successfully',
      data: [updatedProduct, branchDetails],
    };
  };
}
