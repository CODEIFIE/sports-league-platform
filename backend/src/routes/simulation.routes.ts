import { Router } from 'express';
import { simulationController } from '../controllers/simulation.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();
const scorer = [authenticate, authorize('SUPER_ADMIN', 'TOURNAMENT_ADMIN', 'MATCH_OFFICIAL')];

router.get('/status', simulationController.status); // public: scoreboard can show "auto-live" badge
router.get('/state/:id', simulationController.state); // public: live match-centre state
router.post('/auto', ...scorer, simulationController.startAuto);
router.post('/stop', ...scorer, simulationController.stop);
router.post('/match/:id', ...scorer, simulationController.startMatch);

export default router;
