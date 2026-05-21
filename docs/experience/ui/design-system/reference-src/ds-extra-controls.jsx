/* eslint-disable */
// Atrium Design System — Extended Controls (Section 22)
// More button, tag, avatar variants — pulls from existing tokens, never overrides primitives.

function ExtendedControlsSection() {
  return (
    <DSSection id="extracontrols" eyebrow="Components · 22" title="Extended Controls">

      <DSSub title="More buttons — letterpress, split, icon-only, FAB, loading">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          <VariantCard label="Letterpress button" note="Inset shadow gives a depressed feel. For 'mark complete' actions.">
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <LetterpressButton>Mark as read</LetterpressButton>
              <LetterpressButton tone="accent">Confirm intro</LetterpressButton>
              <LetterpressButton tone="ink">Archive</LetterpressButton>
            </div>
          </VariantCard>

          <VariantCard label="Split button" note="Primary action + dropdown menu trigger.">
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <SplitButtonDemo />
            </div>
          </VariantCard>

          <VariantCard label="Icon-only round" note="Compact circular control — toolbar, header chrome.">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <IconRoundButton variant="primary" label="Compose"><PlusGlyph /></IconRoundButton>
              <IconRoundButton variant="outline" label="More"><DotsGlyph /></IconRoundButton>
              <IconRoundButton variant="ink" label="Search"><SearchGlyph /></IconRoundButton>
              <IconRoundButton variant="outline" label="Filter"><FilterGlyph /></IconRoundButton>
              <IconRoundButton variant="ghost" label="Bookmark"><BookmarkGlyph /></IconRoundButton>
            </div>
          </VariantCard>

          <VariantCard label="Floating action button" note="Large primary CTA — 'New post' / 'Compose intro'. Bottom-right anchor in real layouts.">
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', justifyContent: 'center', padding: '4px 0' }}>
              <FABDemo />
            </div>
          </VariantCard>

          <VariantCard label="Loading button" note="Spinner replaces label while in-flight. Disabled during.">
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <LoadingButtonDemo />
            </div>
          </VariantCard>

          <VariantCard label="Link button" note="Inline text action — keeps prose flow intact.">
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <LinkButton>Open inbox →</LinkButton>
              <LinkButton tone="muted">Skip for now</LinkButton>
              <LinkButton tone="danger">Remove</LinkButton>
            </div>
          </VariantCard>
        </div>
      </DSSub>

      <DSSub title="More tags & chips">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          <VariantCard label="Cut-corner tag" note="Angled top-right edge — feels stamped, not pasted.">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <CutCornerTag color={DSC.accent}>Hosting</CutCornerTag>
              <CutCornerTag color={DSC.ok}>Verified</CutCornerTag>
              <CutCornerTag color="#3f5680">Indigo class</CutCornerTag>
            </div>
          </VariantCard>

          <VariantCard label="Striped tag" note="Diagonal stripe fill in accent. For 'spotlight' moments.">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <StripedTag color={DSC.accent}>Featured</StripedTag>
              <StripedTag color="#b88033">Limited</StripedTag>
              <StripedTag color={DSC.ok}>Recommended</StripedTag>
            </div>
          </VariantCard>

          <VariantCard label="Removable chip" note="Tap × to remove — for filters, multi-select.">
            <RemovableChipDemo />
          </VariantCard>

          <VariantCard label="Numbered tag" note="Counted item — checklist, ranked list.">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <NumberedTag n="1">Reply to Iris</NumberedTag>
              <NumberedTag n="2">Confirm Spring Supper</NumberedTag>
              <NumberedTag n="3">Update mentor capacity</NumberedTag>
            </div>
          </VariantCard>

          <VariantCard label="Icon-leading tag" note="Tiny SVG glyph + label.">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <IconTag glyph="pin">Brooklyn</IconTag>
              <IconTag glyph="bolt" color={DSC.accent}>Active now</IconTag>
              <IconTag glyph="leaf" color={DSC.ok}>Climate</IconTag>
              <IconTag glyph="clock" color="#3f5680">5y member</IconTag>
            </div>
          </VariantCard>

          <VariantCard label="Tooltip tag" note="Hover to reveal a definition or detail.">
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <TooltipTag tip="Verified against the Hartwood alumni roster">Verified</TooltipTag>
              <TooltipTag tip="Class of \u201911 \u00b7 founding cohort" color={DSC.accent}>Founding</TooltipTag>
              <TooltipTag tip="Open to mentor up to 4 hours/month" color={DSC.ok}>Mentor</TooltipTag>
            </div>
          </VariantCard>
        </div>
      </DSSub>

      <DSSub title="More avatars">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          <VariantCard label="Avatar stack" note="Overlapping group with overflow count.">
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              <AvatarStack people={[
                { name: 'Iris', initials: 'IO' },
                { name: 'Dev',  initials: 'DP' },
                { name: 'Sam',  initials: 'SA' },
              ]} />
              <AvatarStack size={40} people={[
                { name: 'Iris', initials: 'IO' },
                { name: 'Dev',  initials: 'DP' },
                { name: 'Sam',  initials: 'SA' },
                { name: 'Rosa', initials: 'RF' },
                { name: 'Juno', initials: 'JP' },
              ]} total={12} />
            </div>
          </VariantCard>

          <VariantCard label="Badge-overlay avatar" note="Small status / role badge at corner.">
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
              <BadgeOverlayAvatar name="Iris" initials="IO" size={52} badge="verified" />
              <BadgeOverlayAvatar name="Dev"  initials="DP" size={52} badge="founding" />
              <BadgeOverlayAvatar name="Sam"  initials="SA" size={52} badge="mentor" />
              <BadgeOverlayAvatar name="Rosa" initials="RF" size={52} badge="new" />
            </div>
          </VariantCard>

          <VariantCard label="Crest avatar" note="Decorative ring frame — for hero portraits.">
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', padding: '6px 0' }}>
              <CrestAvatar name="Iris Okonkwo" initials="IO" size={64} />
              <CrestAvatar name="Maren Holt"   initials="MH" size={56} tone={DSC.ok} />
              <CrestAvatar name="Dev Patel"    initials="DP" size={64} tone="#3f5680" />
            </div>
          </VariantCard>

          <VariantCard label="Name plate" note="Avatar + name + role in business-card layout.">
            <NamePlate name="Iris Okonkwo" role="VP Investments · Common Capital" cohort="Class of '11" />
          </VariantCard>
        </div>
      </DSSub>

    </DSSection>
  );
}

