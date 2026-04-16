// ============================================================
// SERVIDOR — Poker Gitano (Express + Socket.io)
// ============================================================

const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const cors   = require('cors');
const { v4: uuidv4 } = require('uuid');

const {
  crearSala, unirseSala, salirSala,
  obtenerSala, infoLobby,
} = require('./roomManager');

const {
  crearEstadoInicial, iniciarRonda, hacerApuesta,
  jugarCarta, jugadoresActivos, construirVistaJugador,
} = require('./gameEngine');

const app    = express();
const server = http.createServer(app);

app.use(cors({ origin: '*' }));
app.use(express.json());

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// ── Estado en memoria ─────────────────────────────────────────────────────────
const estadosPartida = new Map();   // salaId → estado
const timeoutsSala   = new Map();   // salaId → timeoutId

// ── Helpers ───────────────────────────────────────────────────────────────────
function emitirEstado(salaId) {
  const sala   = obtenerSala(salaId);
  const estado = estadosPartida.get(salaId);
  if (!sala || !estado) return;
  for (const jugador of sala.jugadores) {
    const vista = construirVistaJugador(estado, jugador.id);
    io.to(jugador.socketId).emit('estado_actualizado', vista);
  }
}

function emitirLobby(salaId) {
  const sala = obtenerSala(salaId);
  if (!sala) return;
  io.to(salaId).emit('lobby_actualizado', infoLobby(sala));
}

/** Programa el avance automático a la siguiente ronda */
function programarSiguienteRonda(salaId, delay) {
  // Cancelar cualquier timeout previo para esta sala
  if (timeoutsSala.has(salaId)) {
    clearTimeout(timeoutsSala.get(salaId));
  }
  const tid = setTimeout(() => {
    timeoutsSala.delete(salaId);
    let e = estadosPartida.get(salaId);
    if (!e || e.fase === 'fin') return;
    if (e.fase === 'resultado' || e.fase === 'sorteo') {
      e = iniciarRonda(e);
      estadosPartida.set(salaId, e);
      emitirEstado(salaId);
    }
  }, delay);
  timeoutsSala.set(salaId, tid);
}

// ── REST ──────────────────────────────────────────────────────────────────────
app.post('/api/crear-sala', (req, res) => {
  const { nombre, modoJuego, vidasIniciales, maxJugadores } = req.body;
  const sala = crearSala({ nombre, modoJuego, vidasIniciales, maxJugadores });
  res.json({ salaId: sala.id });
});

app.get('/api/sala/:id', (req, res) => {
  const sala = obtenerSala(req.params.id);
  if (!sala) return res.status(404).json({ error: 'Sala no encontrada' });
  res.json(infoLobby(sala));
});

