import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../config/db.js';

export interface MatchRow extends RowDataPacket {
  id: number;
  tournament_id: number;
  tournament_name: string;
  sport_code: string;
  score_label: string;
  status: string;
  scheduled_at: string | null;
  venue: string | null;
  minute_clock: number;
  home_team_id: number | null;
  home_team: string | null;
  home_logo: string | null;
  away_team_id: number | null;
  away_team: string | null;
  away_logo: string | null;
  home_score: number;
  away_score: number;
  home_wickets: number | null;
  away_wickets: number | null;
  home_overs: number | null;
  away_overs: number | null;
}

export interface EventRow extends RowDataPacket {
  id: number;
  event_type: string;
  value: number;
  minute: number | null;
  note: string | null;
  created_at: string;
  team_name: string | null;
  player_name: string | null;
}

export const matchRepository = {
  async list(filter: { tournamentId?: number; status?: string }) {
    const where: string[] = [];
    const params: Record<string, any> = {};
    if (filter.tournamentId) { where.push(`tournament_id = :tournamentId`); params.tournamentId = filter.tournamentId; }
    if (filter.status) { where.push(`status = :status`); params.status = filter.status; }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [rows] = await pool.query<MatchRow[]>(
      `SELECT * FROM vw_live_matches ${clause} ORDER BY COALESCE(scheduled_at, '9999-12-31'), id`,
      params,
    );
    return rows;
  },

  async findById(id: number): Promise<MatchRow | undefined> {
    const [rows] = await pool.query<MatchRow[]>(`SELECT * FROM vw_live_matches WHERE id = :id`, { id });
    return rows[0];
  },

  async events(matchId: number): Promise<EventRow[]> {
    const [rows] = await pool.query<EventRow[]>(
      `SELECT e.id, e.event_type, e.value, e.minute, e.note, e.created_at,
              tm.name AS team_name, p.name AS player_name
         FROM events e
         LEFT JOIN teams tm ON tm.id = e.team_id
         LEFT JOIN players p ON p.id = e.player_id
        WHERE e.match_id = :matchId ORDER BY e.minute, e.id`,
      { matchId },
    );
    return rows;
  },

  async create(input: Record<string, any>): Promise<number> {
    const [res] = await pool.query<ResultSetHeader>(
      `INSERT INTO matches (tournament_id, home_team_id, away_team_id, round_no, bracket_stage, scheduled_at, venue)
       VALUES (:tournamentId, :homeTeamId, :awayTeamId, :roundNo, :bracketStage, :scheduledAt, :venue)`,
      {
        tournamentId: input.tournamentId,
        homeTeamId: input.homeTeamId ?? null,
        awayTeamId: input.awayTeamId ?? null,
        roundNo: input.roundNo ?? null,
        bracketStage: input.bracketStage ?? null,
        scheduledAt: input.scheduledAt || null,
        venue: input.venue ?? null,
      },
    );
    return res.insertId;
  },

  async updateStatus(id: number, status: string, winnerTeamId?: number | null): Promise<void> {
    await pool.query(
      `UPDATE matches SET status = :status, winner_team_id = :winnerTeamId WHERE id = :id`,
      { id, status, winnerTeamId: winnerTeamId ?? null },
    );
  },

  async updateSchedule(id: number, scheduledAt: string | null, venue: string | null): Promise<void> {
    await pool.query(`UPDATE matches SET scheduled_at = :scheduledAt, venue = :venue WHERE id = :id`,
      { id, scheduledAt: scheduledAt || null, venue: venue ?? null });
  },

  async setClock(id: number, seconds: number): Promise<void> {
    await pool.query(`UPDATE matches SET minute_clock = :seconds WHERE id = :id`, { id, seconds });
  },

  async addEvent(input: Record<string, any>): Promise<number> {
    // trigger trg_event_after_insert updates score + player_stats automatically
    const [res] = await pool.query<ResultSetHeader>(
      `INSERT INTO events (match_id, team_id, player_id, event_type, value, minute, note)
       VALUES (:matchId, :teamId, :playerId, :eventType, :value, :minute, :note)`,
      {
        matchId: input.matchId,
        teamId: input.teamId ?? null,
        playerId: input.playerId ?? null,
        eventType: input.eventType,
        value: input.value ?? 1,
        minute: input.minute ?? null,
        note: input.note ?? null,
      },
    );
    return res.insertId;
  },

  async deleteEvent(eventId: number): Promise<void> {
    await pool.query(`DELETE FROM events WHERE id = :eventId`, { eventId });
  },

  /** Persist the full post-match report (JSON) + man of the match. */
  async saveSummary(matchId: number, summaryJson: string, momPlayerId: number | null): Promise<void> {
    await pool.query(
      `UPDATE matches SET summary_json = :summaryJson, mom_player_id = :momPlayerId WHERE id = :matchId`,
      { matchId, summaryJson, momPlayerId },
    );
  },

  async getSummary(matchId: number): Promise<{ summary: any; momName: string | null } | null> {
    const [rows]: any = await pool.query(
      `SELECT m.summary_json, p.name AS mom_name
         FROM matches m LEFT JOIN players p ON p.id = m.mom_player_id
        WHERE m.id = :matchId`,
      { matchId },
    );
    if (!rows[0]) return null;
    return {
      summary: rows[0].summary_json ? JSON.parse(rows[0].summary_json) : null,
      momName: rows[0].mom_name ?? null,
    };
  },

  // ---- stored procedure wrappers -------------------------------------------
  async generateRoundRobin(tournamentId: number): Promise<void> {
    await pool.query(`CALL sp_generate_round_robin(:tournamentId)`, { tournamentId });
  },
  async generateKnockout(tournamentId: number): Promise<void> {
    await pool.query(`CALL sp_generate_knockout(:tournamentId)`, { tournamentId });
  },
  async recalcStandings(tournamentId: number): Promise<void> {
    await pool.query(`CALL sp_recalculate_standings(:tournamentId)`, { tournamentId });
  },
};
