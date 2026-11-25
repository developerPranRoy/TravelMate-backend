import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination';

export const createDestinationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  country: z
    .string()
    .trim()
    .min(2, 'Country must be at least 2 characters')
    .max(100, 'Country must be at most 100 characters'),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be at most 2000 characters'),
  imageUrl: z.string().url('Invalid image URL').optional(),
  isActive: z.boolean().default(true),
});

export const updateDestinationSchema = createDestinationSchema.partial();

export const destinationQuerySchema = paginationSchema.extend({
  search: z.string().trim().optional(),
});

export type CreateDestinationInput = z.infer<typeof createDestinationSchema>;
export type UpdateDestinationInput = z.infer<typeof updateDestinationSchema>;
export type DestinationQuery = z.infer<typeof destinationQuerySchema>;
