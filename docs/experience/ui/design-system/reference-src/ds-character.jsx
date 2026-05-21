/* eslint-disable */
// Atrium Design System — Character Variants (Section 20)
// New variants of existing components — buttons, tags, avatars, cards.
// The originals stay untouched; these layer on top with extra personality.

function CharacterSection() {
  return (
    <DSSection id="character" eyebrow="Components · 20" title="Character Variants">

      <DSSub title="Buttons with character — same behavior, more swagger">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          <VariantCard label="Stamp button" note="Rotated -1°, double border, ink-bleed shadow. For confirmations.">
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <StampButton>RSVP'd</StampButton>
              <StampButton color={DSC.ok}>Verified</StampButton>
              <StampButton color="#3f5680">Replied</StampButton>
            </div>
          </VariantCard>

          <VariantCard label="Soft-glow button" note="Halo grows on hover. Reserve for primary CTAs.">
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <SoftGlowButton>Open inbox</SoftGlowButton>
              <SoftGlowButton variant="ink">Hold</SoftGlowButton>
            </div>
          </VariantCard>

          <VariantCard label="Ticket-edge button" note="Dashed perforation on both sides — for events.">
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <TicketButton>Claim your seat</TicketButton>
              <TicketButton compact>RSVP</TicketButton>
            </div>
          </VariantCard>

          <VariantCard label="Gradient duo button" note="Sweeps between two accents on hover.">
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <GradientButton from={DSC.accent} to="#b88033">Celebrate</GradientButton>
              <GradientButton from="#2f6e6c" to={DSC.ok}>Spring opens</GradientButton>
              <GradientButton from="#7a3a5e" to="#8a5e7a">Evening read</GradientButton>
            </div>
          </VariantCard>
        </div>
      </DSSub>

      <DSSub title="Tags with character">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          <VariantCard label="Ribbon tag" note="Notched right edge — feels woven-in, not chipped-on.">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <RibbonTag color={DSC.accent}>HOSTING</RibbonTag>
              <RibbonTag color={DSC.ok}>OPEN</RibbonTag>
              <RibbonTag color="#3f5680">FEATURED</RibbonTag>
            </div>
          </VariantCard>

          <VariantCard label="Sticker tag" note="±2° tilt, drop shadow. Looks peelable.">
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', paddingTop: 8, paddingBottom: 4 }}>
              <StickerTag color={DSC.accent}>Just joined</StickerTag>
              <StickerTag color="#2f6e6c">In Brooklyn</StickerTag>
              <StickerTag color="#b88033">12-wk streak</StickerTag>
            </div>
          </VariantCard>

          <VariantCard label="Bracket tag" note="Mono in square brackets — technical, archival.">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <BracketTag>cohort · '11</BracketTag>
              <BracketTag>verified</BracketTag>
              <BracketTag>thread · 04</BracketTag>
            </div>
          </VariantCard>

          <VariantCard label="Postal stamp tag" note="Vintage stamp, perforated edge.">
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <StampTag color={DSC.accent}>HARTWOOD</StampTag>
              <StampTag color="#2f6e6c">5-YR</StampTag>
              <StampTag color="#7a3a5e">2026</StampTag>
            </div>
          </VariantCard>
        </div>
      </DSSub>

      <DSSub title="Avatars with character">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          <VariantCard label="Halo avatar" note="Slow-spinning accent ring — for spotlighted members.">
            <style>{`@keyframes ds-halo-spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
            <div style={{ display: 'flex', gap: 18, alignItems: 'center', justifyContent: 'center', padding: '6px 0' }}>
              <HaloAvatar name="Iris Okonkwo" initials="IO" size={56} accent={DSC.accent} />
              <HaloAvatar name="Maren Holt"   initials="MH" size={48} accent={DSC.ok} />
              <HaloAvatar name="Dev Patel"    initials="DP" size={56} accent="#3f5680" />
            </div>
          </VariantCard>

          <VariantCard label="Status-pip avatar" note="Bottom-right dot — 4 states.">
            <div style={{ display: 'flex', gap: 18, alignItems: 'center', justifyContent: 'center', padding: '6px 0' }}>
              <StatusPipAvatar name="Iris" initials="IO" size={48} status="online" />
              <StatusPipAvatar name="Sam"  initials="SA" size={48} status="busy" />
              <StatusPipAvatar name="Rosa" initials="RF" size={48} status="away" />
              <StatusPipAvatar name="Lena" initials="LV" size={48} status="offline" />
            </div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 12, fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              online · busy · away · offline
            </div>
          </VariantCard>

          <VariantCard label="Polaroid avatar" note="White-frame photo with handwritten name.">
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', justifyContent: 'center', padding: '8px 0' }}>
              <PolaroidAvatar name="Iris Okonkwo" initials="IO" caption="Iris, '11" rot={-3} />
              <PolaroidAvatar name="Dev Patel"    initials="DP" caption="Dev, '11"  rot={2} />
            </div>
          </VariantCard>
        </div>
      </DSSub>

    </DSSection>
  );
}

// ─── SHARED — VARIANT SHOWCASE WRAPPER ─────────────────────────────────────

function VariantCard({ label, note, children }) {
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 16, padding: '18px 18px 16px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.accent, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>{label}</div>
        <div style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted, marginTop: 4, lineHeight: 1.45 }}>{note}</div>
      </div>
      <div style={{ background: DSC.cardAlt, border: `1px solid ${DSC.ruleSoft}`, borderRadius: 12, padding: 18, minHeight: 80, display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '100%' }}>{children}</div>
      </div>
    </div>
  );
}

// ─── BUTTON VARIANTS ───────────────────────────────────────────────────────

function StampButton({ children, color = DSC.accent, onClick }) {
  const [hov, setHov] = React.useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: color, color: '#fff', border: `2px solid ${color}`, outline: `1px solid ${color}`, outlineOffset: 2, borderRadius: 4, padding: '8px 18px', fontFamily: DSF.display, fontSize: 13, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer', transform: `rotate(${hov ? 0 : -1.2}deg)`, transition: 'transform 180ms cubic-bezier(0.2,0.8,0.2,1), filter 180ms ease', filter: hov ? 'brightness(1.08)' : 'none', boxShadow: `2px 2px 0 ${dshex(color, 0.32)}` }}>
      {children}
    </button>
  );
}

function SoftGlowButton({ children, variant = 'primary', onClick }) {
  const [hov, setHov] = React.useState(false);
  const bg = variant === 'ink' ? DSC.ink : DSC.accent;
  const glow = variant === 'ink' ? DSC.ink : DSC.accent;
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: bg, color: variant === 'ink' ? DSC.paper : '#fff', border: 'none', borderRadius: 999, padding: '11px 20px', fontFamily: DSF.body, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', transform: hov ? 'scale(1.04)' : 'scale(1)', boxShadow: hov ? `0 8px 26px ${dshex(glow, 0.50)}, 0 0 0 4px ${dshex(glow, 0.14)}` : `0 1px 2px ${dshex(DSC.ink, 0.10)}`, transition: 'transform 200ms cubic-bezier(0.2,0.8,0.2,1), box-shadow 200ms ease' }}>
      {children}
    </button>
  );
}

function TicketButton({ children, compact, onClick }) {
  return (
    <button onClick={onClick} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 8, background: DSC.cardAlt, color: DSC.ink, border: `1.5px dashed ${DSC.muted}`, borderLeft: 'none', borderRight: 'none', padding: compact ? '8px 22px' : '11px 28px', fontFamily: DSF.display, fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
      {/* Punch-hole accents on left/right edges */}
      <span style={{ position: 'absolute', left: -6, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, borderRadius: 999, background: DSC.panel, border: `1.5px dashed ${DSC.muted}` }} />
      <span style={{ position: 'absolute', right: -6, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, borderRadius: 999, background: DSC.panel, border: `1.5px dashed ${DSC.muted}` }} />
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7h18M3 12h18M3 17h18" /></svg>
      {children}
    </button>
  );
}

function GradientButton({ children, from, to, onClick }) {
  const [hov, setHov] = React.useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: `linear-gradient(${hov ? 100 : 135}deg, ${from} 0%, ${to} 100%)`, backgroundSize: '200% 100%', color: '#fff', border: 'none', borderRadius: 999, padding: '11px 20px', fontFamily: DSF.body, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', transition: 'all 300ms cubic-bezier(0.2,0.8,0.2,1)', boxShadow: hov ? `0 6px 18px ${dshex(from, 0.40)}` : '0 1px 2px rgba(42,34,26,0.10)', transform: hov ? 'translateY(-1px)' : 'translateY(0)' }}>
      {children}
    </button>
  );
}

// ─── TAG VARIANTS ──────────────────────────────────────────────────────────

function RibbonTag({ children, color = DSC.accent }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6, background: color, color: '#fff', fontFamily: DSF.body, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', padding: '5px 16px 5px 12px', textTransform: 'uppercase', clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)', boxShadow: `2px 2px 0 ${dshex(color, 0.30)}` }}>
      {children}
    </span>
  );
}

function StickerTag({ children, color = DSC.accent }) {
  const rot = React.useMemo(() => (Math.random() * 6 - 3).toFixed(2), []);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', background: '#fff', color: color, fontFamily: DSF.body, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '6px 12px', borderRadius: 999, border: `2px solid ${color}`, boxShadow: `0 4px 8px ${dshex(DSC.ink, 0.18)}, 0 0 0 1px ${dshex('#fff', 0.6)} inset`, transform: `rotate(${rot}deg)` }}>
      {children}
    </span>
  );
}

function BracketTag({ children }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: DSF.mono, fontSize: 11, color: DSC.ink2, fontWeight: 600, letterSpacing: '0.04em' }}>
      <span style={{ color: DSC.muted }}>[</span>
      {children}
      <span style={{ color: DSC.muted }}>]</span>
    </span>
  );
}

function StampTag({ children, color = DSC.accent }) {
  const id = React.useId();
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontFamily: DSF.display, fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: color, background: '#fdfbf3', border: `2px solid ${color}`, outline: `1px dashed ${color}`, outlineOffset: -5 }}>
      {/* Tiny corner pip */}
      <span style={{ width: 6, height: 6, borderRadius: 999, background: color, opacity: 0.7 }} />
      {children}
    </span>
  );
}

// ─── AVATAR VARIANTS ───────────────────────────────────────────────────────

function HaloAvatar({ name, initials, size = 48, accent = DSC.accent }) {
  return (
    <div style={{ position: 'relative', width: size + 14, height: size + 14, display: 'grid', placeItems: 'center' }}>
      <svg width={size + 14} height={size + 14} viewBox={`0 0 ${size + 14} ${size + 14}`} style={{ position: 'absolute', inset: 0, animation: 'ds-halo-spin 8s linear infinite' }}>
        <circle cx={(size + 14) / 2} cy={(size + 14) / 2} r={(size + 14) / 2 - 2} fill="none" stroke={accent} strokeWidth="1.6" strokeDasharray="3 5" />
      </svg>
      <DSAvatar name={name} initials={initials} size={size} />
    </div>
  );
}

function StatusPipAvatar({ name, initials, size = 48, status = 'online' }) {
  const pipColor = {
    online:  DSC.ok,
    busy:    DSC.bad,
    away:    DSC.warn,
    offline: DSC.mute2,
  }[status];
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <DSAvatar name={name} initials={initials} size={size} />
      <span title={status} style={{ position: 'absolute', right: -1, bottom: -1, width: size * 0.32, height: size * 0.32, borderRadius: 999, background: pipColor, border: `2.5px solid ${DSC.card}` }} />
    </div>
  );
}

function PolaroidAvatar({ name, initials, caption, rot = 0 }) {
  return (
    <div style={{ background: '#fefefe', padding: '8px 8px 18px', borderRadius: 4, boxShadow: `0 4px 10px ${dshex(DSC.ink, 0.18)}, 0 1px 0 rgba(0,0,0,0.04)`, transform: `rotate(${rot}deg)`, display: 'inline-block', transition: 'transform 200ms cubic-bezier(0.2,0.8,0.2,1)' }}
         onMouseEnter={e => { e.currentTarget.style.transform = `rotate(${rot * 0.2}deg) translateY(-3px)`; }}
         onMouseLeave={e => { e.currentTarget.style.transform = `rotate(${rot}deg)`; }}>
      <DSAvatar name={name} initials={initials} size={80} />
      <div style={{ marginTop: 8, fontFamily: '"Inter Tight", system-ui, sans-serif', fontStyle: 'italic', fontSize: 12, color: DSC.ink2, textAlign: 'center', minWidth: 80 }}>{caption}</div>
    </div>
  );
}

window.CharacterSection  = CharacterSection;
window.VariantCard       = VariantCard;
window.StampButton       = StampButton;
window.SoftGlowButton    = SoftGlowButton;
window.TicketButton      = TicketButton;
window.GradientButton    = GradientButton;
window.RibbonTag         = RibbonTag;
window.StickerTag        = StickerTag;
window.BracketTag        = BracketTag;
window.StampTag          = StampTag;
window.HaloAvatar        = HaloAvatar;
window.StatusPipAvatar   = StatusPipAvatar;
window.PolaroidAvatar    = PolaroidAvatar;
