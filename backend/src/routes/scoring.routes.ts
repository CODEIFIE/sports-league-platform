import { Router } from 'express';
import { scoringController } from '../controllers/scoring.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();
const scorer = [authenticate, authorize('SUPER_ADMIN', 'TOURNAMENT_ADMIN', 'MATCH_OFFICIAL')];

// cricket
router.post('/cricket/:id/setup', ...scorer, scoringController.cricketSetup);
router.post('/cricket/:id/ball', ...scorer, scoringController.cricketBall);
router.post('/cricket/:id/batsman', ...scorer, scoringController.cricketBatsman);
router.post('/cricket/:id/bowler', ...scorer, scoringController.cricketBowler);
router.post('/cricket/:id/end-innings', ...scorer, scoringController.cricketEndInnings);
// football
router.post('/football/:id/setup', ...scorer, scoringController.footballSetup);
router.post('/football/:id/goal', ...scorer, scoringController.footballGoal);
router.post('/football/:id/card', ...scorer, scoringController.footballCard);
router.post('/football/:id/clock', ...scorer, scoringController.footballClock);
// shared
router.post('/:id/end', ...scorer, scoringController.endMatch);

export default router;
