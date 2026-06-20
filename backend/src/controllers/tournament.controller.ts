import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created, paginated } from '../utils/http.js';
import { tournamentService } from '../services/tournament.service.js';

export const tournamentController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const q = req.query as never;
    const { rows, total } = await tournamentService.list(q);
    paginated(res, rows, total, (q as { page: number }).page, (q as { limit: number }).limit);
  }),

  sports: asyncHandler(async (_req: Request, res: Response) => {
    ok(res, await tournamentService.listSports());
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await tournamentService.get(Number(req.params.id)));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    created(res, await tournamentService.create(req.body, req.user?.sub));
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await tournamentService.update(Number(req.params.id), req.body));
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await tournamentService.remove(Number(req.params.id));
    ok(res, { message: 'Deleted' });
  }),
};
