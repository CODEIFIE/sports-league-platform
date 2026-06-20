import { Router } from 'express';
import { tournamentController } from '../controllers/tournament.controller.js';
import { validate } from '../middlewares/validate.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import {
  createTournamentSchema,
  updateTournamentSchema,
  listQuerySchema,
  idParamSchema,
} from '../validators/tournament.validator.js';

const router = Router();
const admin = [authenticate, authorize('SUPER_ADMIN', 'TOURNAMENT_ADMIN')];

router.get('/sports', tournamentController.sports);
router.get('/', validate(listQuerySchema, 'query'), tournamentController.list);
router.get('/:id', validate(idParamSchema, 'params'), tournamentController.get);
router.post('/', ...admin, validate(createTournamentSchema), tournamentController.create);
router.patch('/:id', ...admin, validate(idParamSchema, 'params'), validate(updateTournamentSchema), tournamentController.update);
router.delete('/:id', ...admin, validate(idParamSchema, 'params'), tournamentController.remove);

export default router;
