import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/jwt.js';
import type { Role } from '../types/index.js';

/** Requires a valid access token; attaches req.user. */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw AppError.unauthorized('Missing access token');
  try {
    req.user = verifyAccessToken(header.slice(7));
    next();
  } catch {
    throw AppError.unauthorized('Invalid or expired token');
  }
}

/** Restricts a route to the given roles (RBAC). Use after authenticate. */
export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw AppError.unauthorized();
    if (!roles.includes(req.user.role as Role)) throw AppError.forbidden('Insufficient role');
    next();
  };
}
