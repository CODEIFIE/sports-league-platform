import { RowDataPacket } from 'mysql2';
import { pool } from '../config/db.js';

interface TokenRow extends RowDataPacket {
  id: number;
  user_id: number;
  revoked: number;
}

export const tokenRepository = {
  async store(userId: number, tokenHash: string, expiresAt: Date): Promise<void> {
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (:userId, :tokenHash, :expiresAt)`,
      { userId, tokenHash, expiresAt },
    );
  },

  async findValid(tokenHash: string): Promise<TokenRow | undefined> {
    const [rows] = await pool.query<TokenRow[]>(
      `SELECT * FROM refresh_tokens
        WHERE token_hash = :tokenHash AND revoked = 0 AND expires_at > NOW() LIMIT 1`,
      { tokenHash },
    );
    return rows[0];
  },

  async revoke(tokenHash: string): Promise<void> {
    await pool.query(`UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = :tokenHash`, {
      tokenHash,
    });
  },

  async revokeAllForUser(userId: number): Promise<void> {
    await pool.query(`UPDATE refresh_tokens SET revoked = 1 WHERE user_id = :userId`, { userId });
  },
};
