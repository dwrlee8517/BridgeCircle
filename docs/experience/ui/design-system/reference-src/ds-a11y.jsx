/* eslint-disable */
// Atrium Design System — Accessibility Patterns (Section 40)

function AccessibilitySection() {
  return (
    <DSSection id="a11y" eyebrow="Components · 40" title="Accessibility Patterns">

      <DSSub title="Focus rings — 2px accent at 45% opacity, 2px offset">
        <FocusRings />
      </DSSub>

      <DSSub title="Skip links — the first thing a keyboard user meets">
        <SkipLinkDemo />
      </DSSub>

      <DSSub title="Screen-reader-only text — visible to a11y, invisible to sight">
        <SROnlyDemo />
      </DSSub>

      <DSSub title="ARIA live regions — toasts, validation, async results">
        <LiveRegionDemo />
      </DSSub>

      <DSSub title="Color contrast — every token pair, tested against WCAG">
        <ContrastTable />
      </DSSub>

      <DSSub title="Keyboard-first patterns — what each component supports">
        <KeyboardSupportTable />
      </DSSub>

    </DSSection>
  );
}

function FocusRings() {
  const samples = [
    { label: 'Button',  el: <button style={{ background: DSC.accent, color: '#fff', border: 'none', borderRadius: 999, padding: '10px 18px', fontFamily: DSF.body, fontSize: 13, fontWeight: 600, cursor: 'pointer', outline: `2px solid ${dshex(DSC.accent, 0.45)}`, outlineOffset: 2 }}>Send intro</button> },
    { label: 'Input',   el: <input defaultValue="Iris" style={{ padding: '8px 14px', border: `1px solid ${DSC.accent}`, borderRadius: 8, fontFamily: DSF.body, fontSize: 13, outline: `2px solid ${dshex(DSC.accent, 0.45)}`, outlineOffset: 2, background: DSC.card, width: 140 }} /> },
    { label: 'Link',    el: <a style={{ fontFamily: DSF.body, fontSize: 13, fontWeight: 600, color: DSC.accent, outline: `2px solid ${dshex(DSC.accent, 0.45)}`, outlineOffset: 4, borderRadius: 4, padding: '0 2px' }}>Open profile →</a> },
    { label: 'Card',    el: <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 12, padding: '12px 14px', outline: `2px solid ${dshex(DSC.accent, 0.45)}`, outlineOffset: 2, width: 160 }}>Maren Holt · '14</div> },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
      {samples.map((s, i) => (
        <div key={i} style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: 6 }}>{s.el}</div>
          <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function SkipLinkDemo() {
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: '20px 22px' }}>
      <div style={{ background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: 10, padding: 14, position: 'relative' }}>
        {/* Skip link — visible (in real app: only on focus) */}
        <a href="#main" style={{ display: 'inline-block', background: DSC.ink, color: DSC.paper, fontFamily: DSF.body, fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 999, marginBottom: 10, outline: `2px solid ${dshex(DSC.accent, 0.45)}`, outlineOffset: 2 }}>Skip to main content</a>
        <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>Page header · 5 nav items · search · avatar menu</div>
        <div style={{ borderTop: `1px dashed ${DSC.rule}`, marginTop: 12, paddingTop: 12, fontFamily: DSF.body, fontSize: 12, color: DSC.muted }}>↓ <strong style={{ color: DSC.ink, fontWeight: 600 }}>Main content</strong> — destination of the skip link.</div>
      </div>
      <p style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.ink2, lineHeight: 1.6, margin: '14px 0 0', maxWidth: 700 }}>
        Hidden by default; appears at top-left on first keyboard focus. Keyboard users save ~30 Tab keystrokes per page. Implement with <code style={{ fontFamily: DSF.mono, fontSize: 11, background: dshex(DSC.ink, 0.06), padding: '1px 6px', borderRadius: 4 }}>.sr-only:focus</code> revealing the link.
      </p>
    </div>
  );
}

