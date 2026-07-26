/* eslint-disable */
// Atrium Design System — Brand Asset Library (Section 48)

function BrandAssetsSection() {
  return (
    <DSSection id="brand" eyebrow="Components · 48" title="Brand Asset Library">

      <DSSub title="Wordmark lockups — four sanctioned arrangements">
        <Lockups />
      </DSSub>

      <DSSub title="Clear space — minimum breathing room around the mark">
        <ClearSpace />
      </DSSub>

      <DSSub title="Minimum sizes — never go smaller">
        <MinimumSizes />
      </DSSub>

      <DSSub title="Color variations — on paper, on ink, on accent">
        <BrandColorways />
      </DSSub>

      <DSSub title="Misuse — what never to do">
        <BrandMisuse />
      </DSSub>

    </DSSection>
  );
}

function Mark({ accent = '#b84e2c', ok = '#62753a', size = 32, single = false }) {
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 32 24" aria-hidden="true">
      <circle cx="11" cy="12" r="9" fill={accent} fillOpacity="0.85" />
      {!single && <circle cx="21" cy="12" r="9" fill={ok}     fillOpacity="0.85" />}
    </svg>
  );
}

function Wordmark({ size = 18, color = DSC.ink, accent, ok, single }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.5 }}>
      <Mark size={size * 1.7} accent={accent} ok={ok} single={single} />
      <span style={{ fontFamily: DSF.display, fontSize: size, fontWeight: 600, color, letterSpacing: '-0.02em' }}>BridgeCircle</span>
    </div>
  );
}

function WordmarkStacked({ size = 18, color = DSC.ink }) {
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <Mark size={size * 2.4} />
      <span style={{ fontFamily: DSF.display, fontSize: size, fontWeight: 600, color, letterSpacing: '-0.02em' }}>BridgeCircle</span>
    </div>
  );
}

function Lockups() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
      <LockupCard label="Horizontal · default" use="Web header · email · documents">
        <Wordmark size={22} />
      </LockupCard>
      <LockupCard label="Stacked · for square contexts" use="Avatar tiles · favicons at large size · merch">
        <WordmarkStacked size={18} />
      </LockupCard>
      <LockupCard label="Mark only · single circle" use="When BridgeCircle is in the surrounding context already" >
        <Mark size={56} single />
      </LockupCard>
      <LockupCard label="Mark only · two circles" use="App icon · favicon · social profile">
        <Mark size={56} />
      </LockupCard>
    </div>
  );
}

function LockupCard({ label, use, children }) {
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ background: DSC.cardAlt, padding: 36, display: 'grid', placeItems: 'center', borderBottom: `1px solid ${DSC.ruleSoft}`, minHeight: 140 }}>
        {children}
      </div>
      <div style={{ padding: '12px 16px 14px' }}>
        <div style={{ fontFamily: DSF.display, fontSize: 13, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.005em' }}>{label}</div>
        <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, marginTop: 4, lineHeight: 1.5 }}>{use}</div>
      </div>
    </div>
  );
}

function ClearSpace() {
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 240 }}>
      <div style={{ position: 'relative', padding: 36, border: `1.5px dashed ${dshex(DSC.accent, 0.50)}`, borderRadius: 10, background: 'rgba(199,90,58,0.04)' }}>
        <Wordmark size={22} />
        {/* Annotations */}
        {['top','right','bottom','left'].map(s => (
          <span key={s} style={{ position: 'absolute',
            ...(s === 'top'    && { top: 6, left: '50%', transform: 'translateX(-50%)' }),
            ...(s === 'bottom' && { bottom: 6, left: '50%', transform: 'translateX(-50%)' }),
            ...(s === 'left'   && { left: 6, top: '50%', transform: 'translateY(-50%)' }),
            ...(s === 'right'  && { right: 6, top: '50%', transform: 'translateY(-50%)' }),
            fontFamily: DSF.mono, fontSize: 9, color: DSC.accent, fontWeight: 700, letterSpacing: '0.06em', background: DSC.card, padding: '0 5px', borderRadius: 3 }}>X</span>
        ))}
        <span style={{ position: 'absolute', top: -22, right: 0, fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.06em' }}>X = height of the wordmark</span>
        <span style={{ position: 'absolute', bottom: -26, left: 0, right: 0, fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, textAlign: 'center', lineHeight: 1.5 }}>Keep at least one "X" of empty space on every side of the mark. Use this for headers, business cards, and certificate prints.</span>
      </div>
    </div>
  );
}

