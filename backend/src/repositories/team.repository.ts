import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../config/db.js';

export interface TeamRow extends RowDataPacket {
  id: number;
  tournament_id: number;
  name: string;
  logo_url: string | null;
  coach: string | null;
  captain: string | null;
  contact: string | null;
  player_count: number;
}

export const teamRepository = {
  async list(q: { page: number; limit: number; search?: string; tournamentId?: number }) {
    const offset = (q.page - 1) * q.limit;
    const where: string[] = [];
    const params: Record<string, any> = { limit: q.limit, offset };
    if (q.search) { where.push(`t.name LIKE :search`); params.search = `%${q.search}%`; }
    if (q.tournamentId) { where.push(`t.tournament_id = :tournamentId`); params.tournamentId = q.tournamentId; }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await pool.query<TeamRow[]>(
      `SELECT t.*, (SELECT COUNT(*) FROM players p WHERE p.team_id = t.id) AS player_count
         FROM teams t ${clause} ORDER BY t.id DESC LIMIT :limit OFFSET :offset`,
      params,
    );
    const [count] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM teams t ${clause}`,
      params,
    );
    return { rows, total: Number(count[0].total) };
  },

  async findById(id: number): Promise<TeamRow | undefined> {
    const [rows] = await pool.query<TeamRow[]>(
      `SELECT t.*, (SELECT COUNT(*) FROM players p WHERE p.team_id = t.id) AS player_count
         FROM teams t WHERE t.id = :id`,
      { id },
    );
    return rows[0];
  },

  async create(input: Record<string, any>): Promise<number> {
    const [res] = await pool.query<ResultSetHeader>(
      `INSERT INTO teams (tournament_id, name, coach, captain, contact, logo_url)
       VALUES (:tournamentId, :name, :coach, :captain, :contact, :logoUrl)`,
      {
        tournamentId: input.tournamentId,
        name: input.name,
        coach: input.coach ?? null,
        captain: input.captain ?? null,
        contact: input.contact ?? null,
        logoUrl: input.logoUrl ?? null,
      },
    );
    return res.insertId;
  },

  async update(id: number, input: Record<string, any>): Promise<void> {
    const map: Record<string, string> = {
      name: 'name', coach: 'coach', captain: 'captain', contact: 'contact', logoUrl: 'logo_url',
    };
    const sets: string[] = [];
    const params: Record<string, any> = { id };
    for (const [k, col] of Object.entries(map)) {
      if (input[k] !== undefined) { sets.push(`${col} = :${k}`); params[k] = input[k] ?? null; }
    }
    if (!sets.length) return;
    await pool.query(`UPDATE teams SET ${sets.join(', ')} WHERE id = :id`, params);
  },

  async remove(id: number): Promise<void> {
    await pool.query(`DELETE FROM teams WHERE id = :id`, { id });
  },
};
