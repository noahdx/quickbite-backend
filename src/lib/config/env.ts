import { config } from 'dotenv';
import path from 'path';
import z from 'zod';

config({ path: path.resolve(__dirname, '../../../.env') });

const schema = z.object({
  PORT: z.string().default('3000'),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().default('5432'),
  DB_NAME: z.string().default('core_quickbite'),
  DB_USERNAME: z.string().default('postgres'),
  DB_PASSWORD: z.string(),
  DB_POOL_MAX: z.string().default('10'),
  DB_POOL_MIN: z.string().default('2'),
  ACCESS_SECRET: z.string(),
  REFRESH_SECRET: z.string(),
  ACCESS_EXPIRES_IN: z.string().default('1h'),
  REFRESH_EXPIRES_IN: z.string().default('7d'),
  DB_MIGRATION_DIRECTORY: z.string().default('src/migrations'),
  DB_MIGRATION_EXTENSION: z.string().default('ts'),
  NODE_ENV: z.string().default('development'),
  CORS_ORIGINS: z.string().default('http://localhost:8080'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
  REDIS_PASSWORD: z.string().default('12345'),
  MJ_APIKEY_PUBLIC: z.string(),
  MJ_APIKEY_SECRET: z.string(),
  MAIL_FROM_EMAIL: z.string(),
  MAIL_FROM_NAME: z.string(),
});

const parsed = schema.parse(process.env);

export const env = {
  port: Number(parsed.PORT),
  nodeEnv: parsed.NODE_ENV,
  db: {
    host: parsed.DB_HOST,
    port: Number(parsed.DB_PORT),
    name: parsed.DB_NAME,
    userName: parsed.DB_USERNAME,
    password: parsed.DB_PASSWORD,
    maxPool: Number(parsed.DB_POOL_MAX),
    minPool: Number(parsed.DB_POOL_MIN),
  },
  jwt: {
    accessSecret: parsed.ACCESS_SECRET,
    refreshSecret: parsed.REFRESH_SECRET,
    accessExpiresIn: Number(parsed.ACCESS_EXPIRES_IN),
    refreshExpiresIn: Number(parsed.REFRESH_EXPIRES_IN),
  },
  migration: {
    directory: path.resolve('../../../', parsed.DB_MIGRATION_DIRECTORY),
    extension: parsed.DB_MIGRATION_EXTENSION,
  },
  isProduction: parsed.NODE_ENV === 'production',
  cors: {
    origins: parsed.CORS_ORIGINS.split(', '),
  },
  redis: {
    host: parsed.REDIS_HOST,
    port: Number(parsed.REDIS_PORT),
    password: parsed.REDIS_PASSWORD,
  },

  mailjet: {
    apiKey: parsed.MJ_APIKEY_PUBLIC,
    apiSecret: parsed.MJ_APIKEY_SECRET,
    fromEmail: parsed.MAIL_FROM_EMAIL,
    fromName: parsed.MAIL_FROM_NAME,
  },
};
