import Redis from 'ioredis';
import type { CacheProvider } from './cache.interface';
import { logger } from '../../lib/logger/logger';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
}

export class RedisCacheProvider implements CacheProvider {
  private readonly client: Redis;

  constructor(config: RedisConfig) {
    this.client = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });

    this.client.on('error', (error) => {
      logger.error(`Redis Error: ${error.message}`);
    });

    this.client.connect().catch((error) => {
      logger.error(`Redis Connect Error: ${error.message}`);
    });
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<any> {
    try {
      if (ttlSeconds) {
        return await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        return await this.client.set(key, value);
      }
    } catch (error) {
      logger.error('cache set failed', { key: key, message: (error as Error).message });
    }
  }

  async get(key: string): Promise<any> {
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error('cache get failed: ', { key: key, message: (error as Error).message });
    }
  }

  async del(key: string): Promise<any> {
    try {
      return await this.client.del(key);
    } catch (error) {
      logger.error('cache delete failed: ', { key: key, message: (error as Error).message });
    }
  }
}
