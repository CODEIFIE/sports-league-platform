import { z } from 'zod';

export const createPlayerSchema = z.object({
  teamId: z.coerce.number().int().positive(),
  name: z.string().min(1).max(120),
  jerseyNumber: z.coerce.number().int().min(0).max(999).optional().nullable(),
  position: z.string().max(40).optional().nullable(),
  age: z.coerce.number().int().min(5).max(80).optional().nullable(),
  photoUrl: z.string().max(255).optional().nullable(),
});

export const updatePlayerSchema = createPlayerSchema.partial();

export const playerListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  teamId: z.coerce.number().int().positive().optional(),
  tournamentId: z.coerce.number().int().positive().optional(),
});
