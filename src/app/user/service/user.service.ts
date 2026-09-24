import { Knex } from 'knex';
import { UpdateUserDTO } from '../dto/user.dto';
import { UserNotFoundError } from '../errors';
import {
  createUser,
  findUserByEmail,
  findUserById,
  findUserExistsByEmail,
  updateUser,
  updateUserPassword,
} from '../repository/user.repository';
import { injectable } from 'tsyringe';
import { SystemRole } from '../enums';
import { UserAlreadyExistsError } from '../../auth/errors';
import { hashPassword } from '../../auth/utils';

export interface CreateUserData {
  email: string;
  phone: string;
  name: string;
  password: string;
  role: SystemRole;
}

@injectable()
export class UserService {
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

  findByEmail = async (email: string) => {
    return findUserByEmail(email);
  };

  existsByEmail = async (email: string) => {
    const user = await findUserByEmail(email);
    return user !== null;
  };

  create = async (data: CreateUserData, trx?: Knex.Transaction) => {
    const existing = await findUserExistsByEmail(data.email);
    if (existing) throw UserAlreadyExistsError;

    const hashedPassword = await hashPassword(data.password!);

    const now = new Date();
    return await createUser(
      {
        email: data.email,
        phone: data.phone,
        name: data.name,
        passwordHash: hashedPassword,
        systemRole: data.role,
        createdAt: now,
        updatedAt: now,
      },
      trx,
    );
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

  updatePassword = async (userId: number, passwordHash: string) => {
    await updateUserPassword(userId, passwordHash);
  };
}
