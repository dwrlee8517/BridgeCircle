/* eslint-disable */
// Atrium Design System — Layout Primitives (Section 39)

function LayoutPrimitivesSection() {
  return (
    <DSSection id="layout" eyebrow="Components · 39" title="Layout Primitives">

      <DSSub title="Container widths — three named maxima">
        <Containers />
      </DSSub>

      <DSSub title="Column grids — 12-col on desktop, collapses gracefully">
        <Columns />
      </DSSub>

      <DSSub title="Stack · Cluster · Sidebar — three composition primitives">
        <CompositionPrimitives />
      </DSSub>

      <DSSub title="Dividers — hairlines, dashed, ornamental">
        <Dividers />
      </DSSub>

      <DSSub title="Spacing scale — every gap in the system">
        <SpacingScale />
      </DSSub>

    </DSSection>
  );
}

// ─── CONTAINERS ────────────────────────────────────────────────────────────

function Containers() {
  const widths = [
    { name: 'Reading',  px: 640,  use: 'Article body, single-column forms' },
    { name: 'Default',  px: 960,  use: 'Member directory, inbox, settings' },
    { name: 'Wide',     px: 1280, use: 'Home dashboard, multi-column views' },
  ];
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: '18px 20px' }}>
      {widths.map((w, i) => (
        <div key={w.name} style={{ marginBottom: i === widths.length - 1 ? 0 : 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <div>
              <span style={{ fontFamily: DSF.display, fontSize: 14, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.01em' }}>{w.name}</span>
              <span style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.accent, marginLeft: 8, fontWeight: 700, letterSpacing: '0.06em' }}>{w.px}px</span>
            </div>
            <span style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted }}>{w.use}</span>
          </div>
          <div style={{ height: 18, background: DSC.cardAlt, border: `1px dashed ${DSC.rule}`, borderRadius: 4, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(w.px / 1280) * 100}%`, background: dshex(DSC.accent, 0.20), border: `1px solid ${DSC.accent}`, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8, fontFamily: DSF.mono, fontSize: 9, color: DSC.accent, fontWeight: 700, letterSpacing: '0.04em' }}>
              {w.px}
            </div>
          </div>
        </div>
      ))}
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${DSC.ruleSoft}`, fontFamily: DSF.body, fontSize: 12, color: DSC.muted, lineHeight: 1.55 }}>
        Always center within the viewport. Gutter is <strong style={{ color: DSC.ink, fontWeight: 600 }}>24px desktop · 14px mobile</strong>. Don't exceed Wide — pages start to read like spreadsheets past 1280.
      </div>
    </div>
  );
}

// ─── COLUMNS ───────────────────────────────────────────────────────────────

function Columns() {
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>12 columns · 24px gap</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 6, marginBottom: 16 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={{ height: 36, background: dshex(DSC.accent, 0.10), border: `1px solid ${dshex(DSC.accent, 0.30)}`, borderRadius: 4, display: 'grid', placeItems: 'center', fontFamily: DSF.mono, fontSize: 10, color: DSC.accent, fontWeight: 700 }}>{i + 1}</div>
        ))}
      </div>
      <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>Common spans</div>
      {[
        { label: '12 / Full row',        spans: [12] },
        { label: '6 + 6 / Half + Half',  spans: [6, 6] },
        { label: '8 + 4 / Body + Aside', spans: [8, 4] },
        { label: '4 + 4 + 4 / Thirds',   spans: [4, 4, 4] },
        { label: '3 + 6 + 3 / Wings',    spans: [3, 6, 3] },
      ].map((row, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 6, marginBottom: 6 }}>
          {row.spans.map((s, j) => (
            <div key={j} style={{ gridColumn: `span ${s}`, height: 24, background: dshex(DSC.ink, 0.06), border: `1px solid ${DSC.rule}`, borderRadius: 4, display: 'grid', placeItems: 'center', fontFamily: DSF.mono, fontSize: 9, color: DSC.muted, letterSpacing: '0.06em' }}>{s} · {row.label.split(' / ')[1].split(' + ')[j] || row.label.split(' / ')[1]}</div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── COMPOSITION PRIMITIVES ────────────────────────────────────────────────

function CompositionPrimitives() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
      <PrimitiveCard
        name="Stack" desc="Vertical rhythm. Children separated by a single gap value."
        code="<Stack gap={16}>...</Stack>"
        preview={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[36, 24, 56, 28].map((h, i) => <div key={i} style={{ height: h, background: dshex(DSC.accent, 0.12), border: `1px solid ${dshex(DSC.accent, 0.30)}`, borderRadius: 4 }} />)}
          </div>
        }
      />
      <PrimitiveCard
        name="Cluster" desc="Horizontal row with wrap. For tag groups, button rows."
        code="<Cluster gap={8}>...</Cluster>"
        preview={
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {[60, 90, 40, 70, 110, 50, 80].map((w, i) => <div key={i} style={{ width: w, height: 22, background: dshex(DSC.ok, 0.12), border: `1px solid ${dshex(DSC.ok, 0.30)}`, borderRadius: 999 }} />)}
          </div>
        }
      />
      <PrimitiveCard
        name="Sidebar" desc="Fixed-width side + flexible main. Side collapses below breakpoint."
        code="<Sidebar side={220}>...</Sidebar>"
        preview={
          <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: 6 }}>
            <div style={{ height: 140, background: dshex('#3f5680', 0.14), border: `1px solid ${dshex('#3f5680', 0.30)}`, borderRadius: 4 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ height: 30, background: dshex(DSC.ink, 0.06), border: `1px solid ${DSC.rule}`, borderRadius: 4 }} />
              <div style={{ height: 30, background: dshex(DSC.ink, 0.06), border: `1px solid ${DSC.rule}`, borderRadius: 4 }} />
              <div style={{ height: 30, background: dshex(DSC.ink, 0.06), border: `1px solid ${DSC.rule}`, borderRadius: 4 }} />
              <div style={{ height: 30, background: dshex(DSC.ink, 0.06), border: `1px solid ${DSC.rule}`, borderRadius: 4 }} />
            </div>
          </div>
        }
      />
    </div>
  );
}

