import { Request, Response, NextFunction } from 'express';
import { container } from '../di/container';
import { tokens } from '../di/tokens';
import { CacheProvider } from '../../pkg/cache/cache.interface';
import { toSecond } from '../../pkg/utils/time';

export interface IdempotencyOptions {
  strict?: boolean;
}

const TTL = toSecond(24, 'h');
export function idempotency(options: IdempotencyOptions = {}) {
  const { strict = false } = options;
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
      return next();
    }

    const idempotencyKey = req.header('Idempotency-Key') as string | undefined;

    if (!idempotencyKey) {
      if (strict) {
        return res.status(400).json({ message: 'Missing Idempotency-Key header' });
      }
      return next();
    }

    try {
      const cacheProvider = container.resolve<CacheProvider>(tokens.CacheProvider);

      const key = `idempotency:${req.method}:${req.originalUrl}:${idempotencyKey}`;

      const cached = await cacheProvider.get(key);
      if (cached) {
        return res.status(200).json(JSON.parse(cached));
      }

      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheProvider.set(key, JSON.stringify(body), TTL);
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      if (strict) {
        return res.status(503).json({ message: 'Idempotency service unavailable' });
      }
      next(error);
    }
  };
}