function SROnlyDemo() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <VariantCard label="Icon-only button" note='Visible: bell icon. Screen reader announces: "Notifications, 3 unread".'>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <button aria-label="Notifications, 3 unread" style={{ position: 'relative', width: 38, height: 38, borderRadius: 999, background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, cursor: 'pointer', display: 'grid', placeItems: 'center', color: DSC.ink }}>
            <Icon name="bell" size={17} color="currentColor" />
            <span style={{ position: 'absolute', top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 999, background: DSC.accent, color: '#fff', fontFamily: DSF.body, fontSize: 11, fontWeight: 700, padding: '0 5px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${DSC.cardAlt}` }} aria-hidden="true">3</span>
          </button>
          <code style={{ fontFamily: DSF.mono, fontSize: 11, color: DSC.muted, lineHeight: 1.5 }}>aria-label="Notifications, 3 unread"</code>
        </div>
      </VariantCard>

      <VariantCard label="Decorative SVG" note="Marked aria-hidden so SR doesn't read decoration.">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <svg aria-hidden="true" width="60" height="40" viewBox="0 0 60 40">
            <circle cx="22" cy="20" r="14" fill="none" stroke={DSC.accent} strokeWidth="1.4" />
            <circle cx="38" cy="20" r="14" fill="none" stroke={DSC.ok} strokeWidth="1.4" />
          </svg>
          <code style={{ fontFamily: DSF.mono, fontSize: 11, color: DSC.muted }}>aria-hidden="true"</code>
        </div>
      </VariantCard>
    </div>
  );
}

function LiveRegionDemo() {
  const [count, setCount] = React.useState(0);
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 16, alignItems: 'center' }}>
        <DSButton onClick={() => setCount(c => c + 1)}>Trigger announcement</DSButton>
        <div style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.muted, lineHeight: 1.55 }}>
          Each click adds a sibling row to an <code style={{ fontFamily: DSF.mono, fontSize: 11, background: dshex(DSC.ink, 0.06), padding: '1px 6px', borderRadius: 4 }}>aria-live="polite"</code> region. Screen readers announce the change without stealing focus.
        </div>
      </div>
      <div role="status" aria-live="polite" style={{ marginTop: 14, padding: '12px 14px', background: DSC.ink, color: DSC.paper, borderRadius: 10, fontFamily: DSF.body, fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10, minHeight: 22 }}>
        {count === 0 ? <span style={{ color: 'rgba(255,255,255,0.55)', fontStyle: 'italic' }}>Empty · nothing announced yet</span> : <>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: DSC.ok }} />
          <strong style={{ fontWeight: 700 }}>{count}</strong> intro{count !== 1 ? 's' : ''} sent · last to Iris Okonkwo
        </>}
      </div>
      <div style={{ marginTop: 12, padding: 10, background: DSC.cardAlt, border: `1px dashed ${DSC.ruleSoft}`, borderRadius: 8, fontFamily: DSF.mono, fontSize: 11, color: DSC.muted, lineHeight: 1.5 }}>
        Use <strong style={{ color: DSC.accent }}>polite</strong> for toasts & success states. Use <strong style={{ color: DSC.accent }}>assertive</strong> only for errors that block the user.
      </div>
    </div>
  );
}

