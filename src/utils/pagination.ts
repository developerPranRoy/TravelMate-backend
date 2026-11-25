import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export type PaginationQuery = z.infer<typeof paginationSchema>;

export function getPaginationParams(query: PaginationQuery) {
  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
