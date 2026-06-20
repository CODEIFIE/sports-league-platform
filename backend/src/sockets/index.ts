import { Server as HttpServer } from 'node:http';
import { Server as IOServer, Socket } from 'socket.io';
import { env } from '../config/env.js';

let io: IOServer | null = null;

/** Initialise Socket.io and wire room join/leave for per-match live updates. */
export function initSockets(httpServer: HttpServer): IOServer {
  io = new IOServer(httpServer, {
    cors: { origin: env.clientOrigins, credentials: true },
  });

  io.on('connection', (socket: Socket) => {
    // Public scoreboard / live consoles join a per-match room.
    socket.on('match:join', (matchId: number) => socket.join(`match:${matchId}`));
    socket.on('match:leave', (matchId: number) => socket.leave(`match:${matchId}`));
    // Tournament-wide room (standings, notifications).
    socket.on('tournament:join', (id: number) => socket.join(`tournament:${id}`));
    socket.on('tournament:leave', (id: number) => socket.leave(`tournament:${id}`));
  });

  return io;
}

export function getIO(): IOServer {
  if (!io) throw new Error('Socket.io not initialised');
  return io;
}

/** Broadcast helpers used by services. */
export const emit = {
  matchUpdate: (matchId: number, payload: unknown) =>
    io?.to(`match:${matchId}`).emit('match:update', payload),
  matchEvent: (matchId: number, payload: unknown) =>
    io?.to(`match:${matchId}`).emit('match:event', payload),
  matchState: (matchId: number, payload: unknown) =>
    io?.to(`match:${matchId}`).emit('match:state', payload),
  standings: (tournamentId: number, payload: unknown) =>
    io?.to(`tournament:${tournamentId}`).emit('standings:update', payload),
  notification: (payload: unknown) => io?.emit('notification', payload),
};
