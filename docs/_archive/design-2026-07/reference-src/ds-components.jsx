/* eslint-disable */
// HISTORICAL PROTOTYPE ONLY. Do not copy these Atrium primitives into
// production. Use ../components.md and app/src/components/ui/.
// Atrium Design System — Standalone primitives + component showcase sections

// ─── STANDALONE PRIMITIVES ─────────────────────────────────────────────────
// These work without ThemeCtx — suitable for the design system doc.

function DSButton({ children, variant = 'primary', size = 'md', disabled, leadIcon, style: extraStyle, onMouseDown, onMouseUp, onMouseLeave, onClick, ...rest }) {
  const sizes = { sm: { padding: '8px 14px', fontSize: 12.5 }, md: { padding: '11px 18px', fontSize: 13.5 }, lg: { padding: '14px 22px', fontSize: 14.5 } };
  const variants = {
    primary: { background: DSC.accent, color: '#fff', border: `1px solid ${DSC.accent}`, boxShadow: '0 1px 0 rgba(255,255,255,.25) inset, 0 1px 2px rgba(42,34,26,0.08)' },
    outline: { background: DSC.cardAlt, color: DSC.ink, border: `1px solid ${DSC.rule}`, boxShadow: 'none' },
    ghost:   { background: 'transparent', color: DSC.ink, border: '1px solid transparent', boxShadow: 'none' },
    ink:     { background: DSC.ink, color: DSC.paper, border: `1px solid ${DSC.ink}`, boxShadow: 'none' },
  };
  // Defensive: strip leadIcon/leadicon if any tooling re-injects it. Never to DOM.
  delete rest.leadIcon;
  delete rest.leadicon;
  const [dn, setDn] = React.useState(false);
  return (
    <button {...rest} disabled={disabled} onClick={onClick}
      onMouseDown={e => { setDn(true); onMouseDown?.(e); }}
      onMouseUp={e => { setDn(false); onMouseUp?.(e); }}
      onMouseLeave={e => { setDn(false); onMouseLeave?.(e); }}
      style={{ ...sizes[size], ...variants[variant], fontFamily: DSF.body, fontWeight: 600, letterSpacing: 0.1, borderRadius: 999, cursor: disabled ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: disabled ? 0.45 : 1, transform: dn ? 'translateY(0.5px)' : '', transition: 'transform 100ms ease', ...extraStyle }}>
      {leadIcon && <span style={{ display: 'inline-flex' }}>{leadIcon}</span>}
      {children}
    </button>
  );
}

function DSTag({ children, tone = 'muted', dot }) {
  const tones = {
    muted:  { background: dshex(DSC.ink, 0.05),    color: DSC.muted,  border: `1px solid ${DSC.rule}` },
    accent: { background: dshex(DSC.accent, 0.13), color: DSC.accent, border: `1px solid ${dshex(DSC.accent, 0.30)}` },
    ok:     { background: dshex(DSC.ok, 0.13),     color: DSC.ok,     border: `1px solid ${dshex(DSC.ok, 0.30)}` },
    warn:   { background: dshex(DSC.warn, 0.14),   color: DSC.warn,   border: `1px solid ${dshex(DSC.warn, 0.30)}` },
    bad:    { background: dshex(DSC.bad, 0.11),    color: DSC.bad,    border: `1px solid ${dshex(DSC.bad, 0.28)}` },
  };
  return (
    <span style={{ ...tones[tone], fontFamily: DSF.body, fontSize: 11.5, fontWeight: 600, letterSpacing: 0.2, padding: '4px 10px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor', flexShrink: 0 }} />}
      {children}
    </span>
  );
}

