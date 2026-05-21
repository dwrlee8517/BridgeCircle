/* eslint-disable */
// Shared Civic chrome used by every v2 home-page variant. The chrome (top
// utility strip, masthead, nav) is identical across variants so reviewers
// can see what's actually changing — only the body of the page differs.
//
// All four variants share the same data slice (HOME_DATA) and CIVIC palette,
// loaded by home-redesigns-data.jsx.

const NAV = [
  { id: 'home',   label: 'Home',   index: '01', active: true },
  { id: 'people', label: 'People', index: '02' },
  { id: 'inbox',  label: 'Inbox',  index: '03', badge: 3 },
  { id: 'events', label: 'Events', index: '04' },
];

function V2Header() {
  const P = CIVIC;
  return (
    <header style={{ borderBottom: `1px solid ${P.rule}`, background: P.paper }}>
      {/* Top utility strip */}
      <div style={{
        borderBottom: `1px solid ${P.ruleSoft}`, padding: '6px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: P.mute2,
      }}>
        <span>The Hartwood Society · Vol. XII</span>
        <span style={{ display: 'flex', gap: 14 }}>
          <span>Class of ’14</span>
          <span style={{ color: P.accent, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: P.accent }} /> Verified
          </span>
        </span>
      </div>

      {/* Masthead + nav */}
      <div style={{
        padding: '18px 32px',
        display: 'grid', gridTemplateColumns: '240px 1fr auto',
        alignItems: 'center', gap: 24,
      }}>
        <div style={{
          fontFamily: P.font.display, fontSize: 22, fontWeight: 600,
          letterSpacing: '-0.02em', color: P.ink,
        }}>
          BridgeCircle <span style={{ color: P.muted, fontWeight: 400 }}>· Hartwood</span>
        </div>

        <nav style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
          {NAV.map(item => (
            <button key={item.id} style={{
              position: 'relative', background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '10px 16px', color: item.active ? P.ink : P.muted,
              fontFamily: P.font.body, fontSize: 13, fontWeight: 500, letterSpacing: 0.1,
              display: 'inline-flex', gap: 8, alignItems: 'baseline',
            }}>
              <span style={{
                fontFamily: P.font.mono, fontSize: 9.5,
                letterSpacing: '0.16em', textTransform: 'uppercase',
                color: item.active ? P.accent : P.mute2,
              }}>{item.index}</span>
              <span>{item.label}</span>
              {item.badge ? (
                <span style={{
                  fontFamily: P.font.mono, fontSize: 10, color: P.accent,
                  border: `1px solid ${P.accent}`, borderRadius: 2,
                  padding: '0 5px', lineHeight: '14px',
                }}>{item.badge}</span>
              ) : null}
              {item.active ? (
                <span aria-hidden style={{
                  position: 'absolute', left: 12, right: 12, bottom: -19, height: 2, background: P.ink,
                }} />
              ) : null}
            </button>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <MockAvatar name="Maren Vasilakis" initials="MV" size={32} palette={P} />
        </div>
      </div>
    </header>
  );
}

// Compact greeting strip — same across most variants, easy to drop in.
// Headline can be overridden so each variant can lead with its own framing.
function V2Greeting({ headline, sub }) {
  const P = CIVIC;
  return (
    <div style={{
      padding: '22px 32px 18px',
      borderBottom: `1px solid ${P.rule}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24,
      maxWidth: 1280, margin: '0 auto',
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: P.font.mono, fontSize: 10.5, letterSpacing: '0.16em',
          color: P.muted, textTransform: 'uppercase', marginBottom: 8,
        }}>
          Good afternoon, Maren · Class of ’14 · The Hartwood Society
        </div>
        <h1 style={{
          fontFamily: P.font.display, fontSize: 36, lineHeight: 1.05,
          margin: 0, fontWeight: 600, letterSpacing: '-0.025em', color: P.ink,
        }}>
          {headline}
        </h1>
        {sub ? (
          <div style={{ fontSize: 14, color: P.muted, marginTop: 8, maxWidth: 720, lineHeight: 1.55 }}>
            {sub}
          </div>
        ) : null}
      </div>
      <div style={{
        fontFamily: P.font.mono, fontSize: 10.5, letterSpacing: '0.16em',
        color: P.mute2, whiteSpace: 'nowrap', textAlign: 'right', textTransform: 'uppercase',
      }}>
        THU 15 MAY 2026<br />
        <span style={{ color: P.accent }}>●</span> 2:14 PM
      </div>
    </div>
  );
}

// Tiny KPI strip — used by variants that still want the at-a-glance numbers
// up top, but keep them subordinate to the action queue.
function V2KPIStrip({ items }) {
  const P = CIVIC;
  return (
    <div style={{
      borderBottom: `1px solid ${P.rule}`,
      padding: '12px 32px',
      display: 'flex', gap: 0, alignItems: 'stretch',
      maxWidth: 1280, margin: '0 auto', boxSizing: 'border-box',
    }}>
      {items.map((it, i) => (
        <div key={i} style={{
          flex: 1,
          paddingLeft: i === 0 ? 0 : 24,
          paddingRight: 24,
          borderRight: i === items.length - 1 ? 'none' : `1px solid ${P.ruleSoft}`,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 4,
        }}>
          <div style={{
            fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.18em',
            color: P.muted, textTransform: 'uppercase',
          }}>{it.label}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{
              fontFamily: P.font.display, fontSize: 22, fontWeight: 600,
              color: it.color || P.ink, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
            }}>{it.value}</span>
            <span style={{ fontSize: 12, color: P.muted }}>{it.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Common button used across variants. Civic's hairline-only style.
function V2Button({ children, variant = 'primary', size = 'md', ...rest }) {
  const P = CIVIC;
  const sizes = {
    xs: { padding: '5px 9px',  fontSize: 11.5 },
    sm: { padding: '7px 12px', fontSize: 12 },
    md: { padding: '9px 14px', fontSize: 12.5 },
    lg: { padding: '12px 18px', fontSize: 13.5 },
  };
  const variants = {
    primary: { background: P.ink,      color: P.paper, border: `1px solid ${P.ink}` },
    accent:  { background: P.accent,   color: '#fff',  border: `1px solid ${P.accent}` },
    outline: { background: 'transparent', color: P.ink, border: `1px solid ${P.ink}` },
    ghost:   { background: 'transparent', color: P.ink, border: `1px solid ${P.rule}` },
    quiet:   { background: 'transparent', color: P.muted, border: '1px solid transparent' },
  };
  return (
    <button {...rest} style={{
      ...sizes[size], ...variants[variant],
      fontFamily: P.font.body, fontWeight: 500, letterSpacing: 0.1,
      borderRadius: 2, cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
      ...rest.style,
    }}>{children}</button>
  );
}

// A small mono eyebrow used everywhere
function V2Eyebrow({ children, color }) {
  const P = CIVIC;
  return (
    <div style={{
      fontFamily: P.font.mono, fontSize: 10.5, letterSpacing: '0.16em',
      color: color || P.muted, textTransform: 'uppercase', fontWeight: 500,
    }}>{children}</div>
  );
}

// Section title with index, used for grouping inside a variant body.
function V2Section({ index, title, count, action }) {
  const P = CIVIC;
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      marginBottom: 16, borderTop: `2px solid ${P.ink}`, paddingTop: 12, gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, minWidth: 0 }}>
        <span style={{
          fontFamily: P.font.mono, fontSize: 10.5, letterSpacing: '0.16em',
          color: P.muted, textTransform: 'uppercase',
        }}>{`§ ${index}`}</span>
        <h2 style={{
          fontFamily: P.font.display, fontSize: 22, fontWeight: 600,
          margin: 0, letterSpacing: '-0.02em', color: P.ink,
        }}>{title}</h2>
        {count ? (
          <span style={{
            fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.14em',
            color: P.muted, textTransform: 'uppercase',
            padding: '3px 7px', border: `1px solid ${P.rule}`, borderRadius: 2,
            background: P.panel,
          }}>{count}</span>
        ) : null}
      </div>
      {action}
    </div>
  );
}

window.V2Header   = V2Header;
window.V2Greeting = V2Greeting;
window.V2KPIStrip = V2KPIStrip;
window.V2Button   = V2Button;
window.V2Eyebrow  = V2Eyebrow;
window.V2Section  = V2Section;
