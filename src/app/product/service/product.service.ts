import { db } from '../../../lib/knex/knex';
import { CreateProductDTO, UpdateProductDTO } from '../dto/product.dto';
import { ProductNotFoundError } from '../errors';
import {
  createCategory,
  findCategoriesByRestaurant,
  findCategoryByName,
} from '../repository/category.repository';
import { updateBranchDetails } from '../repository/product-branch-details.repository';
import {
  createProduct,
  findProductById,
  findProductsByBranch,
  findProductsByRestaurant,
  updateProduct,
} from '../repository/product.repository';
import { injectable } from 'tsyringe';

@injectable()
export class ProductService {
  create = async (restaurantId: number, data: CreateProductDTO) => {
    const trx = await db.transaction();
    let categoryId: number | null = null;
    const now = new Date();
    try {
      if (data.categoryName) {
        let category = await findCategoryByName(restaurantId, data.categoryName);
        if (!category) {
          category = await createCategory(restaurantId, data.categoryName, trx);
        }
        categoryId = category.id;
      }

      const product = await createProduct(
        {
          restaurantId,
          categoryId,
          name: data.name,
          description: data.description,
          imageUrl: data.imageUrl,
          createdAt: now,
          updatedAt: now,
        },
        trx,
      );

      await trx.commit();

      return {
        message: 'Product created successfully',
        data: product,
      };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  };

  update = async (productId: number, branchId: number, data: UpdateProductDTO) => {
    const product = await findProductById(productId);
    if (!product) throw ProductNotFoundError;

    const trx = await db.transaction();
    const now = new Date();
    let updatedProduct;
    let branchDetails;
    let categoryId: number | null = null;
    try {
      if (data.categoryName) {
        let category = await findCategoryByName(product.restaurantId, data.categoryName);
        if (!category) {
          category = await createCategory(product.restaurantId, data.categoryName, trx);
        }
        categoryId = category.id;
      }

      updatedProduct = await updateProduct(
        productId,
        {
          categoryId,
          name: data.name,
          description: data.description,
          imageUrl: data.imageUrl,
          createdAt: now,
          updatedAt: now,
        },
        trx,
      );

      if (
        branchId &&
        (data.price !== undefined || data.stock !== undefined || data.isAvailable !== undefined)
      ) {
        branchDetails = await updateBranchDetails(
          {
            branchId: branchId,
            productId: productId,
            price: data.price,
            stock: data.stock,
            isAvailable: data.isAvailable,
          },
          trx,
        );
      }

      await trx.commit();
      return {
        message: 'Product updated successfully',
        data: [updatedProduct, branchDetails],
      };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  };

  findById = async (productId: number) => {
    const product = await findProductById(productId);
    return {
      message: 'Product retrieved successfully',
      data: product,
    };
  };

  findByRestaurant = async (restaurantId: number) => {
    const products = await findProductsByRestaurant(restaurantId);

    return {
      message: 'Products retrieved successfully',
      data: products,
    };
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
}
