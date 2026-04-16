// Socket.io singleton para toda la app
import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io('/', {
      autoConnect: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function conectar() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function desconectar() {
  if (socket?.connected) {
    socket.disconnect();
  }
}
