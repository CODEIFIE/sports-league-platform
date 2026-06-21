import { Router } from 'express';
import authRoutes from './auth.routes.js';
import tournamentRoutes from './tournament.routes.js';
import teamRoutes from './team.routes.js';
import playerRoutes from './player.routes.js';
import matchRoutes from './match.routes.js';
import statsRoutes from './stats.routes.js';
import notificationRoutes from './notification.routes.js';
import reportRoutes from './report.routes.js';
import searchRoutes from './search.routes.js';
import scoringRoutes from './scoring.routes.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ success: true, status: 'ok' }));
router.use('/auth', authRoutes);
router.use('/tournaments', tournamentRoutes);
router.use('/teams', teamRoutes);
router.use('/players', playerRoutes);
router.use('/matches', matchRoutes);
router.use('/stats', statsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);
router.use('/search', searchRoutes);
router.use('/scoring', scoringRoutes);

export default router;