// ─── BUTTON EXTRAS ─────────────────────────────────────────────────────────

function LetterpressButton({ children, tone = 'paper', onClick }) {
  const tones = {
    paper:  { bg: DSC.cardAlt, fg: DSC.ink, ring: dshex(DSC.muted, 0.30) },
    accent: { bg: dshex(DSC.accent, 0.10), fg: DSC.accent, ring: dshex(DSC.accent, 0.30) },
    ink:    { bg: dshex(DSC.ink, 0.07), fg: DSC.ink, ring: dshex(DSC.ink, 0.18) },
  };
  const t = tones[tone];
  const [dn, setDn] = React.useState(false);
  return (
    <button onClick={onClick} onMouseDown={() => setDn(true)} onMouseUp={() => setDn(false)} onMouseLeave={() => setDn(false)}
      style={{
        background: t.bg, color: t.fg, border: `1px solid ${t.ring}`,
        padding: '10px 18px', borderRadius: 10,
        fontFamily: DSF.body, fontSize: 13, fontWeight: 600,
        cursor: 'pointer', letterSpacing: 0.06,
        boxShadow: dn
          ? `inset 0 2px 4px ${dshex(DSC.ink, 0.16)}, inset 0 0 0 1px ${dshex(DSC.ink, 0.04)}`
          : `inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -2px 4px ${dshex(DSC.ink, 0.08)}, 0 1px 0 ${dshex(DSC.ink, 0.10)}`,
        transition: 'box-shadow 120ms ease',
      }}>
      {children}
    </button>
  );
}

