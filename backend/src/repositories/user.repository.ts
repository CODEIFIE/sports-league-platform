import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../config/db.js';

export interface UserRow extends RowDataPacket {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  role_id: number;
  role_name: string;
  avatar_url: string | null;
  is_active: number;
}

const ROLE_IDS: Record<string, number> = {
  SUPER_ADMIN: 1,
  TOURNAMENT_ADMIN: 2,
  MATCH_OFFICIAL: 3,
  PUBLIC_VIEWER: 4,
};

export const userRepository = {
  async findByEmail(email: string): Promise<UserRow | undefined> {
    const [rows] = await pool.query<UserRow[]>(
      `SELECT u.*, r.name AS role_name
         FROM users u JOIN roles r ON r.id = u.role_id
        WHERE u.email = :email LIMIT 1`,
      { email },
    );
    return rows[0];
  },

  async findById(id: number): Promise<UserRow | undefined> {
    const [rows] = await pool.query<UserRow[]>(
      `SELECT u.*, r.name AS role_name
         FROM users u JOIN roles r ON r.id = u.role_id
        WHERE u.id = :id LIMIT 1`,
      { id },
    );
    return rows[0];
  },

  async create(input: {
    fullName: string;
    email: string;
    passwordHash: string;
    role: string;
  }): Promise<number> {
    const [res] = await pool.query<ResultSetHeader>(
      `INSERT INTO users (full_name, email, password_hash, role_id)
       VALUES (:fullName, :email, :passwordHash, :roleId)`,
      { ...input, roleId: ROLE_IDS[input.role] ?? 4 },
    );
    return res.insertId;
  },
};
