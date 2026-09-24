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
import { injectable } from 'tsyringe';
import { findMemberByUserId } from '../../rbac/repository/restaurant-member.repository';
import { setMemberBranches } from '../../rbac/repository/member-branch.repository';
import { MemberNotFoundError } from '../../rbac/errors';

@injectable()
export class BranchService {
  findByRestaurant = async (restaurantId: number) => {
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

  create = async (userId: number, restaurantId: number, data: CreateBranchDTO) => {
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

    const member = await findMemberByUserId(userId);
    if (!member) {
      throw MemberNotFoundError;
    }

    await setMemberBranches(member?.id, [
      {
        memberId: member.id,
        branchId: branch.id,
        createdAt: now,
      },
    ]);

    return {
      message: 'Branch created successfully',
      data: branch,
    };
  };

  update = async (branchId: number, data: UpdateBranchDTO) => {
    const branch = await findBranchById(branchId);
    if (!branch) {
      throw BranchNotFoundError;
    }

    const updated = await updateBranch(branchId, data);

    return {
      message: 'Branch updated successfully',
      data: updated,
    };
  };

  updateStatus = async (branchId: number, data: UpdateBranchStatusDTO) => {
    const branch = await findBranchById(branchId);
    if (!branch) {
      throw BranchNotFoundError;
    }

    const updated = await updateBranchStatus(branchId, data);

    return {
      message: 'Branch status updated successfully',
      data: updated,
    };
  };
}
