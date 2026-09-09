import { AppError } from '../../lib/error/AppError';

export const CannotCreateOwnerUserError = new AppError('Cannot create owner user', 400);
export const RoleNotFoundError = new AppError('Role name not found', 404);
export const MemberNotFoundError = new AppError('Member not found', 404);
