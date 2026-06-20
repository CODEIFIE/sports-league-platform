import { Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/http.js';
import { pool } from '../config/db.js';

/** Global search across tournaments, teams, players, and matches. */
export const searchController = {
  search: asyncHandler(async (req: Request, res: Response) => {
    const term = String(req.query.q ?? '').trim();
    if (term.length < 2) return ok(res, { tournaments: [], teams: [], players: [], matches: [] });
    const like = `%${term}%`;

    const [[tournaments], [teams], [players], [matches]] = await Promise.all([
      pool.query<RowDataPacket[]>(
        `SELECT id, name, status FROM tournaments WHERE name LIKE :like LIMIT 6`, { like }),
      pool.query<RowDataPacket[]>(
        `SELECT id, name, tournament_id FROM teams WHERE name LIKE :like LIMIT 6`, { like }),
      pool.query<RowDataPacket[]>(
        `SELECT p.id, p.name, t.name AS team_name FROM players p
           JOIN teams t ON t.id = p.team_id WHERE p.name LIKE :like LIMIT 6`, { like }),
      pool.query<RowDataPacket[]>(
        `SELECT id, home_team, away_team, status FROM vw_live_matches
          WHERE home_team LIKE :like OR away_team LIKE :like LIMIT 6`, { like }),
    ]);

    ok(res, { tournaments, teams, players, matches });
  }),
};
