import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination';

export const createBookingSchema = z.object({
  packageId: z.string().uuid('Invalid package ID'),
  travelerCount: z.number().int().positive('Traveler count must be at least 1'),
});

export const bookingQuerySchema = paginationSchema.extend({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'COMPLETED']),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type BookingQuery = z.infer<typeof bookingQuerySchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
