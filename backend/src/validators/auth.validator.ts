import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email().max(160),
  password: z.string().min(6).max(72),
  role: z
    .enum(['SUPER_ADMIN', 'TOURNAMENT_ADMIN', 'MATCH_OFFICIAL', 'PUBLIC_VIEWER'])
    .default('PUBLIC_VIEWER'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
