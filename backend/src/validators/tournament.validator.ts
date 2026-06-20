import { z } from 'zod';

export const createTournamentSchema = z.object({
  name: z.string().min(2).max(140),
  sportId: z.coerce.number().int().positive(),
  format: z.enum(['ROUND_ROBIN', 'KNOCKOUT']).default('ROUND_ROBIN'),
  status: z.enum(['DRAFT', 'ONGOING', 'COMPLETED', 'CANCELLED']).default('DRAFT'),
  location: z.string().max(160).optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

export const updateTournamentSchema = createTournamentSchema.partial();

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  status: z.enum(['DRAFT', 'ONGOING', 'COMPLETED', 'CANCELLED']).optional(),
  sportId: z.coerce.number().int().positive().optional(),
});

export const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;
export type UpdateTournamentInput = z.infer<typeof updateTournamentSchema>;
export type ListQueryInput = z.infer<typeof listQuerySchema>;
