import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/http.js';
import { scoringService } from '../services/scoring.service.js';

const id = (req: Request) => Number(req.params.id);

export const scoringController = {
  // cricket
  cricketSetup: asyncHandler(async (req: Request, res: Response) =>
    ok(res, await scoringService.cricketSetup(id(req), Number(req.body.battingTeamId), Number(req.body.oversLimit) || 6))),
  cricketBall: asyncHandler(async (req: Request, res: Response) =>
    ok(res, await scoringService.cricketBall(id(req), req.body))),
  cricketBatsman: asyncHandler(async (req: Request, res: Response) =>
    ok(res, await scoringService.cricketNewBatsman(id(req), Number(req.body.playerId)))),
  cricketBowler: asyncHandler(async (req: Request, res: Response) =>
    ok(res, await scoringService.cricketNewBowler(id(req), Number(req.body.playerId)))),
  cricketEndInnings: asyncHandler(async (req: Request, res: Response) =>
    ok(res, await scoringService.cricketEndInnings(id(req)))),
  // football
  footballSetup: asyncHandler(async (req: Request, res: Response) =>
    ok(res, await scoringService.footballSetup(id(req)))),
  footballGoal: asyncHandler(async (req: Request, res: Response) =>
    ok(res, await scoringService.footballGoal(id(req), req.body))),
  footballCard: asyncHandler(async (req: Request, res: Response) =>
    ok(res, await scoringService.footballCard(id(req), req.body))),
  footballClock: asyncHandler(async (req: Request, res: Response) =>
    ok(res, await scoringService.footballClock(id(req), Number(req.body.minute)))),
  // shared
  endMatch: asyncHandler(async (req: Request, res: Response) =>
    ok(res, await scoringService.endMatch(id(req)))),
};
