import { Request, Response, NextFunction } from 'express';
import {
  createBooking, getCustomerBookings, getBookingById,
  cancelBooking, getAgencyBookings, updateBookingStatus,
} from './booking.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/response';
import { AppError } from '../../middleware/errorHandler';
import { createBookingSchema, bookingQuerySchema, updateBookingStatusSchema } from './booking.schema';
import prisma from '../../utils/prisma';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Unauthenticated', 401);
    const data = createBookingSchema.parse(req.body);
    const booking = await createBooking(req.user.id, data);
    sendCreated(res, booking, 'Booking created');
  } catch (err) { next(err); }
}

export async function getMyBookings(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Unauthenticated', 401);
    const query = bookingQuerySchema.parse(req.query);
    const { bookings, total, page, limit } = await getCustomerBookings(req.user.id, query);
    sendPaginated(res, bookings, total, page, limit);
  } catch (err) { next(err); }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Unauthenticated', 401);
    const booking = await getBookingById(String(req.params.id), req.user.id, req.user.role);
    sendSuccess(res, booking);
  } catch (err) { next(err); }
}

export async function cancel(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Unauthenticated', 401);
    const booking = await cancelBooking(String(req.params.id), req.user.id);
    sendSuccess(res, booking, 'Booking cancelled');
  } catch (err) { next(err); }
}

export async function listAgencyBookings(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Unauthenticated', 401);
    const agency = await prisma.agency.findUnique({ where: { userId: req.user.id } });
    if (!agency) throw new AppError('Agency not found', 404);
    const query = bookingQuerySchema.parse(req.query);
    const { bookings, total, page, limit } = await getAgencyBookings(agency.id, query);
    sendPaginated(res, bookings, total, page, limit);
  } catch (err) { next(err); }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Unauthenticated', 401);
    const agency = await prisma.agency.findUnique({ where: { userId: req.user.id } });
    if (!agency) throw new AppError('Agency not found', 404);
    const data = updateBookingStatusSchema.parse(req.body);
    const booking = await updateBookingStatus(String(req.params.id), agency.id, data);
    sendSuccess(res, booking, 'Booking status updated');
  } catch (err) { next(err); }
}