function DSAvatar({ name, initials, size = 44 }) {
  const seed = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const pairs = [[DSC.accent, DSC.ok], [DSC.ok, DSC.ink], [DSC.accent, DSC.ink]];
  const [a, b] = pairs[seed % 3];
  return (
    <div style={{ width: size, height: size, borderRadius: 999, background: `linear-gradient(135deg, ${a}, ${b})`, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: DSF.display, fontSize: Math.round(size * 0.36), fontWeight: 600, letterSpacing: '-0.01em', flexShrink: 0, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.18)' }}>
      {initials}
    </div>
  );
}

function DSEyebrow({ children, accent }) {
  return (
    <div style={{ fontFamily: DSF.body, fontSize: 11.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: DSC.muted, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {accent && <span style={{ width: 6, height: 6, borderRadius: 999, background: DSC.accent, flexShrink: 0 }} />}
      {children}
    </div>
  );
}

function DSTogglePill({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{ background: active ? DSC.ink : DSC.cardAlt, color: active ? DSC.paper : DSC.ink, border: `1px solid ${active ? DSC.ink : DSC.rule}`, padding: '8px 14px', borderRadius: 999, fontFamily: DSF.body, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, transition: 'background 100ms ease' }}>
      <span style={{ width: 8, height: 8, borderRadius: 999, background: active ? DSC.accent : 'transparent', border: active ? 'none' : `1px solid ${DSC.mute2}`, display: 'inline-block', flexShrink: 0 }} />
      {children}
    </button>
  );
}

// ─── SHOWCASE HELPERS ──────────────────────────────────────────────────────

function ShowRow({ label, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>{label}</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>{children}</div>
    </div>
  );
}

function ShowCard({ title, children, span }) {
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 16, padding: '22px 20px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)', gridColumn: span ? `span ${span}` : undefined }}>
      <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 18 }}>{title}</div>
      {children}
    </div>
  );
}

function PropTable({ rows }) {
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 12, overflow: 'hidden', marginTop: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 110px', background: DSC.panel, padding: '8px 16px', fontFamily: DSF.mono, fontSize: 10, letterSpacing: '0.07em', textTransform: 'uppercase', color: DSC.muted }}>
        <span>Prop</span><span>Type</span><span>Default</span>
      </div>
      {rows.map((r, i) => (
        <div key={r.prop} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 110px', padding: '9px 16px', borderTop: `1px solid ${DSC.ruleSoft}`, fontFamily: DSF.mono, fontSize: 11.5 }}>
          <span style={{ color: DSC.accent, fontWeight: 600 }}>{r.prop}</span>
          <span style={{ color: DSC.ink2, opacity: 0.85 }}>{r.type}</span>
          <span style={{ color: DSC.muted }}>{r.default}</span>
        </div>
      ))}
    </div>
  );
}

// ─── BUTTONS SECTION ───────────────────────────────────────────────────────

function ButtonsSection() {
  const PlusIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
  );
  const SearchIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><line x1="16" y1="16" x2="21" y2="21" /></svg>
  );
  return (
    <DSSection id="buttons" eyebrow="Components · 01" title="Buttons">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <ShowCard title="Variants × sizes">
          <ShowRow label="Primary">
            <DSButton size="sm">Small</DSButton>
            <DSButton size="md">Medium</DSButton>
            <DSButton size="lg">Large</DSButton>
          </ShowRow>
          <ShowRow label="Outline">
            <DSButton variant="outline" size="sm">Small</DSButton>
            <DSButton variant="outline" size="md">Medium</DSButton>
            <DSButton variant="outline" size="lg">Large</DSButton>
          </ShowRow>
          <ShowRow label="Ghost">
            <DSButton variant="ghost" size="sm">Small</DSButton>
            <DSButton variant="ghost" size="md">Medium</DSButton>
            <DSButton variant="ghost" size="lg">Large</DSButton>
          </ShowRow>
          <ShowRow label="Ink">
            <DSButton variant="ink" size="sm">Small</DSButton>
            <DSButton variant="ink" size="md">Medium</DSButton>
            <DSButton variant="ink" size="lg">Large</DSButton>
          </ShowRow>
        </ShowCard>
        <ShowCard title="States & compositions">
          <ShowRow label="Disabled">
            <DSButton disabled>Primary</DSButton>
            <DSButton variant="outline" disabled>Outline</DSButton>
            <DSButton variant="ink" disabled>Ink</DSButton>
          </ShowRow>
          <ShowRow label="With lead icon">
            <DSButton leadIcon={<PlusIcon />}>Invite member</DSButton>
            <DSButton variant="outline" leadIcon={<SearchIcon />}>Search</DSButton>
          </ShowRow>
          <ShowRow label="Full-width">
            <DSButton style={{ width: '100%', justifyContent: 'center' }}>Open inbox →</DSButton>
          </ShowRow>
          <ShowRow label="Inline text link">
            <button style={{ background: 'none', border: 'none', padding: 0, fontFamily: DSF.body, fontSize: 13, fontWeight: 600, color: DSC.accent, cursor: 'pointer' }}>Clear AI search</button>
            <button style={{ background: 'none', border: 'none', padding: 0, fontFamily: DSF.body, fontSize: 13, fontWeight: 600, color: DSC.muted, cursor: 'pointer' }}>Browse →</button>
          </ShowRow>
        </ShowCard>
      </div>
      <PropTable rows={[
        { prop: 'variant',  type: '"primary" | "outline" | "ghost" | "ink"', default: '"primary"' },
        { prop: 'size',     type: '"sm" | "md" | "lg"',                      default: '"md"' },
        { prop: 'leadIcon', type: 'ReactNode',                               default: 'undefined' },
        { prop: 'disabled', type: 'boolean',                                  default: 'false' },
        { prop: 'as',       type: 'ElementType',                              default: '"button"' },
      ]} />
    </DSSection>
  );
}

