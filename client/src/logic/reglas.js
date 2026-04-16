// ==============================================================
// REGLAS DE VALIDACIÓN — La Podrida (cliente)
// Mirrors del motor servidor, para feedback inmediato en UI
// ==============================================================

import { JERARQUIA } from './baraja';

export const SECUENCIA_RONDAS = [5, 4, 3, 2, 1, 2, 3, 4, 5];

/**
 * Valida si una apuesta es válida para el último jugador (regla del postre)
 */
export function apuestaValida(apuesta, sumaActual, cartasPorRonda, esUltimo) {
  if (apuesta < 0 || apuesta > cartasPorRonda) return false;
  if (esUltimo && sumaActual + apuesta === cartasPorRonda) return false;
  return true;
}

/**
 * Apuestas no permitidas para el último jugador (para deshabilitar botones)
 */
export function apuestaProhibida(apuesta, sumaActual, cartasPorRonda, esUltimo) {
  if (!esUltimo) return false;
  return sumaActual + apuesta === cartasPorRonda;
}

/**
 * Descripción del estado del turno
 */
export function descripcionTurno(estado, miId) {
  if (!estado) return '';
  const activos = estado.jugadores.filter(j => !j.eliminado);
  if (estado.fase === 'subasta') {
    const turno = activos[estado.turnoSubasta];
    if (!turno) return '';
    return turno.id === miId ? '¡Es tu turno de apostar!' : `Esperando apuesta de ${turno.nombre}...`;
  }
  if (estado.fase === 'jugando') {
    const turno = activos[estado.turnoActual % activos.length];
    if (!turno) return '';
    return turno.id === miId ? '¡Es tu turno de jugar!' : `Esperando a ${turno.nombre}...`;
  }
  if (estado.fase === 'resultado') return '¡Fin de ronda! Ve los resultados.';
  if (estado.fase === 'fin') return '🏆 ¡Partida terminada!';
  return '';
}

/**
 * Calcula ganador de la baza localmente (para animaciones cliente-side)
 */
export function ganadorBazaLocal(bazaActual) {
  if (!bazaActual?.length) return null;
  let mejor = bazaActual[0];
  for (let i = 1; i < bazaActual.length; i++) {
    if (JERARQUIA[bazaActual[i].carta.valor] > JERARQUIA[mejor.carta.valor]) {
      mejor = bazaActual[i];
    }
  }
  return mejor.jugadorId;
}

/**
 * Es mi turno?
 */
export function esMiTurno(estado, miId) {
  if (!estado) return false;
  const activos = estado.jugadores.filter(j => !j.eliminado);
  if (estado.fase === 'subasta') {
    return activos[estado.turnoSubasta]?.id === miId;
  }
  if (estado.fase === 'jugando') {
    return activos[estado.turnoActual % activos.length]?.id === miId;
  }
  return false;
}
