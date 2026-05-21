/* eslint-disable */
// Atrium theme — warm-community palette (oat + terracotta + olive), generous
// radii, soft shadows, friendly second-person voice. Civic's TYPE system
// (Inter Tight display, Inter body, JetBrains Mono details) is preserved.

const ATRIUM_PALETTE = {
  paper:    '#ebe1cb',  // oat — page (Lifted default)
  panel:    '#e2d6bb',  // warmer oat for filled cards
  card:     '#fdf8eb',  // raised card — clear elevation above paper
  cardAlt:  '#fefcf3',  // even softer raised
  ink:      '#2a221a',  // warm bark
  ink2:     '#3d3328',
  muted:    '#655a4a',  // sand mud — darkened for AA text contrast
  mute2:    '#7a6e5e',  // muted timestamps — darkened for AA compliance
  rule:     '#cdbe9c',  // soft rule — crisper for dense lists
  ruleSoft: '#d9cbb0',
  ok:       '#62753a',  // olive
  warn:     '#a05a12',
  bad:      '#9b2c1f',
};

const ACCENT_OPTIONS_ATRIUM = {
  terracotta: '#b84e2c', // default — warm clay (AA compliant)
  saffron:    '#b88033', // golden harvest — generous, sunlit
  olive:      '#5f7038', // earthier, more rural
  lake:       '#2f6e6c', // muted teal — calm, contemplative
  indigo:     '#3f5680', // editorial blue — journal, formal
  plum:       '#7a3a5e', // moody, more editorial
  heather:    '#8a5e7a', // dusty mauve — softer than plum
};

// Tone presets — overrides the page + card + rule colors so users can step
// down from full oat warmth toward a quieter, less-saturated paper. Accent
// and text colors are untouched; just the SURFACES change.
//   warm    — full oat (default)
//   soft    — paler, less yellow oat
//   neutral — barely-tinted cream, almost grey
//   bone    — true Civic-style bone-white, no warmth at all
const TONE_PRESETS = {
  warm: {
    paper:    '#efe7d8',
    panel:    '#e6dcc8',
    card:     '#f8f1e2',
    cardAlt:  '#fbf6ea',
    rule:     '#d8ccb6',
    ruleSoft: '#e4dcca',
    ink:      '#2a221a',
    ink2:     '#3d3328',
    muted:    '#655a4a',
    mute2:    '#7a6e5e',
  },
  lifted: {
    paper:    '#ebe1cb',  // pushed oat — gives the card real lift off the page
    panel:    '#e0d3b9',
    card:     '#fdf8eb',  // brighter card — clear surface elevation
    cardAlt:  '#fefcf3',
    rule:     '#cdbe9c',  // stronger rule for crisp hierarchy in dense lists
    ruleSoft: '#dccfb0',
    ink:      '#2a221a',
    ink2:     '#3d3328',
    muted:    '#655a4a',
    mute2:    '#7a6e5e',
  },
  lamplight: {
    paper:    '#1a1612',  // deep warm bark — like lamplight on dark wood
    panel:    '#221c16',
    card:     '#2a221a',  // cards LIFT (lighter than paper, opposite of intuition)
    cardAlt:  '#322a20',
    rule:     '#3d3328',
    ruleSoft: '#2d2620',
    ink:      '#f0e5d0',  // warm cream text — never pure white
    ink2:     '#d8c9ad',
    muted:    '#998a72',
    mute2:    '#6e6353',
  },
  soft: {
    paper:    '#f2ede2',
    panel:    '#e9e2d1',
    card:     '#faf5ea',
    cardAlt:  '#fcf8ef',
    rule:     '#dcd3c1',
    ruleSoft: '#ebe4d4',
    ink:      '#2a241c',
    ink2:     '#3d352a',
    muted:    '#776e60',
    mute2:    '#9a9082',
  },
  neutral: {
    paper:    '#f4f1e9',
    panel:    '#ebe7dc',
    card:     '#fcf9f1',
    cardAlt:  '#fdfbf5',
    rule:     '#ddd8cb',
    ruleSoft: '#ece8dc',
    ink:      '#1f1d18',
    ink2:     '#322f28',
    muted:    '#73706a',
    mute2:    '#969389',
  },
  bone: {
    paper:    '#f6f4ee',
    panel:    '#edebe3',
    card:     '#fdfcf8',
    cardAlt:  '#fefdfa',
    rule:     '#dedbd1',
    ruleSoft: '#ecebe2',
    ink:      '#161512',
    ink2:     '#2a2924',
    muted:    '#6c6a64',
    mute2:    '#94928b',
  },
};

