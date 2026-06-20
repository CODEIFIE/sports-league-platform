import { Router } from 'express';
import { playerController } from '../controllers/player.controller.js';
import { validate } from '../middlewares/validate.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';
import { createPlayerSchema, updatePlayerSchema, playerListSchema } from '../validators/player.validator.js';
import { idParamSchema } from '../validators/tournament.validator.js';

const router = Router();
const admin = [authenticate, authorize('SUPER_ADMIN', 'TOURNAMENT_ADMIN')];

router.get('/', validate(playerListSchema, 'query'), playerController.list);
router.get('/:id', validate(idParamSchema, 'params'), playerController.get);
router.post('/', ...admin, upload.single('photo'), validate(createPlayerSchema), playerController.create);
router.patch('/:id', ...admin, upload.single('photo'), validate(idParamSchema, 'params'), validate(updatePlayerSchema), playerController.update);
router.delete('/:id', ...admin, validate(idParamSchema, 'params'), playerController.remove);

export default router;