// ─── TAGS & BADGES SECTION ─────────────────────────────────────────────────

function TagsSection() {
  return (
    <DSSection id="tags" eyebrow="Components · 02" title="Tags & Badges">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <ShowCard title="Tag tones">
          <ShowRow label="Without dot">
            <DSTag tone="muted">Muted</DSTag>
            <DSTag tone="accent">Accent</DSTag>
            <DSTag tone="ok">OK</DSTag>
            <DSTag tone="warn">Warn</DSTag>
            <DSTag tone="bad">Bad</DSTag>
          </ShowRow>
          <ShowRow label="With dot indicator">
            <DSTag tone="muted" dot>Pending</DSTag>
            <DSTag tone="accent" dot>Open to mentor</DSTag>
            <DSTag tone="ok" dot>Active thread</DSTag>
            <DSTag tone="warn" dot>Waiting 4d</DSTag>
            <DSTag tone="bad" dot>Overdue</DSTag>
          </ShowRow>
          <ShowRow label="In-context examples">
            <DSTag tone="ok" dot>joined recently</DSTag>
            <DSTag tone="warn" dot>Waiting</DSTag>
            <DSTag tone="muted">T−7d · Upcoming</DSTag>
            <DSTag tone="accent" dot>Hosting</DSTag>
          </ShowRow>
        </ShowCard>

        <ShowCard title="Badges & chips">
          <ShowRow label="Nav notification badge">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: DSC.ink, padding: '9px 16px', borderRadius: 999 }}>
              <span style={{ fontFamily: DSF.body, fontSize: 13.5, fontWeight: 600, color: DSC.paper }}>Inbox</span>
              <span style={{ fontFamily: DSF.body, fontSize: 11, fontWeight: 700, color: '#fff', background: DSC.accent, borderRadius: 999, padding: '0 6px', minWidth: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
            </div>
          </ShowRow>
          <ShowRow label="AI match badge">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: dshex(DSC.accent, 0.10), border: `1px solid ${dshex(DSC.accent, 0.30)}`, padding: '5px 11px', borderRadius: 999 }}>
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 1.5L9.3 6.7L14.5 8L9.3 9.3L8 14.5L6.7 9.3L1.5 8L6.7 6.7Z" fill={DSC.accent} /></svg>
              <span style={{ fontFamily: DSF.body, fontSize: 10.5, fontWeight: 700, color: DSC.accent, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Why this match?</span>
            </div>
          </ShowRow>
          <ShowRow label="Accent count pill">
            <span style={{ fontFamily: DSF.body, fontSize: 12, fontWeight: 600, color: DSC.accent, background: dshex(DSC.accent, 0.12), padding: '4px 12px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor' }} />
              3 replies you owe
            </span>
          </ShowRow>
          <ShowRow label="Mono meta tag">
            <span style={{ fontFamily: DSF.mono, fontSize: 10, letterSpacing: '0.14em', color: DSC.mute2, textTransform: 'uppercase', fontWeight: 600 }}>'11 · Brooklyn</span>
          </ShowRow>
        </ShowCard>
      </div>
      <PropTable rows={[
        { prop: 'tone', type: '"muted" | "accent" | "ok" | "warn" | "bad"', default: '"muted"' },
        { prop: 'dot',  type: 'boolean',                                     default: 'false' },
      ]} />
    </DSSection>
  );
}

