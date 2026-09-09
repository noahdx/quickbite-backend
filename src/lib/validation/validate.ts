import { validate } from 'class-validator';
import { AppError } from '../error/AppError';
import { plainToInstance } from 'class-transformer';

export async function validateBody<T extends Object>(cls: new () => T, body: unknown): Promise<T> {
  const instance = plainToInstance(cls, body ?? {});
  const errors = await validate(instance, { whitelist: true });

  if (errors.length > 0) {
    const message = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    throw new AppError(message.join(' | | '), 400);
  }

  return instance;
}
