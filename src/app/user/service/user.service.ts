import { Knex } from 'knex';
import { UpdateUserDTO } from '../dto/user.dto';
import { User } from '../entity/user.entity';
import { UserNotFoundError } from '../errors';
import {
  createUser,
  findUserByEmail,
  findUserById,
  updateUser,
  updateUserPassword,
} from '../repository/user.repository';
import { injectable } from 'tsyringe';

@injectable()
export class UserService {
  create = async (data: Partial<User>, conn?: Knex) => {
    return createUser(data, conn);
  };

  findByEmail = async (email: string) => {
    return findUserByEmail(email);
  };

  existsByEmail = async (email: string) => {
    const user = await findUserByEmail(email);
    return user !== null;
  };

  updatePassword = async (userId: number, passwordHash: string) => {
    await updateUserPassword(userId, passwordHash);
  };

  getUserById = async (id: number) => {
    const user = await findUserById(id);
    if (!user) throw UserNotFoundError;

    return {
      message: 'User retrieved successfully',
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.systemRole,
        createdAt: user.createdAt,
      },
    };
  };

  updateProfile = async (userId: number, data: UpdateUserDTO) => {
    const user = await findUserById(userId);
    if (!user) throw UserNotFoundError;

    const updated = await updateUser(user.id, data);
    return {
      message: 'User profile update successfully',
      user: {
        id: updated.id,
        email: updated.email,
        phone: updated.phone,
        role: updated.systemRole,
        createdAt: updated.createdAt,
      },
    };
  };
}
