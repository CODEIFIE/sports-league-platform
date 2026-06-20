import ms from './ms.js';
import { AppError } from '../utils/AppError.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js';
import { env } from '../config/env.js';
import { userRepository, UserRow } from '../repositories/user.repository.js';
import { tokenRepository } from '../repositories/token.repository.js';
import type { RegisterInput, LoginInput } from '../validators/auth.validator.js';

function publicUser(u: UserRow) {
  return {
    id: u.id,
    fullName: u.full_name,
    email: u.email,
    role: u.role_name,
    avatarUrl: u.avatar_url,
  };
}

async function issueTokens(user: UserRow) {
  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role_name,
    name: user.full_name,
  });
  const refreshToken = signRefreshToken(user.id);
  const expiresAt = new Date(Date.now() + ms(env.jwt.refreshExpires));
  await tokenRepository.store(user.id, hashToken(refreshToken), expiresAt);
  return { accessToken, refreshToken, user: publicUser(user) };
}

export const authService = {
  async register(input: RegisterInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) throw AppError.conflict('Email already registered');
    const passwordHash = await hashPassword(input.password);
    const id = await userRepository.create({
      fullName: input.fullName,
      email: input.email,
      passwordHash,
      role: input.role,
    });
    const user = await userRepository.findById(id);
    return issueTokens(user!);
  },

  async login(input: LoginInput) {
    const user = await userRepository.findByEmail(input.email);
    if (!user || !user.is_active) throw AppError.unauthorized('Invalid credentials');
    const valid = await verifyPassword(input.password, user.password_hash);
    if (!valid) throw AppError.unauthorized('Invalid credentials');
    return issueTokens(user);
  },

  async refresh(refreshToken: string) {
    let payload: { sub: number };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw AppError.unauthorized('Invalid refresh token');
    }
    const tokenHash = hashToken(refreshToken);
    const stored = await tokenRepository.findValid(tokenHash);
    if (!stored) throw AppError.unauthorized('Refresh token expired or revoked');

    // rotate: revoke the old, issue a fresh pair
    await tokenRepository.revoke(tokenHash);
    const user = await userRepository.findById(payload.sub);
    if (!user) throw AppError.unauthorized();
    return issueTokens(user);
  },

  async logout(refreshToken: string) {
    if (refreshToken) await tokenRepository.revoke(hashToken(refreshToken));
  },

  async me(userId: number) {
    const user = await userRepository.findById(userId);
    if (!user) throw AppError.notFound('User not found');
    return publicUser(user);
  },
};