// useViewport — single source of truth for responsive layout. Returns
// breakpoint booleans the screens can branch on. Mobile = phone width;
// tablet = mid-width where some 3-col grids collapse to 2 but a sidebar
// still doesn't fit. `compact` is the union — most screens just check that.
function useViewport() {
  const get = () => {
    if (typeof window === 'undefined') return { w: 1280 };
    return { w: window.innerWidth };
  };
  const [vp, setVp] = React.useState(get);
  React.useEffect(() => {
    const onResize = () => setVp(get());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const isMobile = vp.w < 720;
  const isTablet = vp.w >= 720 && vp.w < 1024;
  return { width: vp.w, isMobile, isTablet, isCompact: isMobile || isTablet };
}

const CARD_TONE_PRESETS = {
  oat:       { card: '#fdf8eb', cardAlt: '#fefcf3' },
  parchment: { card: '#f5edd8', cardAlt: '#f8f2e0' },
  chalk:     { card: '#f2f1eb', cardAlt: '#f6f5f0' },
  white:     { card: '#fefefe', cardAlt: '#ffffff' },
};

// Linear interpolate between two hex colours (no alpha)
function lerpHex(a, b, t) {
  const ar=parseInt(a.slice(1,3),16), ag=parseInt(a.slice(3,5),16), ab_=parseInt(a.slice(5,7),16);
  const br=parseInt(b.slice(1,3),16), bg=parseInt(b.slice(3,5),16), bb=parseInt(b.slice(5,7),16);
  const rr=Math.round(ar+(br-ar)*t).toString(16).padStart(2,'0');
  const rg=Math.round(ag+(bg-ag)*t).toString(16).padStart(2,'0');
  const rb=Math.round(ab_+(bb-ab_)*t).toString(16).padStart(2,'0');
  return '#'+rr+rg+rb;
}

function useAtriumTheme(tweaks) {
  const accent = ACCENT_OPTIONS_ATRIUM[tweaks.accent] || ACCENT_OPTIONS_ATRIUM.terracotta;
  const d = tweaks.density === 'compact' ? 0.82 : tweaks.density === 'roomy' ? 1.16 : 1;
  const radius = tweaks.shape === 'sharper' ? 8 : tweaks.shape === 'softest' ? 24 : 16;
  const tonePreset = TONE_PRESETS[tweaks.tone] || TONE_PRESETS.lifted;
  const cardTone = CARD_TONE_PRESETS[tweaks.cardTone] || {};
  const mq = useViewport();
  const resolvedCard    = cardTone.card    || tonePreset.card    || ATRIUM_PALETTE.card;
  const resolvedCardAlt = cardTone.cardAlt || tonePreset.cardAlt || ATRIUM_PALETTE.cardAlt;
  const resolvedRule    = tonePreset.rule  || ATRIUM_PALETTE.rule;

  return {
    palette: { ...ATRIUM_PALETTE, ...tonePreset, ...cardTone, accent },
    density: d,
    radius,
    tweaks,
    mq,
    isMobile: mq.isMobile,
    isCompact: mq.isCompact,
    font: {
      display: '"Inter Tight", "Neue Haas Grotesk", system-ui, sans-serif',
      body:    '"Inter", system-ui, sans-serif',
      mono:    '"JetBrains Mono", ui-monospace, "SF Mono", monospace',
    },
    eyebrow: {
      fontFamily: '"Inter", system-ui, sans-serif',
      fontSize: 11.5,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      fontWeight: 600,
    },
    display: {
      fontFamily: '"Inter Tight", "Neue Haas Grotesk", system-ui, sans-serif',
      letterSpacing: '-0.025em',
      fontWeight: 500,
      lineHeight: 1.04,
    },
    body: {
      fontFamily: '"Inter", system-ui, sans-serif',
      lineHeight: 1.55,
    },
    heroBgOptions: [0, 0.25, 0.5, 0.75, 1].map(s => lerpHex(tonePreset.ink || ATRIUM_PALETTE.ink, accent, s)),
    heroBgColor: tweaks.heroBg && tweaks.heroBg.startsWith('#')
      ? tweaks.heroBg
      : (tweaks.heroBg === 'accent' ? accent : (tonePreset.ink || ATRIUM_PALETTE.ink)),
    hairline: `1px solid ${ATRIUM_PALETTE.rule}`,
    cardSurface: (overrides = {}) => ({
      background: resolvedCard,
      border: `1px solid ${resolvedRule}`,
      borderRadius: radius,
      boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)',
      ...overrides,
    }),
    pad: (base) => Math.round(base * d),
  };
}

// ---------------------------------------------------------------------------
// Primitives — Atrium style: rounded pills, soft chips, gradient avatars
// ---------------------------------------------------------------------------

// Returns ink or white text based on background luminance — keeps all 7 accents AA-compliant
function btnTextFor(hex, ink) {
  const r=parseInt(hex.slice(1,3),16)/255, g=parseInt(hex.slice(3,5),16)/255, b=parseInt(hex.slice(5,7),16)/255;
  const lin = v => v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4);
  return 0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b)>0.18?ink:'#ffffff';
}

