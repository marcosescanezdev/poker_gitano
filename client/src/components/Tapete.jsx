import { useEffect, useRef, useState } from 'react';
import Carta from './Carta';
import ManoCarta from './ManoCarta';
import ModalApuesta from './ModalApuesta';
import useGameStore from '../store/gameStore';
import { getSocket } from '../hooks/useSocket';

// ── Sorteo inicial ────────────────────────────────────────────────────────────
function PanelSorteo({ estado }) {
  const { sorteo = [], dealerIdx, jugadores } = estado;
  const [reveladas, setReveladas] = useState(0);
  const [mostrarGanador, setMostrarGanador] = useState(false);

  useEffect(() => {
    setReveladas(0);
    setMostrarGanador(false);
    // Revelar una carta cada 700ms
    let i = 0;
    const intervalId = setInterval(() => {
      i++;
      setReveladas(i);
      if (i >= sorteo.length) {
        clearInterval(intervalId);
        setTimeout(() => setMostrarGanador(true), 400);
      }
    }, 700);
    return () => clearInterval(intervalId);
  }, [sorteo.length]);

  const dealer    = sorteo[dealerIdx];
  const primerIdx = (dealerIdx + 1) % jugadores.length;
  const primero   = jugadores[primerIdx];

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="panel-dorado p-8 w-full max-w-lg mx-4 animate-bounce-in text-center">
        {/* Título */}
        <div className="mb-6">
          <div className="text-4xl mb-2">🎲</div>
          <h2 className="font-bold text-dorado-300 text-2xl mb-1" style={{ fontFamily: '"Cinzel", serif' }}>
            Sorteo del Dealer
          </h2>
          <p className="text-gray-400 text-sm">Cada jugador roba una carta al azar · La más alta decide</p>
        </div>

        {/* Cartas del sorteo */}
        <div className="flex gap-4 justify-center flex-wrap mb-6">
          {sorteo.map((entrada, i) => {
            const esDealer = i === dealerIdx;
            const revelada = i < reveladas;
            return (
              <div key={entrada.jugadorId} className="flex flex-col items-center gap-2">
                <div
                  style={{
                    transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1)',
                    transform: revelada ? 'rotateY(0deg)' : 'rotateY(90deg)',
                    filter: mostrarGanador && esDealer
                      ? 'drop-shadow(0 0 20px rgba(251,191,36,0.9))'
                      : 'none',
                  }}
                >
                  {revelada
                    ? <Carta carta={entrada.carta} tamaño="md" />
                    : <Carta carta={{ esReverso: true }} tamaño="md" />
                  }
                </div>
                <div className="text-xs text-center">
                  <span className={`font-semibold ${esDealer && mostrarGanador ? 'text-dorado-300' : 'text-gray-400'}`}>
                    {entrada.nombre}
                  </span>
                  {esDealer && mostrarGanador && (
                    <div className="text-dorado-400 font-bold animate-bounce-in">👑 Dealer</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Anuncio */}
        {mostrarGanador && (
          <div className="animate-bounce-in space-y-2">
            <div className="text-green-400 font-semibold text-sm">
              {dealer?.nombre} saca el <strong>{dealer?.carta?.valor}</strong> — ¡es el dealer!
            </div>
            <div className="text-dorado-300 font-bold text-lg">
              🎮 {primero?.nombre} empieza la primera ronda
            </div>
            <div className="text-gray-500 text-xs mt-3 animate-pulse">
              Comenzando en unos segundos…
            </div>
          </div>
        )}

        {!mostrarGanador && (
          <p className="text-gray-500 text-sm animate-pulse">Revelando cartas…</p>
        )}
      </div>
    </div>
  );
}

// ── Panel de resultado de ronda ───────────────────────────────────────────────
function PanelResultado({ estado, esAnfitrion, salaId }) {
  const [cuenta, setCuenta] = useState(4);

  useEffect(() => {
    setCuenta(4);
    if (estado.fase === 'fin') return; // no contar en fin
    const tid = setInterval(() => setCuenta(c => c - 1), 1000);
    return () => clearInterval(tid);
  }, [estado.fase]);

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="panel-dorado p-6 w-full max-w-md mx-4 animate-bounce-in">
        <h2 className="font-bold text-dorado-300 text-2xl text-center mb-5"
          style={{ fontFamily: '"Cinzel", serif' }}>
          {estado.fase === 'fin' ? '🏆 Partida Terminada' : '📊 Fin de Ronda'}
        </h2>

        <div className="space-y-2 mb-5">
          {estado.jugadores.map(j => {
            const exito = j.apuesta === j.bazasGanadas;
            return (
              <div key={j.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                  j.eliminado   ? 'opacity-35' :
                  exito         ? 'bg-green-950/40 border border-green-700/30' :
                                  'bg-red-950/30 border border-red-800/20'
                }`}>
                <span className="text-2xl">{exito ? '✅' : '💀'}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-sm truncate">{j.nombre}</div>
                  <div className="text-xs text-gray-400">
                    Apostó <strong className="text-dorado-300">{j.apuesta ?? '?'}</strong>
                    {' · '}Hizo <strong className={exito ? 'text-green-400' : 'text-red-400'}>{j.bazasGanadas ?? 0}</strong>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-gray-500">Vidas</div>
                  <div className="font-bold text-red-300 text-sm">{j.vidas} ❤️</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Ganador */}
        {estado.fase === 'fin' && estado.ganador && (
          <div className="text-center py-4 rounded-xl mb-4"
            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}>
            <div className="text-4xl mb-1">🏆</div>
            <p className="text-dorado-300 font-bold text-xl" style={{ fontFamily: '"Cinzel", serif' }}>
              {estado.jugadores.find(j => j.id === estado.ganador)?.nombre} GANA
            </p>
          </div>
        )}

        {/* Auto-avance o botones de fin */}
        {estado.fase === 'fin' ? (
          esAnfitrion && (
            <button className="btn-secundario w-full"
              onClick={() => getSocket().emit('nueva_partida', { salaId })}>
              Nueva partida
            </button>
          )
        ) : (
          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
            <div className="w-6 h-6 rounded-full border-2 border-dorado-600/40 border-t-dorado-400 animate-spin" />
            Siguiente ronda en <span className="text-dorado-400 font-bold w-4 text-center">{cuenta}</span>s…
          </div>
        )}
      </div>
    </div>
  );
}

// ── Oponente individual ───────────────────────────────────────────────────────
function Oponente({ jugador, esTurno, esIndio }) {
  const mano = jugador.mano || [];
  return (
    <div className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-2xl transition-all duration-300 ${
      jugador.eliminado ? 'opacity-25' : esTurno ? 'turno-activo bg-dorado-500/8' : ''
    }`} style={{ minWidth: 80 }}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
        esTurno ? 'border-dorado-400 bg-dorado-500/20' : 'border-white/15 bg-white/8'
      }`}>
        {jugador.nombre[0].toUpperCase()}
      </div>
      <span className="text-xs text-gray-300 font-medium truncate max-w-[72px] text-center">{jugador.nombre}</span>
      <span className="text-xs">
        {Array.from({ length: Math.max(0, jugador.vidas) }).map((_, i) => (
          <span key={i} style={{ fontSize: 9 }}>❤️</span>
        ))}
      </span>

      <div className="flex gap-0.5 items-end">
        {mano.length === 0
          ? <span className="text-gray-700 text-xs italic">—</span>
          : esIndio
          ? mano.map((c, i) => <Carta key={i} carta={c} tamaño="xs" esPropia={false} />)
          : mano.map((_, i) => (
              <div key={i} style={{ marginLeft: i > 0 ? -14 : 0 }}>
                <Carta carta={{ esReverso: true }} tamaño="xs" />
              </div>
            ))
        }
      </div>

      {esTurno && <span className="text-dorado-400 text-xs font-bold animate-pulse">▶ Su turno</span>}
      {jugador.apuesta !== null && jugador.apuesta !== undefined && !esTurno && (
        <span className="text-gray-500 text-xs">
          <span className="text-dorado-400 font-bold">{jugador.apuesta}</span>
          {' / '}
          <span className={jugador.bazasGanadas === jugador.apuesta ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
            {jugador.bazasGanadas}
          </span>
        </span>
      )}
    </div>
  );
}

// ── Carta jugada en la mesa ────────────────────────────────────────────────────
function CartaMesa({ jugada, esGanadora, index }) {
  return (
    <div className="flex flex-col items-center gap-2"
      style={{ animation: `cardDeal 0.35s cubic-bezier(0.22,1,0.36,1) ${index * 60}ms both` }}>
      <div className="transition-all duration-500"
        style={esGanadora ? { transform: 'scale(1.12)', filter: 'drop-shadow(0 0 18px rgba(251,191,36,0.85))' } : {}}>
        <Carta carta={jugada.carta} tamaño="md" enMesa />
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-xs text-gray-300 font-medium">{jugada.nombre}</span>
        {esGanadora && (
          <span className="text-dorado-400 text-xs font-bold animate-bounce-in">👑 Gana</span>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TAPETE PRINCIPAL
// ═════════════════════════════════════════════════════════════════════════════
export default function Tapete() {
  const estado      = useGameStore(s => s.estado);
  const jugadorId   = useGameStore(s => s.jugadorId);
  const salaId      = useGameStore(s => s.salaId);
  const esAnfitrion = useGameStore(s => s.esAnfitrion);
  const logRef      = useRef(null);

  // ── Baza retenida en pantalla por 1.8s ──────────────────────────────────
  const [bazaMostrada, setBazaMostrada] = useState([]);
  const [ganadorBaza,  setGanadorBaza]  = useState(null);
  const timerRef       = useRef(null);
  const prevBazaLenRef = useRef(0);
  const prevBazaGanRef = useRef({});

  useEffect(() => {
    if (!estado) return;
    const activos    = estado.jugadores.filter(j => !j.eliminado);
    const bazaActual = estado.bazaActual || [];

    if (bazaActual.length > 0) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setBazaMostrada(bazaActual.map(b => ({
        ...b,
        nombre: estado.jugadores.find(j => j.id === b.jugadorId)?.nombre || '?',
      })));
      setGanadorBaza(null);

    } else if (prevBazaLenRef.current === activos.length && activos.length > 0) {
      // Baza resuelta — detectar ganador por variación de bazasGanadas
      let ganadorNombre = null;
      for (const j of activos) {
        if ((j.bazasGanadas || 0) > (prevBazaGanRef.current[j.id] || 0)) {
          ganadorNombre = j.nombre; break;
        }
      }
      setGanadorBaza(ganadorNombre);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setBazaMostrada([]);
        setGanadorBaza(null);
      }, 1800);
    }

    prevBazaLenRef.current = bazaActual.length;
    for (const j of activos) {
      prevBazaGanRef.current[j.id] = j.bazasGanadas || 0;
    }
  }, [estado?.bazaActual, estado?.jugadores]);

  // Auto-scroll del log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [estado?.log]);

  if (!estado) return null;

  const miJugador    = estado.jugadores.find(j => j.id === jugadorId);
  const oponentes    = estado.jugadores.filter(j => j.id !== jugadorId);
  const activos      = estado.jugadores.filter(j => !j.eliminado);
  const esIndio      = estado.cartasPorRonda === 1;

  const jugadorTurno =
    estado.fase === 'subasta' ? activos[estado.turnoSubasta]
    : estado.fase === 'jugando' ? activos[estado.turnoActual % activos.length]
    : null;

  const mostrarResultado = estado.fase === 'resultado' || estado.fase === 'fin';
  const mostrarSorteo    = estado.fase === 'sorteo';

  return (
    <div className="flex flex-col h-full select-none overflow-hidden">

      {/* ── OPONENTES ──────────────────────────────────────────────────────── */}
      <div className="flex justify-center items-start gap-2 flex-wrap px-4 pt-3 pb-1"
        style={{ borderBottom: '1px solid rgba(251,191,36,0.07)', background: 'rgba(0,0,0,0.2)' }}>
        {oponentes.map(j => (
          <Oponente key={j.id} jugador={j} esTurno={jugadorTurno?.id === j.id} esIndio={esIndio} />
        ))}
      </div>

      {/* ── MESA CENTRAL ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="tapete-mesa mx-3 mt-2 mb-2 rounded-2xl flex-1 flex flex-col relative overflow-hidden min-h-[180px]">

          {/* Info ronda */}
          <div className="flex justify-between items-center px-4 pt-3 pb-2"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2">
              {estado.modoDuelo && <span className="badge-modo badge-duelo">⚔️ DUELO</span>}
              <span className="text-dorado-400/80 text-sm font-semibold">
                Ronda {estado.modoDuelo ? '∞' : estado.rondaIndex + 1}
              </span>
              <span className="text-gray-600 text-xs">·</span>
              <span className="text-gray-400 text-xs">
                {estado.cartasPorRonda} carta{estado.cartasPorRonda > 1 ? 's' : ''}
                {esIndio ? ' 🙈' : ''}
              </span>
            </div>
            {(estado.fase === 'jugando' || bazaMostrada.length > 0) && (
              <div className="text-gray-500 text-xs">
                Baza {estado.bazasCompletadas + 1}/{estado.cartasPorRonda}
              </div>
            )}
            {estado.fase === 'subasta' && (
              <div className="text-gray-500 text-xs">Fase de apuestas</div>
            )}
          </div>

          {/* Cartas en mesa */}
          <div className="flex-1 flex items-center justify-center p-4">
            {bazaMostrada.length > 0 ? (
              <div className="flex gap-4 flex-wrap justify-center items-end">
                {bazaMostrada.map((jug, i) => (
                  <CartaMesa key={jug.jugadorId} jugada={jug}
                    esGanadora={ganadorBaza === jug.nombre} index={i} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 opacity-35">
                <span className="text-gray-500 text-sm">
                  {estado.fase === 'subasta'  ? '⏳ Fase de apuestas en curso…'
                  : estado.fase === 'jugando'  ? '🎴 Mesa vacía — sal el primero'
                  : ''}
                </span>
              </div>
            )}
          </div>

          {/* Banner de turno */}
          {jugadorTurno && (
            <div className="px-4 pb-3 text-center">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                jugadorTurno.id === jugadorId
                  ? 'bg-dorado-500/20 text-dorado-300 border border-dorado-500/30 animate-pulse-slow'
                  : 'bg-white/5 text-gray-500 border border-white/10'
              }`}>
                {jugadorTurno.id === jugadorId
                  ? estado.fase === 'subasta' ? '¡Es tu turno de apostar!' : '¡Es tu turno de jugar!'
                  : estado.fase === 'subasta' ? `${jugadorTurno.nombre} está apostando…` : `Esperando a ${jugadorTurno.nombre}…`}
              </span>
            </div>
          )}
        </div>

        {/* LOG */}
        <div className="mx-3 mb-1">
          <div ref={logRef} className="rounded-xl px-3 py-2 overflow-y-auto"
            style={{ height: 52, background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.05)' }}>
            {(estado.log || []).slice(-12).map((msg, i) => (
              <div key={i} className="text-xs text-gray-400 leading-relaxed">{msg}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MANO DEL JUGADOR ───────────────────────────────────────────────── */}
      <div className="flex justify-center items-center px-4 py-3"
        style={{ borderTop: '1px solid rgba(251,191,36,0.08)', background: 'rgba(0,0,0,0.25)', minHeight: 100 }}>
        <ManoCarta />
      </div>

      {/* ── MODALES ─────────────────────────────────────────────────────────── */}
      <ModalApuesta />
      {mostrarSorteo    && <PanelSorteo    estado={estado} />}
      {mostrarResultado && <PanelResultado estado={estado} esAnfitrion={esAnfitrion} salaId={salaId} />}
    </div>
  );
}
