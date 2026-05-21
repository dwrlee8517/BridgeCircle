/* eslint-disable */
// Atrium Design System — Advanced Animations (Section 27)
// Seven new motion patterns: rolling digits, spring pop, glow-trace border,
// cursor spotlight, text scramble, heartbeat pulse, view swap.

function AdvancedMotionSection() {
  return (
    <DSSection id="advmotion" eyebrow="Components · 27" title="Advanced Animations">

      <style>{`
        @keyframes ds-pop-bounce { 0% { transform: scale(0.6); opacity: 0; } 60% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes ds-heartbeat  { 0%,30%,60%,100% { transform: scale(1); } 15% { transform: scale(1.18); } 45% { transform: scale(1.12); } }
        @keyframes ds-glow-trace { from { stroke-dashoffset: var(--ds-perim, 600); } to { stroke-dashoffset: 0; } }
        @keyframes ds-slide-in-l { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes ds-slide-out-r { from { transform: translateX(0); opacity: 1; } to { transform: translateX(-40px); opacity: 0; } }
        @keyframes ds-digit-flip { 0% { transform: translateY(0); } 100% { transform: translateY(-100%); } }
      `}</style>

      <DSSub title="Seven new patterns — each interactive, each replay-able">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          <VariantCard label="Rolling digits" note="Slot-machine style — each digit slides to its new value with independent timing.">
            <RollingDigitsDemo />
          </VariantCard>

          <VariantCard label="Spring pop entrance" note="Overshoots its final size before settling. For confirmation moments.">
            <SpringPopDemo />
          </VariantCard>

          <VariantCard label="Glow-trace border" note="An accent line draws itself around the card edge once. Reserve for hero cards.">
            <GlowTraceDemo />
          </VariantCard>

          <VariantCard label="Cursor spotlight" note="Subtle radial glow follows the pointer inside the card.">
            <SpotlightFollowDemo />
          </VariantCard>

          <VariantCard label="Text scramble" note="Letters cycle through random characters before settling on the target.">
            <TextScrambleDemo />
          </VariantCard>

          <VariantCard label="Heartbeat pulse" note="Subtle double-beat — for verified members, anchor crests, and 'we see you'.">
            <HeartbeatDemo />
          </VariantCard>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14, marginTop: 14 }}>
          <VariantCard label="View-swap transition" note="Two card views, slide-and-fade swap. For week-by-week or member-by-member browsing.">
            <ViewSwapDemo />
          </VariantCard>
        </div>
      </DSSub>

    </DSSection>
  );
}

// ─── ROLLING DIGITS ────────────────────────────────────────────────────────

function RollingDigitsDemo() {
  const values = [247, 1284, 4712, 64];
  const [idx, setIdx] = React.useState(0);
  const target = values[idx];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <RollingNumber value={target} />
        <span style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.muted }}>
          {['conversations', 'members', 'mentor hours', 'profile %'][idx]}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
        {values.map((v, i) => (
          <button key={v} onClick={() => setIdx(i)} style={{ background: idx === i ? DSC.ink : DSC.cardAlt, color: idx === i ? DSC.paper : DSC.ink, border: `1px solid ${idx === i ? DSC.ink : DSC.rule}`, borderRadius: 999, padding: '5px 11px', fontFamily: DSF.mono, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{v.toLocaleString()}</button>
        ))}
      </div>
    </div>
  );
}

function RollingNumber({ value }) {
  const str = value.toLocaleString();
  return (
    <span style={{ fontFamily: DSF.display, fontSize: 52, fontWeight: 600, color: DSC.accent, letterSpacing: '-0.03em', lineHeight: 1, display: 'inline-flex', gap: 1, fontVariantNumeric: 'tabular-nums' }}>
      {str.split('').map((ch, i) => /[0-9]/.test(ch)
        ? <RollingDigit key={i} digit={Number(ch)} />
        : <span key={i} style={{ width: 14, textAlign: 'center', color: DSC.mute2 }}>{ch}</span>
      )}
    </span>
  );
}

function RollingDigit({ digit }) {
  return (
    <span style={{ display: 'inline-block', width: 32, height: 56, overflow: 'hidden', position: 'relative' }}>
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `translateY(-${digit * 56}px)`, transition: 'transform 700ms cubic-bezier(0.34, 1.18, 0.4, 1)' }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <span key={n} style={{ height: 56, lineHeight: '56px' }}>{n}</span>
        ))}
      </span>
    </span>
  );
}

// ─── SPRING POP ────────────────────────────────────────────────────────────

