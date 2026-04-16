import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, Zap, ChevronRight, Users } from 'lucide-react';

// URL del backend: usa la de Render o localhost si estás en tu PC
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/* ── Cartas flotantes de fondo ───────────────────────────────────── */
const CARTAS_DECO = [
  { val: '🂱', x: 8,  y: 12, rot: -18, delay: 0,    dur: 7  },
  { val: '🂾', x: 85, y: 8,  rot:  22, delay: 0.8,  dur: 9  },
  { val: '🃁', x: 15, y: 72, rot: -10, delay: 1.4,  dur: 8  },
  { val: '🂺', x: 78, y: 65, rot:  15, delay: 0.3,  dur: 11 },
  { val: '🂻', x: 50, y: 5,  rot:  -5, delay: 2,    dur: 10 },
  { val: '🃋', x: 92, y: 40, rot:  28, delay: 1.1,  dur: 8  },
  { val: '🂣', x: 3,  y: 45, rot: -25, delay: 0.5,  dur: 12 },
  { val: '🃊', x: 60, y: 80, rot:  12, delay: 1.7,  dur: 9  },
  { val: '🂩', x: 30, y: 88, rot: -20, delay: 0.9,  dur: 10 },
  { val: '🃗', x: 45, y: 58, rot:   8, delay: 2.3,  dur: 7  },
];

function CartaFlotante({ carta }) {
  return (
    <div
      className="absolute select-none pointer-events-none"
      style={{
        left: `${carta.x}%`,
        top: `${carta.y}%`,
        fontSize: '5rem',
        opacity: 0.04,
        transform: `rotate(${carta.rot}deg)`,
        animation: `flotar ${carta.dur}s ease-in-out ${carta.delay}s infinite alternate`,
        filter: 'blur(0.5px)',
      }}
    >
      {carta.val}
    </div>
  );
}

/* ── Componente principal ────────────────────────────────────────── */
const OPCIONES_VIDAS    = [1, 2, 3, 4, 5];
const OPCIONES_JUGADORES = [2, 3, 4, 5, 6, 7, 8];

