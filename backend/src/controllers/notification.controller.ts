import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/http.js';
import { notificationService } from '../services/notification.service.js';

export const notificationController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await notificationService.list(Math.min(Number(req.query.limit ?? 30), 100)));
  }),
  markRead: asyncHandler(async (req: Request, res: Response) => {
    await notificationService.markRead(Number(req.params.id));
    ok(res, { message: 'ok' });
  }),
  markAllRead: asyncHandler(async (_req: Request, res: Response) => {
    await notificationService.markAllRead();
    ok(res, { message: 'ok' });
  }),
};