// ─── AVATARS SECTION ───────────────────────────────────────────────────────

function AvatarsSection() {
  const people = [
    { name: 'Iris Okonkwo', initials: 'IO' },
    { name: 'Maren Holt',   initials: 'MH' },
    { name: 'Dev Patel',    initials: 'DP' },
    { name: 'Sam Aldridge', initials: 'SA' },
    { name: 'Rosa Ferrara', initials: 'RF' },
    { name: 'Juno Park',    initials: 'JP' },
  ];
  return (
    <DSSection id="avatars" eyebrow="Components · 03" title="Avatars">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <ShowCard title="Size scale">
          <div style={{ display: 'flex', gap: 18, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            {[20, 26, 32, 38, 44, 56, 72].map(s => (
              <div key={s} style={{ textAlign: 'center' }}>
                <DSAvatar name="Iris Okonkwo" initials="IO" size={s} />
                <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, marginTop: 6 }}>{s}</div>
              </div>
            ))}
          </div>
        </ShowCard>

        <ShowCard title="Gradient palette — seeded from name">
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {people.map(p => (
              <div key={p.name} style={{ textAlign: 'center' }}>
                <DSAvatar name={p.name} initials={p.initials} size={44} />
                <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, marginTop: 6 }}>{p.initials}</div>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.muted, marginTop: 16, lineHeight: 1.55 }}>
            Three gradient pairs — accent↔ok · ok↔ink · accent↔ink. Determined by charCode sum of the name, stable across renders.
          </p>
        </ShowCard>
      </div>

      <ShowCard title="Avatar chip — nav context">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Compact */}
          <button style={{ display: 'inline-flex', padding: 3, borderRadius: 999, background: DSC.paper, border: `1px solid ${DSC.rule}`, cursor: 'pointer' }}>
            <DSAvatar name="Maren Holt" initials="MH" size={30} />
          </button>
          {/* With name + caret */}
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '3px 12px 3px 3px', borderRadius: 999, background: DSC.paper, border: `1px solid ${DSC.rule}`, cursor: 'pointer' }}>
            <DSAvatar name="Maren Holt" initials="MH" size={28} />
            <span style={{ fontSize: 13, fontWeight: 600, fontFamily: DSF.body, color: DSC.ink }}>Maren</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={DSC.muted} strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
          </button>
          {/* Open state */}
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '3px 12px 3px 3px', borderRadius: 999, background: DSC.paper, border: `1px solid ${DSC.ink}`, cursor: 'pointer' }}>
            <DSAvatar name="Maren Holt" initials="MH" size={28} />
            <span style={{ fontSize: 13, fontWeight: 600, fontFamily: DSF.body, color: DSC.ink }}>Maren</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={DSC.muted} strokeWidth="2" style={{ transform: 'rotate(180deg)' }}><polyline points="6 9 12 15 18 9" /></svg>
          </button>
          <span style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.muted, letterSpacing: '0.04em' }}>compact · default · open</span>
        </div>
      </ShowCard>
      <PropTable rows={[
        { prop: 'name',     type: 'string', default: '""' },
        { prop: 'initials', type: 'string', default: '""' },
        { prop: 'size',     type: 'number', default: '44' },
        { prop: 'accent',   type: 'string (hex)', default: 'palette.accent' },
      ]} />
    </DSSection>
  );
}

// ─── INPUTS & CONTROLS SECTION ─────────────────────────────────────────────

