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

// CONFIGURACIÓN DE CORS REFORZADA
app.use(cors({ origin: '*' }));
app.use(express.json());

const io = new Server(server, {
  cors: { 
    origin: '*', 
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'] // Permitimos ambos para mayor compatibilidad
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

function programarSiguienteRonda(salaId, delay) {
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
// Ruta de salud para Render
app.get('/', (req, res) => res.send('Servidor de Poker Gitano está ONLINE ✅'));

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

    const estadoActual = estadosPartida.get(salaId?.toUpperCase());
    if (estadoActual) {
      const vista = construirVistaJugador(estadoActual, result.jugador.id);
      socket.emit('partida_iniciada');
      socket.emit('estado_actualizado', vista);
    }
  });

  socket.on('iniciar_partida', ({ salaId }) => {
    const sala = obtenerSala(salaId);
    if (!sala) return socket.emit('error_sala', 'Sala no encontrada');
    if (sala.anfitrion !== socket.data.jugadorId) return socket.emit('error_sala', 'Solo el anfitrión puede iniciar');
    
    sala.fase = 'jugando';
    const config = {
      salaId,
      modoJuego: sala.modoJuego,
      vidasIniciales: sala.vidasIniciales,
      jugadores: sala.jugadores.map(j => ({ id: j.id, nombre: j.nombre })),
    };

    const estado = crearEstadoInicial(config);
    estadosPartida.set(salaId, estado);
    io.to(salaId).emit('partida_iniciada');
    emitirEstado(salaId);
    programarSiguienteRonda(salaId, 5000);
  });

  socket.on('hacer_apuesta', ({ salaId, apuesta }) => {
    let estado = estadosPartida.get(salaId);
    if (!estado) return;
    const resultado = hacerApuesta(estado, socket.data.jugadorId, apuesta);
    if (resultado.error) return socket.emit('error_juego', resultado.error);
    estadosPartida.set(salaId, resultado);
    emitirEstado(salaId);
  });

  socket.on('jugar_carta', ({ salaId, cartaId }) => {
    let estado = estadosPartida.get(salaId);
    if (!estado) return;
    const resultado = jugarCarta(estado, socket.data.jugadorId, cartaId);
    if (resultado.error) return socket.emit('error_juego', resultado.error);
    estadosPartida.set(salaId, resultado);
    emitirEstado(salaId);
    if (resultado.fase === 'resultado') programarSiguienteRonda(salaId, 4000);
  });

  socket.on('disconnect', () => {
    const { jugadorId, salaId } = socket.data;
    if (jugadorId && salaId) {
      salirSala(salaId, jugadorId);
      emitirLobby(salaId);
    }
  });
});

// ESCUCHA DEL PUERTO PARA PRODUCCIÓN
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🃏 Servidor listo en puerto ${PORT}`);
});