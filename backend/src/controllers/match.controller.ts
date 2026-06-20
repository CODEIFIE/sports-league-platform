import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/http.js';
import { matchService } from '../services/match.service.js';

export const matchController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await matchService.list(req.query as never));
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await matchService.get(Number(req.params.id)));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    created(res, await matchService.create(req.body));
  }),

  generate: asyncHandler(async (req: Request, res: Response) => {
    const { tournamentId, format } = req.body;
    ok(res, await matchService.generateFixtures(tournamentId, format));
  }),

  schedule: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await matchService.setSchedule(Number(req.params.id), req.body.scheduledAt ?? null, req.body.venue ?? null));
  }),

  status: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await matchService.setStatus(Number(req.params.id), req.body.status, req.body.winnerTeamId));
  }),

  clock: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await matchService.setClock(Number(req.params.id), req.body.seconds));
  }),

  addEvent: asyncHandler(async (req: Request, res: Response) => {
    created(res, await matchService.addEvent(Number(req.params.id), req.body));
  }),

  removeEvent: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await matchService.removeEvent(Number(req.params.id), Number(req.params.eventId)));
  }),

  recalc: asyncHandler(async (req: Request, res: Response) => {
    await matchService.recalcStandings(Number(req.params.tournamentId));
    ok(res, { message: 'Standings recalculated' });
  }),
};
