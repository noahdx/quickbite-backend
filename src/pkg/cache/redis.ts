import Redis from 'ioredis';
import type { ICacheProvider } from './cache.interface';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
}

export class RedisCacheProvider implements ICacheProvider {
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
      console.error('Redis Error: ', error.message);
    });

    this.client.connect().catch((error) => {
      console.error('Redis Connect Error: ', error);
    });
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<any> {
    if (ttlSeconds) {
      return await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      return await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<any> {
    return this.client.get(key);
  }

  async del(key: string): Promise<any> {
    return await this.client.del(key);
  }
}
