import { z } from 'zod';

export const matchListSchema = z.object({
  tournamentId: z.coerce.number().int().positive().optional(),
  status: z.enum(['SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED']).optional(),
});

export const createMatchSchema = z.object({
  tournamentId: z.coerce.number().int().positive(),
  homeTeamId: z.coerce.number().int().positive(),
  awayTeamId: z.coerce.number().int().positive(),
  roundNo: z.coerce.number().int().optional().nullable(),
  bracketStage: z.enum(['GROUP', 'QUARTER', 'SEMI', 'FINAL']).optional().nullable(),
  scheduledAt: z.string().optional().nullable(),
  venue: z.string().max(160).optional().nullable(),
});

export const scheduleSchema = z.object({
  scheduledAt: z.string().optional().nullable(),
  venue: z.string().max(160).optional().nullable(),
});

export const statusSchema = z.object({
  status: z.enum(['SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED']),
  winnerTeamId: z.coerce.number().int().positive().optional().nullable(),
});

export const clockSchema = z.object({ seconds: z.coerce.number().int().min(0) });

export const eventSchema = z.object({
  teamId: z.coerce.number().int().positive().optional().nullable(),
  playerId: z.coerce.number().int().positive().optional().nullable(),
  eventType: z.enum([
    'GOAL', 'ASSIST', 'YELLOW_CARD', 'RED_CARD',
    'POINT', 'FOUL', 'RUN', 'WICKET', 'OVER',
  ]),
  value: z.coerce.number().int().min(1).default(1),
  minute: z.coerce.number().int().optional().nullable(),
  note: z.string().max(200).optional().nullable(),
});

export const generateSchema = z.object({
  tournamentId: z.coerce.number().int().positive(),
  format: z.enum(['ROUND_ROBIN', 'KNOCKOUT']),
});
