import { io, Socket } from 'socket.io-client';
import { API_BASE } from './api';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    // same-origin (dev proxy) unless VITE_API_URL points at a separate backend
    socket = io(API_BASE || '/', { transports: ['websocket', 'polling'], autoConnect: true });
  }
  return socket;
}