function MinimumSizes() {
  const sizes = [
    { label: 'Wordmark',    px: 16, ok: 'Documents, footers, in-line attribution' },
    { label: 'Wordmark',    px: 14, ok: 'Email footers (minimum)', danger: true },
    { label: 'Mark only',   px: 20, ok: 'Favicons (28+ recommended)' },
    { label: 'Mark only',   px: 16, ok: 'Avatar tiles (minimum)', danger: true },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
      {sizes.map((s, i) => (
        <div key={i} style={{ background: DSC.card, border: `1px solid ${s.danger ? dshex(DSC.warn, 0.40) : DSC.rule}`, borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <span style={{ fontFamily: DSF.display, fontSize: 13.5, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.01em' }}>{s.label}</span>
            <span style={{ fontFamily: DSF.mono, fontSize: 10.5, color: s.danger ? DSC.warn : DSC.accent, fontWeight: 700, letterSpacing: '0.06em' }}>{s.danger ? 'MIN · ' : 'OK · '}{s.px}px</span>
          </div>
          <div style={{ background: DSC.cardAlt, border: `1px solid ${DSC.ruleSoft}`, borderRadius: 8, padding: 18, display: 'grid', placeItems: 'center', minHeight: 80 }}>
            {s.label === 'Mark only' ? <Mark size={s.px} /> : <Wordmark size={s.px} />}
          </div>
          <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, marginTop: 8, lineHeight: 1.45 }}>{s.ok}</div>
        </div>
      ))}
    </div>
  );
}

function BrandColorways() {
  const ways = [
    { name: 'Default · on paper',  bg: '#efe7d8', renderProps: {} },
    { name: 'Inverse · on ink',    bg: '#1a1612', renderProps: { color: '#f0e5d0' } },
    { name: 'On Lamplight card',   bg: '#2a221a', renderProps: { color: '#f0e5d0' } },
    { name: 'Solid · on accent',   bg: '#b84e2c', renderProps: { color: '#fff', accent: '#fff', ok: '#fff' } },
    { name: 'Mono · ink-on-paper', bg: '#ebe1cb', renderProps: { color: '#1a1612', accent: '#1a1612', ok: '#1a1612' } },
    { name: 'Mono · white-on-ink', bg: '#1a1612', renderProps: { color: '#fff', accent: '#fff', ok: '#fff' } },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
      {ways.map((w, i) => (
        <div key={i} style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ background: w.bg, padding: 28, display: 'grid', placeItems: 'center', minHeight: 96 }}>
            <Wordmark size={18} {...w.renderProps} />
          </div>
          <div style={{ padding: '10px 14px', borderTop: `1px solid ${DSC.ruleSoft}`, fontFamily: DSF.body, fontSize: 11.5, fontWeight: 600, color: DSC.ink2 }}>{w.name}</div>
        </div>
      ))}
    </div>
  );
}

function BrandMisuse() {
  const dont = [
    { label: 'Don\u2019t recolor the circles',  render: <Wordmark size={18} accent="#3f5680" ok="#7a3a5e" /> },
    { label: 'Don\u2019t separate mark + word', render: <div style={{ display: 'inline-flex', alignItems: 'center', gap: 28 }}><Mark size={32} /><span style={{ fontFamily: DSF.display, fontSize: 18, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.02em' }}>BridgeCircle</span></div> },
    { label: 'Don\u2019t rotate or warp',       render: <div style={{ transform: 'rotate(-6deg) skewX(-4deg)' }}><Wordmark size={18} /></div> },
    { label: 'Don\u2019t add a drop shadow',    render: <div style={{ filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.55))' }}><Wordmark size={18} /></div> },
    { label: 'Don\u2019t outline the circles',   render: <svg width="32" height="24" viewBox="0 0 32 24"><circle cx="11" cy="12" r="9" fill="none" stroke="#c75a3a" strokeWidth="2" /><circle cx="21" cy="12" r="9" fill="none" stroke="#62753a" strokeWidth="2" /></svg> },
    { label: 'Don\u2019t change the wordmark font', render: <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}><Mark size={32} /><span style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: DSC.ink, fontStyle: 'italic' }}>BridgeCircle</span></div> },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
      {dont.map((d, i) => (
        <div key={i} style={{ background: DSC.card, border: `1px solid ${dshex(DSC.bad, 0.30)}`, borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: 999, background: DSC.bad, color: '#fff', display: 'grid', placeItems: 'center', zIndex: 1 }}>
            <Icon name="close" size={12} color="currentColor" strokeWidth={3.2} />
          </div>
          <div style={{ background: DSC.cardAlt, padding: 22, display: 'grid', placeItems: 'center', minHeight: 100, opacity: 0.85 }}>
            {d.render}
          </div>
          <div style={{ padding: '10px 14px', borderTop: `1px solid ${DSC.ruleSoft}`, fontFamily: DSF.body, fontSize: 12, color: DSC.bad, fontWeight: 600 }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

window.BrandAssetsSection = BrandAssetsSection;
