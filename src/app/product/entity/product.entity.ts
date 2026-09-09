export class Product {
  id: number;
  restaurantId: number;
  categoryId: number | null;
  name: string;
  description: string;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  constructor(data: Partial<Product>) {
    this.id = data.id!;
    this.restaurantId = data.restaurantId!;
    this.categoryId = data.categoryId ?? null;
    this.name = data.name!;
    this.description = data.description ?? '';
    this.imageUrl = data.imageUrl ?? '';
    this.createdAt = data.createdAt ?? new Date();
    this.updatedAt = data.updatedAt ?? new Date();
    this.deletedAt = data.deletedAt ?? null;
  }
}
