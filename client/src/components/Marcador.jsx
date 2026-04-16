import { Heart } from 'lucide-react';
import useGameStore from '../store/gameStore';

function Corazones({ vidas, vidasMax }) {
  return (
    <div className="flex gap-0.5 flex-wrap">
      {Array.from({ length: vidasMax }).map((_, i) => (
        <Heart
          key={i}
          size={14}
          className={i < vidas ? 'text-red-400 fill-red-400' : 'text-gray-700 fill-gray-700'}
          style={i < vidas ? { filter: 'drop-shadow(0 0 3px rgba(248,113,113,0.6))' } : {}}
        />
      ))}
    </div>
  );
}

function FilaJugador({ jugador, esYo, vidasMax, estado }) {
  const apuesta = jugador.apuesta ?? '-';
  const bazas = jugador.bazasGanadas ?? 0;
  const acierto = jugador.apuesta !== null && jugador.apuesta === jugador.bazasGanadas;
  const activos = estado?.jugadores?.filter(j => !j.eliminado) ?? [];
  const esTurno =
    (estado?.fase === 'subasta' && activos[estado.turnoSubasta]?.id === jugador.id) ||
    (estado?.fase === 'jugando' && activos[estado.turnoActual % activos.length]?.id === jugador.id);

  return (
    <div
      className={`relative p-3 rounded-xl transition-all duration-300 ${
        jugador.eliminado
          ? 'opacity-30 grayscale'
          : esTurno
          ? 'border border-dorado-400/60 bg-dorado-500/10 turno-activo'
          : 'border border-white/5 bg-white/5'
      }`}
    >
      {esTurno && (
        <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-dorado-400 rounded-full animate-pulse" />
      )}

      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold truncate text-white">
            {esYo ? '👤 Tú' : jugador.nombre}
          </span>
          {jugador.eliminado && (
            <span className="text-xs text-red-400 font-bold">ELIMINADO</span>
          )}
        </div>
        <Corazones vidas={jugador.vidas} vidasMax={vidasMax} />
      </div>

      {/* Apuesta / Bazas */}
      {estado?.fase !== 'esperando' && estado?.fase !== 'lobby' && (
        <div className="flex gap-3 text-xs text-gray-400">
          <span>
            Apuesta:{' '}
            <span className="text-dorado-300 font-bold">
              {jugador.apuesta !== null && jugador.apuesta !== undefined ? jugador.apuesta : '?'}
            </span>
          </span>
          <span>
            Bazas:{' '}
            <span
              className={`font-bold ${
                acierto ? 'text-green-400' : jugador.apuesta !== null ? 'text-red-400' : 'text-gray-300'
              }`}
            >
              {bazas}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

function EntradaHistorial({ entrada, nombre }) {
  return (
    <div className="log-entrada px-2">
      <span className="text-dorado-400/60 text-xs mr-1">R{entrada.ronda + 1}</span>
      <span className="text-gray-300">{nombre}:</span>{' '}
      {entrada.exito ? (
        <span className="text-green-400 font-medium">✓ {entrada.apuesta}/{entrada.bazas}</span>
      ) : (
        <span className="text-red-400 font-medium">✗ {entrada.apuesta}→{entrada.bazas}</span>
      )}
      <span className="text-gray-500 ml-1">
        {entrada.vidasAntes}→{entrada.vidasDespues}❤️
      </span>
    </div>
  );
}

export default function Marcador({ vidasMax }) {
  const estado = useGameStore(s => s.estado);
  const jugadorId = useGameStore(s => s.jugadorId);

  if (!estado) return null;

  const modo = estado.modoJuego === 'diferencia' ? 'Diferencia' : 'Normal';
  const badgeClase = estado.modoDuelo ? 'badge-duelo' : estado.modoJuego === 'diferencia' ? 'badge-diferencia' : 'badge-normal';

  // Recolectar historial de todos los jugadores
  const historial = [];
  for (const j of estado.jugadores) {
    for (const h of j.puntosHistorial ?? []) {
      historial.push({ ...h, nombre: j.nombre, jugadorId: j.id });
    }
  }
  historial.sort((a, b) => b.ronda - a.ronda);

  return (
    <aside className="panel flex flex-col gap-4 p-4 h-full overflow-hidden">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-dorado-300 font-bold text-lg">Marcador</h2>
        <div className="flex gap-1.5">
          <span className={`badge-modo ${badgeClase}`}>
            {estado.modoDuelo ? '⚔️ DUELO' : modo}
          </span>
        </div>
      </div>

      {/* Ronda actual */}
      {estado.cartasPorRonda && (
        <div className="text-center py-2 border border-dorado-600/20 rounded-xl bg-dorado-500/5">
          <div className="text-dorado-400 text-xs uppercase tracking-widest mb-0.5">Ronda</div>
          <div className="text-dorado-300 font-bold text-2xl leading-none">
            {estado.modoDuelo ? '⚔️' : estado.rondaIndex + 1}
          </div>
          <div className="text-gray-400 text-xs mt-0.5">
            {estado.cartasPorRonda} carta{estado.cartasPorRonda > 1 ? 's' : ''}
            {estado.cartasPorRonda === 1 ? ' 🙈' : ''}
          </div>
        </div>
      )}

      {/* Jugadores */}
      <div className="flex flex-col gap-2">
        {estado.jugadores.map(j => (
          <FilaJugador
            key={j.id}
            jugador={j}
            esYo={j.id === jugadorId}
            vidasMax={vidasMax || estado.vidasIniciales || 3}
            estado={estado}
          />
        ))}
      </div>

      {/* Historial de rondas */}
      {historial.length > 0 && (
        <div className="flex-1 min-h-0 flex flex-col gap-1">
          <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold">Historial</h3>
          <div className="flex-1 overflow-y-auto rounded-xl bg-black/20 divide-y divide-white/5">
            {historial.slice(0, 30).map((h, i) => (
              <EntradaHistorial key={i} entrada={h} nombre={h.nombre} />
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
