import { Restaurant } from '../entity/restaurant.entity';
import { RestaurantNotFoundError } from '../errors';
import { findRestaurantById } from '../repository/restaurant.repository';
import { injectable } from 'tsyringe';

@injectable()
export class RestaurantAccessService {
  findById = async (restaurantId: number): Promise<Restaurant> => {
    const restaurant = await findRestaurantById(restaurantId);
    if (!restaurant) throw RestaurantNotFoundError;
    return restaurant;
  };
}
