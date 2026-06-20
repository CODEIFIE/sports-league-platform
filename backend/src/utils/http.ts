import { Response } from 'express';

export function ok<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ success: true, data });
}

export function created<T>(res: Response, data: T) {
  return res.status(201).json({ success: true, data });
}

export function paginated<T>(
  res: Response,
  items: T[],
  total: number,
  page: number,
  limit: number,
) {
  return res.json({
    success: true,
    data: items,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
  });
}