function PrimitiveCard({ name, desc, code, preview }) {
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: '18px 18px 16px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
      <div style={{ fontFamily: DSF.display, fontSize: 16, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.015em' }}>{name}</div>
      <div style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted, marginTop: 4, lineHeight: 1.5 }}>{desc}</div>
      <div style={{ marginTop: 14, padding: 14, background: DSC.cardAlt, border: `1px solid ${DSC.ruleSoft}`, borderRadius: 8 }}>{preview}</div>
      <div style={{ marginTop: 10, padding: '6px 10px', background: dshex(DSC.ink, 0.05), borderRadius: 6, fontFamily: DSF.mono, fontSize: 10.5, color: DSC.ink2 }}>{code}</div>
    </div>
  );
}

// ─── DIVIDERS ──────────────────────────────────────────────────────────────

function Dividers() {
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: '20px 22px' }}>
      {[
        { name: 'Hairline', note: 'Default between rows in a list', render: <div style={{ height: 1, background: DSC.rule }} /> },
        { name: 'Soft hairline', note: 'Within a card (less weight than card border)', render: <div style={{ height: 1, background: DSC.ruleSoft }} /> },
        { name: 'Dashed', note: 'Section break inside a single card', render: <div style={{ height: 1, background: `repeating-linear-gradient(to right, ${DSC.muted} 0 4px, transparent 4px 8px)` }} /> },
        { name: 'Heavy', note: 'Bucket header divider — Civic-style top rule', render: <div style={{ height: 2, background: DSC.ink }} /> },
        { name: 'Ornamental', note: 'For long-form section breaks. Hartwood "circle" motif', render: (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: DSC.muted, fontFamily: DSF.mono, fontSize: 9.5, letterSpacing: '0.20em', fontWeight: 700 }}>
            <div style={{ flex: 1, height: 1, background: DSC.rule }} />
            <span>§</span>
            <span style={{ color: DSC.accent }}>·</span>
            <span>✦</span>
            <span style={{ color: DSC.accent }}>·</span>
            <span>§</span>
            <div style={{ flex: 1, height: 1, background: DSC.rule }} />
          </div>
        ) },
      ].map((d, i) => (
        <div key={d.name} style={{ marginBottom: i === 4 ? 0 : 18 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontFamily: DSF.display, fontSize: 13, fontWeight: 600, color: DSC.ink }}>{d.name}</span>
            <span style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted }}>{d.note}</span>
          </div>
          {d.render}
        </div>
      ))}
    </div>
  );
}

// ─── SPACING SCALE ─────────────────────────────────────────────────────────

function SpacingScale() {
  const steps = [
    { token: 'space-0',  px: 0,   use: '—' },
    { token: 'space-1',  px: 2,   use: 'Icon to label inside a tight chip' },
    { token: 'space-2',  px: 4,   use: 'Between paired chips · row dot gap' },
    { token: 'space-3',  px: 6,   use: 'Tag gap · button icon to label' },
    { token: 'space-4',  px: 8,   use: 'Compact stack · sibling controls' },
    { token: 'space-5',  px: 10,  use: 'Avatar to text · inline icon gap' },
    { token: 'space-6',  px: 12,  use: 'Default stack · standard padding' },
    { token: 'space-7',  px: 14,  use: 'Card padding (medium)' },
    { token: 'space-8',  px: 16,  use: 'Card padding (default) · grid gap' },
    { token: 'space-9',  px: 20,  use: 'Section padding · large gap' },
    { token: 'space-10', px: 24,  use: 'Page gutter (desktop)' },
    { token: 'space-12', px: 32,  use: 'Hero padding · between sections' },
    { token: 'space-16', px: 48,  use: 'Between major page regions' },
    { token: 'space-20', px: 72,  use: 'Top of a new section (DSSection)' },
  ];
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '110px 60px 1fr 1fr', padding: '10px 16px', background: DSC.panel, borderBottom: `1px solid ${DSC.rule}`, fontFamily: DSF.mono, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: DSC.muted, fontWeight: 700 }}>
        <span>Token</span><span>px</span><span>Scale</span><span>Used for</span>
      </div>
      {steps.map((s, i) => (
        <div key={s.token} style={{ display: 'grid', gridTemplateColumns: '110px 60px 1fr 1fr', padding: '7px 16px', borderTop: i === 0 ? 'none' : `1px solid ${DSC.ruleSoft}`, alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: DSF.mono, fontSize: 11, color: DSC.accent, fontWeight: 700 }}>{s.token}</span>
          <span style={{ fontFamily: DSF.mono, fontSize: 11, color: DSC.ink2 }}>{s.px}</span>
          <span style={{ display: 'block', height: 10, background: DSC.accent, borderRadius: 2, width: `${Math.min(100, (s.px / 72) * 100)}%` }} />
          <span style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, lineHeight: 1.4 }}>{s.use}</span>
        </div>
      ))}
    </div>
  );
}

window.LayoutPrimitivesSection = LayoutPrimitivesSection;
