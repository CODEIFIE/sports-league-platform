import { AccessPayload } from '../utils/jwt.js';

export type Role = 'SUPER_ADMIN' | 'TOURNAMENT_ADMIN' | 'MATCH_OFFICIAL' | 'PUBLIC_VIEWER';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AccessPayload;
    }
  }
}

export interface ListQuery {
  page: number;
  limit: number;
  search?: string;
}
