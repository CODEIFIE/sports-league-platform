import { NextFunction, Request, Response } from 'express';
import { ZodTypeAny } from 'zod';

type Source = 'body' | 'query' | 'params';

/** Validates and coerces a request segment against a Zod schema. */
export function validate(schema: ZodTypeAny, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.parse(req[source]);
    // overwrite with the parsed/coerced value
    (req as unknown as Record<Source, unknown>)[source] = parsed;
    next();
  };
}
