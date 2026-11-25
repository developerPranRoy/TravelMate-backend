import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination';

// Schema for updating agency status (approve or suspend)
export const updateAgencyStatusSchema = z.object({
  status: z.enum(['APPROVED', 'SUSPENDED'], {
    required_error: 'Status is required',
    invalid_type_error: 'Status must be either APPROVED or SUSPENDED',
  }),
});

// Schema for admin query with pagination, search, and filters
export const adminQuerySchema = paginationSchema.extend({
  search: z
    .string()
    .trim()
    .optional(),
  role: z
    .enum(['CUSTOMER', 'AGENCY', 'ADMIN'], {
      invalid_type_error: 'Role must be CUSTOMER, AGENCY, or ADMIN',
    })
    .optional(),
  status: z
    .enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'], {
      invalid_type_error: 'Status must be PENDING, CONFIRMED, CANCELLED, or COMPLETED',
    })
    .optional(),
});

export type UpdateAgencyStatusInput = z.infer<typeof updateAgencyStatusSchema>;
export type AdminQueryInput = z.infer<typeof adminQuerySchema>;
