import { Knex } from 'knex';
import { UnAuthorizedError } from '../../../lib/auth/errors';
import { db } from '../../../lib/knex/knex';
import { SystemRole } from '../../user/enums';
import { CredentialsService } from '../../auth/service/credentials.service';
import { UserService } from '../../user/service/user.service';
import { CreateRestaurantDTO, UpdatedRestaurantDTO, UpdateRestaurantStatusDTO } from '../dto/restaurant.dto';
import { Restaurant } from '../entity/restaurant.entity';
import { RestaurantStatus } from '../enums';
import { OwnerAlreadyExistsError, RestaurantNotFoundError } from '../errors';
import {
  createRestaurant,
  findAllRestaurants,
  updateRestaurant,
  updateRestaurantStatus,
} from '../repository/restaurant.repository';
import { MemberService } from '../../rbac/service/member.service';
import { RestaurantAccessService } from './restaurant-access.service';
import { inject, injectable } from 'tsyringe';
import { tokens } from '../../../lib/di/tokens';
import { buildPaginationResult, FilterParams, PaginationParams } from '../../../lib/http/pagination/cursor-pagination';

@injectable()
export class RestaurantService {
  constructor(
    @inject(tokens.UserService) private readonly userService: UserService,
    @inject(tokens.MemberService) private readonly memberService: MemberService,
    @inject(tokens.CredentialsService) private readonly credentialsService: CredentialsService,
    @inject(tokens.RestaurantAccessService) private readonly restaurantAccessService: RestaurantAccessService,
  ) {}

  findById = async (restaurantId: number): Promise<Restaurant> => {
    return this.restaurantAccessService.findById(restaurantId);
  };

  createWithOwner = async (userRole: SystemRole, data: CreateRestaurantDTO) => {
    if (userRole !== SystemRole.SYSTEM_ADMIN) throw UnAuthorizedError;
    if (await this.userService.existsByEmail(data.owner.email)) throw OwnerAlreadyExistsError;

    const now = new Date();
    const trx = await db.transaction();
    try {
      // Create user
      const hashedPassword = await this.credentialsService.hashPassword(data.owner.password);
      const user = await this.userService.create(
        {
          email: data.owner.email,
          phone: data.owner.phone,
          name: data.owner.name,
          passwordHash: hashedPassword,
          systemRole: SystemRole.RESTAURANT_USER,
          createdAt: now,
          updatedAt: now,
        },
        trx,
      );

      // Create restaurant
      const restaurant = await createRestaurant(
        {
          ownerId: user.id,
          name: data.name,
          status: RestaurantStatus.ACTIVE,
          logoURL: data.logoURL ?? '',
          primaryCountry: data.primaryCountry,
          createdAt: now,
          updatedAt: now,
          statusUpdatedAt: now,
        },
        trx,
      );

      // Create owner member
      await this.memberService.createMemberOwner(user.id, restaurant.id, trx);

      await trx.commit();

      return {
        message: 'Restaurant and owner created successfully',
        restaurant,
        owner: {
          email: user.email,
          phone: user.phone,
          name: user.name,
          createdAt: user.createdAt,
        },
      };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  };

  create = async (userId: number, data: { name: string; logoURL?: string; primaryCountry: string }, trx: Knex) => {
    const now = new Date();
    const restaurant = new Restaurant({
      ownerId: userId,
      name: data.name,
      logoURL: data.logoURL,
      primaryCountry: data.primaryCountry,
      status: RestaurantStatus.PENDING,
      createdAt: now,
      updatedAt: now,
      statusUpdatedAt: now,
    });

    return await createRestaurant(restaurant, trx);
  };

  update = async (restaurantId: number, data: UpdatedRestaurantDTO) => {
    await this.findById(restaurantId);

    const result = await updateRestaurant(restaurantId, data);

    return {
      message: 'Restaurant updated successfully',
      data: result,
    };
  };

  updateStatus = async (restaurantId: number, userRole: SystemRole, data: UpdateRestaurantStatusDTO) => {
    if (userRole !== SystemRole.SYSTEM_ADMIN) throw UnAuthorizedError;
    const restaurant = await this.findById(restaurantId);

    if (!restaurant) throw RestaurantNotFoundError;
    const result = await updateRestaurantStatus(restaurantId, data.status);

    return {
      message: 'Restaurant status updated successfully',
      data: result,
    };
  };

  findAll = async (params: PaginationParams, filters: FilterParams[], allowedFields: Record<string, any>) => {
    const restaurants = await findAllRestaurants(params, filters, allowedFields);

    return buildPaginationResult(restaurants, params.limit, params.field);
  };

  findByRestaurant = async (restaurantId: number) => {
    const restaurant = await this.findById(restaurantId);

    return {
      message: 'Restaurant retrieved successfully',
      data: restaurant,
    };
  };
}
