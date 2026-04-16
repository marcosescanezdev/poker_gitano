// ============================================================
// MOTOR DEL JUEGO — La Podrida
// Sin triunfo. Solo importa el número de la carta.
// ============================================================

const PALOS = ['Oros', 'Copas', 'Espadas', 'Bastos'];
const VALORES = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];

// Jerarquía: 1 > 12 > 11 > 10 > 7 > 6 > 5 > 4 > 3 > 2
const JERARQUIA = { 1: 10, 12: 9, 11: 8, 10: 7, 7: 6, 6: 5, 5: 4, 4: 3, 3: 2, 2: 1 };

// Secuencia de rondas: 5→4→3→2→1→2→3→4→5
const SECUENCIA_RONDAS = [5, 4, 3, 2, 1, 2, 3, 4, 5];

function crearBaraja() {
  const baraja = [];
  let id = 0;
  for (const palo of PALOS) {
    for (const valor of VALORES) {
      baraja.push({ id: id++, palo, valor });
    }
  }
  return baraja;
}

function barajar(baraja) {
  const b = [...baraja];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

function cartaMasAlta(cartasEnMesa) {
  // cartasEnMesa: [{ jugadorId, carta }]
  // Gana la carta con mayor jerarquía; en empate gana la primera tirada
  let ganador = cartasEnMesa[0];
  for (let i = 1; i < cartasEnMesa.length; i++) {
    const actual = cartasEnMesa[i];
    if (JERARQUIA[actual.carta.valor] > JERARQUIA[ganador.carta.valor]) {
      ganador = actual;
    }
  }
  return ganador.jugadorId;
}

function calcularVidas(apuesta, bazasGanadas, vidas, modoJuego) {
  if (apuesta === bazasGanadas) return vidas; // Sin cambio
  if (modoJuego === 'normal') return vidas - 1;
  // Modo diferencia
  return vidas - Math.abs(apuesta - bazasGanadas);
}

function crearSorteo(jugadores) {
  const baraja = barajar(crearBaraja());
  return jugadores.map((j, i) => ({
    jugadorId: j.id,
    nombre: j.nombre,
    carta: baraja[i],
  }));
}

function resolverSorteo(cartasSorteo) {
  // Devuelve el índice del dealer (carta más alta)
  let dealerIdx = 0;
  for (let i = 1; i < cartasSorteo.length; i++) {
    if (JERARQUIA[cartasSorteo[i].carta.valor] > JERARQUIA[cartasSorteo[dealerIdx].carta.valor]) {
      dealerIdx = i;
    }
  }
  return dealerIdx;
}

function crearEstadoInicial(config) {
  const cartasSorteo = crearSorteo(config.jugadores);
  const dealerIdx   = resolverSorteo(cartasSorteo);
  // El de la derecha del dealer empieza (siguiente en el array)
  const primerIdx   = (dealerIdx + 1) % config.jugadores.length;

  return {
    // Configuración
    salaId: config.salaId,
    modoJuego: config.modoJuego || 'normal',
    vidasIniciales: config.vidasIniciales || 3,
    empezoCon: config.jugadores.length,

    // Sorteo inicial
    sorteo: cartasSorteo,
    dealerIdx,

    // Estado
    fase: 'sorteo',
    rondaIndex: 0,
    cartasPorRonda: SECUENCIA_RONDAS[0],
    modoDuelo: false,

    jugadores: config.jugadores.map(j => ({
      id: j.id,
      nombre: j.nombre,
      vidas: config.vidasIniciales,
      eliminado: false,
      apuesta: null,
      bazasGanadas: 0,
      mano: [],
      puntosHistorial: [],
    })),

    turnoActual: primerIdx,
    turnoSubasta: primerIdx,
    subastas: {},
    bazaActual: [],
    bazasCompletadas: 0,
    iniciadorBaza: primerIdx,

    log: [`🎲 Sorteo: ${cartasSorteo[dealerIdx].nombre} saca la carta más alta y es el dealer. Empieza ${config.jugadores[primerIdx].nombre}.`],
  };
}


function jugadoresActivos(estado) {
  return estado.jugadores.filter(j => !j.eliminado);
}

function iniciarRonda(estado) {
  const activos = jugadoresActivos(estado);

  // Comprobar si entramos en Modo Duelo
  if (estado.empezoCon > 2 && activos.length === 2 && !estado.modoDuelo) {
    estado.modoDuelo = true;
    estado.log.push('⚔️ ¡MODO DUELO! Solo quedan 2 jugadores. Se jugará con 1 carta siempre.');
  }

  const cartasARepartir = estado.modoDuelo ? 1 : SECUENCIA_RONDAS[estado.rondaIndex];
  estado.cartasPorRonda = cartasARepartir;
  const esIndio = cartasARepartir === 1;

  const baraja = barajar(crearBaraja());
  let idx = 0;

  // Limpiar estado de jugadores activos
  for (const jugador of activos) {
    const refJugador = estado.jugadores.find(j => j.id === jugador.id);
    refJugador.mano = [];
    refJugador.apuesta = null;
    refJugador.bazasGanadas = 0;
  }

  // Repartir
  for (let i = 0; i < cartasARepartir; i++) {
    for (const jugador of activos) {
      const refJugador = estado.jugadores.find(j => j.id === jugador.id);
      refJugador.mano.push({ ...baraja[idx++], oculta: false });
    }
  }

  // En ronda del Indio: la primera carta de cada jugador está oculta a sí mismo
  if (esIndio) {
    for (const jugador of activos) {
      const refJugador = estado.jugadores.find(j => j.id === jugador.id);
      refJugador.mano[0].esIndio = true; // El servidor la marcará como oculta para ese jugador
    }
  }

  estado.subastas = {};
  estado.bazaActual = [];
  estado.bazasCompletadas = 0;
  estado.fase = 'subasta';
  estado.turnoSubasta = 0;

  const rondaNum = estado.modoDuelo ? 'Duelo' : `${estado.rondaIndex + 1}/${SECUENCIA_RONDAS.length}`;
  estado.log.push(`🃏 Ronda ${rondaNum} — ${cartasARepartir} carta${cartasARepartir > 1 ? 's' : ''} por jugador${esIndio ? ' (¡Ronda del Indio!)' : ''}`);

  return estado;
}

function hacerApuesta(estado, jugadorId, apuesta) {
  const activos = jugadoresActivos(estado);
  const turnoJugador = activos[estado.turnoSubasta];

  if (turnoJugador.id !== jugadorId) {
    return { error: 'No es tu turno de apostar' };
  }

  const esUltimo = estado.turnoSubasta === activos.length - 1;
  if (esUltimo) {
    const sumaActual = Object.values(estado.subastas).reduce((a, b) => a + b, 0);
    if (sumaActual + apuesta === estado.cartasPorRonda) {
      return { error: `El último en apostar no puede hacer que la suma sea ${estado.cartasPorRonda} (regla del postre). Elige otro número.` };
    }
  }

  estado.subastas[jugadorId] = apuesta;
  estado.jugadores.find(j => j.id === jugadorId).apuesta = apuesta;

  const sumaTotal = Object.values(estado.subastas).reduce((a, b) => a + b, 0);
  estado.log.push(`💬 ${turnoJugador.nombre} apuesta ${apuesta} baza${apuesta !== 1 ? 's' : ''} (suma: ${sumaTotal}/${estado.cartasPorRonda})`);

  if (estado.turnoSubasta < activos.length - 1) {
    estado.turnoSubasta++;
  } else {
    // Todos han apostado → empezar a jugar
    estado.fase = 'jugando';
    estado.turnoActual = estado.iniciadorBaza;
    estado.log.push('🎮 ¡Empezamos! Que salga el primero.');
  }

  return estado;
}

function jugarCarta(estado, jugadorId, cartaId) {
  const activos = jugadoresActivos(estado);
  const turnoJugador = activos[estado.turnoActual % activos.length];

  if (turnoJugador.id !== jugadorId) {
    return { error: 'No es tu turno de jugar' };
  }

  const refJugador = estado.jugadores.find(j => j.id === jugadorId);
  const cartaIdx = refJugador.mano.findIndex(c => c.id === cartaId);
  if (cartaIdx === -1) return { error: 'Carta no encontrada en tu mano' };

  const [carta] = refJugador.mano.splice(cartaIdx, 1);
  estado.bazaActual.push({ jugadorId, carta });

  estado.log.push(`🃏 ${turnoJugador.nombre} tira el ${carta.valor} de ${carta.palo}`);

  // ¿Han tirado todos?
  if (estado.bazaActual.length === activos.length) {
    // Resolver baza
    const ganadorId = cartaMasAlta(estado.bazaActual);
    const ganador = estado.jugadores.find(j => j.id === ganadorId);
    ganador.bazasGanadas++;
    estado.bazasCompletadas++;

    const cartaGanadora = estado.bazaActual.find(b => b.jugadorId === ganadorId).carta;
    estado.log.push(`✅ ${ganador.nombre} gana la baza con el ${cartaGanadora.valor} de ${cartaGanadora.palo} (lleva ${ganador.bazasGanadas}/${ganador.apuesta})`);

    estado.bazaActual = [];

    // El ganador abre la siguiente baza
    const nuevoPrimerIdx = activos.findIndex(j => j.id === ganadorId);
    estado.iniciadorBaza = nuevoPrimerIdx;

    if (estado.bazasCompletadas >= estado.cartasPorRonda) {
      // Fin de la ronda
      estado = finalizarRonda(estado);
    } else {
      estado.turnoActual = nuevoPrimerIdx;
    }
  } else {
    estado.turnoActual = (estado.turnoActual + 1) % activos.length;
  }

  return estado;
}

function finalizarRonda(estado) {
  const activos = jugadoresActivos(estado);
  estado.fase = 'resultado';

  let eliminados = [];

  for (const jugador of activos) {
    const ref = estado.jugadores.find(j => j.id === jugador.id);
    const vidasAntes = ref.vidas;
    const nuevasVidas = calcularVidas(ref.apuesta, ref.bazasGanadas, ref.vidas, estado.modoJuego);
    ref.vidas = Math.max(0, nuevasVidas);

    const exito = ref.apuesta === ref.bazasGanadas;
    estado.log.push(
      exito
        ? `⭐ ${ref.nombre}: apostó ${ref.apuesta}, hizo ${ref.bazasGanadas} — ¡ACIERTA! (${vidasAntes}→${ref.vidas} ❤️)`
        : `💀 ${ref.nombre}: apostó ${ref.apuesta}, hizo ${ref.bazasGanadas} — FALLA (-${vidasAntes - ref.vidas} vida${vidasAntes - ref.vidas > 1 ? 's' : ''}) → ${ref.vidas} ❤️`
    );

    ref.puntosHistorial.push({
      ronda: estado.rondaIndex,
      cartasPorRonda: estado.cartasPorRonda,
      apuesta: ref.apuesta,
      bazas: ref.bazasGanadas,
      vidasAntes,
      vidasDespues: ref.vidas,
      exito,
    });

    if (ref.vidas <= 0) {
      ref.eliminado = true;
      eliminados.push(ref.nombre);
    }
  }

  if (eliminados.length) {
    estado.log.push(`❌ Eliminado${eliminados.length > 1 ? 's' : ''}: ${eliminados.join(', ')}`);
  }

  // Rotar quién abre
  const activosAhora = jugadoresActivos(estado);
  const nuevoPrimero = (estado.iniciadorBaza + 1) % activosAhora.length;
  estado.iniciadorBaza = nuevoPrimero;

  // ¿Fin del juego?
  if (activosAhora.length <= 1) {
    estado.fase = 'fin';
    if (activosAhora.length === 1) {
      estado.log.push(`🏆 ¡${activosAhora[0].nombre} GANA LA PARTIDA!`);
      estado.ganador = activosAhora[0].id;
    } else {
      estado.log.push('🤝 ¡Empate! Todos eliminados a la vez.');
    }
    return estado;
  }

  // Avanzar al siguiente ronda (si no es Modo Duelo)
  if (!estado.modoDuelo) {
    estado.rondaIndex++;
    if (estado.rondaIndex >= SECUENCIA_RONDAS.length) {
      estado.rondaIndex = 0; // Reiniciar ciclo si todos sobreviven al ciclo completo
    }
  }

  return estado;
}

function construirVistaJugador(estado, jugadorId) {
  // Devuelve el estado filtrado para un jugador específico
  // (oculta las cartas del Indio al propio jugador)
  const estadoFiltrado = JSON.parse(JSON.stringify(estado));

  for (const jugador of estadoFiltrado.jugadores) {
    if (jugador.id === jugadorId) {
      // Ocultar sus propias cartas de Indio
      jugador.mano = jugador.mano.map(c => ({
        ...c,
        valor: c.esIndio ? null : c.valor,
        palo: c.esIndio ? null : c.palo,
        oculta: c.esIndio ? true : false,
      }));
    } else {
      // Ocultar las cartas de otros jugadores (excepto en Indio, donde SÍ las ve)
      const esRondaIndio = estado.cartasPorRonda === 1;
      if (!esRondaIndio) {
        // Rondas normales: no ves las cartas de los demás
        jugador.mano = jugador.mano.map(() => ({ oculta: true, esReverso: true }));
      }
      // En ronda Indio: ves las cartas de los demás (ya están en el estado)
    }
  }

  return estadoFiltrado;
}

module.exports = {
  crearEstadoInicial,
  iniciarRonda,
  hacerApuesta,
  jugarCarta,
  finalizarRonda,
  jugadoresActivos,
  construirVistaJugador,
  SECUENCIA_RONDAS,
};
