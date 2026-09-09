import 'reflect-metadata';
import path from 'path';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: path.resolve(process.cwd(), '.env') });

process.env.NODE_ENV = 'test';
process.env.DB_HOST = process.env.DB_HOST ?? 'localhost';
process.env.DB_PORT = process.env.DB_PORT ?? '5432';
process.env.DB_NAME = process.env.DB_NAME ?? 'core_quickbite_test';
process.env.DB_USERNAME = process.env.DB_USERNAME ?? 'postgres';
process.env.DB_PASSWORD = process.env.DB_PASSWORD ?? 'postgres';
process.env.DB_POOL_MAX = process.env.DB_POOL_MAX ?? '2';
process.env.DB_POOL_MIN = process.env.DB_POOL_MIN ?? '1';
process.env.DB_MIGRATION_DIRECTORY = process.env.DB_MIGRATION_DIRECTORY ?? 'src/migrations';
process.env.DB_MIGRATION_EXTENSION = process.env.DB_MIGRATION_EXTENSION ?? 'ts';
process.env.ACCESS_SECRET = process.env.ACCESS_SECRET ?? 'test-access-secret';
process.env.REFRESH_SECRET = process.env.REFRESH_SECRET ?? 'test-refresh-secret';
process.env.ACCESS_EXPIRES_IN = process.env.ACCESS_EXPIRES_IN ?? '3600';
process.env.REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN ?? '604800';
process.env.CORS_ORIGINS = process.env.CORS_ORIGINS ?? 'http://localhost:8080';
process.env.REDIS_HOST = process.env.REDIS_HOST ?? 'localhost';
process.env.REDIS_PORT = process.env.REDIS_PORT ?? '6379';
process.env.REDIS_PASSWORD = process.env.REDIS_PASSWORD ?? '';
