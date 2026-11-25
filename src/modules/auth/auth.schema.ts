import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),

  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Invalid email address')
    .toLowerCase(),

  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password must be at most 128 characters'),

  role: z.enum(['CUSTOMER', 'AGENCY']).optional().default('CUSTOMER'),

  agencyName: z
    .string()
    .trim()
    .min(2, 'Agency name must be at least 2 characters')
    .max(200, 'Agency name must be at most 200 characters')
    .optional(),
}).refine(
  (data) => {
    // If role is AGENCY, agencyName is required
    if (data.role === 'AGENCY' && !data.agencyName) {
      return false;
    }
    return true;
  },
  {
    message: 'Agency name is required for agency registration',
    path: ['agencyName'],
  }
);

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Invalid email address')
    .toLowerCase(),

  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
