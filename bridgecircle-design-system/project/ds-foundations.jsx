/* eslint-disable */
// Atrium Design System — Foundation tokens + section components

// ─── RAW TOKENS ────────────────────────────────────────────────────────────

const DS_TOKENS = {
  palette: [
    { hex: '#ebe1cb', name: 'Paper',     token: 'paper',    role: 'Page background',        group: 'Surfaces' },
    { hex: '#e2d6bb', name: 'Panel',     token: 'panel',    role: 'Filled panels, sidebar', group: 'Surfaces' },
    { hex: '#fdf8eb', name: 'Card',      token: 'card',     role: 'Raised card surface',    group: 'Surfaces' },
    { hex: '#fefcf3', name: 'Card Alt',  token: 'cardAlt',  role: 'Softer card, nav bg',    group: 'Surfaces' },
    { hex: '#cdbe9c', name: 'Rule',      token: 'rule',     role: 'Borders, dividers',      group: 'Surfaces' },
    { hex: '#d9cbb0', name: 'Rule Soft', token: 'ruleSoft', role: 'Subtle dividers',        group: 'Surfaces' },
    { hex: '#2a221a', name: 'Ink',       token: 'ink',      role: 'Primary text',           group: 'Text' },
    { hex: '#3d3328', name: 'Ink 2',     token: 'ink2',     role: 'Secondary text',         group: 'Text' },
    { hex: '#655a4a', name: 'Muted',     token: 'muted',    role: 'Labels, tertiary',       group: 'Text' },
    { hex: '#7a6e5e', name: 'Mute 2',   token: 'mute2',    role: 'Timestamps, fine print', group: 'Text' },
    { hex: '#62753a', name: 'OK',        token: 'ok',       role: 'Success, positive',      group: 'Semantic' },
    { hex: '#a05a12', name: 'Warn',      token: 'warn',     role: 'Caution, attention',     group: 'Semantic' },
    { hex: '#9b2c1f', name: 'Bad',       token: 'bad',      role: 'Error, danger',          group: 'Semantic' },
  ],
  accents: [
    { hex: '#b84e2c', name: 'Terracotta', id: 'terracotta', isDefault: true, role: 'Warm clay — default, invitation' },
    { hex: '#b88033', name: 'Saffron',    id: 'saffron',    role: 'Golden harvest — generous, sunlit' },
    { hex: '#5f7038', name: 'Olive',      id: 'olive',      role: 'Earthy green — rooted, rural' },
    { hex: '#2f6e6c', name: 'Lake',       id: 'lake',       role: 'Muted teal — calm, contemplative' },
    { hex: '#3f5680', name: 'Indigo',     id: 'indigo',     role: 'Editorial blue — journal, formal' },
    { hex: '#7a3a5e', name: 'Plum',       id: 'plum',       role: 'Deep purple — moody, evening' },
    { hex: '#8a5e7a', name: 'Heather',    id: 'heather',    role: 'Dusty mauve — softer than plum' },
  ],
  tones: [
    { name: 'Warm',      paper: '#efe7d8', card: '#f8f1e2', rule: '#d8ccb6', note: 'Classic — original warm tone' },
    { name: 'Lifted',    paper: '#ebe1cb', card: '#fdf8eb', rule: '#cdbe9c', note: 'New default — card clearly elevated above paper' },
    { name: 'Soft',      paper: '#f2ede2', card: '#faf5ea', rule: '#dcd3c1', note: 'Paler, less yellow' },
    { name: 'Neutral',   paper: '#f4f1e9', card: '#fcf9f1', rule: '#ddd8cb', note: 'Barely-tinted cream' },
    { name: 'Bone',      paper: '#f6f4ee', card: '#fdfcf8', rule: '#dedbd1', note: 'True bone-white' },
    { name: 'Lamplight', paper: '#1a1612', card: '#2a221a', rule: '#3d3328', note: 'Warm dark — evening read', dark: true },
  ],
  cardTones: [
    { name: 'Oat',       hex: '#fdf8eb', note: 'Default · lifted cream' },
    { name: 'Parchment', hex: '#f5edd8', note: 'Deeper golden warmth' },
    { name: 'Chalk',     hex: '#f2f1eb', note: 'Neutral off-white' },
    { name: 'White',     hex: '#fefefe', note: 'True white cards' },
  ],
  typeScale: [
    { size: 56, weight: 600, tracking: '-0.025em', lh: 1.04, family: 'display', label: 'Display XL',  usage: 'Hero headings' },
    { size: 40, weight: 600, tracking: '-0.025em', lh: 1.04, family: 'display', label: 'Display L',   usage: 'Page titles' },
    { size: 32, weight: 600, tracking: '-0.025em', lh: 1.04, family: 'display', label: 'Display M',   usage: 'Section headings' },
    { size: 24, weight: 600, tracking: '-0.02em',  lh: 1.10, family: 'display', label: 'Display S',   usage: 'Card titles' },
    { size: 20, weight: 600, tracking: '-0.02em',  lh: 1.15, family: 'display', label: 'Display XS',  usage: 'Subheadings' },
    { size: 17, weight: 600, tracking: '-0.01em',  lh: 1.20, family: 'display', label: 'Heading SM',  usage: 'Dense headers' },
    { size: 16, weight: 400, tracking: '0',        lh: 1.55, family: 'body',    label: 'Body L',      usage: 'Lead paragraphs' },
    { size: 14, weight: 400, tracking: '0',        lh: 1.55, family: 'body',    label: 'Body M',      usage: 'Standard body' },
    { size: 13, weight: 400, tracking: '0',        lh: 1.50, family: 'body',    label: 'Body S',      usage: 'UI labels' },
    { size: 11.5, weight: 600, tracking: '0.08em', lh: 1.30, family: 'body',    label: 'Eyebrow',     usage: 'Section labels (uppercase)', eyebrow: true },
    { size: 12,   weight: 500, tracking: '0.06em', lh: 1.40, family: 'mono',    label: 'Mono M',      usage: 'Code, IDs' },
    { size: 10.5, weight: 400, tracking: '0.14em', lh: 1.40, family: 'mono',    label: 'Mono S',      usage: 'Timestamps, metadata' },
  ],
  fonts: {
    display: { family: '"Inter Tight", "Neue Haas Grotesk", system-ui, sans-serif', label: 'Inter Tight',    role: 'Display, headings' },
    body:    { family: '"Inter", system-ui, sans-serif',                             label: 'Inter',           role: 'Body copy, UI labels' },
    mono:    { family: '"JetBrains Mono", ui-monospace, "SF Mono", monospace',       label: 'JetBrains Mono', role: 'Metadata, timestamps, code' },
  },
  radii: [
    { name: 'Pill',    value: 999, css: '999px', usage: 'Buttons, tags, chips, nav pills' },
    { name: 'Softest', value: 24,  css: '24px',  usage: 'Cards — softest preset' },
    { name: 'Soft',    value: 16,  css: '16px',  usage: 'Cards — default preset' },
    { name: 'Sharper', value: 8,   css: '8px',   usage: 'Cards — compact preset' },
    { name: 'Inner',   value: 10,  css: '10px',  usage: 'Nested chips, filters' },
    { name: 'Small',   value: 6,   css: '6px',   usage: 'Tiny swatches, micro chips' },
  ],
  shadows: [
    { name: 'Card',       value: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)',   usage: 'Resting card' },
    { name: 'Card Hover', value: '0 1px 0 rgba(255,255,255,.6) inset, 0 8px 24px rgba(42,34,26,0.10)',  usage: 'Card on hover (−2px lift)' },
    { name: 'Nav',        value: '0 1px 0 rgba(255,255,255,.5) inset, 0 8px 28px rgba(42,34,26,0.06)',  usage: 'Floating nav bar' },
    { name: 'Menu',       value: '0 16px 40px rgba(42,34,26,0.16), 0 1px 0 rgba(255,255,255,.6) inset', usage: 'Dropdown menus' },
    { name: 'Button',     value: '0 1px 0 rgba(255,255,255,.25) inset, 0 1px 2px rgba(42,34,26,0.08)',  usage: 'Primary button' },
  ],
  density: [
    { name: 'Compact',     scale: 0.82, key: 'compact',     isDefault: true, usage: 'Default — information-dense' },
    { name: 'Comfortable', scale: 1.00, key: 'comfortable',               usage: 'Standard spacing' },
    { name: 'Roomy',       scale: 1.16, key: 'roomy',                     usage: 'Relaxed reading' },
  ],
};

