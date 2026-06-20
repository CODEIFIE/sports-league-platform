import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../config/db.js';

export interface PlayerRow extends RowDataPacket {
  id: number;
  team_id: number;
  team_name: string;
  name: string;
  jersey_number: number | null;
  position: string | null;
  age: number | null;
  photo_url: string | null;
}

export const playerRepository = {
  async list(q: {
    page: number; limit: number; search?: string; teamId?: number; tournamentId?: number;
  }) {
    const offset = (q.page - 1) * q.limit;
    const where: string[] = [];
    const params: Record<string, any> = { limit: q.limit, offset };
    if (q.search) { where.push(`p.name LIKE :search`); params.search = `%${q.search}%`; }
    if (q.teamId) { where.push(`p.team_id = :teamId`); params.teamId = q.teamId; }
    if (q.tournamentId) { where.push(`t.tournament_id = :tournamentId`); params.tournamentId = q.tournamentId; }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await pool.query<PlayerRow[]>(
      `SELECT p.*, t.name AS team_name
         FROM players p JOIN teams t ON t.id = p.team_id
         ${clause} ORDER BY p.id DESC LIMIT :limit OFFSET :offset`,
      params,
    );
    const [count] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM players p JOIN teams t ON t.id = p.team_id ${clause}`,
      params,
    );
    return { rows, total: Number(count[0].total) };
  },

  async findById(id: number): Promise<PlayerRow | undefined> {
    const [rows] = await pool.query<PlayerRow[]>(
      `SELECT p.*, t.name AS team_name FROM players p JOIN teams t ON t.id = p.team_id WHERE p.id = :id`,
      { id },
    );
    return rows[0];
  },

  async create(input: Record<string, any>): Promise<number> {
    const [res] = await pool.query<ResultSetHeader>(
      `INSERT INTO players (team_id, name, jersey_number, position, age, photo_url)
       VALUES (:teamId, :name, :jerseyNumber, :position, :age, :photoUrl)`,
      {
        teamId: input.teamId,
        name: input.name,
        jerseyNumber: input.jerseyNumber ?? null,
        position: input.position ?? null,
        age: input.age ?? null,
        photoUrl: input.photoUrl ?? null,
      },
    );
    return res.insertId;
  },

  async update(id: number, input: Record<string, any>): Promise<void> {
    const map: Record<string, string> = {
      teamId: 'team_id', name: 'name', jerseyNumber: 'jersey_number',
      position: 'position', age: 'age', photoUrl: 'photo_url',
    };
    const sets: string[] = [];
    const params: Record<string, any> = { id };
    for (const [k, col] of Object.entries(map)) {
      if (input[k] !== undefined) { sets.push(`${col} = :${k}`); params[k] = input[k] ?? null; }
    }
    if (!sets.length) return;
    await pool.query(`UPDATE players SET ${sets.join(', ')} WHERE id = :id`, params);
  },

  async remove(id: number): Promise<void> {
    await pool.query(`DELETE FROM players WHERE id = :id`, { id });
  },
};
