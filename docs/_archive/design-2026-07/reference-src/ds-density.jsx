/* eslint-disable */
// Atrium Design System — Density & Breakpoints (Section 52)

function DensityBreakpointsSection() {
  return (
    <DSSection id="density" eyebrow="Components · 52" title="Density & Breakpoints">

      <DSSub title="Density modes — three scales, same content">
        <DensityModes />
      </DSSub>

      <DSSub title="Breakpoint table — the full responsive ladder">
        <BreakpointTable />
      </DSSub>

      <DSSub title="What changes at each breakpoint — a worked example">
        <ResponsiveExample />
      </DSSub>

    </DSSection>
  );
}

function DensityModes() {
  const [mode, setMode] = React.useState('comfortable');
  const cfg = {
    compact:     { scale: 0.82, padX: 12, padY: 8,  rowGap: 4,  avatarSize: 24, fontSize: 12,   subSize: 10.5 },
    comfortable: { scale: 1.00, padX: 14, padY: 10, rowGap: 6,  avatarSize: 30, fontSize: 13.5, subSize: 11.5 },
    roomy:       { scale: 1.16, padX: 18, padY: 14, rowGap: 10, avatarSize: 36, fontSize: 15,   subSize: 12.5 },
  }[mode];

  const rows = [
    { name: 'Iris Okonkwo',    cohort: "'11", role: 'VP Investments · Common Capital' },
    { name: 'Dev Patel',       cohort: "'11", role: 'Partner, Greenleaf Ventures' },
    { name: 'Rosa Ferrara',    cohort: "'17", role: 'CEO, Solaris Grid · Lagos' },
    { name: 'Sam Aldridge',    cohort: "'11", role: 'Climate engineer, Watershed' },
    { name: 'Theo Harrington', cohort: "'20", role: 'Product, Waymark' },
  ];

  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: 18 }}>
      {/* Mode picker */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'inline-flex', gap: 2, background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: 999, padding: 2 }}>
          {['compact', 'comfortable', 'roomy'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ padding: '6px 14px', background: mode === m ? DSC.ink : 'transparent', color: mode === m ? DSC.paper : DSC.muted, border: 'none', borderRadius: 999, fontFamily: DSF.body, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{m[0].toUpperCase() + m.slice(1)}</button>
          ))}
        </div>
        <span style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.muted, letterSpacing: '0.06em' }}>Scale × {cfg.scale.toFixed(2)}</span>
      </div>

      {/* List */}
      <div style={{ background: DSC.cardAlt, border: `1px solid ${DSC.ruleSoft}`, borderRadius: 10, overflow: 'hidden' }}>
        {rows.map((r, i) => (
          <div key={r.name} style={{ display: 'grid', gridTemplateColumns: `${cfg.avatarSize + 12}px 1fr auto`, alignItems: 'center', padding: `${cfg.padY}px ${cfg.padX}px`, borderTop: i === 0 ? 'none' : `1px solid ${DSC.ruleSoft}`, transition: 'padding 160ms ease' }}>
            <DSAvatar name={r.name} initials={r.name.split(' ').map(s => s[0]).join('')} size={cfg.avatarSize} />
            <div style={{ minWidth: 0, marginRight: 8 }}>
              <div style={{ fontFamily: DSF.body, fontSize: cfg.fontSize, fontWeight: 600, color: DSC.ink, transition: 'font-size 160ms ease' }}>{r.name}</div>
              <div style={{ fontFamily: DSF.body, fontSize: cfg.subSize, color: DSC.muted, marginTop: cfg.rowGap / 2, lineHeight: 1.4, transition: 'font-size 160ms ease' }}>{r.role}</div>
            </div>
            <span style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.accent, letterSpacing: '0.10em', fontWeight: 700 }}>{r.cohort}</span>
          </div>
        ))}
      </div>

      {/* Token effects */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16, padding: '12px 14px', background: DSC.cardAlt, borderRadius: 10 }}>
        {[
          { label: 'Row padding',  value: `${cfg.padY}px / ${cfg.padX}px` },
          { label: 'Avatar size',  value: `${cfg.avatarSize}px` },
          { label: 'Body size',    value: `${cfg.fontSize}px` },
          { label: 'Sub size',     value: `${cfg.subSize}px` },
        ].map(s => (
          <div key={s.label}>
            <div style={{ fontFamily: DSF.mono, fontSize: 9, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontFamily: DSF.mono, fontSize: 12, color: DSC.ink, fontWeight: 700, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BreakpointTable() {
  const rows = [
    { name: 'Phone XS',    min: '< 360',  max: '359px',   token: '--bp-xs',  cols: '1', nav: 'Bottom nav (5 tabs)',       gutter: '12px', card: '12px',  use: 'iPhone SE, small Android' },
    { name: 'Phone',       min: '360',    max: '599px',   token: '--bp-sm',  cols: '1', nav: 'Bottom nav (5 tabs)',       gutter: '14px', card: '14px',  use: 'Default mobile' },
    { name: 'Tablet',      min: '600',    max: '899px',   token: '--bp-md',  cols: '2', nav: 'Top floating · no labels', gutter: '20px', card: '16px',  use: 'Portrait tablets, large phones' },
    { name: 'Laptop',      min: '900',    max: '1199px',  token: '--bp-lg',  cols: '3', nav: 'Top floating · with labels', gutter: '24px', card: '18px',  use: 'Small laptops' },
    { name: 'Desktop',     min: '1200',   max: '1535px',  token: '--bp-xl',  cols: '4', nav: 'Top floating · full nav',    gutter: '24px', card: '20px',  use: 'Standard desktop' },
    { name: 'Wide',        min: '≥ 1536', max: '∞',       token: '--bp-2xl', cols: '4', nav: 'Top floating · full nav',    gutter: '32px', card: '22px',  use: 'Large monitors · max width 1280' },
  ];
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '120px 100px 90px 90px 50px 160px 90px 90px 1fr', padding: '10px 16px', background: DSC.panel, borderBottom: `1px solid ${DSC.rule}`, fontFamily: DSF.mono, fontSize: 9.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: DSC.muted, fontWeight: 700, gap: 6 }}>
        <span>Name</span><span>Token</span><span>Min</span><span>Max</span><span>Cols</span><span>Nav</span><span>Gutter</span><span>Card pad</span><span>Used for</span>
      </div>
      {rows.map((r, i) => (
        <div key={r.token} style={{ display: 'grid', gridTemplateColumns: '120px 100px 90px 90px 50px 160px 90px 90px 1fr', padding: '11px 16px', borderTop: i === 0 ? 'none' : `1px solid ${DSC.ruleSoft}`, alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.ink, fontWeight: 700 }}>{r.name}</span>
          <span style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.accent, fontWeight: 700, letterSpacing: '0.04em' }}>{r.token}</span>
          <span style={{ fontFamily: DSF.mono, fontSize: 11, color: DSC.ink2 }}>{r.min}</span>
          <span style={{ fontFamily: DSF.mono, fontSize: 11, color: DSC.muted }}>{r.max}</span>
          <span style={{ fontFamily: DSF.display, fontSize: 14, fontWeight: 700, color: DSC.ink, fontVariantNumeric: 'tabular-nums' }}>{r.cols}</span>
          <span style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.ink2 }}>{r.nav}</span>
          <span style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.ink2 }}>{r.gutter}</span>
          <span style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.ink2 }}>{r.card}</span>
          <span style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, lineHeight: 1.4 }}>{r.use}</span>
        </div>
      ))}
    </div>
  );
}

