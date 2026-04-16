// Socket.io singleton para toda la app
import { io } from 'socket.io-client';

let socket = null;

/**
 * IMPORTANTE: 
 * En producción (Render), usará la variable VITE_API_URL que configuramos.
 * En local (tu PC), usará el puerto 3000 por defecto.
 */
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function getSocket() {
  if (!socket) {
    // Si la URL termina en '/', se la quitamos para evitar errores
    const cleanUrl = SOCKET_URL.endsWith('/') ? SOCKET_URL.slice(0, -1) : SOCKET_URL;

    socket = io(cleanUrl, {
      autoConnect: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      // Forzamos solo websocket para evitar problemas de CORS/Polling en Render
      transports: ['websocket'],
    });

    // Logs para que veas en la consola (F12) a dónde se está intentando conectar
    socket.on('connect', () => console.log('✅ Conectado al servidor:', cleanUrl));
    socket.on('connect_error', (err) => console.error('❌ Error de conexión:', err.message));
  }
  return socket;
}

export function conectar() {
  const s = getSocket();
  if (!s.connected) {
    console.log('Iniciando conexión...');
    s.connect();
  }
  return s;
}

export function desconectar() {
  if (socket?.connected) {
    socket.disconnect();
    console.log('Socket desconectado manualmente');
  }
}