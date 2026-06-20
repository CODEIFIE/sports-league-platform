import { AppError } from '../utils/AppError.js';
import { matchRepository } from '../repositories/match.repository.js';
import { notificationService } from './notification.service.js';
import { emit } from '../sockets/index.js';

const EVENT_TITLES: Record<string, string> = {
  GOAL: 'Goal!', POINT: 'Points scored', RUN: 'Runs scored', WICKET: 'Wicket!',
  YELLOW_CARD: 'Yellow card', RED_CARD: 'Red card', FOUL: 'Foul', ASSIST: 'Assist', OVER: 'Over',
};

async function broadcastMatch(matchId: number) {
  const match = await matchRepository.findById(matchId);
  if (match) emit.matchUpdate(matchId, match);
  return match;
}

export const matchService = {
  list: (filter: { tournamentId?: number; status?: string }) => matchRepository.list(filter),

  async get(id: number) {
    const m = await matchRepository.findById(id);
    if (!m) throw AppError.notFound('Match not found');
    const events = await matchRepository.events(id);
    const summary = await matchRepository.getSummary(id);
    return { ...m, events, summary: summary?.summary ?? null, momName: summary?.momName ?? null };
  },

  async create(input: Record<string, any>) {
    if (input.homeTeamId === input.awayTeamId) throw AppError.badRequest('A team cannot play itself');
    const id = await matchRepository.create(input);
    return matchRepository.findById(id);
  },

  async setSchedule(id: number, scheduledAt: string | null, venue: string | null) {
    await this.assertExists(id);
    await matchRepository.updateSchedule(id, scheduledAt, venue);
    return broadcastMatch(id);
  },

  async setStatus(id: number, status: string, winnerTeamId?: number | null) {
    const match = await this.assertExists(id);
    await matchRepository.updateStatus(id, status, winnerTeamId);
    const updated = await broadcastMatch(id);

    if (status === 'LIVE') {
      await notificationService.push({
        type: 'MATCH_STARTED',
        title: `${match.home_team ?? 'TBD'} vs ${match.away_team ?? 'TBD'} is live`,
        tournamentId: match.tournament_id, matchId: id,
      });
    } else if (status === 'COMPLETED' && updated) {
      // standings updated by trigger; rebroadcast standings room
      emit.standings(updated.tournament_id, { tournamentId: updated.tournament_id });
      await notificationService.push({
        type: 'MATCH_FINISHED',
        title: `${updated.home_team} ${updated.home_score} - ${updated.away_score} ${updated.away_team}`,
        body: 'Full time',
        tournamentId: updated.tournament_id, matchId: id,
      });
    }
    return updated;
  },

  async setClock(id: number, seconds: number) {
    await this.assertExists(id);
    await matchRepository.setClock(id, seconds);
    return broadcastMatch(id);
  },

  async addEvent(matchId: number, input: Record<string, any>, opts: { notify?: boolean } = {}) {
    const match = await this.assertExists(matchId);
    const eventId = await matchRepository.addEvent({ ...input, matchId });
    const updated = await broadcastMatch(matchId); // reflects trigger-updated score
    const events = await matchRepository.events(matchId);
    const latest = events.find((e) => e.id === eventId);
    if (latest) emit.matchEvent(matchId, latest);

    if (opts.notify !== false && ['GOAL', 'POINT', 'WICKET'].includes(String(input.eventType))) {
      await notificationService.push({
        type: input.eventType === 'WICKET' ? 'WICKET' : 'GOAL',
        title: `${EVENT_TITLES[String(input.eventType)]} — ${updated?.home_team} ${updated?.home_score}-${updated?.away_score} ${updated?.away_team}`,
        tournamentId: match.tournament_id, matchId,
      });
    }
    return { event: latest, match: updated };
  },

  async removeEvent(matchId: number, eventId: number) {
    await this.assertExists(matchId);
    await matchRepository.deleteEvent(eventId); // trigger reverses score/stats
    return broadcastMatch(matchId);
  },

  async generateFixtures(tournamentId: number, format: 'ROUND_ROBIN' | 'KNOCKOUT') {
    if (format === 'ROUND_ROBIN') await matchRepository.generateRoundRobin(tournamentId);
    else await matchRepository.generateKnockout(tournamentId);
    return matchRepository.list({ tournamentId });
  },

  recalcStandings: (tournamentId: number) => matchRepository.recalcStandings(tournamentId),

  async assertExists(id: number) {
    const m = await matchRepository.findById(id);
    if (!m) throw AppError.notFound('Match not found');
    return m;
  },
};
