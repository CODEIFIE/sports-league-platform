import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/db.js';
import { emit } from '../sockets/index.js';

export interface NotificationRow extends RowDataPacket {
  id: number;
  type: string;
  title: string;
  body: string | null;
  tournament_id: number | null;
  match_id: number | null;
  is_read: number;
  created_at: string;
}

export const notificationService = {
  /** Persist a notification and broadcast it over Socket.io. */
  async push(input: {
    type: string;
    title: string;
    body?: string;
    tournamentId?: number | null;
    matchId?: number | null;
  }) {
    const [res] = await pool.query<ResultSetHeader>(
      `INSERT INTO notifications (type, title, body, tournament_id, match_id)
       VALUES (:type, :title, :body, :tournamentId, :matchId)`,
      {
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        tournamentId: input.tournamentId ?? null,
        matchId: input.matchId ?? null,
      },
    );
    const payload = { id: res.insertId, ...input, createdAt: new Date().toISOString() };
    emit.notification(payload);
    return payload;
  },

  async list(limit = 30) {
    const [rows] = await pool.query<NotificationRow[]>(
      `SELECT * FROM notifications ORDER BY created_at DESC LIMIT :limit`,
      { limit },
    );
    return rows;
  },

  async markRead(id: number) {
    await pool.query(`UPDATE notifications SET is_read = 1 WHERE id = :id`, { id });
  },

  async markAllRead() {
    await pool.query(`UPDATE notifications SET is_read = 1 WHERE is_read = 0`);
  },
};