function InputsSection() {
  const [on, setOn] = React.useState(true);
  const [pills, setPills] = React.useState({ mentor: true, near: false, know: false });
  return (
    <DSSection id="inputs" eyebrow="Components · 04" title="Inputs & Controls">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <ShowCard title="Text inputs">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Standard text field */}
            {[{ label: 'City', ph: 'Brooklyn' }, { label: 'Mentor topic', ph: 'Fundraising, product-market fit…' }].map(f => (
              <div key={f.label}>
                <div style={{ fontFamily: DSF.body, fontSize: 11.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: DSC.muted, marginBottom: 6 }}>{f.label}</div>
                <input defaultValue="" placeholder={f.ph} style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${DSC.rule}`, padding: '9px 14px', fontFamily: DSF.body, fontSize: 13, background: DSC.card, borderRadius: 999, color: DSC.ink, outline: 'none' }} onFocus={e => { e.target.style.borderColor = DSC.accent; }} onBlur={e => { e.target.style.borderColor = DSC.rule; }} />
              </div>
            ))}
            {/* Year range */}
            <div>
              <div style={{ fontFamily: DSF.body, fontSize: 11.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: DSC.muted, marginBottom: 6 }}>Class of</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input defaultValue="2010" style={{ width: '100%', border: `1px solid ${DSC.rule}`, padding: '9px 12px', fontFamily: DSF.body, fontSize: 13, background: DSC.card, borderRadius: 999, color: DSC.ink, outline: 'none', boxSizing: 'border-box' }} />
                <span style={{ color: DSC.muted, fontSize: 13, flexShrink: 0 }}>–</span>
                <input defaultValue="2020" style={{ width: '100%', border: `1px solid ${DSC.rule}`, padding: '9px 12px', fontFamily: DSF.body, fontSize: 13, background: DSC.card, borderRadius: 999, color: DSC.ink, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>
        </ShowCard>

        <ShowCard title="Search & toggles">
          {/* Inline search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 999, padding: '9px 14px', background: DSC.paper, border: `1px solid ${DSC.rule}`, marginBottom: 22 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke={DSC.muted} strokeWidth="2" /><line x1="16" y1="16" x2="21" y2="21" stroke={DSC.muted} strokeWidth="2" strokeLinecap="round" /></svg>
            <span style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.mute2 }}>Find someone…</span>
          </div>
          {/* Toggle pills */}
          <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Toggle pills — interactive</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <DSTogglePill active={pills.mentor} onClick={() => setPills(p => ({ ...p, mentor: !p.mentor }))}>Open to mentor</DSTogglePill>
            <DSTogglePill active={pills.near}   onClick={() => setPills(p => ({ ...p, near: !p.near }))}>Near me</DSTogglePill>
            <DSTogglePill active={pills.know}   onClick={() => setPills(p => ({ ...p, know: !p.know }))}>People I know</DSTogglePill>
          </div>
        </ShowCard>
      </div>

      {/* Toggle switch */}
      <div style={{ marginTop: 14 }}>
        <ShowCard title="Toggle switch — helper mode pattern">
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, minWidth: 280 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, fontFamily: DSF.body, color: DSC.ink }}>Helper mode</div>
                <div style={{ fontSize: 11.5, color: DSC.muted, fontFamily: DSF.body, marginTop: 2 }}>{on ? 'On — accepting mentor requests' : 'Paused — no new requests'}</div>
              </div>
              <button onClick={() => setOn(v => !v)} style={{ width: 34, height: 20, padding: 0, border: 'none', cursor: 'pointer', borderRadius: 999, background: on ? DSC.accent : DSC.rule, position: 'relative', flexShrink: 0, transition: 'background 120ms ease' }}>
                <span style={{ position: 'absolute', top: 2, left: on ? 16 : 2, width: 16, height: 16, borderRadius: 999, background: '#fff', transition: 'left 140ms cubic-bezier(.2,.8,.2,1)', boxShadow: '0 1px 2px rgba(42,34,26,0.20)' }} />
              </button>
            </div>
            <div style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.muted, letterSpacing: '0.06em' }}>Click to toggle</div>
          </div>
        </ShowCard>
      </div>
    </DSSection>
  );
}

window.DSButton = DSButton;
window.DSTag = DSTag;
window.DSAvatar = DSAvatar;
window.DSEyebrow = DSEyebrow;
window.DSTogglePill = DSTogglePill;
window.ShowRow = ShowRow;
window.ShowCard = ShowCard;
window.PropTable = PropTable;
window.ButtonsSection = ButtonsSection;
window.TagsSection = TagsSection;
window.AvatarsSection = AvatarsSection;
window.InputsSection = InputsSection;