function SplitButtonDemo() {
  const [open, setOpen] = React.useState(false);
  const [label, setLabel] = React.useState('Send intro');
  const opts = ['Send intro', 'Send & schedule', 'Save as draft'];
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button style={{ background: DSC.accent, color: '#fff', border: 'none', borderRight: `1px solid ${dshex('#000', 0.18)}`, padding: '11px 18px', borderRadius: '999px 0 0 999px', fontFamily: DSF.body, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{label}</button>
      <button onClick={() => setOpen(o => !o)} style={{ background: DSC.accent, color: '#fff', border: 'none', padding: '11px 14px', borderRadius: '0 999px 999px 0', cursor: 'pointer' }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" style={{ transform: open ? 'rotate(180deg)' : '', transition: 'transform 120ms ease' }}><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, minWidth: 180, background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 12, boxShadow: '0 16px 36px rgba(42,34,26,0.16)', overflow: 'hidden', zIndex: 5 }}>
          {opts.map(o => (
            <button key={o} onClick={() => { setLabel(o); setOpen(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '10px 14px', fontFamily: DSF.body, fontSize: 13, color: DSC.ink, cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.background = DSC.cardAlt; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function IconRoundButton({ children, variant = 'outline', label, size = 38, onClick }) {
  const variants = {
    primary: { bg: DSC.accent,  fg: '#fff',      bd: DSC.accent },
    outline: { bg: DSC.card,    fg: DSC.ink,     bd: DSC.rule },
    ghost:   { bg: 'transparent', fg: DSC.muted, bd: 'transparent' },
    ink:     { bg: DSC.ink,     fg: DSC.paper,   bd: DSC.ink },
  };
  const v = variants[variant];
  return (
    <button onClick={onClick} aria-label={label} title={label} style={{ width: size, height: size, borderRadius: 999, background: v.bg, color: v.fg, border: `1px solid ${v.bd}`, cursor: 'pointer', display: 'grid', placeItems: 'center', transition: 'transform 120ms ease, background 120ms ease, color 120ms ease' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; if (variant === 'ghost') e.currentTarget.style.background = dshex(DSC.ink, 0.06); }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; if (variant === 'ghost') e.currentTarget.style.background = 'transparent'; }}>
      {children}
    </button>
  );
}

function FABDemo() {
  const [hov, setHov] = React.useState(false);
  return (
    <button onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ width: 56, height: 56, borderRadius: 999, background: DSC.accent, color: '#fff', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', boxShadow: hov ? `0 14px 28px ${dshex(DSC.accent, 0.45)}, 0 0 0 6px ${dshex(DSC.accent, 0.12)}` : `0 8px 18px ${dshex(DSC.accent, 0.35)}`, transform: hov ? 'scale(1.05)' : 'scale(1)', transition: 'all 200ms cubic-bezier(0.2,0.8,0.2,1)' }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
    </button>
  );
}

function LoadingButtonDemo() {
  const [loading, setLoading] = React.useState(false);
  return (
    <>
      <button onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 2200); }} disabled={loading}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: DSC.accent, color: '#fff', border: 'none', borderRadius: 999, padding: '11px 20px', fontFamily: DSF.body, fontSize: 13, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.85 : 1 }}>
        {loading && <Spinner />}
        {loading ? 'Sending intro…' : 'Send intro'}
      </button>
      <button onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 2200); }} disabled={loading}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: DSC.cardAlt, color: DSC.ink, border: `1px solid ${DSC.rule}`, borderRadius: 999, padding: '11px 20px', fontFamily: DSF.body, fontSize: 13, fontWeight: 600, cursor: loading ? 'wait' : 'pointer' }}>
        {loading && <Spinner color={DSC.muted} />}
        {loading ? 'Refreshing…' : 'Refresh'}
      </button>
    </>
  );
}

function Spinner({ color = '#fff', size = 14 }) {
  return (
    <span style={{ display: 'inline-block', width: size, height: size, borderRadius: 999, border: `2px solid ${dshex(color, 0.25)}`, borderTopColor: color, animation: 'ds-halo-spin 0.8s linear infinite' }} />
  );
}

function LinkButton({ children, tone = 'accent', onClick }) {
  const colors = { accent: DSC.accent, muted: DSC.muted, danger: DSC.bad };
  return (
    <button onClick={onClick} style={{ background: 'none', border: 'none', padding: 0, fontFamily: DSF.body, fontSize: 13.5, fontWeight: 600, color: colors[tone], cursor: 'pointer', borderBottom: `1px dashed ${dshex(colors[tone], 0.45)}`, paddingBottom: 1 }}>
      {children}
    </button>
  );
}

// ─── INLINE GLYPHS ─────────────────────────────────────────────────────────

function PlusGlyph()     { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>; }
function DotsGlyph()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/></svg>; }
function SearchGlyph()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7"/><line x1="16" y1="16" x2="21" y2="21" strokeLinecap="round"/></svg>; }
function FilterGlyph()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 5h18M6 12h12M10 19h4" strokeLinecap="round"/></svg>; }
function BookmarkGlyph() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>; }

