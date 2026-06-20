import { Router } from 'express';
import { teamController } from '../controllers/team.controller.js';
import { validate } from '../middlewares/validate.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';
import { createTeamSchema, updateTeamSchema, teamListSchema } from '../validators/team.validator.js';
import { idParamSchema } from '../validators/tournament.validator.js';

const router = Router();
const admin = [authenticate, authorize('SUPER_ADMIN', 'TOURNAMENT_ADMIN')];

router.get('/', validate(teamListSchema, 'query'), teamController.list);
router.get('/:id', validate(idParamSchema, 'params'), teamController.get);
router.post('/', ...admin, upload.single('logo'), validate(createTeamSchema), teamController.create);
router.patch('/:id', ...admin, upload.single('logo'), validate(idParamSchema, 'params'), validate(updateTeamSchema), teamController.update);
router.delete('/:id', ...admin, validate(idParamSchema, 'params'), teamController.remove);

export default router;
