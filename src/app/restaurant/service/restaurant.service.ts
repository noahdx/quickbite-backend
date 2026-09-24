import { Knex } from 'knex';
import { UnAuthorizedError } from '../../../lib/auth/errors';
import { db } from '../../../lib/knex/knex';
import { SystemRole } from '../../user/enums';
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
    @inject(tokens.RestaurantAccessService) private readonly restaurantAccessService: RestaurantAccessService,
  ) {}

  findAll = async (params: PaginationParams, filters: FilterParams[], allowedFields: Record<string, any>) => {
    const restaurants = await findAllRestaurants(params, filters, allowedFields);

    return buildPaginationResult(restaurants, params.limit, params.field);
  };

  findByRestaurantId = async (restaurantId: number) => {
    const restaurant = await this.restaurantAccessService.findById(restaurantId);

    return {
      message: 'Restaurant retrieved successfully',
      data: restaurant,
    };
  };

  createWithOwner = async (userRole: SystemRole, data: CreateRestaurantDTO) => {
    if (userRole !== SystemRole.SYSTEM_ADMIN) {
      throw UnAuthorizedError;
    }

    const existsUser = await this.userService.existsByEmail(data.owner.email);
    if (existsUser) {
      throw OwnerAlreadyExistsError;
    }

    const now = new Date();
    const trx = await db.transaction();
    try {
      // Create user
      const user = await this.userService.create(
        {
          email: data.owner.email,
          phone: data.owner.phone,
          name: data.owner.name,
          password: data.owner.password,
          role: SystemRole.RESTAURANT_USER,
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
      await this.memberService.createOwnerMember(user.id, restaurant.id, trx);

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

  create = async (userId: number, data: { name: string; logoURL?: string; primaryCountry: string }, trx: Knex.Transaction) => {
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
    const restaurant = await this.restaurantAccessService.findById(restaurantId);
    if (!restaurant) {
      throw RestaurantNotFoundError;
    }

    const updatedRestaurant = await updateRestaurant(restaurantId, data);

    return {
      message: 'Restaurant updated successfully',
      data: updatedRestaurant,
    };
  };

  updateStatus = async (restaurantId: number, userRole: SystemRole, data: UpdateRestaurantStatusDTO) => {
    if (userRole !== SystemRole.SYSTEM_ADMIN) {
      throw UnAuthorizedError;
    }

    const restaurant = await this.restaurantAccessService.findById(restaurantId);
    if (!restaurant) {
      throw RestaurantNotFoundError;
    }

    const updatedRestaurant = await updateRestaurantStatus(restaurantId, data.status);

    return {
      message: 'Restaurant status updated successfully',
      data: updatedRestaurant,
    };
  };
}
