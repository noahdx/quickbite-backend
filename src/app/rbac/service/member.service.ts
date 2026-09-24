import { Knex } from 'knex';
import { inject, injectable } from 'tsyringe';
import { tokens } from '../../../lib/di/tokens';
import { AppError } from '../../../lib/error/AppError';
import { db } from '../../../lib/knex/knex';
import { UserAlreadyExistsError } from '../../auth/errors';
import { CredentialsService } from '../../auth/service/credentials.service';
import { BranchService } from '../../branch/service/branch.service';
import { UserService } from '../../user/service/user.service';
import { CreateMemberDTO, UpdateMemberDTO } from '../dto/member.dto';
import { MemberBranch } from '../entity/member-branches.entity';
import { MemberStatus } from '../enums';
import { BranchIdsNotFoundError, CannotCreateOwnerUserError, MemberNotFoundError, RoleNotFoundError } from '../errors';
import { findBranchIdsByMemberId, setMemberBranches } from '../repository/member-branch.repository';
import {
  activateMemberByUserId,
  createRestaurantMember,
  deleteMember,
  findMemberById,
  findMembersByRestaurantId,
  findMemberWithRoleName,
  findRestaurantMemberWithRole,
  updateMember,
} from '../repository/restaurant-member.repository';
import { findRoleIdByName } from '../repository/role.repository';
import { SystemRole } from '../../user/enums';

@injectable()
export class MemberService {
  constructor(
    @inject(tokens.UserService) private readonly userService: UserService,
    @inject(tokens.BranchService) private readonly branchService: BranchService,
    @inject(tokens.CredentialsService) private readonly credentialsService: CredentialsService,
  ) {}

  getRestaurantMemberWithRole = async (userId: number) => {
    const memberData = await findRestaurantMemberWithRole(userId);

    if (!memberData) {
      throw MemberNotFoundError;
    }

    return memberData;
  };

  getBranchIdsByMemberId = async (memberId: number) => {
    const branchIds = await findBranchIdsByMemberId(memberId);
    if (branchIds.length === 0) {
      throw BranchIdsNotFoundError;
    }
    return branchIds;
  };

  listMembers = async (restaurantId: number) => {
    const members = await findMembersByRestaurantId(restaurantId);
    return {
      message: 'Members retrieved successfully',
      data: members,
    };
  };

  createOwnerMember = async (userId: number, restaurantId: number, trx?: Knex.Transaction) => {
    const ownerRoleId = await findRoleIdByName('owner', trx);
    if (!ownerRoleId) {
      throw RoleNotFoundError;
    }

    const now = new Date();
    return await createRestaurantMember(
      {
        userId,
        restaurantId,
        roleId: ownerRoleId,
        status: MemberStatus.ACTIVE,
        createdAt: now,
        updatedAt: now,
      },
      trx,
    );
  };

  createMember = async (restaurantId: number, data: CreateMemberDTO) => {
    // don't accept owner role creation
    if (data.restaurantRole.toLowerCase() === 'owner') {
      throw CannotCreateOwnerUserError;
    }

    // find roleId by role name
    const roleId = await findRoleIdByName(data.restaurantRole);
    if (!roleId) {
      throw RoleNotFoundError;
    }

    const existing = await this.userService.existsByEmail(data.email);
    if (existing) {
      throw UserAlreadyExistsError;
    }

    const trx = await db.transaction();
    try {
      const now = new Date();
      const user = await this.userService.create(
        {
          email: data.email,
          phone: data.phone,
          name: data.name,
          password: '',
          role: SystemRole.RESTAURANT_USER,
        },
        trx,
      );

      const member = await createRestaurantMember(
        {
          userId: user.id,
          restaurantId: restaurantId,
          roleId: roleId,
          status: MemberStatus.INACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        trx,
      );

      // Assign member branches if provided
      if (data.branchIds !== undefined && data.branchIds.length > 0) {
        const findBranchIds = await this.branchService.findByIds(data.branchIds);

        if (findBranchIds.length !== data.branchIds.length) {
          const setIds = new Set(findBranchIds.map((branch) => branch.id));

          const missing = data.branchIds.filter((id) => !setIds.has(id));
          // TODO:: keep on error convention
          throw new AppError(`Branch Ids: ${missing.join(', ')} not found`, 400);
        }

        const rows = data.branchIds.map(
          (branchId) =>
            new MemberBranch({
              memberId: member.id,
              branchId: branchId,
              createdAt: now,
            }),
        );

        await setMemberBranches(member.id, rows, trx);
      }

      // Create OTP
      const otp = await this.credentialsService.createOtp(user.id, trx);

      // TODO:: send otp to user by his email and active it
      console.log(`mocked email sent ${otp}`);

      await trx.commit();
      return {
        message: 'Member invited successfully',
        member: {
          id: member.id,
          userId: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: data.restaurantRole,
          status: MemberStatus.INACTIVE,
          branchIs: data.branchIds,
        },
      };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  };

  updateMember = async (restaurantId: number, memberId: number, data: UpdateMemberDTO) => {
    const result = await findMemberWithRoleName(memberId);
    if (!result || result.member.restaurantId !== restaurantId) {
      throw MemberNotFoundError;
    }

    const updateData: { roleId?: number; status?: MemberStatus } = {};

    // Update role
    if (data.restaurantRole !== undefined) {
      if (data.restaurantRole.toLowerCase() === 'owner') throw CannotCreateOwnerUserError;

      const findRoleId = await findRoleIdByName(data.restaurantRole);
      if (!findRoleId) throw RoleNotFoundError;
      updateData.roleId = findRoleId;
    }

    // Update status
    if (data.status) {
      updateData.status = data.status;
    }

    // Update member branches
    if (data.branchIds && data.branchIds.length > 0) {
      const branches = await this.branchService.findByIds(data.branchIds);

      if (data.branchIds.length !== branches.length) {
        const branchIds = new Set(branches.map((branch) => branch.id));

        const missing = data.branchIds.filter((id) => !branchIds.has(id));
        throw new AppError(`Branch Ids: ${missing.join(', ')} not found`, 400);
      }

      const rows = data.branchIds.map((id) => ({
        memberId: result.member.id,
        branchId: id,
        createdAt: new Date(),
      }));

      await setMemberBranches(result.member.id, rows);
    }

    const updatedMember = await updateMember(memberId, {
      ...updateData,
      updatedAt: new Date(),
    });

    return {
      message: 'Member updated successfully',
      data: updatedMember,
    };
  };

  deleteMember = async (memberId: number, restaurantId: number) => {
    const member = await findMemberById(memberId);
    if (!member || member.restaurantId !== restaurantId) throw MemberNotFoundError;
    await deleteMember(memberId);
    return { message: 'Restaurant member deleted successfully' };
  };

  activateMemberByUserId = async (userId: number) => {
    await activateMemberByUserId(userId);
  };
}

// getRestaurantContext = async (userId: number) => {
//   const memberData = await findMemberWithRoleName(userId);
//   if (!memberData) throw UserNotFoundError;
//   const branchIds = await findBranchIdsByMemberId(memberData.memberId);

//   return {
//     restaurantId: memberData.restaurantId,
//     roleName: memberData.roleName,
//     branchIds,
//   };
// };
