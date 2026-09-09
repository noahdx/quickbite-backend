import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductService } from '../../src/app/product/service/product.service';
import {
  createProduct,
  findProductById,
  updateProduct,
} from '../../src/app/product/repository/product.repository';
import { createCategory, findCategoryByName } from '../../src/app/product/repository/category.repository';
import { updateBranchDetails } from '../../src/app/product/repository/product-branch-details.repository';

const mocks = vi.hoisted(() => ({
  db: { transaction: vi.fn() },
  findProductById: vi.fn(),
  findCategoryByName: vi.fn(),
  createCategory: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  updateBranchDetails: vi.fn(),
}));

vi.mock('../../src/lib/knex/knex', () => ({ db: mocks.db }));
vi.mock('../../src/app/product/repository/product.repository', () => ({
  findProductById: mocks.findProductById,
  findCategoryByName: mocks.findCategoryByName,
  findProductsByBranch: vi.fn(),
  findProductsByRestaurant: vi.fn(),
  createProduct: mocks.createProduct,
  updateProduct: mocks.updateProduct,
}));
vi.mock('../../src/app/product/repository/category.repository', () => ({
  findCategoryByName: mocks.findCategoryByName,
  createCategory: mocks.createCategory,
  findCategoriesByRestaurant: vi.fn(),
}));
vi.mock('../../src/app/product/repository/product-branch-details.repository', () => ({
  updateBranchDetails: mocks.updateBranchDetails,
}));

describe('ProductService', () => {
  let service: ProductService;
  let trx: { commit: ReturnType<typeof vi.fn>; rollback: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    trx = { commit: vi.fn().mockResolvedValue(undefined), rollback: vi.fn().mockResolvedValue(undefined) };
    mocks.db.transaction.mockResolvedValue(trx);
    service = new ProductService();
  });

  describe('create', () => {
    it('creates a product reusing an existing category', async () => {
      mocks.findCategoryByName.mockResolvedValue({ id: 5 });
      mocks.createProduct.mockResolvedValue({ id: 1, name: 'Burger' });

      const result = await service.create(1, {
        name: 'Burger',
        description: 'yum',
        categoryName: 'Mains',
      });

      expect(mocks.findCategoryByName).toHaveBeenCalledWith(1, 'Mains');
      expect(mocks.createCategory).not.toHaveBeenCalled();
      expect(mocks.createProduct).toHaveBeenCalledWith(
        expect.objectContaining({ restaurantId: 1, categoryId: 5, name: 'Burger' }),
        trx,
      );
      expect(trx.commit).toHaveBeenCalled();
      expect(result.data.id).toBe(1);
    });

    it('creates a new category when it does not exist', async () => {
      mocks.findCategoryByName.mockResolvedValue(null);
      mocks.createCategory.mockResolvedValue({ id: 9 });
      mocks.createProduct.mockResolvedValue({ id: 2 });

      const result = await service.create(1, { name: 'Pizza', categoryName: 'New' });

      expect(mocks.createCategory).toHaveBeenCalledWith(1, 'New', trx);
      expect(mocks.createProduct).toHaveBeenCalledWith(
        expect.objectContaining({ restaurantId: 1, categoryId: 9 }),
        trx,
      );
      expect(result.data.id).toBe(2);
    });

    it('rolls back the transaction when product creation fails', async () => {
      mocks.createProduct.mockRejectedValue(new Error('db failure'));

      await expect(service.create(1, { name: 'Burger' })).rejects.toThrow('db failure');

      expect(trx.rollback).toHaveBeenCalled();
      expect(trx.commit).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const existing = { id: 10, restaurantId: 1, name: 'Burger' };

    beforeEach(() => {
      mocks.findProductById.mockResolvedValue(existing);
    });

    it('throws when the product does not exist', async () => {
      mocks.findProductById.mockResolvedValue(null);

      await expect(service.update(10, 1, { name: 'X' })).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('updates per-branch pricing when branchId and price are provided', async () => {
      mocks.updateProduct.mockResolvedValue({ id: 10 });
      mocks.updateBranchDetails.mockResolvedValue({ price: 12.5 });

      const result = await service.update(10, 3, { name: 'Burger XL', price: 12.5 });

      expect(mocks.updateBranchDetails).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: 3, productId: 10, price: 12.5 }),
        trx,
      );
      expect(trx.commit).toHaveBeenCalled();
      expect(result.message).toContain('updated');
    });

    it('skips branch details when no pricing data is provided', async () => {
      mocks.updateProduct.mockResolvedValue({ id: 10 });

      await service.update(10, 3, { name: 'Burger XL' });

      expect(mocks.updateBranchDetails).not.toHaveBeenCalled();
    });
  });
});
