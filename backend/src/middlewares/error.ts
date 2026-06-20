import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ success: false, error: 'Route not found' });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.flatten(),
    });
  }
  if (err instanceof AppError) {
    return res.status(err.status).json({
      success: false,
      error: err.message,
      details: err.details,
    });
  }
  const e = err as { code?: string; message?: string };
  if (e.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ success: false, error: 'Duplicate entry' });
  }
  console.error('[unhandled]', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
}
