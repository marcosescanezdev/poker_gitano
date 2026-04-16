import Carta from './Carta';
import useGameStore from '../store/gameStore';
import { getSocket } from '../hooks/useSocket';
import { esMiTurno } from '../logic/reglas';

export default function ManoCarta() {
  const estado = useGameStore(s => s.estado);
  const jugadorId = useGameStore(s => s.jugadorId);
  const salaId = useGameStore(s => s.salaId);
  const cartaSeleccionada = useGameStore(s => s.cartaSeleccionada);
  const seleccionarCarta = useGameStore(s => s.seleccionarCarta);
  const limpiarSeleccion = useGameStore(s => s.limpiarSeleccion);

  if (!estado || estado.fase !== 'jugando') return null;

  const miJugador = estado.jugadores.find(j => j.id === jugadorId);
  if (!miJugador || miJugador.eliminado) return null;

  const mano = miJugador.mano || [];
  const puedoJugar = esMiTurno(estado, jugadorId);
  const esRondaIndio = estado.cartasPorRonda === 1;

  function handleClickCarta(cartaId) {
    if (!puedoJugar) return;

    if (cartaSeleccionada === cartaId) {
      // Segundo click = jugar la carta
      getSocket().emit('jugar_carta', { salaId, cartaId });
      limpiarSeleccion();
    } else {
      seleccionarCarta(cartaId);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Estado / instrucción */}
      <div className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-all duration-300 ${
        puedoJugar
          ? 'bg-dorado-500/20 text-dorado-300 border border-dorado-500/40 animate-pulse-slow'
          : 'bg-white/5 text-gray-500 border border-white/10'
      }`}>
        {puedoJugar
          ? cartaSeleccionada
            ? '👆 Toca de nuevo para jugar · o elige otra'
            : '🎴 Selecciona una carta para jugar'
          : 'Espera tu turno…'
        }
      </div>

      {/* Apuesta / bazas */}
      {miJugador.apuesta !== null && (
        <div className="flex gap-4 text-xs">
          <span className="text-gray-500">
            Aposté <span className="text-dorado-300 font-bold">{miJugador.apuesta}</span>
          </span>
          <span className="text-gray-500">
            Llevo <span className={`font-bold ${miJugador.bazasGanadas === miJugador.apuesta ? 'text-green-400' : 'text-red-400'}`}>
              {miJugador.bazasGanadas}
            </span>
          </span>
        </div>
      )}

      {/* Cartas en mano */}
      <div className="flex gap-1 flex-wrap justify-center items-end">
        {mano.map((carta, i) => (
          <div
            key={carta.id ?? i}
            style={{
              animation: `cardDeal 0.4s cubic-bezier(0.22,1,0.36,1) ${i * 80}ms both`,
              marginLeft: i > 0 ? -10 : 0,
              transition: 'margin 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.marginLeft = i > 0 ? '4px' : '0'; e.currentTarget.style.zIndex = '10'; }}
            onMouseLeave={e => { e.currentTarget.style.marginLeft = i > 0 ? '-10px' : '0'; e.currentTarget.style.zIndex = '1'; }}
          >
            <Carta
              carta={carta}
              onClick={puedoJugar ? () => handleClickCarta(carta.id) : undefined}
              seleccionada={cartaSeleccionada === carta.id}
              esPropia={true}
              tamaño="lg"
            />
          </div>
        ))}
      </div>

      {/* Ayuda ronda Indio */}
      {esRondaIndio && (
        <div className="text-xs text-amber-400/80 bg-amber-900/20 border border-amber-700/30 rounded-lg px-3 py-1.5 text-center max-w-xs">
          🙈 <strong>Ronda del Indio</strong> — No ves tu carta, ¡los demás sí!
        </div>
      )}
    </div>
  );

}
