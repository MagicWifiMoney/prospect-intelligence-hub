import { z } from 'zod'

/**
 * Pagination parameters with sensible limits
 * - page: minimum 1
 * - limit: 1-100 (prevents DOS from massive queries)
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

/**
 * Query parameters for prospect list endpoints
 */
export const prospectQuerySchema = paginationSchema.extend({
  search: z.string().max(200).optional(),
  businessType: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  isHotLead: z.enum(['true', 'false']).optional(),
  hasAnomalies: z.enum(['true', 'false']).optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
  maxScore: z.coerce.number().min(0).max(100).optional(),
})

/**
 * Validation for prospect create/update requests
 */
export const prospectCreateSchema = z.object({
  companyName: z.string().min(1).max(200),
  businessType: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().max(255).optional().or(z.literal('')),
  website: z.string().url().max(500).optional().or(z.literal('')),
  gbpUrl: z.string().url().max(1000).optional().or(z.literal('')),
  placeId: z.string().max(255).optional(),
})

/**
 * Validation for prospect update (PATCH) requests
 */
export const prospectUpdateSchema = z.object({
  notes: z.string().max(10000).optional(),
  tags: z.string().max(1000).optional(),
  contactedAt: z.string().datetime().optional().nullable(),
  isConverted: z.boolean().optional(),
})

/**
 * Helper to parse and validate query params
 */
export function parseQueryParams<T extends z.ZodSchema>(
  searchParams: URLSearchParams,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  const params = Object.fromEntries(searchParams.entries())
  const result = schema.safeParse(params)

  if (!result.success) {
    return { success: false, error: 'Invalid parameters' }
  }

  return { success: true, data: result.data }
}
