import { AppError } from '../utils/AppError.js';
import { teamRepository } from '../repositories/team.repository.js';

export const teamService = {
  list: (q: { page: number; limit: number; search?: string; tournamentId?: number }) =>
    teamRepository.list(q),

  async get(id: number) {
    const t = await teamRepository.findById(id);
    if (!t) throw AppError.notFound('Team not found');
    return t;
  },

  async create(input: Record<string, any>) {
    // trigger trg_team_after_insert auto-creates the standings row
    const id = await teamRepository.create(input);
    return teamRepository.findById(id);
  },

  async update(id: number, input: Record<string, any>) {
    await this.get(id);
    await teamRepository.update(id, input);
    return teamRepository.findById(id);
  },

  async remove(id: number) {
    await this.get(id);
    await teamRepository.remove(id);
  },
};
