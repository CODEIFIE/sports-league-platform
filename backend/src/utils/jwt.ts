import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from '../config/env.js';

export interface AccessPayload {
  sub: number;
  role: string;
  name: string;
}

export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpires,
  } as SignOptions);
}

export function signRefreshToken(userId: number): string {
  return jwt.sign({ sub: userId }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpires,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessPayload {
  return jwt.verify(token, env.jwt.accessSecret) as unknown as AccessPayload;
}

export function verifyRefreshToken(token: string): { sub: number } {
  return jwt.verify(token, env.jwt.refreshSecret) as unknown as { sub: number };
}

/** Store only a hash of refresh tokens at rest. */
export const hashToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');
