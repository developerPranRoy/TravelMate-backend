import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination';

const packageBaseSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  destinationId: z.string().uuid('Invalid destination'),
  description: z.string().min(10, 'Description is required'),
  price: z.coerce.number().positive('Price must be positive'),
  durationDays: z.coerce.number().int().positive('Duration must be a positive integer'),
  availableSeats: z.coerce.number().int().positive('Available seats must be positive'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']).default('DRAFT'),
});

export const createPackageSchema = packageBaseSchema.refine((d) => d.endDate >= d.startDate, {
  message: 'End date must be on or after start date',
  path: ['endDate'],
});

export const updatePackageSchema = packageBaseSchema.partial().refine(
  (d) => !d.startDate || !d.endDate || d.endDate >= d.startDate,
  {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  },
);

export const packageQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  destinationId: z.string().uuid().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  startDate: z.coerce.date().optional(),
  sort: z.enum(['price_asc', 'price_desc', 'date_asc', 'date_desc']).optional(),
});

export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;
export type PackageQuery = z.infer<typeof packageQuerySchema>;
