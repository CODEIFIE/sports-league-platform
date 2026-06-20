import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../config/db.js';
import type { CreateTournamentInput, ListQueryInput } from '../validators/tournament.validator.js';

export interface TournamentRow extends RowDataPacket {
  id: number;
  name: string;
  sport: string;
  sport_code: string;
  format: string;
  status: string;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  team_count: number;
  match_count: number;
  completed_count: number;
  live_count: number;
}

export const tournamentRepository = {
  async list(q: ListQueryInput & { status?: string; sportId?: number }) {
    const offset = (q.page - 1) * q.limit;
    const where: string[] = [];
    const params: Record<string, any> = { limit: q.limit, offset };
    if (q.search) { where.push(`name LIKE :search`); params.search = `%${q.search}%`; }
    if (q.status) { where.push(`status = :status`); params.status = q.status; }
    if (q.sportId) { where.push(`sport_code = (SELECT code FROM sports WHERE id = :sportId)`); params.sportId = q.sportId; }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await pool.query<TournamentRow[]>(
      `SELECT * FROM vw_tournament_summary ${clause} ORDER BY id DESC LIMIT :limit OFFSET :offset`,
      params,
    );
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM vw_tournament_summary ${clause}`,
      params,
    );
    return { rows, total: Number(countRows[0].total) };
  },

  async findById(id: number): Promise<TournamentRow | undefined> {
    const [rows] = await pool.query<TournamentRow[]>(
      `SELECT * FROM vw_tournament_summary WHERE id = :id`,
      { id },
    );
    return rows[0];
  },

  async create(input: CreateTournamentInput, userId?: number): Promise<number> {
    const [res] = await pool.query<ResultSetHeader>(
      `INSERT INTO tournaments (name, sport_id, format, status, location, start_date, end_date, created_by)
       VALUES (:name, :sportId, :format, :status, :location, :startDate, :endDate, :userId)`,
      {
        name: input.name,
        sportId: input.sportId,
        format: input.format,
        status: input.status,
        location: input.location ?? null,
        startDate: input.startDate || null,
        endDate: input.endDate || null,
        userId: userId ?? null,
      },
    );
    return res.insertId;
  },

  async update(id: number, input: Record<string, any>): Promise<void> {
    const map: Record<string, string> = {
      name: 'name', sportId: 'sport_id', format: 'format', status: 'status',
      location: 'location', startDate: 'start_date', endDate: 'end_date',
    };
    const sets: string[] = [];
    const params: Record<string, any> = { id };
    for (const [key, col] of Object.entries(map)) {
      if (input[key] !== undefined) { sets.push(`${col} = :${key}`); params[key] = input[key] || null; }
    }
    if (!sets.length) return;
    await pool.query(`UPDATE tournaments SET ${sets.join(', ')} WHERE id = :id`, params);
  },

  async remove(id: number): Promise<void> {
    await pool.query(`DELETE FROM tournaments WHERE id = :id`, { id });
  },

  async listSports() {
    const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM sports ORDER BY id`);
    return rows;
  },
};
