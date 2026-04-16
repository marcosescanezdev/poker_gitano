import { useEffect, useState } from 'react';
import { Copy, Check, Users, Crown, RefreshCw } from 'lucide-react';
import useGameStore from '../store/gameStore';
import { getSocket } from '../hooks/useSocket';

function BotonesAnfitrion({ salaId, numJugadores }) {
  const [iniciando, setIniciando] = useState(false);

  function iniciar() {
    setIniciando(true);
    getSocket().emit('iniciar_partida', { salaId });
    setTimeout(() => setIniciando(false), 2000);
  }

  return (
    <button
      onClick={iniciar}
      disabled={iniciando || numJugadores < 2}
      className="btn-primario w-full text-base"
    >
      {iniciando ? <span className="flex items-center justify-center gap-2"><RefreshCw size={16} className="animate-spin" />Iniciando...</span>
        : numJugadores < 2 ? 'Esperando jugadores...'
        : '🎮 ¡Iniciar partida!'}
    </button>
  );
}

export default function SalaEspera() {
  const lobby = useGameStore(s => s.lobby);
  const jugadorId = useGameStore(s => s.jugadorId);
  const salaId = useGameStore(s => s.salaId);
  const [copiado, setCopiado] = useState(false);

  if (!lobby) return null;

  const esAnfitrion = lobby.anfitrion === jugadorId;
  const urlInvitacion = `${window.location.origin}/sala/${lobby.id}`;

  function copiarUrl() {
    navigator.clipboard.writeText(urlInvitacion).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="panel-dorado p-8 w-full max-w-md animate-fade-in">
        {/* Título */}
        <div className="text-center mb-6">
          <h1 className="font-display text-dorado-300 text-4xl font-bold mb-1"
              style={{ fontFamily: '"Cinzel", serif', letterSpacing: '0.05em' }}>
            Poker Gitano
          </h1>
          <p className="text-gray-400 text-sm">Sala de espera</p>
        </div>

        {/* Código de sala */}
        <div className="bg-black/40 border border-dorado-600/30 rounded-2xl p-4 mb-4 text-center">
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Código de sala</p>
          <div className="text-dorado-300 font-bold text-4xl tracking-[0.3em] font-mono">{lobby.id}</div>
        </div>

        {/* URL de invitación */}
        <div className="flex gap-2 mb-5">
          <input
            readOnly
            value={urlInvitacion}
            className="input-casino flex-1 text-sm"
          />
          <button onClick={copiarUrl} className="btn-primario px-4">
            {copiado ? <Check size={18} /> : <Copy size={18} />}
          </button>
        </div>

        {/* Configuración de la partida */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="bg-white/5 rounded-xl p-2 text-center">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Modo</div>
            <div className={`text-sm font-bold ${lobby.modoJuego === 'diferencia' ? 'text-purple-300' : 'text-blue-300'}`}>
              {lobby.modoJuego === 'diferencia' ? 'Diferencia' : 'Normal'}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-2 text-center">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Vidas</div>
            <div className="text-sm font-bold text-red-300">{'❤️'.repeat(lobby.vidasIniciales)}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-2 text-center">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Jugadores</div>
            <div className="text-sm font-bold text-white">{lobby.jugadores.length}/{lobby.maxJugadores}</div>
          </div>
        </div>

        {/* Lista de jugadores */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-gray-500" />
            <span className="text-gray-500 text-xs uppercase tracking-wide font-bold">Jugadores conectados</span>
          </div>
          <div className="space-y-2">
            {lobby.jugadores.map(j => (
              <div
                key={j.id}
                className={`flex items-center justify-between px-3 py-2 rounded-xl ${
                  j.id === jugadorId ? 'border border-dorado-500/40 bg-dorado-500/10' : 'bg-white/5'
                }`}
              >
                <span className="font-medium text-white">
                  {j.id === jugadorId ? '👤 ' : ''}{j.nombre}
                </span>
                {j.esAnfitrion && (
                  <span className="flex items-center gap-1 text-dorado-400 text-xs">
                    <Crown size={12} /> Anfitrión
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Botón */}
        {esAnfitrion ? (
          <BotonesAnfitrion salaId={salaId} numJugadores={lobby.jugadores.length} />
        ) : (
          <div className="text-center text-gray-500 text-sm py-3 border border-white/10 rounded-xl">
            ⏳ Esperando a que el anfitrión inicie la partida...
          </div>
        )}
      </div>
    </div>
  );
}