function SpringPopDemo() {
  const [key, setKey] = React.useState(0);
  return (
    <div>
      <div key={key} style={{ animation: 'ds-pop-bounce 520ms cubic-bezier(0.34, 1.4, 0.5, 1)', display: 'inline-flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, boxShadow: '0 8px 22px rgba(42,34,26,0.10)' }}>
        <span style={{ width: 36, height: 36, borderRadius: 999, background: DSC.ok, color: '#fff', display: 'grid', placeItems: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4 4 10-10" /></svg>
        </span>
        <div>
          <div style={{ fontFamily: DSF.display, fontSize: 14, fontWeight: 700, color: DSC.ink }}>RSVP confirmed</div>
          <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, marginTop: 2 }}>Spring Supper · Tue 7:30</div>
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <DSButton size="sm" variant="outline" onClick={() => setKey(k => k + 1)}>Replay</DSButton>
      </div>
    </div>
  );
}

// ─── GLOW TRACE BORDER ─────────────────────────────────────────────────────

function GlowTraceDemo() {
  const [seed, setSeed] = React.useState(0);
  // Approx perimeter of 280×140 rounded-14 rect ≈ 2*(280+140) - 8 ≈ 832
  const perim = 832;
  return (
    <div>
      <div style={{ position: 'relative', width: '100%', height: 140, background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: 18, display: 'flex', alignItems: 'center', gap: 14, overflow: 'visible' }}>
        {/* Animated SVG border */}
        <svg key={seed} width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 14 }}>
          <rect x="0.5" y="0.5" width="99" height="99" rx="3" ry="3" fill="none" stroke={DSC.accent} strokeWidth="0.8" pathLength="100" strokeDasharray="100" strokeDashoffset="100" style={{ animation: 'ds-glow-trace 1800ms cubic-bezier(0.4,0,0.2,1) forwards', filter: `drop-shadow(0 0 4px ${dshex(DSC.accent, 0.45)})` }} vectorEffect="non-scaling-stroke" />
        </svg>
        <DSAvatar name="Iris Okonkwo" initials="IO" size={48} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontFamily: DSF.display, fontSize: 17, fontWeight: 600, color: DSC.ink }}>Iris Okonkwo</div>
          <div style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted, marginTop: 2 }}>Spotlight this week</div>
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <DSButton size="sm" variant="outline" onClick={() => setSeed(s => s + 1)}>Replay</DSButton>
      </div>
    </div>
  );
}

// ─── CURSOR SPOTLIGHT ──────────────────────────────────────────────────────

