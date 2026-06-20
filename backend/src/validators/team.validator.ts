import { z } from 'zod';

export const createTeamSchema = z.object({
  tournamentId: z.coerce.number().int().positive(),
  name: z.string().min(1).max(120),
  coach: z.string().max(120).optional().nullable(),
  captain: z.string().max(120).optional().nullable(),
  contact: z.string().max(40).optional().nullable(),
  logoUrl: z.string().max(255).optional().nullable(),
});

export const updateTeamSchema = createTeamSchema.partial();

export const teamListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(10),
  search: z.string().trim().optional(),
  tournamentId: z.coerce.number().int().positive().optional(),
});
