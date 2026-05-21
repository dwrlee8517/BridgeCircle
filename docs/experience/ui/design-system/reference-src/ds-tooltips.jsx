/* eslint-disable */
// Atrium Design System — Tooltips & Popovers (Section 45)

function TooltipsPopoversSection() {
  return (
    <DSSection id="tooltips" eyebrow="Components · 45" title="Tooltips & Popovers">

      <DSSub title="Simple tooltips — text-only, four placements">
        <SimpleTooltips />
      </DSSub>

      <DSSub title="Rich tooltips — title + body + optional shortcut">
        <RichTooltips />
      </DSSub>

      <DSSub title="Popovers — hover-preview, click-to-pin, focus-anchored">
        <PopoverVariants />
      </DSSub>

      <DSSub title="Auto-flip behaviour — what happens near viewport edges">
        <AutoFlipDemo />
      </DSSub>

      <DSSub title="The tail · anatomy and sizing">
        <TooltipTailAnatomy />
      </DSSub>

    </DSSection>
  );
}

function SimpleTip({ children, text, placement = 'top' }) {
  const [hov, setHov] = React.useState(false);
  const pos = {
    top:    { bottom: 'calc(100% + 10px)', left: '50%', transform: 'translateX(-50%)' },
    bottom: { top: 'calc(100% + 10px)',    left: '50%', transform: 'translateX(-50%)' },
    left:   { right: 'calc(100% + 10px)',  top: '50%',  transform: 'translateY(-50%)' },
    right:  { left: 'calc(100% + 10px)',   top: '50%',  transform: 'translateY(-50%)' },
  };
  const tail = {
    top:    { top: '100%',   left: '50%', transform: 'translateX(-50%)',           borderTop: `5px solid ${DSC.ink}`,    borderLeft: '5px solid transparent', borderRight: '5px solid transparent' },
    bottom: { bottom: '100%',left: '50%', transform: 'translateX(-50%)',           borderBottom: `5px solid ${DSC.ink}`, borderLeft: '5px solid transparent', borderRight: '5px solid transparent' },
    left:   { left: '100%',  top: '50%',  transform: 'translateY(-50%)',           borderLeft: `5px solid ${DSC.ink}`,   borderTop: '5px solid transparent',  borderBottom: '5px solid transparent' },
    right:  { right: '100%', top: '50%',  transform: 'translateY(-50%)',           borderRight: `5px solid ${DSC.ink}`,  borderTop: '5px solid transparent',  borderBottom: '5px solid transparent' },
  };
  return (
    <span onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onFocus={() => setHov(true)} onBlur={() => setHov(false)} style={{ position: 'relative', display: 'inline-block' }}>
      {children}
      <span role="tooltip" style={{ position: 'absolute', ...pos[placement], background: DSC.ink, color: DSC.paper, fontFamily: DSF.body, fontSize: 11.5, fontWeight: 500, padding: '6px 10px', borderRadius: 6, whiteSpace: 'nowrap', opacity: hov ? 1 : 0, pointerEvents: 'none', transition: 'opacity 140ms ease', zIndex: 10, boxShadow: '0 6px 14px rgba(42,34,26,0.20)' }}>
        {text}
        <span style={{ position: 'absolute', ...tail[placement], width: 0, height: 0 }} />
      </span>
    </span>
  );
}

