// ============================================================
// GESTOR DE SALAS — La Podrida
// ============================================================

const { v4: uuidv4 } = require('uuid');

const salas = new Map(); // salaId → sala

function generarCodigoSala() {
  // Código legible de 6 caracteres (sin O,0,I,1 para evitar confusiones)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let codigo = '';
  for (let i = 0; i < 6; i++) {
    codigo += chars[Math.floor(Math.random() * chars.length)];
  }
  return codigo;
}

function crearSala(config) {
  let codigo;
  do {
    codigo = generarCodigoSala();
  } while (salas.has(codigo));

  const sala = {
    id: codigo,
    nombre: config.nombre || `Sala ${codigo}`,
    anfitrion: null,
    jugadores: [],
    maxJugadores: Math.min(8, Math.max(2, config.maxJugadores || 6)),
    modoJuego: config.modoJuego || 'normal',
    vidasIniciales: Math.min(5, Math.max(1, config.vidasIniciales || 3)),
    estado: null, // Se rellenará al iniciar el juego
    fase: 'lobby', // 'lobby' | 'jugando' | 'terminada'
    creadaEn: Date.now(),
  };

  salas.set(codigo, sala);
  return sala;
}

function unirseSala(salaId, jugador) {
  const sala = salas.get(salaId.toUpperCase());
  if (!sala) return { error: 'Sala no encontrada' };
  if (sala.fase !== 'lobby') return { error: 'La partida ya ha comenzado' };
  if (sala.jugadores.length >= sala.maxJugadores) return { error: 'La sala está llena' };
  if (sala.jugadores.find(j => j.id === jugador.id)) return { error: 'Ya estás en esta sala' };

  const nuevoJugador = {
    id: jugador.id || uuidv4(),
    socketId: jugador.socketId,
    nombre: jugador.nombre || `Jugador ${sala.jugadores.length + 1}`,
    listo: false,
  };

  sala.jugadores.push(nuevoJugador);

  if (!sala.anfitrion) {
    sala.anfitrion = nuevoJugador.id;
  }

  return { sala, jugador: nuevoJugador };
}

function salirSala(salaId, jugadorId) {
  const sala = salas.get(salaId);
  if (!sala) return;

  sala.jugadores = sala.jugadores.filter(j => j.id !== jugadorId);

  // Si el anfitrión se va, el siguiente pasa a ser anfitrión
  if (sala.anfitrion === jugadorId && sala.jugadores.length > 0) {
    sala.anfitrion = sala.jugadores[0].id;
  }

  // Limpiar sala vacía
  if (sala.jugadores.length === 0) {
    salas.delete(salaId);
  }

  return sala;
}

function actualizarSocket(jugadorId, nuevoSocketId) {
  for (const sala of salas.values()) {
    const jugador = sala.jugadores.find(j => j.id === jugadorId);
    if (jugador) {
      jugador.socketId = nuevoSocketId;
      return sala;
    }
  }
  return null;
}

function obtenerSala(salaId) {
  return salas.get(salaId?.toUpperCase()) || null;
}

function infoLobby(sala) {
  return {
    id: sala.id,
    nombre: sala.nombre,
    modoJuego: sala.modoJuego,
    vidasIniciales: sala.vidasIniciales,
    maxJugadores: sala.maxJugadores,
    jugadores: sala.jugadores.map(j => ({
      id: j.id,
      nombre: j.nombre,
      esAnfitrion: j.id === sala.anfitrion,
    })),
    fase: sala.fase,
    anfitrion: sala.anfitrion,
  };
}

module.exports = {
  crearSala,
  unirseSala,
  salirSala,
  actualizarSocket,
  obtenerSala,
  infoLobby,
};
