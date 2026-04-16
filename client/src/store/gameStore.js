import { create } from 'zustand';

const useGameStore = create((set, get) => ({
  // Identidad del jugador local
  jugadorId: null,
  nombre: '',
  salaId: null,

  // Estado de la partida (viene del servidor)
  estado: null,
  lobby: null,

  // UI
  cartaSeleccionada: null,
  error: null,
  conectado: false,
  enPartida: false,

  // ──────────────────────────────────────────────
  // Setters
  // ──────────────────────────────────────────────
  setJugadorId: (id) => set({ jugadorId: id }),
  setNombre: (nombre) => set({ nombre }),
  setSalaId: (id) => set({ salaId: id }),
  setEstado: (estado) => set({ estado }),
  setLobby: (lobby) => set({ lobby }),
  setConectado: (v) => set({ conectado: v }),
  setEnPartida: (v) => set({ enPartida: v }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  seleccionarCarta: (cartaId) => set((s) => ({
    cartaSeleccionada: s.cartaSeleccionada === cartaId ? null : cartaId,
  })),
  limpiarSeleccion: () => set({ cartaSeleccionada: null }),

  resetSala: () => set({
    estado: null,
    lobby: null,
    cartaSeleccionada: null,
    enPartida: false,
    error: null,
  }),

  // ──────────────────────────────────────────────
  // Selectores derivados
  // ──────────────────────────────────────────────
  get miJugador() {
    const { estado, jugadorId } = get();
    return estado?.jugadores?.find(j => j.id === jugadorId) ?? null;
  },

  get jugadoresActivos() {
    const { estado } = get();
    return estado?.jugadores?.filter(j => !j.eliminado) ?? [];
  },

  get esMiTurno() {
    const { estado, jugadorId } = get();
    if (!estado) return false;
    const activos = estado.jugadores.filter(j => !j.eliminado);
    if (estado.fase === 'subasta') return activos[estado.turnoSubasta]?.id === jugadorId;
    if (estado.fase === 'jugando') return activos[estado.turnoActual % activos.length]?.id === jugadorId;
    return false;
  },

  get esAnfitrion() {
    const { lobby, jugadorId } = get();
    return lobby?.anfitrion === jugadorId;
  },
}));

export default useGameStore;