// ─── TAG EXTRAS ────────────────────────────────────────────────────────────

function CutCornerTag({ children, color = DSC.accent }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', background: color, color: '#fff', fontFamily: DSF.body, fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', padding: '6px 14px 6px 12px', textTransform: 'uppercase', clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%, 10px 50%)' }}>
      {children}
    </span>
  );
}

function StripedTag({ children, color = DSC.accent }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', color: '#fff', fontFamily: DSF.body, fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', padding: '5px 13px', borderRadius: 999, textTransform: 'uppercase', background: `repeating-linear-gradient(135deg, ${color} 0 6px, ${dshex(color, 0.78)} 6px 12px)`, boxShadow: `0 1px 0 ${dshex('#fff', 0.25)} inset` }}>
      {children}
    </span>
  );
}

function RemovableChipDemo() {
  const [chips, setChips] = React.useState(['Climate', 'Brooklyn', "'11 cohort", 'Open to mentor', 'VC']);
  if (chips.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.muted, fontStyle: 'italic' }}>No filters applied.</span>
        <DSButton size="sm" variant="outline" onClick={() => setChips(['Climate', 'Brooklyn', "'11 cohort", 'Open to mentor', 'VC'])}>Reset</DSButton>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {chips.map(c => (
        <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 4px 4px 12px', background: dshex(DSC.accent, 0.10), border: `1px solid ${dshex(DSC.accent, 0.28)}`, color: DSC.accent, fontFamily: DSF.body, fontSize: 12, fontWeight: 600, borderRadius: 999 }}>
          {c}
          <button onClick={() => setChips(prev => prev.filter(x => x !== c))} aria-label={`Remove ${c}`} style={{ width: 18, height: 18, borderRadius: 999, background: dshex(DSC.accent, 0.18), color: DSC.accent, border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: 12, lineHeight: 1 }}>×</button>
        </span>
      ))}
    </div>
  );
}

function NumberedTag({ n, children }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px 4px 4px', background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: 999, fontFamily: DSF.body, fontSize: 12.5, fontWeight: 500, color: DSC.ink2 }}>
      <span style={{ width: 22, height: 22, borderRadius: 999, background: DSC.ink, color: DSC.paper, display: 'grid', placeItems: 'center', fontFamily: DSF.mono, fontSize: 11, fontWeight: 700 }}>{n}</span>
      {children}
    </span>
  );
}

function IconTag({ children, glyph, color = DSC.muted }) {
  const glyphs = {
    pin:   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z"/><circle cx="12" cy="9" r="2.4" /></svg>,
    bolt:  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /></svg>,
    leaf:  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21c5-10 14-12 18-12-2 8-6 16-14 16-3 0-4-2-4-4z"/><path d="M3 21l8-8" /></svg>,
    clock: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 11px', background: dshex(color, 0.10), color: color, fontFamily: DSF.body, fontSize: 11.5, fontWeight: 600, borderRadius: 999, border: `1px solid ${dshex(color, 0.24)}` }}>
      {glyphs[glyph]}
      {children}
    </span>
  );
}

function TooltipTag({ children, tip, color = DSC.muted }) {
  const [hov, setHov] = React.useState(false);
  return (
    <span onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ position: 'relative', display: 'inline-block' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 11px', background: dshex(color, 0.10), color: color, fontFamily: DSF.body, fontSize: 11.5, fontWeight: 600, borderRadius: 999, border: `1px dashed ${dshex(color, 0.40)}`, cursor: 'help' }}>
        {children}
        <span style={{ fontSize: 10, opacity: 0.7 }}>?</span>
      </span>
      {hov && (
        <span style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', background: DSC.ink, color: DSC.paper, padding: '7px 11px', borderRadius: 8, fontFamily: DSF.body, fontSize: 11.5, fontWeight: 500, whiteSpace: 'nowrap', boxShadow: '0 8px 20px rgba(42,34,26,0.32)', zIndex: 10 }}>
          {tip}
          <span style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: `5px solid ${DSC.ink}` }} />
        </span>
      )}
    </span>
  );
}

// ─── AVATAR EXTRAS ─────────────────────────────────────────────────────────

