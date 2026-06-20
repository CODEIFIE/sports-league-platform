import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { reportService } from '../services/report.service.js';

export const reportController = {
  fixtures: asyncHandler((req: Request, res: Response) =>
    reportService.fixtures(res, Number(req.params.tournamentId))),
  results: asyncHandler((req: Request, res: Response) =>
    reportService.results(res, Number(req.params.tournamentId))),
  standings: asyncHandler((req: Request, res: Response) =>
    reportService.standings(res, Number(req.params.tournamentId))),
  playerStats: asyncHandler((req: Request, res: Response) =>
    reportService.playerStats(res, Number(req.params.tournamentId))),
  tournamentReport: asyncHandler((req: Request, res: Response) =>
    reportService.tournamentReport(res, Number(req.params.tournamentId))),
  certificate: asyncHandler((req: Request, res: Response) =>
    reportService.certificate(
      res,
      Number(req.params.tournamentId),
      String(req.query.team ?? 'Champions'),
      String(req.query.title ?? 'Champion'),
    )),
};
