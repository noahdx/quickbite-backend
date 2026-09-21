import { Knex } from 'knex';
import { inject, injectable } from 'tsyringe';
import { tokens } from '../../../lib/di/tokens';
import { AppError } from '../../../lib/error/AppError';
import { db } from '../../../lib/knex/knex';
import { UserAlreadyExistsError } from '../../auth/errors';
import { CredentialsService } from '../../auth/service/credentials.service';
import { BranchService } from '../../branch/service/branch.service';
import { SystemRole } from '../../user/enums';
import { UserNotFoundError } from '../../user/errors';
import { UserService } from '../../user/service/user.service';
import { CreateMemberDTO, UpdateMemberDTO } from '../dto/member.dto';
import { MemberBranch } from '../entity/member-branches.entity';
import { MemberStatus } from '../enums';
import { CannotCreateOwnerUserError, MemberNotFoundError, RoleNotFoundError } from '../errors';
import { findBranchIdsByMemberId, setMemberBranches } from '../repository/member-branch.repository';
import {
  activateMemberByUserId,
  createRestaurantMember,
  deleteMember,
  findMemberById,
  findMembersByRestaurantId,
  findRestaurantMemberWithRole,
  updateRestaurantMember,
} from '../repository/restaurant-member.repository';
import { findRoleByName } from '../repository/role.repository';

@injectable()
export class MemberService {
  constructor(
    @inject(tokens.UserService) private readonly userService: UserService,
    @inject(tokens.BranchService) private readonly branchService: BranchService,
    @inject(tokens.CredentialsService) private readonly credentialsService: CredentialsService,
  ) {}

  createMemberOwner = async (userId: number, restaurantId: number, trx?: Knex.Transaction) => {
    const ownerRoleId = await findRoleByName('owner');
    if (!ownerRoleId) throw RoleNotFoundError;
    const now = new Date();
    return createRestaurantMember(
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
    if (data.restaurantRole.toLowerCase() === 'owner') throw CannotCreateOwnerUserError;

    const roleId = await findRoleByName(data.restaurantRole);
    if (!roleId) throw RoleNotFoundError;

    if (await this.userService.findByEmail(data.email)) throw UserAlreadyExistsError;

    const trx = await db.transaction();
    try {
      const now = new Date();
      // Create user
      const user = await this.userService.create(
        {
          email: data.email,
          phone: data.phone,
          name: data.name,
          passwordHash: '',
          systemRole: SystemRole.RESTAURANT_USER,
          createdAt: now,
          updatedAt: now,
        },
        trx,
      );

      // Create member
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

        const rows = data.branchIds.map((branchId) => {
          return new MemberBranch({
            memberId: member.id,
            branchId: branchId,
            createdAt: now,
          });
        });

        await setMemberBranches(member.id, rows, trx);
      }

      // Create OTP
      const otp = await this.credentialsService.createInviteOtp(user.id, trx);

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
        },
      };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  };

  /** Restaurant context embedded in JWTs: which restaurant, which role, accessible branches. */
  getRestaurantContext = async (userId: number) => {
    const memberData = await findRestaurantMemberWithRole(userId);
    if (!memberData) throw UserNotFoundError;
    const branchIds = await findBranchIdsByMemberId(memberData.memberId);
    console.log('------------------------', branchIds);
    return {
      restaurantId: memberData.restaurantId,
      roleName: memberData.roleName,
      branchIds,
    };
  };

  listMembers = async (restaurantId: number) => {
    const members = await findMembersByRestaurantId(restaurantId);
    return {
      message: 'Members retrieved successfully',
      data: members,
    };
  };

  activateMemberByUserId = async (userId: number) => {
    await activateMemberByUserId(userId);
  };

  updateMember = async (memberId: number, data: UpdateMemberDTO) => {
    const member = await findMemberById(memberId);
    if (!member) throw MemberNotFoundError;

    // Update role
    let roleId: number | undefined;
    if (data.restaurantRole !== undefined) {
      if (data.restaurantRole.toLowerCase() === 'owner') throw CannotCreateOwnerUserError;

      const foundRoleId = await findRoleByName(data.restaurantRole);
      if (foundRoleId === null || foundRoleId === undefined) throw RoleNotFoundError;
      roleId = foundRoleId;
    }

    // Update member branches
    if (data.branchIds !== undefined && data.branchIds.length > 0) {
      const found = await this.branchService.findByIds(data.branchIds);

      if (data.branchIds.length !== found.length) {
        const foundIds = new Set(found.map((branch) => branch.id));

        const missing = data.branchIds.filter((id) => !foundIds.has(id));
        throw new AppError(`Branch Ids: ${missing.join(', ')} not found`, 400);
      }

      const rows = data.branchIds.map((id) => ({
        memberId: member.id,
        branchId: id,
        createdAt: new Date(),
      }));

      await setMemberBranches(member.id, rows);
    }

    const updatedMember = await updateRestaurantMember(memberId, {
      roleId,
      status: data.status,
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
}