function AvatarStack({ people, size = 36, total }) {
  const overflow = total && total > people.length ? total - people.length : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {people.map((p, i) => (
        <div key={i} style={{ marginLeft: i === 0 ? 0 : -size * 0.32, border: `2px solid ${DSC.card}`, borderRadius: 999, zIndex: people.length - i }}>
          <DSAvatar name={p.name} initials={p.initials} size={size} />
        </div>
      ))}
      {overflow > 0 && (
        <div style={{ marginLeft: -size * 0.32, width: size, height: size, borderRadius: 999, background: dshex(DSC.ink, 0.08), border: `2px solid ${DSC.card}`, display: 'grid', placeItems: 'center', fontFamily: DSF.body, fontSize: size * 0.30, fontWeight: 700, color: DSC.ink2 }}>+{overflow}</div>
      )}
    </div>
  );
}

function BadgeOverlayAvatar({ name, initials, size = 48, badge }) {
  const badges = {
    verified: { bg: DSC.ok,     glyph: <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4 4 10-10" /></svg> },
    founding: { bg: DSC.accent, glyph: <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff"><path d="M12 2L14 8L20 8.5L15 12.5L17 19L12 15.5L7 19L9 12.5L4 8.5L10 8Z" /></svg> },
    mentor:   { bg: '#3f5680',  glyph: <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff"><path d="M12 4L4 8v8c0 3 4 5 8 5s8-2 8-5V8l-8-4z" /></svg> },
    new:      { bg: '#b88033',  glyph: <span style={{ fontFamily: 'system-ui', fontWeight: 700, fontSize: 9, color: '#fff', letterSpacing: '0.04em' }}>NEW</span> },
  };
  const b = badges[badge];
  const pip = Math.max(18, size * 0.40);
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <DSAvatar name={name} initials={initials} size={size} />
      {b && (
        <span style={{ position: 'absolute', right: -2, bottom: -2, width: pip, height: pip, borderRadius: 999, background: b.bg, border: `2.5px solid ${DSC.card}`, display: 'grid', placeItems: 'center' }}>{b.glyph}</span>
      )}
    </div>
  );
}

function CrestAvatar({ name, initials, size = 64, tone = DSC.accent }) {
  return (
    <div style={{ position: 'relative', width: size + 28, height: size + 28, display: 'grid', placeItems: 'center' }}>
      {/* Decorative crest frame */}
      <svg width={size + 28} height={size + 28} viewBox={`0 0 ${size + 28} ${size + 28}`} style={{ position: 'absolute', inset: 0 }}>
        {/* Outer scalloped ring (chain of small circles) */}
        {Array.from({ length: 14 }).map((_, i) => {
          const ang = (i / 14) * Math.PI * 2;
          const r = (size + 28) / 2 - 5;
          const cx = (size + 28) / 2 + Math.cos(ang) * r;
          const cy = (size + 28) / 2 + Math.sin(ang) * r;
          return <circle key={i} cx={cx} cy={cy} r="2" fill={dshex(tone, 0.55)} />;
        })}
        {/* Inner ring */}
        <circle cx={(size + 28) / 2} cy={(size + 28) / 2} r={size / 2 + 5} fill="none" stroke={tone} strokeWidth="1.2" />
      </svg>
      <DSAvatar name={name} initials={initials} size={size} />
    </div>
  );
}

function NamePlate({ name, role, cohort }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fefefe', padding: '12px 16px 12px 12px', borderRadius: 10, border: `1px solid ${DSC.rule}`, boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
      <DSAvatar name={name} initials={name.split(' ').map(s => s[0]).join('')} size={42} />
      <div style={{ borderLeft: `1px solid ${DSC.ruleSoft}`, paddingLeft: 12 }}>
        <div style={{ fontFamily: DSF.display, fontSize: 15, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.01em' }}>{name}</div>
        <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, marginTop: 2 }}>{role}</div>
        <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.accent, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 600, marginTop: 3 }}>{cohort}</div>
      </div>
    </div>
  );
}

window.ExtendedControlsSection = ExtendedControlsSection;
window.LetterpressButton    = LetterpressButton;
window.IconRoundButton      = IconRoundButton;
window.LinkButton           = LinkButton;
window.Spinner              = Spinner;
window.CutCornerTag         = CutCornerTag;
window.StripedTag           = StripedTag;
window.NumberedTag          = NumberedTag;
window.IconTag              = IconTag;
window.TooltipTag           = TooltipTag;
window.AvatarStack          = AvatarStack;
window.BadgeOverlayAvatar   = BadgeOverlayAvatar;
window.CrestAvatar          = CrestAvatar;
window.NamePlate            = NamePlate;
