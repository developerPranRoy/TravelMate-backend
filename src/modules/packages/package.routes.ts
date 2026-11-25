import { Router } from 'express';
import { list, getById, create, update, remove, listAgencyPackages } from './package.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/roleGuard';

const router = Router();

router.get('/', list);
router.get('/agency/mine', authenticate, requireRole('AGENCY'), listAgencyPackages);
router.get('/:id', getById);
router.post('/', authenticate, requireRole('AGENCY'), create);
router.patch('/:id', authenticate, requireRole('AGENCY', 'ADMIN'), update);
router.delete('/:id', authenticate, requireRole('AGENCY', 'ADMIN'), remove);

export default router;
