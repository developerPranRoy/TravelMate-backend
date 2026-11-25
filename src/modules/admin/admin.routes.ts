import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/roleGuard';
import { validate } from '../../middleware/validate';
import { updateAgencyStatusSchema, adminQuerySchema } from './admin.schema';
import * as adminController from './admin.controller';

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate, requireRole('ADMIN'));

// GET /api/admin/dashboard - Admin dashboard statistics
router.get('/dashboard', adminController.dashboard);

// GET /api/admin/users - Paginated users list with search & role filter
router.get(
  '/users',
  validate(adminQuerySchema, 'query'),
  adminController.users,
);

// PATCH /api/admin/agencies/:id/status - Approve or suspend an agency
router.patch(
  '/agencies/:id/status',
  validate(updateAgencyStatusSchema, 'body'),
  adminController.updateAgencyStatus,
);

// GET /api/admin/bookings - Paginated bookings list with status filter
router.get(
  '/bookings',
  validate(adminQuerySchema, 'query'),
  adminController.bookings,
);

export default router;