function SimpleTooltips() {
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: '40px 22px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, justifyItems: 'center' }}>
      {[
        { p: 'top',    label: 'Top' },
        { p: 'bottom', label: 'Bottom' },
        { p: 'left',   label: 'Left' },
        { p: 'right',  label: 'Right' },
      ].map(o => (
        <div key={o.p} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <SimpleTip text={`Anchored ${o.p}`} placement={o.p}>
            <button style={{ width: 38, height: 38, borderRadius: 999, background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, color: DSC.ink, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
              <Icon name="bell" size={15} color="currentColor" />
            </button>
          </SimpleTip>
          <span style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>{o.label}</span>
        </div>
      ))}
    </div>
  );
}

function RichTooltips() {
  const [activeIdx, setActiveIdx] = React.useState(0);
  const samples = [
    {
      anchor: <DSButton variant="outline" leadIcon={<Icon name="vouch" size={12} color="currentColor" />}>Verified</DSButton>,
      title: 'Verified · The Hartwood Society',
      body: 'Confirmed against alumni records on 19 May 2021. Reissue from your account settings.',
    },
    {
      anchor: <DSButton variant="outline" leadIcon={<Icon name="settings" size={12} color="currentColor" />}>Helper</DSButton>,
      title: 'Helper mode',
      body: 'When on, members can ask for your time. Turn off during deadlines.',
      shortcut: ['H'],
    },
    {
      anchor: <DSButton variant="outline" leadIcon={<Icon name="bookmark" size={12} color="currentColor" />}>Save</DSButton>,
      title: 'Save to your desk',
      body: 'Pins this member to your private desk for follow-up.',
      shortcut: ['⌘', 'S'],
    },
  ];
  const s = samples[activeIdx];
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {samples.map((_, i) => (
          <button key={i} onClick={() => setActiveIdx(i)} style={{ background: activeIdx === i ? DSC.ink : DSC.cardAlt, color: activeIdx === i ? DSC.paper : DSC.ink, border: `1px solid ${activeIdx === i ? DSC.ink : DSC.rule}`, padding: '5px 12px', borderRadius: 999, fontFamily: DSF.body, fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>Sample {i + 1}</button>
        ))}
      </div>
      <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: '60px 22px 40px', display: 'flex', justifyContent: 'center', position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          {s.anchor}
          {/* Always-visible rich tooltip */}
          <div style={{ position: 'absolute', bottom: 'calc(100% + 12px)', left: '50%', transform: 'translateX(-50%)', background: DSC.ink, color: DSC.paper, borderRadius: 10, padding: '12px 14px', width: 240, boxShadow: '0 10px 24px rgba(42,34,26,0.28)' }}>
            <div style={{ fontFamily: DSF.body, fontSize: 12.5, fontWeight: 700, color: DSC.paper }}>{s.title}</div>
            <p style={{ fontFamily: DSF.body, fontSize: 11.5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5, margin: '4px 0 0' }}>{s.body}</p>
            {s.shortcut && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                <span style={{ fontFamily: DSF.mono, fontSize: 9.5, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>Shortcut</span>
                <span style={{ display: 'inline-flex', gap: 3, marginLeft: 'auto' }}>{s.shortcut.map((k, i) => <KbdKey key={i}>{k}</KbdKey>)}</span>
              </div>
            )}
            <span style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', borderTop: `6px solid ${DSC.ink}`, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', width: 0, height: 0 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function PopoverVariants() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
      <VariantCard label="Hover-preview · member" note="Reveals the full member card on hover. No click needed.">
        <HoverPopover />
      </VariantCard>
      <VariantCard label="Click-to-pin · sorts menu" note="Click opens, click outside closes. Esc dismisses.">
        <ClickPopover />
      </VariantCard>
      <VariantCard label="Focus-anchored · field help" note="Appears when input is focused. Disappears on blur.">
        <FocusPopover />
      </VariantCard>
    </div>
  );
}

function HoverPopover() {
  const [hov, setHov] = React.useState(false);
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '36px 0 12px' }}>
      <span onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ position: 'relative' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 12px 4px 4px', borderRadius: 999, background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, cursor: 'pointer' }}>
          <DSAvatar name="Iris Okonkwo" initials="IO" size={24} />
          <span style={{ fontFamily: DSF.body, fontSize: 12.5, fontWeight: 600, color: DSC.ink }}>Iris Okonkwo</span>
        </span>
        <div style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, width: 240, background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 12, padding: 14, boxShadow: '0 16px 36px rgba(42,34,26,0.18)', opacity: hov ? 1 : 0, transform: hov ? 'translateY(0)' : 'translateY(6px)', pointerEvents: hov ? 'auto' : 'none', transition: 'opacity 160ms ease, transform 160ms ease', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <DSAvatar name="Iris Okonkwo" initials="IO" size={36} />
            <div>
              <div style={{ fontFamily: DSF.display, fontSize: 13.5, fontWeight: 600, color: DSC.ink }}>Iris Okonkwo</div>
              <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.accent, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>'11 · Brooklyn</div>
            </div>
          </div>
          <p style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.ink2, lineHeight: 1.5, margin: 0 }}>VP Investments · Common Capital. Climate underwriting.</p>
        </div>
      </span>
    </div>
  );
}