// ─── SHARED CONSTANTS ──────────────────────────────────────────────────────

const DSC = {
  paper: '#ebe1cb', panel: '#e2d6bb', card: '#fdf8eb', cardAlt: '#fefcf3',
  ink: '#2a221a', ink2: '#3d3328', muted: '#655a4a', mute2: '#7a6e5e',
  rule: '#cdbe9c', ruleSoft: '#d9cbb0',
  ok: '#62753a', warn: '#a05a12', bad: '#9b2c1f', accent: '#b84e2c',
};

const DSF = {
  display: '"Inter Tight", "Neue Haas Grotesk", system-ui, sans-serif',
  body:    '"Inter", system-ui, sans-serif',
  mono:    '"JetBrains Mono", ui-monospace, monospace',
};

function dshex(c, a = 1) {
  if (a >= 1) return c;
  return c + Math.round(a * 255).toString(16).padStart(2, '0');
}

// Returns DSC.ink or '#ffffff' based on accent background luminance (WCAG)
function accentText(hex) {
  const r = parseInt(hex.slice(1,3),16)/255;
  const g = parseInt(hex.slice(3,5),16)/255;
  const b = parseInt(hex.slice(5,7),16)/255;
  const lin = v => v <= 0.04045 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);
  const L = 0.2126*lin(r) + 0.7152*lin(g) + 0.0722*lin(b);
  return L > 0.18 ? DSC.ink : '#ffffff';
}

// ─── SECTION WRAPPER ───────────────────────────────────────────────────────

