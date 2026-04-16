import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SalaEspera from '../components/SalaEspera';
import Tapete from '../components/Tapete';
import Marcador from '../components/Marcador';
import useGameStore from '../store/gameStore';
import { conectar } from '../hooks/useSocket';

function generarId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function Sala() {
  const { salaId } = useParams();
  const navigate = useNavigate();

  const setJugadorId = useGameStore(s => s.setJugadorId);
  const setNombre    = useGameStore(s => s.setNombre);
  const setSalaId    = useGameStore(s => s.setSalaId);
  const setEstado    = useGameStore(s => s.setEstado);
  const setLobby     = useGameStore(s => s.setLobby);
  const setConectado = useGameStore(s => s.setConectado);
  const setEnPartida = useGameStore(s => s.setEnPartida);
  const setError     = useGameStore(s => s.setError);

  const enPartida = useGameStore(s => s.enPartida);
  const estado    = useGameStore(s => s.estado);
  const lobby     = useGameStore(s => s.lobby);
  const conectado = useGameStore(s => s.conectado);
  const error     = useGameStore(s => s.error);

  const iniciadoRef = useRef(false);

  useEffect(() => {
    if (iniciadoRef.current) return;
    iniciadoRef.current = true;

    let jugadorId = sessionStorage.getItem('lp_id') || generarId();
    let nombre    = sessionStorage.getItem('lp_nombre') || `Jugador ${jugadorId.slice(0, 4)}`;
    sessionStorage.setItem('lp_id', jugadorId);

    setJugadorId(jugadorId);
    setNombre(nombre);
    setSalaId(salaId.toUpperCase());

    const socket = conectar();

    const unirse = () => {
      setConectado(true);
      socket.emit('unirse_sala', {
        salaId: salaId.toUpperCase(),
        jugadorId,
        nombre,
      });
    };

    // Si ya estaba conectado al montar (ej: StrictMode doble render)
    if (socket.connected) unirse();

    socket.on('connect',            unirse);
    socket.on('unido_sala',         ({ jugadorId: id }) => setJugadorId(id));
    socket.on('lobby_actualizado',  (data) => { setLobby(data); setEnPartida(false); });
    socket.on('partida_iniciada',   () => setEnPartida(true));
    socket.on('estado_actualizado', (s) => { setEstado(s); if (s.fase !== 'lobby') setEnPartida(true); });
    socket.on('error_sala',         (msg) => setError(msg));
    socket.on('error_juego',        (msg) => {
      setError(msg);
      setTimeout(() => useGameStore.getState().clearError(), 3000);
    });
    socket.on('disconnect', () => setConectado(false));

    return () => socket.removeAllListeners();
  }, [salaId]);

  const vidasMax = lobby?.vidasIniciales ?? estado?.vidasIniciales ?? 3;

  // ── Pantalla de carga mientras llega el lobby ──────────────
  if (!lobby && !enPartida) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-dorado-600/20" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-dorado-400 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-3xl">🃏</div>
        </div>

        <div className="text-center">
          <h2 className="font-display text-dorado-300 text-2xl font-bold mb-1">
            {conectado ? 'Uniéndose a la sala…' : 'Conectando…'}
          </h2>
          <p className="text-gray-500 text-sm font-mono tracking-widest">{salaId?.toUpperCase()}</p>
        </div>

        {error && (
          <div className="bg-red-950/80 border border-red-700/60 text-red-300 px-6 py-3 rounded-xl text-sm max-w-sm text-center">
            ⚠️ {error}
            <br />
            <button
              className="mt-2 text-xs text-gray-400 underline"
              onClick={() => navigate('/')}
            >
              Volver al inicio
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Vista normal ────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-950/90 border border-red-700/60 text-red-300 px-5 py-3 rounded-xl text-sm font-medium shadow-xl animate-bounce-in">
          ⚠️ {error}
        </div>
      )}

      {!enPartida || !estado ? (
        <SalaEspera />
      ) : (
        <div className="flex h-screen overflow-hidden">
          <main className="flex-1 flex flex-col overflow-hidden">
            <Tapete />
          </main>
          <aside className="w-72 flex-shrink-0 border-l border-dorado-600/10 overflow-hidden">
            <Marcador vidasMax={vidasMax} />
          </aside>
        </div>
      )}
    </div>
  );
}
