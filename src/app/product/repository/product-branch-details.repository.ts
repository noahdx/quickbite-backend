import { Knex } from 'knex';
import { db } from '../../../lib/knex/knex';
import { ProductBranchDetails } from '../entity/product-branch-details.entity';

const PBD_COLUMNS = ['id', 'branch_id', 'product_id', 'price', 'stock', 'is_available'];

function toEntity(row: any) {
  return new ProductBranchDetails({
    id: row.id,
    branchId: row.branch_id,
    productId: row.product_id,
    price: Number(row.price),
    stock: row.stock,
    isAvailable: row.is_available,
  });
}

export async function updateBranchDetails(data: Partial<ProductBranchDetails>, conn: Knex = db): Promise<ProductBranchDetails> {
  const mapping: Record<string, unknown> = {};
  if (data.price !== undefined) mapping.price = data.price;
  if (data.stock !== undefined) mapping.stock = data.stock;
  if (data.isAvailable !== undefined) mapping.is_available = data.isAvailable;

  const [row] = await conn('product_branch_details')
    .where('branch_id', data.branchId)
    .where('product_id', data.productId)
    .update(mapping)
    .returning(PBD_COLUMNS);

  return toEntity(row);
}
