import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/http.js';
import { statsRepository } from '../repositories/stats.repository.js';

export const statsController = {
  standings: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await statsRepository.standings(Number(req.params.tournamentId)));
  }),

  topPlayers: asyncHandler(async (req: Request, res: Response) => {
    const metric = String(req.query.metric ?? 'goals');
    const limit = Math.min(Number(req.query.limit ?? 10), 50);
    ok(res, await statsRepository.topPlayers(Number(req.params.tournamentId), metric, limit));
  }),

  playerStats: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await statsRepository.playerStats(Number(req.params.tournamentId)));
  }),

  mvp: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await statsRepository.mvp(Number(req.params.tournamentId)));
  }),

  dashboard: asyncHandler(async (_req: Request, res: Response) => {
    const [counts, matchesPerTournament, goalsPerTournament, winsDistribution, topTeams, recent] =
      await Promise.all([
        statsRepository.dashboardCounts(),
        statsRepository.matchesPerTournament(),
        statsRepository.goalsPerTournament(),
        statsRepository.winsDistribution(),
        statsRepository.topTeams(),
        statsRepository.recentActivity(),
      ]);
    ok(res, {
      counts,
      charts: { matchesPerTournament, goalsPerTournament, winsDistribution, topTeams },
      recent,
    });
  }),
};