function ResponsiveExample() {
  const stops = [
    { name: 'Phone',  w: 320, cols: 1 },
    { name: 'Tablet', w: 720, cols: 2 },
    { name: 'Laptop', w: 1080, cols: 3 },
    { name: 'Wide',   w: 1440, cols: 4 },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
      {stops.map(s => (
        <div key={s.name} style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', background: DSC.cardAlt, borderBottom: `1px solid ${DSC.ruleSoft}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontFamily: DSF.display, fontSize: 13, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.005em' }}>{s.name}</span>
            <span style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.accent, letterSpacing: '0.06em', fontWeight: 700 }}>{s.w}px · {s.cols} col</span>
          </div>
          <div style={{ padding: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${s.cols}, 1fr)`, gap: 4 }}>
              {Array.from({ length: s.cols * 2 }).map((_, i) => (
                <div key={i} style={{ aspectRatio: '1 / 1.2', background: dshex(DSC.accent, 0.10 + (i % 2) * 0.06), border: `1px solid ${dshex(DSC.accent, 0.22)}`, borderRadius: 4 }} />
              ))}
            </div>
            <div style={{ height: 1, background: DSC.rule, margin: '10px 0' }} />
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4, fontFamily: DSF.mono, fontSize: 10, color: DSC.muted }}>
              <li>cols · <strong style={{ color: DSC.ink, fontWeight: 700 }}>{s.cols}</strong></li>
              <li>nav · <strong style={{ color: DSC.ink, fontWeight: 700 }}>{s.cols === 1 ? 'Bottom' : 'Top floating'}</strong></li>
              <li>typescale · <strong style={{ color: DSC.ink, fontWeight: 700 }}>{s.cols === 1 ? 'Mobile (×0.9)' : s.cols >= 3 ? 'Full' : 'Default'}</strong></li>
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

window.DensityBreakpointsSection = DensityBreakpointsSection;
