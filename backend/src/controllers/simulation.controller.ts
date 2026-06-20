import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/http.js';
import { simulationService } from '../services/simulation.service.js';

export const simulationController = {
  status: asyncHandler(async (_req: Request, res: Response) => {
    ok(res, simulationService.status());
  }),

  state: asyncHandler(async (req: Request, res: Response) => {
    ok(res, simulationService.getState(Number(req.params.id)));
  }),

  startAuto: asyncHandler(async (req: Request, res: Response) => {
    const tournamentId = req.body?.tournamentId ? Number(req.body.tournamentId) : undefined;
    const max = req.body?.maxConcurrent ? Number(req.body.maxConcurrent) : 2;
    ok(res, await simulationService.startAuto(tournamentId, max));
  }),

  startMatch: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await simulationService.startMatch(Number(req.params.id)));
  }),

  stop: asyncHandler(async (_req: Request, res: Response) => {
    simulationService.stopAll();
    ok(res, simulationService.status());
  }),
};
