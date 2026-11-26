import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendPaginated } from '../../utils/response';
import * as adminService from './admin.service';
import { UpdateAgencyStatusInput, AdminQueryInput } from './admin.schema';

/**
 * GET /api/admin/dashboard
 * Returns aggregated dashboard statistics.
 */
export async function dashboard(_req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await adminService.getDashboard();
    sendSuccess(res, stats, 'Dashboard data retrieved');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/users
 * Returns a paginated list of users with optional search and role filter.
 */
export async function users(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as unknown as AdminQueryInput;
    const { users, total, page, limit } = await adminService.getUsers(query);
    sendPaginated(res, users, total, page, limit, 'Users retrieved');
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/agencies/:id/status
 * Updates an agency's status (approve or suspend).
 */
export async function updateAgencyStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const { status } = req.body as UpdateAgencyStatusInput;
    const agency = await adminService.updateAgencyStatus(id, status);
    sendSuccess(res, agency, `Agency ${status.toLowerCase()} successfully`);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/bookings
 * Returns a paginated list of all bookings with customer and package details.
 */
export async function bookings(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as unknown as AdminQueryInput;
    const { bookings, total, page, limit } = await adminService.getBookings(query);
    sendPaginated(res, bookings, total, page, limit, 'Bookings retrieved');
  } catch (err) {
    next(err);
  }
}
