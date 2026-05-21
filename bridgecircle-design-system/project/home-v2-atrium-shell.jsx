/* eslint-disable */
// Atrium chrome for the home-page redesigns. Mirrors the structure of
// home-v2-shell.jsx but in Atrium's vocabulary: pill buttons, 16px radii,
// terracotta accent, warm oat paper, gradient circle avatars, and a softer
// editorial type rhythm. Same layout — different dialect.

const A_NAV = [
  { id: 'home',   label: 'Home',   active: true },
  { id: 'people', label: 'People' },
  { id: 'inbox',  label: 'Inbox', badge: 3 },
  { id: 'events', label: 'Events' },
];

function ATR_Header() {
  const P = ATRIUM;
  return (
    <header style={{ background: P.paper, borderBottom: `1px solid ${P.rule}` }}>
      <div style={{
        padding: '14px 32px',
        display: 'grid', gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center', gap: 24,
      }}>
        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 28, height: 28, borderRadius: 999, background: P.accent,
            display: 'grid', placeItems: 'center', color: '#fff',
            fontFamily: P.font.display, fontSize: 14, fontWeight: 700,
          }}>H</span>
          <span style={{
            fontFamily: P.font.display, fontSize: 18, fontWeight: 600,
            letterSpacing: '-0.02em', color: P.ink,
          }}>
            Hartwood Atrium
          </span>
        </div>

        {/* Centered nav */}
        <nav style={{
          display: 'flex', gap: 4, justifyContent: 'center',
          background: P.cardAlt, borderRadius: 999, padding: 4,
          border: `1px solid ${P.rule}`,
        }}>
          {A_NAV.map(item => (
            <button key={item.id} style={{
              background: item.active ? P.card : 'transparent',
              border: 'none', cursor: 'pointer',
              padding: '8px 16px', borderRadius: 999,
              color: item.active ? P.ink : P.muted,
              fontFamily: P.font.body, fontSize: 13, fontWeight: 600,
              display: 'inline-flex', gap: 8, alignItems: 'center',
              boxShadow: item.active ? '0 1px 2px rgba(42,34,26,0.06)' : 'none',
            }}>
              <span>{item.label}</span>
              {item.badge ? (
                <span style={{
                  fontFamily: P.font.body, fontSize: 11, color: '#fff',
                  background: P.accent, borderRadius: 999,
                  padding: '1px 7px', fontWeight: 600,
                }}>{item.badge}</span>
              ) : null}
            </button>
          ))}
        </nav>

        {/* Right cluster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
          <button style={{
            border: `1px solid ${P.rule}`, background: P.card,
            borderRadius: 999, padding: '7px 14px',
            fontFamily: P.font.body, fontSize: 12.5, fontWeight: 500, color: P.muted,
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: P.muted }} />
            Search
            <span style={{ color: P.mute2, fontFamily: P.font.mono, fontSize: 11 }}>⌘K</span>
          </button>
          <ATR_Avatar name="Maren Vasilakis" initials="MV" size={34} />
        </div>
      </div>
    </header>
  );
}

function ATR_Greeting({ eyebrow, headline, sub, kicker }) {
  const P = ATRIUM;
  return (
    <div style={{
      padding: '32px 32px 22px',
      maxWidth: 1280, margin: '0 auto', width: '100%', boxSizing: 'border-box',
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 32,
    }}>
      <div style={{ minWidth: 0, maxWidth: 820 }}>
        <ATR_Eyebrow accent>{eyebrow || `Good afternoon, ${HOME_DATA.viewer.firstName}`}</ATR_Eyebrow>
        <h1 style={{
          fontFamily: P.font.display, fontSize: 44, fontWeight: 500,
          letterSpacing: '-0.025em', lineHeight: 1.05,
          margin: '10px 0 0', color: P.ink, textWrap: 'pretty',
        }}>
          {headline}
        </h1>
        {sub ? (
          <div style={{
            fontSize: 15, color: P.muted, marginTop: 12, lineHeight: 1.55,
            maxWidth: 700, textWrap: 'pretty',
          }}>{sub}</div>
        ) : null}
      </div>
      {kicker ? (
        <div style={{
          background: P.card, border: `1px solid ${P.rule}`, borderRadius: 16,
          padding: '14px 18px', minWidth: 180, textAlign: 'left',
        }}>
          {kicker}
        </div>
      ) : null}
    </div>
  );
}

function ATR_Button({ children, variant = 'primary', size = 'md', ...rest }) {
  const P = ATRIUM;
  const sizes = {
    xs: { padding: '5px 11px',  fontSize: 11.5 },
    sm: { padding: '8px 14px',  fontSize: 12.5 },
    md: { padding: '11px 18px', fontSize: 13.5 },
    lg: { padding: '14px 22px', fontSize: 14.5 },
  };
  const variants = {
    primary: { background: P.accent, color: '#fff', border: `1px solid ${P.accent}` },
    ink:     { background: P.ink, color: P.paper, border: `1px solid ${P.ink}` },
    outline: { background: P.cardAlt, color: P.ink, border: `1px solid ${P.rule}` },
    ghost:   { background: 'transparent', color: P.ink, border: '1px solid transparent' },
    quiet:   { background: 'transparent', color: P.muted, border: '1px solid transparent' },
  };
  return (
    <button {...rest} style={{
      ...sizes[size], ...variants[variant],
      fontFamily: P.font.body, fontWeight: 600, letterSpacing: 0.1,
      borderRadius: 999, cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
      ...rest.style,
    }}>{children}</button>
  );
}

function ATR_Eyebrow({ children, color, accent }) {
  const P = ATRIUM;
  return (
    <div style={{
      fontFamily: P.font.body, fontSize: 11.5, letterSpacing: '0.08em',
      color: color || P.muted, textTransform: 'uppercase', fontWeight: 600,
      display: 'inline-flex', alignItems: 'center', gap: 8,
    }}>
      {accent ? <span style={{ width: 6, height: 6, borderRadius: 999, background: P.accent }} /> : null}
      {children}
    </div>
  );
}

function ATR_Tag({ children, tone = 'muted' }) {
  const P = ATRIUM;
  const tones = {
    muted:  { background: P.paper,  color: P.muted, border: `1px solid ${P.rule}` },
    accent: { background: hexAlpha(P.accent, 0.14), color: P.accent },
    ok:     { background: hexAlpha(P.ok, 0.14),     color: P.ok },
    warn:   { background: hexAlpha(P.warn, 0.16),   color: P.warn },
    ink:    { background: hexAlpha(P.ink, 0.06),    color: P.ink },
  };
  return (
    <span style={{
      ...tones[tone],
      fontFamily: P.font.body, fontSize: 11.5, fontWeight: 600, letterSpacing: 0.2,
      padding: '4px 11px', borderRadius: 999,
      display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

function ATR_Avatar({ name, initials, size = 44 }) {
  const P = ATRIUM;
  const seed = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const pairs = [
    [P.accent, P.ink], [P.ok, P.accent], [P.ink, P.muted],
    [P.accent, '#a05a12'], [P.ok, P.ink],
  ];
  const pair = pairs[seed % pairs.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: 999,
      background: `linear-gradient(135deg, ${pair[0]}, ${pair[1]})`,
      color: '#fff',
      display: 'grid', placeItems: 'center',
      fontFamily: P.font.display, fontSize: Math.round(size * 0.36), fontWeight: 600,
      letterSpacing: '-0.01em', flexShrink: 0,
    }}>{initials}</div>
  );
}

function ATR_Section({ eyebrow, title, action }) {
  const P = ATRIUM;
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      marginBottom: 18, gap: 16,
    }}>
      <div>
        <ATR_Eyebrow accent>{eyebrow}</ATR_Eyebrow>
        <h2 style={{
          fontFamily: P.font.display, fontSize: 28, fontWeight: 500,
          letterSpacing: '-0.02em', color: P.ink, margin: '8px 0 0',
        }}>{title}</h2>
      </div>
      {action}
    </div>
  );
}

// Small alpha helper for tint backgrounds
function hexAlpha(hex, a) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

window.ATR_Header = ATR_Header;
window.ATR_Greeting = ATR_Greeting;
window.ATR_Button = ATR_Button;
window.ATR_Eyebrow = ATR_Eyebrow;
window.ATR_Tag = ATR_Tag;
window.ATR_Avatar = ATR_Avatar;
window.ATR_Section = ATR_Section;
window.hexAlpha = hexAlpha;
