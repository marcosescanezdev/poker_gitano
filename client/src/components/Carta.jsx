// ═══════════════════════════════════════════════════════════
//  CARTA.JSX — Diseño premium de carta española
//  Sin iniciales de palo. SVG dibujados a mano.
// ═══════════════════════════════════════════════════════════

const COLORES = {
  Oros:    { txt: '#92400e', dark: '#b45309', shadow: 'rgba(180,83,9,0.25)',   border: '#fbbf24' },
  Copas:   { txt: '#991b1b', dark: '#b91c1c', shadow: 'rgba(185,28,28,0.25)',  border: '#f87171' },
  Espadas: { txt: '#1e3a8a', dark: '#1d4ed8', shadow: 'rgba(30,58,138,0.25)',  border: '#93c5fd' },
  Bastos:  { txt: '#14532d', dark: '#166534', shadow: 'rgba(22,101,52,0.25)',  border: '#86efac' },
};

// ── SVG de cada palo ─────────────────────────────────────────────────────────
function SimboloPalo({ palo, size = 36, color }) {
  const col = color || COLORES[palo]?.dark || '#333';
  const p   = { width: size, height: size, viewBox: '0 0 40 40', style: { display: 'block' } };

  if (palo === 'Oros') return (
    <svg {...p}>
      <circle cx="20" cy="20" r="15.5" fill="none" stroke={col} strokeWidth="2.8"/>
      <circle cx="20" cy="20" r="9"    fill={col} opacity="0.18"/>
      <circle cx="20" cy="20" r="5"    fill={col}/>
      {/* rayos decorativos */}
      {[0,45,90,135].map(a => {
        const r2 = a * Math.PI/180;
        const x1 = 20 + 10.5*Math.cos(r2), y1 = 20 + 10.5*Math.sin(r2);
        const x2 = 20 + 14.5*Math.cos(r2), y2 = 20 + 14.5*Math.sin(r2);
        return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth="1.8" opacity="0.5"/>;
      })}
    </svg>
  );

  if (palo === 'Copas') return (
    <svg {...p}>
      {/* copa / cáliz */}
      <path d="M6 5 Q6 19 20 22 Q34 19 34 5 Z" fill={col} opacity="0.9"/>
      <path d="M6 5 Q6 10 13 14" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2"/>
      <rect x="17.5" y="22" width="5" height="11" rx="1.5" fill={col}/>
      <rect x="11"   y="32" width="18" height="3.5" rx="1.75" fill={col}/>
    </svg>
  );

  if (palo === 'Espadas') return (
    <svg {...p}>
      {/* hoja de espada */}
      <polygon points="20,3 23.5,19 16.5,19" fill={col}/>
      {/* filo central */}
      <rect x="18.8" y="3" width="2.4" height="30" rx="1" fill={col} opacity="0.5"/>
      {/* pomo */}
      <rect x="9" y="24" width="22" height="3" rx="1.5" fill={col}/>
      {/* punta de guardar */}
      <path d="M9 25.5 Q14 29 20 30 Q26 29 31 25.5" fill="none" stroke={col} strokeWidth="1.5"/>
      {/* mango */}
      <rect x="18.3" y="26" width="3.4" height="11" rx="1.5" fill={col}/>
    </svg>
  );

  // Bastos
  return (
    <svg {...p}>
      <circle cx="20" cy="10" r="8"   fill={col}/>
      <circle cx="11" cy="26" r="7.5" fill={col}/>
      <circle cx="29" cy="26" r="7.5" fill={col}/>
      {/* mango */}
      <rect x="17.5" y="21" width="5" height="16" rx="2" fill={col}/>
      {/* highlight */}
      <circle cx="17" cy="7.5" r="2.5" fill="rgba(255,255,255,0.25)"/>
    </svg>
  );
}

// ── Tamaños de carta ─────────────────────────────────────────────────────────
const TAMAÑOS = {
  xs:  { w: 48,  h: 68,  numSize: 15, symSm: 14, symLg: 22 },
  sm:  { w: 60,  h: 86,  numSize: 18, symSm: 16, symLg: 28 },
  md:  { w: 74,  h: 106, numSize: 22, symSm: 20, symLg: 36 },
  lg:  { w: 90,  h: 130, numSize: 28, symSm: 24, symLg: 48 },
};

