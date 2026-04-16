import { useState } from 'react';
import useGameStore from '../store/gameStore';
import { getSocket } from '../hooks/useSocket';
import { apuestaProhibida } from '../logic/reglas';

export default function ModalApuesta() {
  const estado = useGameStore(s => s.estado);
  const jugadorId = useGameStore(s => s.jugadorId);
  const salaId = useGameStore(s => s.salaId);
  const [apuestaSeleccionada, setApuestaSeleccionada] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (!estado || estado.fase !== 'subasta') return null;

  const activos = estado.jugadores.filter(j => !j.eliminado);
  const turnoJugador = activos[estado.turnoSubasta];
  if (!turnoJugador || turnoJugador.id !== jugadorId) return null;

  const cartasPorRonda = estado.cartasPorRonda;
  const esUltimo = estado.turnoSubasta === activos.length - 1;
  const sumaActual = activos
    .filter(j => j.apuesta !== null && j.apuesta !== undefined)
    .reduce((acc, j) => acc + j.apuesta, 0);

  const opciones = Array.from({ length: cartasPorRonda + 1 }, (_, i) => i);

  function confirmarApuesta() {
    if (apuestaSeleccionada === null) return;
    setEnviando(true);
    getSocket().emit('hacer_apuesta', { salaId, apuesta: apuestaSeleccionada });
    setApuestaSeleccionada(null);
    setTimeout(() => setEnviando(false), 500);
  }

  const apuestaRespuesta = esUltimo ? cartasPorRonda - sumaActual : null;

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="panel-dorado p-6 w-full max-w-sm mx-4 animate-bounce-in">
        {/* Cabecera */}
        <div className="text-center mb-5">
          <div className="text-dorado-400 text-xs uppercase tracking-widest mb-1">Turno de apuesta</div>
          <h2 className="font-display text-white text-2xl font-bold">¿Cuántas bazas?</h2>
          <p className="text-gray-400 text-sm mt-1">
            Ronda de{' '}
            <span className="text-dorado-300 font-bold">{cartasPorRonda}</span>{' '}
            carta{cartasPorRonda > 1 ? 's' : ''}
          </p>
        </div>

        {/* Info de apuestas anteriores */}
        <div className="bg-black/30 rounded-xl p-3 mb-4 space-y-1">
          {activos.map((j, i) => (
            <div key={j.id} className="flex justify-between text-sm">
              <span className={j.id === jugadorId ? 'text-dorado-300 font-bold' : 'text-gray-400'}>
                {j.id === jugadorId ? '👤 Tú' : j.nombre}
              </span>
              <span className={j.apuesta !== null && j.apuesta !== undefined ? 'text-white font-bold' : 'text-gray-600'}>
                {j.apuesta !== null && j.apuesta !== undefined ? j.apuesta : (i < estado.turnoSubasta ? '?' : '—')}
              </span>
            </div>
          ))}
          <div className="border-t border-white/10 pt-1 flex justify-between text-xs text-gray-500">
            <span>Suma actual</span>
            <span>{sumaActual} / {cartasPorRonda}</span>
          </div>
        </div>

        {/* Aviso postre */}
        {esUltimo && (
          <div className="bg-amber-900/30 border border-amber-700/40 rounded-xl px-3 py-2 mb-4 text-xs text-amber-300">
            ⚠️ <strong>Regla del postre:</strong> No puedes apostar{' '}
            <span className="font-bold text-amber-200">{apuestaRespuesta}</span>{' '}
            (haría la suma igual a {cartasPorRonda}).
          </div>
        )}

        {/* Botones de apuesta */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {opciones.map(num => {
            const prohibida = apuestaProhibida(num, sumaActual, cartasPorRonda, esUltimo);
            const seleccionada = apuestaSeleccionada === num;
            return (
              <button
                key={num}
                onClick={() => !prohibida && setApuestaSeleccionada(num)}
                disabled={prohibida}
                className={`
                  h-12 rounded-xl font-bold text-lg transition-all duration-150
                  ${prohibida
                    ? 'bg-red-950/40 text-red-800 border border-red-900/30 cursor-not-allowed line-through'
                    : seleccionada
                    ? 'bg-dorado-500 text-tapete-900 shadow-lg scale-110'
                    : 'bg-white/10 text-white border border-white/10 hover:bg-white/20 hover:scale-105'
                  }
                `}
              >
                {num}
              </button>
            );
          })}
        </div>

        {/* Confirmar */}
        <button
          onClick={confirmarApuesta}
          disabled={apuestaSeleccionada === null || enviando}
          className="btn-primario w-full text-base"
        >
          {enviando ? 'Enviando...' : apuestaSeleccionada !== null ? `Apostar ${apuestaSeleccionada}` : 'Elige una apuesta'}
        </button>
      </div>
    </div>
  );
}