function AtriumButton({ children, variant = 'primary', size = 'md', leadIcon, as: As = 'button', ...rest }) {
  const t = React.useContext(ThemeCtx);
  const sizes = {
    sm: { padding: '8px 14px', fontSize: 12.5 },
    md: { padding: '11px 18px', fontSize: 13.5 },
    lg: { padding: '14px 22px', fontSize: 14.5 },
  };
  const variants = {
    primary: { background: t.palette.accent, color: btnTextFor(t.palette.accent, t.palette.ink), border: `1px solid ${t.palette.accent}` },
    outline: { background: t.palette.cardAlt, color: t.palette.ink, border: `1px solid ${t.palette.rule}` },
    ghost:   { background: 'transparent', color: t.palette.ink, border: '1px solid transparent' },
    ink:     { background: t.palette.ink, color: t.palette.paper, border: `1px solid ${t.palette.ink}` },
  };
  return (
    <As
      {...rest}
      style={{
        ...sizes[size],
        ...variants[variant],
        fontFamily: t.font.body,
        fontWeight: 600,
        letterSpacing: 0.1,
        borderRadius: 999,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        textDecoration: 'none',
        boxShadow: variant === 'primary' ? '0 1px 0 rgba(255,255,255,.25) inset, 0 1px 2px rgba(42,34,26,0.08)' : 'none',
        transition: 'transform 120ms ease, filter 120ms ease',
        ...rest.style,
      }}
      onMouseDown={(e) => { e.currentTarget.style.transform = 'translateY(0.5px)'; rest.onMouseDown?.(e); }}
      onMouseUp={(e)   => { e.currentTarget.style.transform = ''; rest.onMouseUp?.(e); }}
    >
      {leadIcon ? <span style={{ display: 'inline-flex' }}>{leadIcon}</span> : null}
      {children}
    </As>
  );
}

function AtriumTag({ children, tone = 'muted', dot }) {
  const t = React.useContext(ThemeCtx);
  const tones = {
    muted:  { background: t.palette.paper,  color: t.palette.muted, border: `1px solid ${t.palette.rule}` },
    accent: { background: hex(t.palette.accent, 0.14), color: t.palette.accent, border: 'none' },
    ok:     { background: hex(t.palette.ok, 0.14),     color: t.palette.ok,     border: `1px solid ${hex(t.palette.ok, 0.30)}` },
    warn:   { background: hex(t.palette.warn, 0.16),   color: t.palette.warn,   border: `1px solid ${hex(t.palette.warn, 0.30)}` },
  };
  return (
    <span style={{
      ...tones[tone],
      fontFamily: t.font.body,
      fontSize: 11.5,
      fontWeight: 600,
      letterSpacing: 0.2,
      padding: '4px 10px',
      borderRadius: 999,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      whiteSpace: 'nowrap',
    }}>
      {dot ? <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor' }} /> : null}
      {children}
    </span>
  );
}

// hex+alpha helper — pulls alpha by appending hex pair
function hex(c, a = 1) {
  if (a >= 1) return c;
  const n = Math.round(a * 255).toString(16).padStart(2, '0');
  return c + n;
}

function AtriumAvatar({ name, initials, size = 44, accent }) {
  const t = React.useContext(ThemeCtx);
  // Generate a stable gradient from the name so each person feels distinct
  const seed = (name || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const a = accent || t.palette.accent;
  const b = t.palette.ok;
  const c = t.palette.ink;
  const palette = [[a, b], [b, c], [a, c]];
  const pair = palette[seed % palette.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: 999,
      background: `linear-gradient(135deg, ${pair[0]}, ${pair[1]})`,
      color: '#fff',
      display: 'grid', placeItems: 'center',
      fontFamily: t.font.display, fontSize: Math.round(size * 0.36), fontWeight: 600,
      letterSpacing: '-0.01em',
      flexShrink: 0,
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.18)',
    }}>{initials}</div>
  );
}

function AtriumEyebrow({ children, color, accent }) {
  const t = React.useContext(ThemeCtx);
  return (
    <div style={{ ...t.eyebrow, color: color || t.palette.muted, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {accent ? <span style={{ width: 6, height: 6, borderRadius: 999, background: t.palette.accent }} /> : null}
      {children}
    </div>
  );
}

function AtriumSection({ eyebrow, title, action }) {
  const t = React.useContext(ThemeCtx);
  const m = t.isMobile;
  return (
    <div style={{
      display: 'flex',
      alignItems: m ? 'flex-start' : 'flex-end',
      justifyContent: 'space-between',
      flexDirection: m ? 'column' : 'row',
      marginBottom: m ? 16 : 22, gap: m ? 8 : 16,
    }}>
      <div>
        <AtriumEyebrow accent>{eyebrow}</AtriumEyebrow>
        <h2 style={{ ...t.display, fontSize: m ? 24 : 32, margin: '6px 0 0' }}>{title}</h2>
      </div>
      {action}
    </div>
  );
}

window.useAtriumTheme = useAtriumTheme;
window.useViewport = useViewport;
window.AtriumButton = AtriumButton;
window.AtriumTag = AtriumTag;
window.AtriumAvatar = AtriumAvatar;
window.AtriumEyebrow = AtriumEyebrow;
window.AtriumSection = AtriumSection;
window.hex = hex;
window.ACCENT_OPTIONS_ATRIUM = ACCENT_OPTIONS_ATRIUM;
