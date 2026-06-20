import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created, paginated } from '../utils/http.js';
import { teamService } from '../services/team.service.js';

export const teamController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const q = req.query as never as { page: number; limit: number };
    const { rows, total } = await teamService.list(req.query as never);
    paginated(res, rows, total, q.page, q.limit);
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await teamService.get(Number(req.params.id)));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const body = { ...req.body };
    if (req.file) body.logoUrl = `/uploads/${req.file.filename}`;
    created(res, await teamService.create(body));
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const body = { ...req.body };
    if (req.file) body.logoUrl = `/uploads/${req.file.filename}`;
    ok(res, await teamService.update(Number(req.params.id), body));
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await teamService.remove(Number(req.params.id));
    ok(res, { message: 'Deleted' });
  }),
};
