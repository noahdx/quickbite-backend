import { MemberStatus } from '../enums';

export class RestaurantMember {
  id: number;
  userId: number;
  restaurantId: number;
  roleId: number;
  status: MemberStatus;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<RestaurantMember>) {
    this.id = data.id!;
    this.userId = data.userId!;
    this.restaurantId = data.restaurantId!;
    this.roleId = data.roleId!;
    this.status = data.status!;
    this.createdAt = data.createdAt ?? new Date();
    this.updatedAt = data.updatedAt ?? new Date();
  }
}