function SpotlightFollowDemo() {
  const ref = React.useRef(null);
  const [pos, setPos] = React.useState({ x: 50, y: 50 });
  const [active, setActive] = React.useState(false);

  const onMove = (e) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  return (
    <div ref={ref} onMouseMove={onMove} onMouseEnter={() => setActive(true)} onMouseLeave={() => setActive(false)}
      style={{ position: 'relative', height: 140, background: DSC.ink, color: DSC.paper, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: '20px 22px', cursor: 'crosshair', overflow: 'hidden' }}>
      {/* Spotlight overlay */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(360px circle at ${pos.x}% ${pos.y}%, ${dshex(DSC.accent, 0.50)} 0%, transparent 50%)`, opacity: active ? 1 : 0, transition: 'opacity 300ms ease', pointerEvents: 'none' }} />
      <div style={{ position: 'relative' }}>
        <div style={{ fontFamily: DSF.mono, fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>Hover to track</div>
        <div style={{ fontFamily: DSF.display, fontSize: 22, fontWeight: 600, color: DSC.paper, letterSpacing: '-0.02em', marginTop: 6 }}>The {active ? 'spotlight' : 'circle'} follows you.</div>
        <div style={{ fontFamily: DSF.body, fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 6 }}>
          {active ? `cursor at ${Math.round(pos.x)}%, ${Math.round(pos.y)}%` : 'enter the card →'}
        </div>
      </div>
    </div>
  );
}

// ─── TEXT SCRAMBLE ─────────────────────────────────────────────────────────

function TextScrambleDemo() {
  const targets = ['Hartwood', 'Brooklyn', 'Class of \'11', 'Iris Okonkwo'];
  const [idx, setIdx] = React.useState(0);
  const target = targets[idx];
  const [text, setText] = React.useState(target);

  React.useEffect(() => {
    const chars = '!@#$%^&*()_+-={}[]<>?/abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let frame = 0;
    const totalFrames = 30;
    const interval = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const settled = Math.floor(target.length * progress);
      let next = '';
      for (let i = 0; i < target.length; i++) {
        if (i < settled) next += target[i];
        else next += target[i] === ' ' ? ' ' : chars[Math.floor(Math.random() * chars.length)];
      }
      setText(next);
      if (frame >= totalFrames) { setText(target); clearInterval(interval); }
    }, 30);
    return () => clearInterval(interval);
  }, [idx, target]);

  return (
    <div>
      <div style={{ fontFamily: DSF.mono, fontSize: 22, fontWeight: 700, color: DSC.accent, letterSpacing: '0.04em', minHeight: 32 }}>{text}</div>
      <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
        {targets.map((t, i) => (
          <button key={t} onClick={() => setIdx(i)} style={{ background: idx === i ? DSC.ink : DSC.cardAlt, color: idx === i ? DSC.paper : DSC.ink, border: `1px solid ${idx === i ? DSC.ink : DSC.rule}`, borderRadius: 999, padding: '5px 10px', fontFamily: DSF.body, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{t}</button>
        ))}
      </div>
    </div>
  );
}

// ─── HEARTBEAT PULSE ───────────────────────────────────────────────────────

function HeartbeatDemo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
      {/* Heartbeat verified pip */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ position: 'relative' }}>
          <DSAvatar name="Iris Okonkwo" initials="IO" size={56} />
          <span style={{ position: 'absolute', right: -3, bottom: -3, width: 22, height: 22, borderRadius: 999, background: DSC.ok, border: `3px solid ${DSC.card}`, display: 'grid', placeItems: 'center', animation: 'ds-heartbeat 1800ms ease-in-out infinite', transformOrigin: 'center' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4 4 10-10" /></svg>
          </span>
        </div>
        <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>Verified</div>
      </div>

      {/* Heartbeat anchor crest */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ animation: 'ds-heartbeat 1800ms ease-in-out infinite', animationDelay: '600ms', transformOrigin: 'center' }}>
          <PinCrest pin={{ id: 'anchor', name: 'Anchor', color: DSC.accent, glyph: 'star' }} size={54} />
        </div>
        <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>Anchor</div>
      </div>

      {/* Heartbeat icon */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 54, height: 54, borderRadius: 999, background: dshex(DSC.bad, 0.12), color: DSC.bad, display: 'grid', placeItems: 'center', animation: 'ds-heartbeat 1800ms ease-in-out infinite', animationDelay: '1200ms', transformOrigin: 'center' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7-4.5-9.5-9.5C0 6 4 2 8 4c1.5.7 3 2 4 4 1-2 2.5-3.3 4-4 4-2 8 2 5.5 7.5C19 16.5 12 21 12 21z" /></svg>
        </div>
        <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>Loved</div>
      </div>

      <div style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted, lineHeight: 1.5, flex: 1 }}>
        Double-beat (not single-pulse) keeps it feeling alive, not nervous. Stagger three indicators by 600ms so the page doesn't synchronize.
      </div>
    </div>
  );
}

// ─── VIEW SWAP TRANSITION ──────────────────────────────────────────────────

function ViewSwapDemo() {
  const views = [
    { name: 'Iris Okonkwo', initials: 'IO', role: 'VP Investments · Common Capital', cohort: "'11", quote: "Climate is the only career pivot that won't age.", tone: DSC.accent },
    { name: 'Dev Patel',    initials: 'DP', role: 'Partner · Greenleaf Ventures',    cohort: "'11", quote: "Climate VCs are still scouts, not bankers.",       tone: DSC.ok },
    { name: 'Rosa Ferrara', initials: 'RF', role: 'CEO · Solaris Grid · Lagos',      cohort: "'17", quote: "Operators-turned-VC understand the grid.",       tone: '#3f5680' },
  ];
  const [idx, setIdx] = React.useState(0);
  const [dir, setDir] = React.useState('next');
  const [animKey, setAnimKey] = React.useState(0);

  const swap = (newIdx, direction) => {
    setDir(direction);
    setIdx(newIdx);
    setAnimKey(k => k + 1);
  };

  const next = () => swap((idx + 1) % views.length, 'next');
  const prev = () => swap((idx - 1 + views.length) % views.length, 'prev');

  const v = views[idx];

  return (
    <div>
      <div style={{ position: 'relative', height: 160, background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: 14, overflow: 'hidden' }}>
        <div key={animKey} style={{
          padding: '20px 22px', height: '100%', display: 'flex', alignItems: 'center', gap: 18, position: 'relative',
          animation: `${dir === 'next' ? 'ds-slide-in-l' : 'ds-slide-in-l'} 320ms cubic-bezier(0.2,0.8,0.2,1)`,
        }}>
          <DSAvatar name={v.name} initials={v.initials} size={64} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: v.tone, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>Class of {v.cohort}</div>
            <div style={{ fontFamily: DSF.display, fontSize: 22, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.02em', lineHeight: 1, marginTop: 4 }}>{v.name}</div>
            <div style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.muted, marginTop: 4 }}>{v.role}</div>
            <div style={{ fontFamily: DSF.display, fontStyle: 'italic', fontSize: 12.5, color: DSC.ink2, marginTop: 10, lineHeight: 1.4, paddingLeft: 10, borderLeft: `2px solid ${v.tone}` }}>"{v.quote}"</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {views.map((_, i) => (
            <button key={i} onClick={() => swap(i, i > idx ? 'next' : 'prev')} aria-label={`View ${i + 1}`} style={{ width: idx === i ? 22 : 10, height: 10, borderRadius: 999, background: idx === i ? DSC.accent : DSC.rule, border: 'none', cursor: 'pointer', transition: 'all 200ms ease' }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={prev} style={{ background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: 999, width: 34, height: 34, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={DSC.ink} strokeWidth="2.4" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <button onClick={next} style={{ background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: 999, width: 34, height: 34, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={DSC.ink} strokeWidth="2.4" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

window.AdvancedMotionSection = AdvancedMotionSection;
