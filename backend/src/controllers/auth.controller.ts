import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/http.js';
import { authService } from '../services/auth.service.js';
import { AppError } from '../utils/AppError.js';

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    created(res, result);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    ok(res, result);
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.refresh(req.body.refreshToken);
    ok(res, result);
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    await authService.logout(req.body?.refreshToken ?? '');
    ok(res, { message: 'Logged out' });
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    ok(res, await authService.me(req.user.sub));
  }),
};
