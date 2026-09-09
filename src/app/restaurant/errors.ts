import { AppError } from '../../lib/error/AppError';

export const OwnerAlreadyExistsError = new AppError('User with this email or phone already exists', 409);

export const RestaurantNotFoundError = new AppError('Restaurant not found', 404);
