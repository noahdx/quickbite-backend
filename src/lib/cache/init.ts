import { RedisCacheProvider } from '../../pkg/cache/redis';
import { env } from '../config/env';

const RedisProvider = new RedisCacheProvider({
  host: env.redis.host,
  port: env.redis.port,
  password: env.redis.password || undefined,
});
