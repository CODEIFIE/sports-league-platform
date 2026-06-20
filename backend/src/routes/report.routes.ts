import { Router } from 'express';
import { reportController } from '../controllers/report.controller.js';

const router = Router();
router.get('/fixtures/:tournamentId', reportController.fixtures);
router.get('/results/:tournamentId', reportController.results);
router.get('/standings/:tournamentId', reportController.standings);
router.get('/player-stats/:tournamentId', reportController.playerStats);
router.get('/tournament/:tournamentId', reportController.tournamentReport);
router.get('/certificate/:tournamentId', reportController.certificate);

export default router;
