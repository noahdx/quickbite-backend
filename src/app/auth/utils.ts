import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../../lib/config/env';
import crypto from 'crypto';

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(inputPassword: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(inputPassword, hashedPassword);
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  restaurantId?: number;
  restaurantRole?: string;
  branchIds?: number[];
}

export function generateAccessToken(payload: JwtPayload) {
  const options: SignOptions = { expiresIn: env.jwt.accessExpiresIn };
  return jwt.sign(payload, env.jwt.accessSecret, options);
}

export function generateRefreshToken(payload: JwtPayload) {
  const options: SignOptions = { expiresIn: env.jwt.refreshExpiresIn };
  return jwt.sign(payload, env.jwt.refreshSecret, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwt.accessSecret) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwt.refreshSecret) as JwtPayload;
}

export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export function hashOTP(otp: string) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}
