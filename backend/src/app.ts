import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'node:path';
import { env } from './config/env.js';
import { apiLimiter } from './middlewares/rateLimit.js';
import { errorHandler, notFound } from './middlewares/error.js';
import routes from './routes/index.js';

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // static uploads
  app.use('/uploads', express.static(path.resolve(process.cwd(), env.uploadDir)));

  // root route — keeps platform health probes (e.g. Hugging Face) happy
  app.get('/', (_req, res) =>
    res.json({ name: 'SportsLeague API', status: 'ok', docs: '/api/health' }));

  app.use('/api', apiLimiter, routes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
