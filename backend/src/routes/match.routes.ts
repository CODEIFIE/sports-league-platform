import { Router } from 'express';
import { matchController } from '../controllers/match.controller.js';
import { validate } from '../middlewares/validate.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { idParamSchema } from '../validators/tournament.validator.js';
import {
  matchListSchema, createMatchSchema, scheduleSchema, statusSchema,
  clockSchema, eventSchema, generateSchema,
} from '../validators/match.validator.js';

const router = Router();
const admin = [authenticate, authorize('SUPER_ADMIN', 'TOURNAMENT_ADMIN')];
const official = [authenticate, authorize('SUPER_ADMIN', 'TOURNAMENT_ADMIN', 'MATCH_OFFICIAL')];

// public reads
router.get('/', validate(matchListSchema, 'query'), matchController.list);
router.get('/:id', validate(idParamSchema, 'params'), matchController.get);

// fixture generation + scheduling (admin)
router.post('/generate', ...admin, validate(generateSchema), matchController.generate);
router.post('/', ...admin, validate(createMatchSchema), matchController.create);
router.patch('/:id/schedule', ...admin, validate(idParamSchema, 'params'), validate(scheduleSchema), matchController.schedule);
router.post('/recalc/:tournamentId', ...admin, matchController.recalc);

// live scoring (match officials + admins)
router.patch('/:id/status', ...official, validate(idParamSchema, 'params'), validate(statusSchema), matchController.status);
router.patch('/:id/clock', ...official, validate(idParamSchema, 'params'), validate(clockSchema), matchController.clock);
router.post('/:id/events', ...official, validate(idParamSchema, 'params'), validate(eventSchema), matchController.addEvent);
router.delete('/:id/events/:eventId', ...official, matchController.removeEvent);

export default router;
