import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created, paginated } from '../utils/http.js';
import { AppError } from '../utils/AppError.js';
import { playerRepository } from '../repositories/player.repository.js';

async function getOrThrow(id: number) {
  const p = await playerRepository.findById(id);
  if (!p) throw AppError.notFound('Player not found');
  return p;
}

export const playerController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const q = req.query as never as { page: number; limit: number };
    const { rows, total } = await playerRepository.list(req.query as never);
    paginated(res, rows, total, q.page, q.limit);
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await getOrThrow(Number(req.params.id)));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const body = { ...req.body };
    if (req.file) body.photoUrl = `/uploads/${req.file.filename}`;
    const id = await playerRepository.create(body);
    created(res, await playerRepository.findById(id));
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    await getOrThrow(Number(req.params.id));
    const body = { ...req.body };
    if (req.file) body.photoUrl = `/uploads/${req.file.filename}`;
    await playerRepository.update(Number(req.params.id), body);
    ok(res, await playerRepository.findById(Number(req.params.id)));
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await getOrThrow(Number(req.params.id));
    await playerRepository.remove(Number(req.params.id));
    ok(res, { message: 'Deleted' });
  }),
};