// ── Reverso de carta ─────────────────────────────────────────────────────────
function CartaReverso({ w, h }) {
  return (
    <div style={{
      width: w, height: h,
      borderRadius: 10,
      background: 'linear-gradient(145deg, #1a4a3a 0%, #0d2b20 100%)',
      border: '1.5px solid rgba(251,191,36,0.25)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* patrón geométrico */}
      <svg width={w} height={h} style={{ position: 'absolute', inset: 0 }} viewBox={`0 0 ${w} ${h}`}>
        <defs>
          <pattern id="rev" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
            <rect width="12" height="12" fill="none"/>
            <path d="M0 0 L6 6 M6 6 L12 0 M0 12 L6 6 M6 6 L12 12" stroke="rgba(251,191,36,0.12)" strokeWidth="0.8"/>
          </pattern>
        </defs>
        <rect width={w} height={h} fill="url(#rev)"/>
        <rect x="5" y="5" width={w-10} height={h-10} rx="7"
          fill="none" stroke="rgba(251,191,36,0.2)" strokeWidth="1"/>
        <rect x="9" y="9" width={w-18} height={h-18} rx="5"
          fill="none" stroke="rgba(251,191,36,0.1)" strokeWidth="0.8"/>
      </svg>
      <span style={{ fontSize: 20, zIndex: 1, opacity: 0.6 }}>🂠</span>
    </div>
  );
}

// ── Carta del Indio (carta propia oculta) ────────────────────────────────────
function CartaIndio({ w, h, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: w, height: h,
        borderRadius: 10,
        background: 'linear-gradient(145deg, #2d1b00, #4a2d00)',
        border: '2px dashed rgba(251,191,36,0.45)',
        boxShadow: '0 0 20px rgba(251,191,36,0.15), 0 4px 12px rgba(0,0,0,0.5)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 6,
        cursor: onClick ? 'pointer' : 'default',
        animation: 'glow 2s ease-in-out infinite',
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 28 }}>❓</span>
      <span style={{ color: '#fbbf24', fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Indio</span>
    </div>
  );
}

// ── Cara de carta ─────────────────────────────────────────────────────────────
export default function Carta({
  carta,
  onClick,
  seleccionada = false,
  enMesa       = false,
  animDelay    = 0,
  tamaño       = 'md',
  esPropia     = false,
  className    = '',
}) {
  const t = TAMAÑOS[tamaño] || TAMAÑOS.md;
  const { w, h, numSize, symSm, symLg } = t;

  // ── Reverso ──────────────────────────────────────────────────────
  if (!carta || carta.esReverso) {
    return (
      <div style={{ animationDelay: `${animDelay}ms`, display: 'inline-block' }}>
        <CartaReverso w={w} h={h} />
      </div>
    );
  }

  // ── Indio (carta propia oculta) ──────────────────────────────────
  if (carta.oculta && esPropia) {
    return (
      <div style={{ animationDelay: `${animDelay}ms`, display: 'inline-block' }}>
        <CartaIndio w={w} h={h} onClick={onClick} />
      </div>
    );
  }

  const col   = COLORES[carta.palo] || COLORES.Oros;
  const valor = carta.valor;

  // Estilos de selección / mesa
  const translateY = seleccionada ? -20 : 0;
  const scale      = seleccionada ? 1.08 : 1;
  const shadow     = seleccionada
    ? `0 24px 48px rgba(0,0,0,0.6), 0 0 30px ${col.shadow}, 0 0 0 2px ${col.border}`
    : enMesa
    ? `0 8px 24px rgba(0,0,0,0.4), 0 0 14px ${col.shadow}`
    : `0 4px 12px rgba(0,0,0,0.35)`;

  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        width: w, height: h, flexShrink: 0,
        borderRadius: 10,
        background: `linear-gradient(160deg, #fffdf5 0%, #fdf6e3 100%)`,
        border: `1.5px solid ${seleccionada ? col.border : 'rgba(210,190,150,0.6)'}`,
        boxShadow: shadow,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 5,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        transform: `translateY(${translateY}px) scale(${scale})`,
        transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
        animationDelay: `${animDelay}ms`,
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* sutil textura interior */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 9,
        background: `radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.6) 0%, transparent 60%)`,
        pointerEvents: 'none',
      }}/>

      {/* ── Esquina superior izquierda ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1, zIndex: 1 }}>
        <span style={{ fontSize: numSize, fontWeight: 900, color: col.txt, lineHeight: 1, fontFamily: '"Playfair Display", serif' }}>
          {valor}
        </span>
        <SimboloPalo palo={carta.palo} size={symSm} color={col.dark}/>
      </div>

      {/* ── Centro ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, zIndex: 1 }}>
        <SimboloPalo palo={carta.palo} size={symLg} color={col.dark}/>
      </div>

      {/* ── Esquina inferior derecha (invertida) ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, transform: 'rotate(180deg)', zIndex: 1 }}>
        <span style={{ fontSize: numSize, fontWeight: 900, color: col.txt, lineHeight: 1, fontFamily: '"Playfair Display", serif' }}>
          {valor}
        </span>
        <SimboloPalo palo={carta.palo} size={symSm} color={col.dark}/>
      </div>
    </div>
  );
}
