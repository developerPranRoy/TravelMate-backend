import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/roleGuard';
import { validate } from '../../middleware/validate';
import { createDestinationSchema, updateDestinationSchema, destinationQuerySchema } from './destination.schema';
import * as destinationController from './destination.controller';

const router = Router();

// Public routes
router.get('/', validate(destinationQuerySchema, 'query'), destinationController.list);
router.get('/:id', destinationController.getById);

// Admin-only routes
router.post('/', authenticate, requireRole('ADMIN'), validate(createDestinationSchema), destinationController.create);
router.patch('/:id', authenticate, requireRole('ADMIN'), validate(updateDestinationSchema), destinationController.update);
router.delete('/:id', authenticate, requireRole('ADMIN'), destinationController.remove);

export default router;