function ClickPopover() {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);
  const [sort, setSort] = React.useState('Match');
  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', justifyContent: 'center', padding: '36px 0 12px' }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: DSC.cardAlt, border: `1px solid ${open ? DSC.ink : DSC.rule}`, borderRadius: 999, padding: '7px 14px', fontFamily: DSF.body, fontSize: 12, fontWeight: 600, color: DSC.ink, cursor: 'pointer' }}>
        Sort by · {sort}
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={11} color={DSC.muted} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 10, boxShadow: '0 16px 36px rgba(42,34,26,0.18)', overflow: 'hidden', minWidth: 160, zIndex: 10 }}>
          {['Match', 'Recent', 'Name', 'Cohort'].map(o => (
            <button key={o} onClick={() => { setSort(o); setOpen(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px', background: sort === o ? dshex(DSC.accent, 0.10) : 'transparent', color: sort === o ? DSC.accent : DSC.ink, border: 'none', cursor: 'pointer', fontFamily: DSF.body, fontSize: 12, fontWeight: 500 }}>
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FocusPopover() {
  const [focused, setFocused] = React.useState(false);
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0 12px', position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} defaultValue="" placeholder="@maren" style={{ width: 180, padding: '8px 14px', border: `1.5px solid ${focused ? DSC.accent : DSC.rule}`, borderRadius: 999, fontFamily: DSF.body, fontSize: 13, background: DSC.card, outline: 'none' }} />
        {focused && (
          <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: 240, background: DSC.ink, color: DSC.paper, borderRadius: 10, padding: '10px 12px', boxShadow: '0 10px 24px rgba(42,34,26,0.28)', zIndex: 10 }}>
            <div style={{ fontFamily: DSF.body, fontSize: 12, fontWeight: 700 }}>Mention a member</div>
            <div style={{ fontFamily: DSF.body, fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 3, lineHeight: 1.45 }}>Start with @ to ping someone in the cohort.</div>
            <span style={{ position: 'absolute', bottom: '100%', left: 20, borderBottom: `6px solid ${DSC.ink}`, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', width: 0, height: 0 }} />
          </div>
        )}
      </div>
    </div>
  );
}

function AutoFlipDemo() {
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: 20, position: 'relative', height: 180 }}>
      <div style={{ position: 'absolute', top: 14, left: 14 }}>
        <SimpleTip text="Flipped to bottom · ran out of room above" placement="bottom">
          <span style={{ display: 'inline-block', padding: '6px 12px', background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: 6, fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.08em', fontWeight: 700 }}>TOP LEFT</span>
        </SimpleTip>
      </div>
      <div style={{ position: 'absolute', top: 14, right: 14 }}>
        <SimpleTip text="Flipped to bottom · also no room above" placement="bottom">
          <span style={{ display: 'inline-block', padding: '6px 12px', background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: 6, fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.08em', fontWeight: 700 }}>TOP RIGHT</span>
        </SimpleTip>
      </div>
      <div style={{ position: 'absolute', bottom: 14, left: 14 }}>
        <SimpleTip text="Default · top" placement="top">
          <span style={{ display: 'inline-block', padding: '6px 12px', background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: 6, fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.08em', fontWeight: 700 }}>BOTTOM</span>
        </SimpleTip>
      </div>
      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', fontFamily: DSF.body, fontSize: 12, color: DSC.muted, textAlign: 'center', maxWidth: 280 }}>
        Hover any corner button. The tooltip auto-flips to stay inside the container.
      </div>
    </div>
  );
}

function TooltipTailAnatomy() {
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: '22px 24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 24, alignItems: 'center' }}>
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 30 }}>
          {/* Anatomical drawing */}
          <div style={{ background: DSC.ink, color: DSC.paper, borderRadius: 10, padding: '12px 14px', position: 'relative', boxShadow: '0 10px 24px rgba(42,34,26,0.28)' }}>
            <div style={{ fontFamily: DSF.body, fontSize: 12, fontWeight: 600 }}>Tooltip body</div>
            <div style={{ fontFamily: DSF.body, fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 3 }}>Hartwood · Tuesday</div>
            <span style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', borderTop: `8px solid ${DSC.ink}`, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', width: 0, height: 0 }} />
          </div>
          {/* Anchor */}
          <div style={{ width: 32, height: 32, borderRadius: 999, background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, marginTop: 24, position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)' }} />
          {/* Annotations */}
          <span style={{ position: 'absolute', left: 0, top: 8, fontFamily: DSF.mono, fontSize: 9.5, color: DSC.accent, letterSpacing: '0.06em', fontWeight: 700 }}>← BODY · radius 10</span>
          <span style={{ position: 'absolute', right: 8, top: 56, fontFamily: DSF.mono, fontSize: 9.5, color: DSC.accent, letterSpacing: '0.06em', fontWeight: 700 }}>TAIL · 8×8 ↓</span>
          <span style={{ position: 'absolute', left: 0, bottom: 30, fontFamily: DSF.mono, fontSize: 9.5, color: DSC.accent, letterSpacing: '0.06em', fontWeight: 700 }}>↑ 10px GAP</span>
        </div>
        <div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['Gap', '10px between tooltip body and anchor — never closer.'],
              ['Tail', '8×8 triangle, centered on anchor. Hide when tooltip moves off-center.'],
              ['Radius', '10px tooltip body (matches the dropdown/menu family).'],
              ['Shadow', '0 10px 24px rgba(42,34,26,0.28) — heavier than card lift.'],
              ['Background', 'Ink (#2a221a) by default. Use light card only for rich tooltips with photos.'],
              ['Z-index', '1000+ — always above modals.'],
            ].map(([k, v], i) => (
              <li key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 12 }}>
                <span style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.accent, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{k}</span>
                <span style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.ink2, lineHeight: 1.5 }}>{v}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

window.TooltipsPopoversSection = TooltipsPopoversSection;
