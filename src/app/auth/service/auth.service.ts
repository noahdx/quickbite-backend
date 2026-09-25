import { inject, injectable } from 'tsyringe';
import { tokens } from '../../../lib/di/tokens';
import { db } from '../../../lib/knex/knex';
import { MemberService } from '../../rbac/service/member.service';
import { RestaurantService } from '../../restaurant/service/restaurant.service';
import { SystemRole } from '../../user/enums';
import { UserService } from '../../user/service/user.service';
import { ForgetResetDTO, LoginDTO, RegisterDTO, ResetPasswordDTO } from '../dto/auth.dto';
import { CannotSingUpAsSystemAdminError, IncorrectCredentials, InvalidOTPError, RestaurantDataRequiredError } from '../errors';
import { findLatestPasswordResetByUserId, updatePasswordResetConsumedAt } from '../repository/auth.repository';
import { generateAccessToken, generateRefreshToken, hashOTP, JwtPayload, verifyRefreshToken } from '../utils';
import { CredentialsService } from './credentials.service';
import { IEmailProvider } from '../../../pkg/email/email.interface';
import { passwordResetEmail } from '../templates/password-reset';

@injectable()
export class AuthService {
  constructor(
    @inject(tokens.UserService) private readonly userService: UserService,
    @inject(tokens.CredentialsService) private readonly credentialsService: CredentialsService,
    @inject(tokens.RestaurantService) private readonly restaurantService: RestaurantService,
    @inject(tokens.MemberService) private readonly memberService: MemberService,
    @inject(tokens.EmailProvider) private readonly emailProvider: IEmailProvider,
  ) {}

  register = async (data: RegisterDTO) => {
    if (data.role === SystemRole.SYSTEM_ADMIN) {
      throw CannotSingUpAsSystemAdminError;
    }

    let user = null;
    let restaurant = null;
    let restaurantMemberInfo: { restaurantId?: number; restaurantRole?: string; branchIds?: number[] } = {};
    const trx = await db.transaction();
    try {
      user = await this.userService.create(
        {
          email: data.email,
          phone: data.phone,
          name: data.name,
          password: data.password,
          role: data.role,
        },
        trx,
      );

      // check if the type of user is restaurant, then call restaurant service to create a new restaurant
      if (data.role === SystemRole.RESTAURANT_USER) {
        if (data.restaurant === undefined) {
          throw RestaurantDataRequiredError;
        }

        restaurant = await this.restaurantService.create(user.id, data.restaurant, trx);

        // insert the owner member via member service
        await this.memberService.createOwnerMember(user.id, restaurant.id, trx);
        restaurantMemberInfo = {
          restaurantId: restaurant.id,
          restaurantRole: 'owner',
          branchIds: [],
        };
      }

      await trx.commit();
    } catch (error) {
      await trx.rollback();
      throw error;
    }

    // create access token , refresh token
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.systemRole,
      ...restaurantMemberInfo,
    };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      message: 'User registered successfully',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.systemRole,
        createdAt: user.createdAt,
      },
      restaurant,
    };
  };

  login = async (data: LoginDTO) => {
    const user = await this.userService.findByEmail(data.email);
    if (!user) throw IncorrectCredentials;
    const match = await this.credentialsService.comparePassword(data.password, user.passwordHash);

    if (!match) throw IncorrectCredentials;

    let restaurantMemberInfo: { restaurantId?: number; restaurantRole?: string; branchIds?: number[] } = {};
    if (user.systemRole === SystemRole.RESTAURANT_USER) {
      const memberData = await this.memberService.getRestaurantMemberWithRole(user.id);
      const branchIds = await this.memberService.getBranchIdsByMemberId(memberData.memberId);
      restaurantMemberInfo = {
        restaurantId: memberData.restaurantId,
        restaurantRole: memberData.roleName,
        branchIds,
      };
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.systemRole,
      ...restaurantMemberInfo,
    };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      message: 'Login successfully',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.systemRole,
        createdAt: user.createdAt,
      },
    };
  };

  forgetPassword = async (data: ForgetResetDTO) => {
    const user = await this.userService.findByEmail(data.email);
    if (!user)
      return {
        message: 'Email Sent with OTP',
      };

    const otp = await this.credentialsService.createOtp(user.id);

    const email = passwordResetEmail(otp);
    await this.emailProvider.send({
      email: user.email,
      subject: email.subject,
      html: email.html,
    });

    return {
      message: 'Email Sent with OTP',
    };
  };

  refresh = async (refreshToken: string) => {
    if (!refreshToken) throw IncorrectCredentials;
    const payload = verifyRefreshToken(refreshToken);

    const accessToken = generateAccessToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      restaurantId: payload.restaurantId,
      restaurantRole: payload.restaurantRole,
      branchIds: payload.branchIds,
    });

    return {
      message: 'Success',
      accessToken,
    };
  };

  // Handles the password reset flow and validates the reset OTP.
  private resetPasswordLogic = async (data: ResetPasswordDTO) => {
    const user = await this.userService.findByEmail(data.email);
    if (!user) throw InvalidOTPError;

    const reset = await findLatestPasswordResetByUserId(user.id);
    if (!reset) throw InvalidOTPError;

    const inputOTP = hashOTP(data.otp);
    if (inputOTP !== reset.otpHash || reset.isExpired()) {
      throw InvalidOTPError;
    }
    console.log('stilll work 3');

    const hashedPassword = await this.credentialsService.hashPassword(data.newPassword);
    await this.userService.updatePassword(user.id, hashedPassword);
    await updatePasswordResetConsumedAt(reset.id);
    return user;
  };

  resetPassword = async (data: ResetPasswordDTO) => {
    await this.resetPasswordLogic(data);
    return {
      message: 'Password reset successfully, please login again',
    };
  };

  acceptInvite = async (data: ResetPasswordDTO) => {
    const user = await this.resetPasswordLogic(data);
    await this.memberService.activateMemberByUserId(user.id);
    return {
      message: 'Password reset successfully, please login again',
    };
  };
}
