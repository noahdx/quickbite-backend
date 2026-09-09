import { UnAuthorizedError } from '../../../lib/auth/errors';
import { SystemRole } from '../../user/enums';
import { RestaurantAccessService } from '../../restaurant/service/restaurant-access.service';
import { CreateBranchDTO, UpdateBranchDTO, UpdateBranchStatusDTO } from '../dto/branch.dto';
import { BranchNotFoundError } from '../errors';
import {
  createBranch,
  findBranchById,
  findBranchesByRestaurantId,
  findBranchesIds,
  findNearbyBranches,
  updateBranch,
  updateBranchStatus,
} from '../repository/branch.repository';
import { inject, injectable } from 'tsyringe';
import { tokens } from '../../../lib/di/tokens';

@injectable()
export class BranchService {
  constructor(
    @inject(tokens.RestaurantAccessService)
    private readonly restaurantAccessService: RestaurantAccessService,
  ) {}

  create = async (restaurantId: number, data: CreateBranchDTO) => {
    const now = new Date();
    const branch = await createBranch({
      restaurantId: restaurantId,
      addressText: data.addressText,
      label: data.label,
      lng: data.lng,
      lat: data.lat,
      isActive: false,
      acceptOrders: true,
      opensAt: data.opensAt,
      closesAt: data.closesAt,
      countryCode: data.countryCode,
      currency: data.currency,
      deliveryRadius: data.deliveryRadius,
      commission: 0,
      createdAt: now,
      updatedAt: now,
    });

    return {
      message: 'Branch created successfully',
      data: branch,
    };
  };

  update = async (branchId: number, data: UpdateBranchDTO) => {
    const branch = await findBranchById(branchId);
    if (!branch) throw BranchNotFoundError;

    const updated = await updateBranch(branchId, data);

    return {
      message: 'Branch updated successfully',
      data: updated,
    };
  };

  updateStatus = async (userRole: SystemRole, branchId: number, data: UpdateBranchStatusDTO) => {
    if (userRole !== SystemRole.SYSTEM_ADMIN) throw UnAuthorizedError;

    const branch = await findBranchById(branchId);
    if (!branch) throw BranchNotFoundError;

    const updated = await updateBranchStatus(branchId, data);

    return {
      message: 'Branch status updated successfully',
      data: updated,
    };
  };

  findByRestaurant = async (restaurantId: number) => {
    await this.restaurantAccessService.findById(restaurantId);

    const branches = await findBranchesByRestaurantId(restaurantId);

    return {
      message: 'Branches retrieved successfully',
      data: branches,
    };
  };

  findNearby = async (lng: number, lat: number) => {
    const branches = await findNearbyBranches(lng, lat);
    return {
      message: 'Branches retrieved successfully',
      data: branches,
    };
  };

  findByIds = async (ids: number[]) => {
    return await findBranchesIds(ids);
  };
}