export default function Inicio() {
  const navigate = useNavigate();
  const [nombre,       setNombre]       = useState('');
  const [codigoSala,   setCodigoSala]   = useState('');
  const [tab,           setTab]          = useState('crear');
  const [modoJuego,    setModoJuego]    = useState('normal');
  const [vidas,        setVidas]        = useState(3);
  const [maxJugadores, setMaxJugadores] = useState(6);
  const [cargando,     setCargando]     = useState(false);
  const [error,        setError]        = useState('');
  const [visible,      setVisible]      = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  async function crearSala() {
    if (!nombre.trim()) return setError('Escribe tu nombre para continuar');
    setCargando(true); setError('');
    
    // Limpiamos la URL por si acaso tiene una barra al final
    const base = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;

    try {
      const res = await fetch(`${base}/api/crear-sala`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modoJuego, vidasIniciales: vidas, maxJugadores }),
      });
      const data = await res.json();
      if (data.salaId) {
        sessionStorage.setItem('lp_nombre', nombre.trim());
        navigate(`/sala/${data.salaId}`);
      } else { 
        setError(data.error || 'Error al crear la sala'); 
      }
    } catch (err) { 
      console.error("Error de conexión:", err);
      setError('No se puede conectar con el servidor'); 
    }
    finally { setCargando(false); }
  }

  function unirseSala() {
    if (!nombre.trim())      return setError('Escribe tu nombre para continuar');
    if (!codigoSala.trim())  return setError('Escribe el código de la sala');
    sessionStorage.setItem('lp_nombre', nombre.trim());
    navigate(`/sala/${codigoSala.trim().toUpperCase()}`);
  }

  return (
    <>
      <style>{`
        @keyframes flotar {
          from { transform: translateY(0px) rotate(var(--r, 0deg)); }
          to   { transform: translateY(-22px) rotate(var(--r, 0deg)); }
        }
        @keyframes entradaLogo {
          from { opacity: 0; transform: translateY(-30px) scale(0.92); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes entradaCard {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes brillo {
          0%, 100% { background-position: 0% 50%; }
          50%       { background-position: 100% 50%; }
        }
        .logo-text {
          background: linear-gradient(135deg, #fde68a 0%, #fbbf24 30%, #f59e0b 50%, #fbbf24 70%, #fde68a 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: brillo 4s ease infinite;
        }
        .card-form {
          animation: entradaCard 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.25s both;
        }
        .logo-wrap {
          animation: entradaLogo 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .separador-linea {
          background: linear-gradient(to right, transparent, rgba(251,191,36,0.4), transparent);
          height: 1px;
        }
      `}</style>

      <div className="relative min-h-screen overflow-hidden flex items-center justify-center px-4 py-10">
        <div className="absolute inset-0 pointer-events-none">
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(20,82,20,0.55) 0%, transparent 70%)',
          }} />
          {CARTAS_DECO.map((c, i) => <CartaFlotante key={i} carta={c} />)}
        </div>

        <div className="relative z-10 w-full max-w-lg">
          <div className="logo-wrap text-center mb-10">
            <div className="inline-flex items-center justify-center mb-5">
              <div style={{
                width: 90, height: 90,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, rgba(251,191,36,0.25) 0%, rgba(251,191,36,0.05) 60%, transparent 100%)',
                border: '1px solid rgba(251,191,36,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 40px rgba(251,191,36,0.15), inset 0 0 20px rgba(251,191,36,0.05)',
              }}>
                <span style={{ fontSize: '2.8rem', filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.6))' }}>🃏</span>
              </div>
            </div>

            <h1 className="logo-text font-bold leading-none mb-2" style={{ fontFamily: '"Cinzel", serif', fontSize: 'clamp(2.8rem, 8vw, 4.5rem)', letterSpacing: '0.04em' }}>
              Poker Gitano
            </h1>
            <p className="text-gray-400 text-sm tracking-widest uppercase font-light mt-3">
              El juego de cartas · Multijugador en tiempo real
            </p>
          </div>

          <div className="card-form panel-dorado p-8" style={{ boxShadow: '0 0 60px rgba(0,0,0,0.5), 0 0 30px rgba(251,191,36,0.05)' }}>
            <div className="mb-6">
              <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2 font-semibold">
                Tu nombre en la partida
              </label>
              <input
                className="input-casino text-base font-medium"
                placeholder="¿Cómo quieres que te llamen?"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (tab === 'crear' ? crearSala() : unirseSala())}
                maxLength={20}
                autoFocus
              />
            </div>

            <div className="flex mb-6 p-1 rounded-xl" style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {[['crear', '➕ Crear partida'], ['unirse', '🔗 Unirse con código']].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => { setTab(key); setError(''); }}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200"
                  style={tab === key
                    ? { background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,191,36,0.1))', color: '#fde68a', boxShadow: 'inset 0 1px 0 rgba(251,191,36,0.2)' }
                    : { color: '#6b7280' }
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === 'crear' && (
              <div className="space-y-5 mb-6">
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2.5 font-semibold">
                    Modo de juego
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'normal',     icon: <Zap size={15}/>,    label: 'Normal',     desc: 'Pierdes 1 vida al fallar'          },
                      { key: 'diferencia', icon: <Swords size={15}/>, label: 'Diferencia', desc: 'Pierdes tantas vidas como diferencia' },
                    ].map(m => (
                      <button
                        key={m.key}
                        onClick={() => setModoJuego(m.key)}
                        className="p-3.5 rounded-xl text-left transition-all duration-200"
                        style={modoJuego === m.key
                          ? { border: '1px solid rgba(251,191,36,0.5)', background: 'rgba(251,191,36,0.12)', color: 'white' }
                          : { border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)', color: '#9ca3af' }
                        }
                      >
                        <div className="flex items-center gap-1.5 font-bold text-sm mb-1">
                          {m.icon} {m.label}
                        </div>
                        <div className="text-xs opacity-60">{m.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2.5 font-semibold">
                    Vidas por jugador
                  </label>
                  <div className="flex gap-2">
                    {OPCIONES_VIDAS.map(v => (
                      <button
                        key={v}
                        onClick={() => setVidas(v)}
                        className="flex-1 py-3 rounded-xl font-bold transition-all"
                        style={vidas === v
                          ? { background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)', color: '#fca5a5' }
                          : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#6b7280' }
                        }
                      >
                        <span className="text-lg">{'❤️'.repeat(v)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2.5 font-semibold">
                    Máx. jugadores
                  </label>
                  <div className="flex gap-1.5">
                    {OPCIONES_JUGADORES.map(n => (
                      <button
                        key={n}
                        onClick={() => setMaxJugadores(n)}
                        className="flex-1 h-10 rounded-xl font-bold text-sm"
                        style={maxJugadores === n
                          ? { background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.5)', color: '#fde68a' }
                          : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#6b7280' }
                        }
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'unirse' && (
              <div className="mb-6">
                <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2.5 font-semibold">
                  Código de sala
                </label>
                <input
                  className="input-casino text-center font-mono font-black uppercase"
                  style={{ fontSize: '2rem', letterSpacing: '0.45em' }}
                  placeholder="• • • • • •"
                  value={codigoSala}
                  onChange={e => setCodigoSala(e.target.value.toUpperCase().slice(0, 6))}
                  onKeyDown={e => e.key === 'Enter' && unirseSala()}
                  maxLength={6}
                />
              </div>
            )}

            {error && (
              <div className="px-4 py-2.5 rounded-xl mb-4 text-sm text-red-300" style={{ background: 'rgba(127,29,29,0.4)', border: '1px solid rgba(239,68,68,0.3)' }}>
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={tab === 'crear' ? crearSala : unirseSala}
              disabled={cargando}
              className="btn-primario w-full flex items-center justify-center gap-2 py-3.5"
            >
              {cargando ? 'Cargando...' : tab === 'crear' ? 'Crear partida' : 'Unirse a la partida'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}