// ── Socket.io ─────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[+] Conectado: ${socket.id}`);

  // ── UNIRSE A SALA ──────────────────────────────────────────────────────────
  socket.on('unirse_sala', ({ salaId, jugadorId, nombre }) => {
    const id     = jugadorId || uuidv4();
    const result = unirseSala(salaId, { id, socketId: socket.id, nombre });

    if (result.error) { socket.emit('error_sala', result.error); return; }

    socket.join(salaId);
    socket.data.jugadorId = result.jugador.id;
    socket.data.salaId    = salaId;
    socket.data.nombre    = result.jugador.nombre;

    socket.emit('unido_sala', { jugadorId: result.jugador.id, salaId });
    emitirLobby(salaId);

    // Si ya hay una partida en curso, enviar estado al jugador recién conectado
    const estadoActual = estadosPartida.get(salaId?.toUpperCase());
    if (estadoActual) {
      const vista = construirVistaJugador(estadoActual, result.jugador.id);
      socket.emit('partida_iniciada');
      socket.emit('estado_actualizado', vista);
    }

    console.log(`  → ${result.jugador.nombre} se unió a ${salaId}`);
  });

  // ── INICIAR PARTIDA ────────────────────────────────────────────────────────
  socket.on('iniciar_partida', ({ salaId }) => {
    const sala = obtenerSala(salaId);
    if (!sala)                              return socket.emit('error_sala', 'Sala no encontrada');
    if (sala.anfitrion !== socket.data.jugadorId) return socket.emit('error_sala', 'Solo el anfitrión puede iniciar');
    if (sala.jugadores.length < 2)          return socket.emit('error_sala', 'Se necesitan al menos 2 jugadores');
    if (sala.fase !== 'lobby')              return socket.emit('error_sala', 'La partida ya está en curso');

    sala.fase = 'jugando';

    const config = {
      salaId,
      modoJuego:      sala.modoJuego,
      vidasIniciales: sala.vidasIniciales,
      jugadores:      sala.jugadores.map(j => ({ id: j.id, nombre: j.nombre })),
    };

    const estado = crearEstadoInicial(config);
    estadosPartida.set(salaId, estado);

    io.to(salaId).emit('partida_iniciada');
    emitirEstado(salaId);

    console.log(`  → Partida iniciada en ${salaId} (${sala.jugadores.length} jugadores) — fase: sorteo`);

    // Auto-avanzar del sorteo a la primera ronda tras 5 segundos
    programarSiguienteRonda(salaId, 5000);
  });

  // ── APOSTAR ───────────────────────────────────────────────────────────────
  socket.on('hacer_apuesta', ({ salaId, apuesta }) => {
    let estado = estadosPartida.get(salaId);
    if (!estado)               return socket.emit('error_juego', 'Partida no encontrada');
    if (estado.fase !== 'subasta') return socket.emit('error_juego', 'No estamos en fase de subasta');

    const resultado = hacerApuesta(estado, socket.data.jugadorId, apuesta);
    if (resultado.error) return socket.emit('error_juego', resultado.error);

    estadosPartida.set(salaId, resultado);
    emitirEstado(salaId);
  });

  // ── JUGAR CARTA ───────────────────────────────────────────────────────────
  socket.on('jugar_carta', ({ salaId, cartaId }) => {
    let estado = estadosPartida.get(salaId);
    if (!estado)               return socket.emit('error_juego', 'Partida no encontrada');
    if (estado.fase !== 'jugando') return socket.emit('error_juego', 'No estamos en fase de juego');

    const resultado = jugarCarta(estado, socket.data.jugadorId, cartaId);
    if (resultado.error) return socket.emit('error_juego', resultado.error);

    estadosPartida.set(salaId, resultado);
    emitirEstado(salaId);

    // Si la ronda terminó, auto-avanzar a la siguiente tras 4 segundos
    if (resultado.fase === 'resultado') {
      programarSiguienteRonda(salaId, 4000);
    }
    // Si la partida terminó, no programar nada
  });

  // ── NUEVA PARTIDA (reset al lobby) ────────────────────────────────────────
  socket.on('nueva_partida', ({ salaId }) => {
    const sala = obtenerSala(salaId);
    if (!sala) return;
    if (sala.anfitrion !== socket.data.jugadorId) return socket.emit('error_juego', 'Solo el anfitrión puede reiniciar');

    // Cancelar timeouts pendientes
    if (timeoutsSala.has(salaId)) {
      clearTimeout(timeoutsSala.get(salaId));
      timeoutsSala.delete(salaId);
    }

    sala.fase = 'lobby';
    estadosPartida.delete(salaId);
    emitirLobby(salaId);
  });

  // ── DESCONEXIÓN ───────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const { jugadorId, salaId, nombre } = socket.data;
    if (!jugadorId || !salaId) return;
    console.log(`[-] Desconectado: ${nombre} (sala ${salaId})`);
    salirSala(salaId, jugadorId);
    emitirLobby(salaId);
  });
});

// ── Inicio ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🃏 Servidor Poker Gitano en http://localhost:${PORT}`);
});
