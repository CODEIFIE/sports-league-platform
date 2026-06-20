import { createServer } from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { pingDb } from './config/db.js';
import { initSockets } from './sockets/index.js';

async function bootstrap() {
  const app = createApp();
  const httpServer = createServer(app);
  initSockets(httpServer);

  try {
    await pingDb();
    console.log('✓ Database connected');
  } catch (err) {
    console.error('✗ Database connection failed:', (err as Error).message);
  }

  httpServer.listen(env.port, () => {
    console.log(`✓ API + Socket.io on http://localhost:${env.port}`);
  });
}

bootstrap();
