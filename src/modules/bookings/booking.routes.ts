import { Router } from 'express';
import { create, getMyBookings, getById, cancel, listAgencyBookings, updateStatus } from './booking.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/roleGuard';

const router = Router();

router.post('/', authenticate, requireRole('CUSTOMER'), create);
router.get('/me', authenticate, requireRole('CUSTOMER'), getMyBookings);
router.get('/agency', authenticate, requireRole('AGENCY'), listAgencyBookings);
router.patch('/agency/:id/status', authenticate, requireRole('AGENCY'), updateStatus);
router.get('/:id', authenticate, getById);
router.patch('/:id/cancel', authenticate, requireRole('CUSTOMER'), cancel);

export default router;
