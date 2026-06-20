import { Router } from 'express';
import { statsController } from '../controllers/stats.controller.js';

const router = Router();

// all public (used by dashboard + public scoreboard)
router.get('/dashboard', statsController.dashboard);
router.get('/standings/:tournamentId', statsController.standings);
router.get('/top-players/:tournamentId', statsController.topPlayers);
router.get('/player-stats/:tournamentId', statsController.playerStats);
router.get('/mvp/:tournamentId', statsController.mvp);

export default router;
