import { AppError } from '../utils/AppError.js';
import { withTransaction } from '../config/db.js';
import { tournamentRepository } from '../repositories/tournament.repository.js';
import { notificationService } from './notification.service.js';
import type {
  CreateTournamentInput,
  ListQueryInput,
  UpdateTournamentInput,
} from '../validators/tournament.validator.js';

export const tournamentService = {
  list: (q: ListQueryInput) => tournamentRepository.list(q),

  async get(id: number) {
    const t = await tournamentRepository.findById(id);
    if (!t) throw AppError.notFound('Tournament not found');
    return t;
  },

  async create(input: CreateTournamentInput, userId?: number) {
    // transaction: insert + (trigger writes its own log) + notification
    const id = await withTransaction(async () => tournamentRepository.create(input, userId));
    const created = await tournamentRepository.findById(id);
    await notificationService.push({
      type: 'TOURNAMENT_CREATED',
      title: `${input.name} created`,
      body: `${input.format} · ${created?.sport ?? ''}`.trim(),
      tournamentId: id,
    });
    return created;
  },

  async update(id: number, input: UpdateTournamentInput) {
    await this.get(id);
    await tournamentRepository.update(id, input as Record<string, any>);
    return tournamentRepository.findById(id);
  },

  async remove(id: number) {
    await this.get(id);
    await tournamentRepository.remove(id);
  },

  listSports: () => tournamentRepository.listSports(),
};