function DSSection({ id, eyebrow, title, children }) {
  return (
    <section id={id} style={{ padding: '68px 0 56px', borderTop: `1px solid ${DSC.rule}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: DSC.accent, display: 'inline-block', flexShrink: 0 }} />
        <span style={{ fontFamily: DSF.body, fontSize: 11.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: DSC.accent }}>{eyebrow}</span>
      </div>
      <h2 style={{ fontFamily: DSF.display, fontSize: 36, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.04, color: DSC.ink, margin: '0 0 40px' }}>{title}</h2>
      {children}
    </section>
  );
}

function DSSub({ title, children }) {
  return (
    <div style={{ marginBottom: 44 }}>
      <div style={{ fontFamily: DSF.mono, fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: DSC.muted, marginBottom: 16, fontWeight: 600 }}>{title}</div>
      {children}
    </div>
  );
}

// ─── COLOR SECTION ─────────────────────────────────────────────────────────

function ColorChip({ hex, name, token, role }) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => { navigator.clipboard?.writeText(hex).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1200); };
  const isLight = parseInt(hex.slice(1, 3), 16) > 180;
  return (
    <button onClick={copy} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
      <div style={{ position: 'relative', width: '100%', paddingBottom: '68%', borderRadius: 12, background: hex, border: isLight ? `1px solid ${DSC.rule}` : 'none', overflow: 'hidden', boxShadow: '0 1px 3px rgba(42,34,26,0.08)' }}>
        {copied && (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.18)', fontFamily: DSF.mono, fontSize: 10, fontWeight: 700, color: isLight ? DSC.ink : '#fff', letterSpacing: '0.1em' }}>COPIED</div>
        )}
      </div>
      <div style={{ paddingTop: 8 }}>
        <div style={{ fontFamily: DSF.body, fontSize: 13, fontWeight: 600, color: DSC.ink }}>{name}</div>
        <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, marginTop: 1, letterSpacing: '0.04em' }}>{hex.toUpperCase()}</div>
        <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.mute2, marginTop: 2 }}>{role}</div>
      </div>
    </button>
  );
}

function AccentCard({ hex, name, id, isDefault, role }) {
  const [copied, setCopied] = React.useState(false);
  const copy = (e) => { e.stopPropagation(); navigator.clipboard?.writeText(hex).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1200); };
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)', display: 'flex', flexDirection: 'column' }}>
      {/* Color header */}
      <button onClick={copy} style={{ background: hex, padding: '20px 18px 18px', position: 'relative', overflow: 'hidden', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'block' }}>
        <div style={{ position: 'absolute', right: -22, top: -22, width: 100, height: 100, borderRadius: 999, background: 'rgba(255,255,255,0.10)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 16, bottom: 12, width: 44, height: 44, borderRadius: 999, background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        {isDefault && <div style={{ position: 'absolute', top: 12, right: 12, fontFamily: DSF.body, fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.92)', background: 'rgba(255,255,255,0.22)', padding: '3px 8px', borderRadius: 999, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Default</div>}
        <div style={{ fontFamily: DSF.display, fontSize: 20, fontWeight: 600, color: '#fff', letterSpacing: '-0.02em', position: 'relative' }}>{name}</div>
        <div style={{ fontFamily: DSF.mono, fontSize: 10.5, color: 'rgba(255,255,255,0.72)', marginTop: 4, letterSpacing: '0.06em', position: 'relative' }}>{hex.toUpperCase()}</div>
        {copied && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.18)', fontFamily: DSF.mono, fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '0.1em' }}>COPIED</div>}
      </button>
      {/* Body — tint scale + samples + role */}
      <div style={{ padding: '12px 14px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Tint scale */}
        <div style={{ display: 'flex', gap: 3 }}>
          {[{ a: 1, l: '100' }, { a: 0.5, l: '50' }, { a: 0.25, l: '25' }, { a: 0.10, l: '10' }].map(s => (
            <div key={s.l} style={{ flex: 1 }}>
              <div style={{ height: 10, background: dshex(hex, s.a), borderRadius: 3, border: s.a < 0.3 ? `1px solid ${DSC.rule}` : 'none', boxSizing: 'border-box' }} />
              <div style={{ fontFamily: DSF.mono, fontSize: 8.5, color: DSC.muted, marginTop: 3, textAlign: 'center', letterSpacing: '0.04em' }}>{s.l}</div>
            </div>
          ))}
        </div>
        {/* Sample components */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ background: hex, color: accentText(hex), borderRadius: 999, padding: '6px 12px', fontFamily: DSF.body, fontSize: 11.5, fontWeight: 600 }}>RSVP</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: dshex(hex, 0.14), color: hex, fontFamily: DSF.body, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999 }}>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: 'currentColor' }} />
            Mentor
          </span>
        </div>
        {/* Role */}
        {role && <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, lineHeight: 1.45, marginTop: 'auto' }}>{role}</div>}
        {/* Token id */}
        <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.mute2, letterSpacing: '0.04em' }}>palette.{id}</div>
      </div>
    </div>
  );
}

function AccentLab() {
  const [active, setActive] = React.useState('terracotta');
  const accent = DS_TOKENS.accents.find(a => a.id === active) || DS_TOKENS.accents[0];
  const c = accent.hex;

  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 18, padding: 20, boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
      {/* Picker row */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
        {DS_TOKENS.accents.map(a => {
          const on = a.id === active;
          return (
            <button key={a.id} onClick={() => setActive(a.id)} style={{ background: on ? a.hex : DSC.cardAlt, color: on ? accentText(a.hex) : DSC.ink, border: `1px solid ${on ? a.hex : DSC.rule}`, padding: '7px 14px 7px 9px', borderRadius: 999, fontFamily: DSF.body, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'background 140ms ease, color 140ms ease, border-color 140ms ease' }}>
              <span style={{ width: 14, height: 14, background: a.hex, borderRadius: 999, border: on ? '1px solid rgba(255,255,255,0.7)' : `1px solid ${dshex(DSC.ink, 0.18)}`, flexShrink: 0 }} />
              {a.name}
            </button>
          );
        })}
      </div>

      {/* Live composition that uses the active accent */}
      <div style={{ background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: 16, padding: 24, position: 'relative', overflow: 'hidden' }}>
        {/* Background circle motif tinted with active accent */}
        <svg aria-hidden="true" width="260" height="160" viewBox="0 0 260 160" style={{ position: 'absolute', right: -40, top: -30, opacity: 0.18, pointerEvents: 'none', transition: 'opacity 200ms ease' }}>
          <circle cx="100" cy="90" r="70" fill="none" stroke={c}      strokeWidth="1.5" />
          <circle cx="170" cy="90" r="70" fill="none" stroke={DSC.ok} strokeWidth="1.5" />
        </svg>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 22, alignItems: 'flex-start', position: 'relative' }}>
          {/* Left — greeting + member card */}
          <div>
            <div style={{ fontFamily: DSF.body, fontSize: 11.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: c, display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'color 180ms ease' }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: c, transition: 'background 180ms ease' }} />
              The {accent.name.toLowerCase()} edit · Class of '14
            </div>
            <h3 style={{ fontFamily: DSF.display, fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.1, color: DSC.ink, margin: '8px 0 0' }}>
              Lead the way. <span style={{ color: DSC.muted }}>What brings you in?</span>
            </h3>

            {/* Member card sample */}
            <div style={{ marginTop: 18, background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: 14, boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontFamily: DSF.mono, fontSize: 10, letterSpacing: '0.14em', color: DSC.mute2, textTransform: 'uppercase', fontWeight: 600 }}>'11 · Brooklyn</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: dshex(c, 0.14), color: c, fontFamily: DSF.body, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999, transition: 'background 180ms ease, color 180ms ease' }}>
                  <span style={{ width: 5, height: 5, borderRadius: 999, background: 'currentColor' }} />
                  Open to mentor
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 999, background: `linear-gradient(135deg, ${c}, ${DSC.ok})`, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: DSF.display, fontSize: 13, fontWeight: 600, flexShrink: 0, transition: 'background 220ms ease' }}>IO</div>
                <div>
                  <div style={{ fontFamily: DSF.display, fontSize: 16, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.01em' }}>Iris Okonkwo</div>
                  <div style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted, marginTop: 1 }}>VP Investments · Common Capital</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                <button style={{ background: c, color: accentText(c), border: 'none', borderRadius: 999, padding: '7px 14px', fontFamily: DSF.body, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 0 rgba(255,255,255,.25) inset, 0 1px 2px rgba(42,34,26,0.08)', transition: 'background 180ms ease' }}>Send intro</button>
                <button style={{ background: DSC.cardAlt, color: DSC.ink, border: `1px solid ${DSC.rule}`, borderRadius: 999, padding: '7px 14px', fontFamily: DSF.body, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>View profile</button>
              </div>
            </div>
          </div>

          {/* Right — count pill, progress, banner */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Count pill */}
            <div>
              <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Count pill</div>
              <span style={{ fontFamily: DSF.body, fontSize: 12, fontWeight: 600, color: c, background: dshex(c, 0.12), padding: '4px 12px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'background 180ms ease, color 180ms ease' }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor' }} />
                3 replies you owe
              </span>
            </div>

            {/* Progress bar */}
            <div>
              <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Progress</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 5, fontFamily: DSF.body }}>
                <span style={{ fontWeight: 600, color: DSC.ink2 }}>Event capacity</span>
                <span style={{ color: DSC.muted }}>70%</span>
              </div>
              <div style={{ background: DSC.rule, borderRadius: 999, height: 6, overflow: 'hidden' }}>
                <div style={{ background: c, height: '100%', width: '70%', borderRadius: 999, transition: 'background 180ms ease' }} />
              </div>
            </div>

            {/* Mini AI badge */}
            <div>
              <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>AI match badge</div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: dshex(c, 0.10), border: `1px solid ${dshex(c, 0.30)}`, padding: '5px 11px', borderRadius: 999, transition: 'background 180ms ease, border-color 180ms ease' }}>
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 1.5L9.3 6.7L14.5 8L9.3 9.3L8 14.5L6.7 9.3L1.5 8L6.7 6.7Z" fill={c} /></svg>
                <span style={{ fontFamily: DSF.body, fontSize: 10.5, fontWeight: 700, color: c, letterSpacing: '0.06em', textTransform: 'uppercase', transition: 'color 180ms ease' }}>Why this match?</span>
              </span>
            </div>

            {/* Role caption */}
            <div style={{ marginTop: 'auto', padding: '10px 12px', background: dshex(c, 0.07), border: `1px solid ${dshex(c, 0.20)}`, borderRadius: 12, fontFamily: DSF.body, fontSize: 11.5, color: DSC.ink2, lineHeight: 1.5, transition: 'background 180ms ease, border-color 180ms ease' }}>
              <strong style={{ color: c, fontWeight: 700, transition: 'color 180ms ease' }}>{accent.name}</strong> — {accent.role}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToneCompareScene({ label, tone, note, isLifted }) {
  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${DSC.rule}`, boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
      {/* Label strip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', background: DSC.cardAlt, borderBottom: `1px solid ${DSC.rule}`, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {isLifted && <span style={{ width: 6, height: 6, borderRadius: 999, background: DSC.accent }} />}
          <span style={{ fontFamily: DSF.mono, fontSize: 10.5, color: isLifted ? DSC.accent : DSC.ink, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>{label}</span>
        </div>
        <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted }}>{note}</div>
      </div>

      {/* The scene — uses the passed-in tone for paper / card / rule */}
      <div style={{ background: tone.paper, padding: 18 }}>
        {/* Section eyebrow */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: DSC.accent }} />
            <span style={{ fontFamily: DSF.body, fontSize: 10.5, color: DSC.accent, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>On your desk</span>
          </div>
          <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.mute2, letterSpacing: '0.06em' }}>3 replies</div>
        </div>

        {/* Member card */}
        <div style={{ background: tone.card, border: `1px solid ${tone.rule}`, borderRadius: 12, padding: '12px 14px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <DSAvatar name="Iris Okonkwo" initials="IO" size={34} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: DSF.display, fontSize: 14, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.01em' }}>Iris Okonkwo</div>
            <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, marginTop: 2 }}>VP Investments · Common Capital</div>
          </div>
          <span style={{ background: dshex(DSC.accent, 0.14), color: DSC.accent, fontFamily: DSF.body, fontSize: 10.5, fontWeight: 700, padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>Mentor</span>
        </div>

        {/* Rule line for dense-list context */}
        <div style={{ height: 1, background: tone.rule, margin: '10px 0' }} />

        {/* Second tile + action */}
        <div style={{ background: tone.cardAlt, border: `1px solid ${tone.ruleSoft}`, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted, lineHeight: 1.4 }}><strong style={{ color: DSC.ink, fontWeight: 700 }}>3 mentor requests</strong> · oldest waiting 6 days</div>
          <button style={{ background: DSC.accent, color: '#fff', border: 'none', borderRadius: 999, padding: '6px 12px', fontFamily: DSF.body, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Open →</button>
        </div>
      </div>
    </div>
  );
}

function SurfaceVariation({ name, paper, card, treatment, desc, useCase }) {
  const isInverse = treatment === 'inverse';
  const cardBase = { background: card, borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, position: 'relative' };

  const treatments = {
    lift:       { ...cardBase, border: `1px solid ${dshex(DSC.muted, 0.30)}`, boxShadow: '0 1px 0 rgba(255,255,255,.6) inset' },
    sink:       { ...cardBase, background: card, border: `1px solid ${dshex(DSC.ink, 0.08)}`, boxShadow: `inset 0 2px 4px ${dshex(DSC.ink, 0.10)}, inset 0 0 0 1px ${dshex('#fff', 0.20)}` },
    outline:    { ...cardBase, background: paper, border: `1.5px solid ${DSC.ink2}`, borderRadius: 8 },
    float:      { ...cardBase, border: 'none', boxShadow: `0 10px 22px ${dshex(DSC.ink, 0.18)}, 0 1px 0 rgba(255,255,255,.7) inset` },
    tint:       { ...cardBase, border: `1px solid ${dshex(DSC.accent, 0.30)}`, boxShadow: `0 4px 12px ${dshex(DSC.accent, 0.15)}` },
    inset:      { ...cardBase, background: paper, border: `1px solid ${dshex(DSC.ink, 0.10)}`, boxShadow: `inset 0 3px 6px ${dshex(DSC.ink, 0.14)}`, opacity: 0.85 },
    stratified: { ...cardBase, border: `1px solid ${dshex(DSC.muted, 0.30)}`, boxShadow: '0 1px 0 rgba(255,255,255,.6) inset' },
    inverse:    { ...cardBase, background: DSC.ink, border: 'none', boxShadow: '0 8px 18px rgba(42,34,26,0.35), 0 1px 0 rgba(255,255,255,.06) inset' },
  };

  const fg = isInverse ? DSC.paper : DSC.ink;
  const fgMuted = isInverse ? dshex(DSC.paper, 0.60) : DSC.muted;

  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${DSC.rule}`, background: DSC.card, boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
      {/* Live scene */}
      <div style={{ background: paper, padding: 16, minHeight: 110 }}>
        <div style={treatments[treatment]}>
          <span style={{ width: 26, height: 26, borderRadius: 999, background: `linear-gradient(135deg, ${DSC.accent}, ${DSC.ok})`, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: DSF.display, fontSize: 10.5, fontWeight: 700, flexShrink: 0, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.18)' }}>IO</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: DSF.display, fontSize: 12, fontWeight: 600, color: fg, letterSpacing: '-0.005em', lineHeight: 1.2 }}>Iris Okonkwo</div>
            <div style={{ fontFamily: DSF.body, fontSize: 10, color: fgMuted, marginTop: 1 }}>VP Investments</div>
          </div>
          <span style={{ background: isInverse ? dshex(DSC.accent, 0.30) : dshex(DSC.accent, 0.14), color: isInverse ? '#ffaa8c' : DSC.accent, fontFamily: DSF.body, fontSize: 9, fontWeight: 700, padding: '2.5px 8px', borderRadius: 999, letterSpacing: '0.06em' }}>MENTOR</span>
          {treatment === 'stratified' && (
            <span style={{ position: 'absolute', top: -4, right: -4, background: '#fbf5e6', border: `1px solid ${dshex(DSC.muted, 0.28)}`, borderRadius: 6, padding: '2px 7px', fontFamily: DSF.mono, fontSize: 8, fontWeight: 700, color: DSC.ink, letterSpacing: '0.06em', boxShadow: '0 2px 5px rgba(42,34,26,0.10)' }}>3</span>
          )}
        </div>
      </div>

      {/* Info strip */}
      <div style={{ padding: '12px 14px', borderTop: `1px solid ${DSC.ruleSoft}`, background: DSC.card }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 5 }}>
          <span style={{ fontFamily: DSF.display, fontSize: 13, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.01em' }}>{name}</span>
          <span style={{ fontFamily: DSF.mono, fontSize: 8.5, color: DSC.mute2, letterSpacing: '0.04em' }}>{paper.toUpperCase()} → {card.toUpperCase()}</span>
        </div>
        <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, lineHeight: 1.45 }}>{desc}</div>
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${DSC.ruleSoft}` }}>
          <div style={{ fontFamily: DSF.mono, fontSize: 8.5, color: DSC.mute2, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>Use for</div>
          <div style={{ fontFamily: DSF.body, fontSize: 11, color: DSC.ink2, lineHeight: 1.4, marginTop: 2 }}>{useCase}</div>
        </div>
      </div>
    </div>
  );
}

function ColorSection() {
  const surfaces = DS_TOKENS.palette.filter(p => p.group === 'Surfaces');
  const text     = DS_TOKENS.palette.filter(p => p.group === 'Text');
  const semantic = DS_TOKENS.palette.filter(p => p.group === 'Semantic');
  return (
    <DSSection id="color" eyebrow="Foundation · 01" title="Color">
      <DSSub title="Accent options — 7 grounded hues, all interchangeable">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {DS_TOKENS.accents.map(a => <AccentCard key={a.id} {...a} />)}
        </div>
        <p style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.muted, lineHeight: 1.6, marginTop: 16, maxWidth: 640 }}>
          All seven accents sit at similar perceived luminance and chroma — they swap cleanly via the Tweaks panel with no layout changes. Each carries its own community feeling: <strong style={{ color: DSC.ink }}>Terracotta</strong> invites, <strong style={{ color: DSC.ink }}>Saffron</strong> celebrates, <strong style={{ color: DSC.ink }}>Lake</strong> settles, <strong style={{ color: DSC.ink }}>Indigo</strong> archives, <strong style={{ color: DSC.ink }}>Heather</strong> closes the day.
        </p>
      </DSSub>

      <DSSub title="Accent lab — try one, see everything re-skin">
        <AccentLab />
      </DSSub>

      <DSSub title="Surface palette — warm oat base">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(118px, 1fr))', gap: 14 }}>
          {surfaces.map(s => <ColorChip key={s.token} {...s} />)}
        </div>
      </DSSub>

      <DSSub title="Text hierarchy — warm bark to sand">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(118px, 1fr))', gap: 14 }}>
          {text.map(s => <ColorChip key={s.token} {...s} />)}
        </div>
      </DSSub>

      <DSSub title="Semantic — olive · amber · rust">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, maxWidth: 420 }}>
          {semantic.map(s => <ColorChip key={s.token} {...s} />)}
        </div>
      </DSSub>

      <DSSub title="Surface tone presets — controls warmth system-wide">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {DS_TOKENS.tones.map(t => {
            const fg = t.dark ? '#f0e5d0' : DSC.ink;
            const fgMuted = t.dark ? '#998a72' : DSC.muted;
            return (
              <div key={t.name} style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${DSC.rule}` }}>
                <div style={{ background: t.paper, padding: '18px 14px 12px' }}>
                  <div style={{ background: t.card, borderRadius: 8, padding: '10px 12px', border: `1px solid ${t.rule}`, fontFamily: DSF.body, fontSize: 12, color: fg, fontWeight: 500 }}>Card surface</div>
                </div>
                <div style={{ background: t.paper, padding: '0 14px 14px' }}>
                  <div style={{ height: 1, background: t.rule, marginBottom: 10 }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, fontFamily: DSF.body, color: fg }}>{t.name}</div>
                    {t.dark && <span style={{ fontFamily: DSF.mono, fontSize: 8.5, padding: '2px 6px', background: 'rgba(255,255,255,0.10)', color: fg, borderRadius: 999, letterSpacing: '0.08em', fontWeight: 700 }}>DARK</span>}
                  </div>
                  <div style={{ fontSize: 11.5, color: fgMuted, fontFamily: DSF.body, marginTop: 3, lineHeight: 1.4 }}>{t.note}</div>
                </div>
              </div>
            );
          })}
        </div>
      </DSSub>

      <DSSub title="Lifted vs Warm — fixes the wash-out without losing warmth">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, alignItems: 'flex-start' }}>
          <ToneCompareScene
            label="Warm · classic"
            tone={{ paper: '#efe7d8', card: '#f8f1e2', cardAlt: '#fbf6ea', rule: '#d8ccb6', ruleSoft: '#e4dcca' }}
            note="Card +5% above paper · soft rules"
          />
          <ToneCompareScene
            label="Lifted · new default"
            tone={{ paper: '#ebe1cb', card: '#fdf8eb', cardAlt: '#fefcf3', rule: '#cdbe9c', ruleSoft: '#d9cbb0' }}
            note="Card +10% above paper · rules 6pt darker"
            isLifted
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 14, padding: '14px 16px', background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 12 }}>
          {[
            { label: 'Paper',  warm: '#efe7d8', lifted: '#ebe1cb', delta: 'Pushed oat — base reads warmer, not whiter' },
            { label: 'Card',   warm: '#f8f1e2', lifted: '#fdf8eb', delta: 'Brighter — gives real elevation above paper' },
            { label: 'Rule',   warm: '#d8ccb6', lifted: '#cdbe9c', delta: 'Stronger — crisper hierarchy in dense lists' },
          ].map(d => (
            <div key={d.label}>
              <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>{d.label}</div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 6 }}>
                <div style={{ flex: 1, height: 22, background: d.warm, border: `1px solid ${DSC.rule}`, borderRadius: 4 }} title={`Warm ${d.warm}`} />
                <span style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted }}>→</span>
                <div style={{ flex: 1, height: 22, background: d.lifted, border: `1px solid ${DSC.rule}`, borderRadius: 4 }} title={`Lifted ${d.lifted}`} />
              </div>
              <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.mute2, letterSpacing: '0.04em', marginBottom: 4 }}>{d.warm.toUpperCase()} → {d.lifted.toUpperCase()}</div>
              <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, lineHeight: 1.5 }}>{d.delta}</div>
            </div>
          ))}
        </div>
        <p style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.muted, lineHeight: 1.6, marginTop: 14, maxWidth: 720 }}>
          Text colors, accents, and shadows stay identical — only paper, card, and rule shift. Tags and buttons keep their saturation; against the brighter Lifted card they actually read with more confidence than they did on the flat Warm surface. Now the system default; Warm available as the classic option.
        </p>
      </DSSub>

      <DSSub title="Surface relationships — eight ways to distinguish card from paper">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <SurfaceVariation name="Lifted" paper="#efe7d8" card="#fdf8eb" treatment="lift" desc="Card brighter than paper. Soft 1px rule. The default move." useCase="General member tiles, event cards, list rows" />
          <SurfaceVariation name="Sunk" paper="#f6f1e2" card="#e6dcc8" treatment="sink" desc="Card darker than paper — recedes into the page." useCase="Background context cards, secondary info, archive states" />
          <SurfaceVariation name="Outlined" paper="#efe7d8" card="#efe7d8" treatment="outline" desc="Same fill on both. Defined by a 1.5px ink border alone." useCase="Technical UIs, settings panels, schematic views" />
          <SurfaceVariation name="Floating" paper="#efe7d8" card="#fbf5e6" treatment="float" desc="Borderless. A heavy shadow does all the lifting." useCase="Modals, popovers, hero CTAs, primary actions" />
          <SurfaceVariation name="Tinted" paper="#efe7d8" card="#fbf2e6" treatment="tint" desc="Card subtly tinted toward the accent. Soft branded warmth." useCase="Anniversary cards, status flags, celebration moments" />
          <SurfaceVariation name="Inset" paper="#efe7d8" card="#efe7d8" treatment="inset" desc="Card depressed into paper. Inset shadow, slight de-saturation." useCase="Disabled fields, archived rows, read-only states" />
          <SurfaceVariation name="Stratified" paper="#e6dcc8" card="#f0e6d2" treatment="stratified" desc="Three nested surface levels visible at once." useCase="Nested data, complex forms, dense dashboards" />
          <SurfaceVariation name="Inverse" paper="#efe7d8" card="#2a221a" treatment="inverse" desc="Dark card on bright paper — maximum lift, dramatic contrast." useCase="Hero spotlights, feature callouts, 'On Deck' banners" />
        </div>
        <p style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.muted, lineHeight: 1.6, marginTop: 16, maxWidth: 760 }}>
          The Lifted preset solves the wash-out by going brighter. But you can also distinguish card from paper by going <em>darker</em> (Sunk), by going <em>colder</em> (Inverse), or by using <em>line</em> instead of fill (Outlined). Mix-and-match in one page: outlined panels for settings, lifted cards for content, inverse for the weekly spotlight, stratified for nested data. Each strategy speaks at a different volume.
        </p>
      </DSSub>

      <DSSub title="Card tone options — card surface only">
        <div style={{ display: 'flex', gap: 12 }}>
          {DS_TOKENS.cardTones.map(ct => (
            <div key={ct.name} style={{ flex: 1 }}>
              <div style={{ background: ct.hex, border: `1px solid ${DSC.rule}`, borderRadius: 10, height: 52, boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }} />
              <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, fontFamily: DSF.body, color: DSC.ink }}>{ct.name}</div>
              <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, marginTop: 2 }}>{ct.hex.toUpperCase()}</div>
              <div style={{ fontSize: 11.5, color: DSC.muted, fontFamily: DSF.body, marginTop: 3 }}>{ct.note}</div>
            </div>
          ))}
        </div>
      </DSSub>
    </DSSection>
  );
}

// ─── TYPOGRAPHY SECTION ────────────────────────────────────────────────────

function TypeSection() {
  return (
    <DSSection id="type" eyebrow="Foundation · 02" title="Typography">
      <DSSub title="Font families">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {Object.entries(DS_TOKENS.fonts).map(([k, f]) => (
            <div key={k} style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 16, padding: '22px 20px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
              <div style={{ fontSize: 44, fontFamily: f.family, fontWeight: 600, color: DSC.ink, lineHeight: 1, letterSpacing: '-0.02em' }}>Aa</div>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: DSF.body, color: DSC.ink, marginTop: 14 }}>{f.label}</div>
              <div style={{ fontSize: 12, color: DSC.muted, fontFamily: DSF.body, marginTop: 2 }}>{f.role}</div>
              <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.mute2, marginTop: 10, letterSpacing: '0.04em', wordBreak: 'break-all' }}>{f.family.split(',')[0].replace(/"/g, '')}</div>
            </div>
          ))}
        </div>
      </DSSub>

      <DSSub title="Type scale — live samples">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {DS_TOKENS.typeScale.map((s, i) => {
            const fam = DS_TOKENS.fonts[s.family]?.family || DSF.body;
            const capped = Math.min(s.size, 52);
            return (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '108px 1fr 160px',
                gap: 16, padding: '14px 0', alignItems: 'center',
                borderBottom: `1px solid ${DSC.ruleSoft}`,
              }}>
                <div>
                  <div style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.ink2, fontWeight: 600, letterSpacing: '0.04em' }}>{s.label}</div>
                  <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, marginTop: 2 }}>{s.size}px · {s.weight}</div>
                </div>
                <div style={{
                  fontFamily: fam, fontSize: capped, fontWeight: s.weight,
                  letterSpacing: s.tracking, lineHeight: s.lh,
                  color: DSC.ink, textTransform: s.eyebrow ? 'uppercase' : 'none',
                  overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                }}>
                  {s.eyebrow ? 'Section Label · Eyebrow' : 'BridgeCircle Network'}
                </div>
                <div style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted, textAlign: 'right' }}>{s.usage}</div>
              </div>
            );
          })}
        </div>
      </DSSub>
    </DSSection>
  );
}

// ─── SPACE & SHAPE SECTION ─────────────────────────────────────────────────

function SpaceSection() {
  return (
    <DSSection id="space" eyebrow="Foundation · 03" title="Space & Shape">

      <DSSub title="Border radius tokens">
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {DS_TOKENS.radii.map(r => (
            <div key={r.name} style={{ textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: Math.min(r.value, 36), boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 4px rgba(42,34,26,0.06)', margin: '0 auto' }} />
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: DSF.body, color: DSC.ink, marginTop: 10 }}>{r.name}</div>
              <div style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.muted, marginTop: 2 }}>{r.css}</div>
              <div style={{ fontSize: 11.5, color: DSC.mute2, fontFamily: DSF.body, marginTop: 3, maxWidth: 90, textAlign: 'center' }}>{r.usage}</div>
            </div>
          ))}
        </div>
      </DSSub>

      <DSSub title="Elevation / box-shadow scale">
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {DS_TOKENS.shadows.map((s) => (
            <div key={s.name} style={{ textAlign: 'center' }}>
              <div style={{ width: 100, height: 70, background: DSC.card, borderRadius: 12, boxShadow: s.value, border: `1px solid ${DSC.rule}` }} />
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: DSF.body, color: DSC.ink, marginTop: 10 }}>{s.name}</div>
              <div style={{ fontSize: 11.5, color: DSC.muted, fontFamily: DSF.body, marginTop: 3, maxWidth: 110 }}>{s.usage}</div>
            </div>
          ))}
        </div>
      </DSSub>

      <DSSub title="Density scale — all spacing multiplied by this factor">
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {DS_TOKENS.density.map(d => (
            <div key={d.key} style={{ flex: 1, minWidth: 160 }}>
              <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 16, padding: `${Math.round(22 * d.scale)}px ${Math.round(18 * d.scale)}px`, boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontFamily: DSF.body, color: DSC.ink, fontWeight: 600 }}>Sample card</div>
                <div style={{ fontSize: 12, color: DSC.muted, fontFamily: DSF.body, marginTop: Math.round(5 * d.scale) }}>Body text preview</div>
                <div style={{ height: 1, background: DSC.rule, margin: `${Math.round(10 * d.scale)}px 0` }} />
                <div style={{ display: 'inline-block', background: DSC.accent, borderRadius: 999, padding: `${Math.round(6 * d.scale)}px ${Math.round(12 * d.scale)}px`, fontSize: 12, color: '#fff', fontFamily: DSF.body, fontWeight: 600 }}>Action</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: DSF.body, color: DSC.ink, display: 'flex', alignItems: 'center', gap: 8 }}>
                {d.name}
                {d.isDefault && <span style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.accent, fontWeight: 700, letterSpacing: '0.06em', background: dshex(DSC.accent, 0.10), padding: '2px 7px', borderRadius: 999 }}>DEFAULT</span>}
              </div>
              <div style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.muted, marginTop: 2 }}>scale: {d.scale}</div>
              <div style={{ fontSize: 11.5, color: DSC.muted, fontFamily: DSF.body, marginTop: 3 }}>{d.usage}</div>
            </div>
          ))}
        </div>
      </DSSub>

    </DSSection>
  );
}

window.DS_TOKENS = DS_TOKENS;
window.DSC = DSC;
window.DSF = DSF;
window.dshex = dshex;
window.accentText = accentText;
window.DSSection = DSSection;
window.DSSub = DSSub;
window.ColorSection = ColorSection;
window.TypeSection = TypeSection;
window.SpaceSection = SpaceSection;