function ContrastTable() {
  const pairs = [
    { fg: '#2a221a', bg: '#efe7d8', name: 'Ink on paper',     ratio: 14.0 },
    { fg: '#3d3328', bg: '#efe7d8', name: 'Ink2 on paper',    ratio: 10.2 },
    { fg: '#7a6e5e', bg: '#efe7d8', name: 'Muted on paper',   ratio: 4.6 },
    { fg: '#9a8e7d', bg: '#efe7d8', name: 'Mute2 on paper',   ratio: 3.1 },
    { fg: '#c75a3a', bg: '#efe7d8', name: 'Accent on paper',  ratio: 4.6 },
    { fg: '#ffffff', bg: '#c75a3a', name: 'White on accent',  ratio: 4.6 },
    { fg: '#62753a', bg: '#efe7d8', name: 'Ok on paper',      ratio: 4.5 },
    { fg: '#9b2c1f', bg: '#efe7d8', name: 'Bad on paper',     ratio: 6.1 },
    { fg: '#f0e5d0', bg: '#1a1612', name: 'Cream on Lamp',    ratio: 13.8 },
    { fg: '#998a72', bg: '#1a1612', name: 'Muted on Lamp',    ratio: 4.7 },
  ];
  const verdict = (r) => r >= 7 ? { label: 'AAA', tone: DSC.ok } : r >= 4.5 ? { label: 'AA', tone: DSC.ok } : r >= 3 ? { label: 'AA Large', tone: DSC.warn } : { label: 'Fail', tone: DSC.bad };
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '100px 1.2fr 70px 80px 80px', padding: '10px 16px', background: DSC.panel, borderBottom: `1px solid ${DSC.rule}`, fontFamily: DSF.mono, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: DSC.muted, fontWeight: 700 }}>
        <span>Sample</span><span>Pair</span><span>Ratio</span><span>Body</span><span>Display</span>
      </div>
      {pairs.map((p, i) => {
        const v = verdict(p.ratio);
        return (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1.2fr 70px 80px 80px', padding: '10px 16px', borderTop: i === 0 ? 'none' : `1px solid ${DSC.ruleSoft}`, alignItems: 'center', gap: 12 }}>
            <div style={{ background: p.bg, color: p.fg, padding: '6px 8px', borderRadius: 6, fontFamily: DSF.body, fontSize: 12, fontWeight: 600, textAlign: 'center', border: `1px solid ${DSC.ruleSoft}` }}>Aa</div>
            <div style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.ink2 }}>{p.name}</div>
            <div style={{ fontFamily: DSF.mono, fontSize: 11, color: DSC.ink, fontWeight: 700 }}>{p.ratio.toFixed(1)}:1</div>
            <div style={{ fontFamily: DSF.body, fontSize: 10.5, fontWeight: 700, color: p.ratio >= 4.5 ? DSC.ok : DSC.bad }}>{p.ratio >= 4.5 ? '✓ Pass' : '✗ Fail'}</div>
            <div><span style={{ fontFamily: DSF.body, fontSize: 10, fontWeight: 700, color: v.tone, background: dshex(v.tone, 0.12), padding: '2px 8px', borderRadius: 999, letterSpacing: '0.06em' }}>{v.label}</span></div>
          </div>
        );
      })}
    </div>
  );
}

function KeyboardSupportTable() {
  const rows = [
    { component: 'Button', keys: 'Tab · Space / Enter', notes: 'Standard activation' },
    { component: 'Toggle', keys: 'Tab · Space',         notes: 'Space flips state' },
    { component: 'Tabs',   keys: 'Tab · ←/→',           notes: 'Arrow keys move within tablist; Tab exits' },
    { component: 'Menu',   keys: 'Tab · ↑↓ · ↵ · Esc',   notes: 'Trap focus until Esc' },
    { component: '⌘K palette', keys: '⌘K · ↑↓ · ↵ · Esc', notes: 'Open anywhere; Esc clears, then closes' },
    { component: 'Date picker', keys: '←/→ · ↑↓ · ↵ · PgUp/PgDn', notes: '←/→ days · ↑↓ weeks · PgUp/PgDn month' },
    { component: 'Modal / sheet', keys: 'Esc · Tab', notes: 'Trap focus, return to opener on close' },
    { component: 'Tooltip', keys: 'Focus to show', notes: 'Hover and focus both reveal; Esc dismisses' },
  ];
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 1.4fr', padding: '10px 16px', background: DSC.panel, borderBottom: `1px solid ${DSC.rule}`, fontFamily: DSF.mono, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: DSC.muted, fontWeight: 700 }}>
        <span>Component</span><span>Keys</span><span>Notes</span>
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 1.4fr', padding: '10px 16px', borderTop: i === 0 ? 'none' : `1px solid ${DSC.ruleSoft}`, alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: DSF.body, fontSize: 13, fontWeight: 600, color: DSC.ink }}>{r.component}</span>
          <span style={{ fontFamily: DSF.mono, fontSize: 11, color: DSC.accent, fontWeight: 700 }}>{r.keys}</span>
          <span style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted, lineHeight: 1.5 }}>{r.notes}</span>
        </div>
      ))}
    </div>
  );
}

window.AccessibilitySection = AccessibilitySection;
