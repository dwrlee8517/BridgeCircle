/* eslint-disable */
// Atrium Design System — Card character variants + Motion behaviors (Section 21)
// Postcard / Polaroid / Ticket stub cards + Ink ripple, Count-up, Breathing, Stagger, Tilt

function MotionPlusSection() {
  return (
    <DSSection id="motionplus" eyebrow="Components · 21" title="Card Variants & Motion Behaviors">

      <style>{`
        @keyframes ds-breath      { 0%,100% { transform: scale(1);   filter: brightness(1); } 50% { transform: scale(1.04); filter: brightness(1.05); } }
        @keyframes ds-tag-stagger { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ds-ripple-grow { from { transform: scale(0); opacity: 0.45; } to { transform: scale(4); opacity: 0; } }
      `}</style>

      <DSSub title="Cards with character — postcard, polaroid, ticket stub">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, alignItems: 'flex-start' }}>
          <PostcardCard />
          <PolaroidCard />
          <TicketStubCard />
        </div>
      </DSSub>

      <DSSub title="Motion behaviors — replay-able, opt-in for any component">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          <VariantCard label="Ink ripple on click" note="Soft accent ripple from the click point. Use on confirm actions.">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <InkRippleButton>RSVP</InkRippleButton>
              <InkRippleButton variant="ink">Send intro</InkRippleButton>
            </div>
          </VariantCard>

          <VariantCard label="Count-up number" note="Animates from 0 → target over 1.2s. For stats reveals.">
            <CountUpDemo />
          </VariantCard>

          <VariantCard label="Breathing element" note="Gentle scale loop. Signals active/listening state — never urgent.">
            <BreathingDemo />
          </VariantCard>

          <VariantCard label="Stagger entrance" note="Row of items fade in 60ms apart. Use for search results.">
            <StaggerDemo />
          </VariantCard>

          <VariantCard label="Magnetic tilt" note="Card tilts toward cursor. Save for hero cards only.">
            <MagneticTiltDemo />
          </VariantCard>

          <VariantCard label="Reveal-on-scroll" note="Slide+fade as the card enters viewport. Heavy use → noisy.">
            <RevealDemo />
          </VariantCard>
        </div>
      </DSSub>

    </DSSection>
  );
}

// ─── CARD VARIANTS ─────────────────────────────────────────────────────────

function PostcardCard() {
  return (
    <div style={{ background: '#fdfbf3', border: `1px solid ${DSC.rule}`, borderRadius: 6, padding: 0, boxShadow: '0 6px 16px rgba(42,34,26,0.10), 0 1px 0 rgba(255,255,255,.6) inset', overflow: 'hidden' }}>
      {/* Decorative outer border */}
      <div style={{ border: `1px dashed ${dshex(DSC.muted, 0.40)}`, margin: 6, borderRadius: 4, padding: '14px 14px 12px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, minHeight: 200 }}>
        {/* Message side */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: DSF.mono, fontSize: 9, color: DSC.accent, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>Greetings from</div>
          <div style={{ fontFamily: DSF.display, fontSize: 22, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.025em', lineHeight: 1, marginTop: 4 }}>Brooklyn</div>
          <p style={{ fontFamily: DSF.body, fontStyle: 'italic', fontSize: 11.5, color: DSC.ink2, lineHeight: 1.5, margin: '12px 0 0', flex: 1 }}>
            Spring Supper is on Tue. Sam's hosting, you're seated next to Iris. Reply when you can. — Maren
          </p>
          <div style={{ fontFamily: DSF.display, fontStyle: 'italic', fontSize: 13, color: DSC.muted, marginTop: 8 }}>— Maren</div>
        </div>

        {/* Center divider */}
        <div style={{ width: 1, background: dshex(DSC.muted, 0.30), backgroundImage: `repeating-linear-gradient(to bottom, ${dshex(DSC.muted, 0.40)} 0 4px, transparent 4px 8px)` }} />

        {/* Address side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Stamp */}
          <div style={{ alignSelf: 'flex-end', width: 44, height: 50, padding: 3, border: `1.5px solid ${dshex(DSC.muted, 0.50)}`, outline: `1px dashed ${dshex(DSC.muted, 0.45)}`, outlineOffset: -5, background: dshex(DSC.accent, 0.10), display: 'grid', placeItems: 'center', borderRadius: 2 }}>
            <div style={{ width: 28, height: 30, background: DSC.accent, borderRadius: 2, display: 'grid', placeItems: 'center', fontFamily: DSF.mono, fontSize: 7.5, color: '#fff', fontWeight: 700, letterSpacing: '0.06em' }}>2026</div>
          </div>

          {/* Address lines */}
          <div style={{ fontFamily: DSF.display, fontSize: 13, fontWeight: 600, color: DSC.ink, marginTop: 6 }}>Iris Okonkwo</div>
          <div style={{ fontFamily: DSF.body, fontSize: 11, color: DSC.muted, lineHeight: 1.5 }}>Class of '11<br />Common Capital<br />Brooklyn · NY</div>
          {/* Routing lines */}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ height: 1, background: dshex(DSC.muted, 0.30) }} />
            <div style={{ height: 1, background: dshex(DSC.muted, 0.30) }} />
            <div style={{ height: 1, background: dshex(DSC.muted, 0.30) }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function PolaroidCard() {
  return (
    <div style={{ background: '#fefefe', padding: '10px 10px 22px', borderRadius: 6, boxShadow: '0 8px 22px rgba(42,34,26,0.18), 0 1px 0 rgba(0,0,0,0.04)', transform: 'rotate(-1.4deg)', transition: 'transform 220ms cubic-bezier(0.2,0.8,0.2,1)' }}
         onMouseEnter={e => { e.currentTarget.style.transform = 'rotate(-0.4deg) translateY(-3px)'; }}
         onMouseLeave={e => { e.currentTarget.style.transform = 'rotate(-1.4deg)'; }}>
      {/* Photo area */}
      <div style={{ background: DSC.panel, borderRadius: 2, aspectRatio: '4 / 5', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `repeating-linear-gradient(135deg, ${DSC.panel} 0 8px, ${dshex(DSC.muted, 0.18)} 8px 9px)` }} />
        <div style={{ position: 'absolute', top: 12, left: 12, padding: '4px 8px', background: DSC.accent, color: '#fff', fontFamily: DSF.mono, fontSize: 8.5, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', borderRadius: 2 }}>Supper '26</div>
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', background: '#fefefe', padding: '5px 11px', fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, borderRadius: 4, letterSpacing: '0.06em', border: `1px solid ${DSC.rule}` }}>EVENT PHOTO</div>
        <div style={{ position: 'absolute', bottom: 10, right: 12, fontFamily: DSF.mono, fontSize: 9, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.10em' }}>05·19·26</div>
      </div>
      {/* Caption */}
      <div style={{ marginTop: 14, fontFamily: '"Inter Tight", system-ui, sans-serif', fontStyle: 'italic', fontSize: 14, color: DSC.ink2, textAlign: 'center', letterSpacing: '-0.005em' }}>Class of '11 reunion night ✦</div>
    </div>
  );
}

function TicketStubCard() {
  return (
    <div style={{ position: 'relative', background: DSC.card, border: `1.5px solid ${DSC.ink2}`, borderRadius: 4, padding: 0, boxShadow: '0 4px 12px rgba(42,34,26,0.10)', overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 64px' }}>
        {/* Main */}
        <div style={{ padding: '16px 18px' }}>
          <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.accent, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>Admit one · Hartwood</div>
          <div style={{ fontFamily: DSF.display, fontSize: 19, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.02em', lineHeight: 1.1, marginTop: 6 }}>Spring Supper</div>
          <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {[['Date', 'Tue · 27 May'], ['Time', '7:30 pm'], ['Seat', '08'], ['Host', "Iris O. '11"]].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontFamily: DSF.mono, fontSize: 8.5, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 600 }}>{k}</div>
                <div style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.ink, fontWeight: 600, marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Perforation */}
        <div style={{ position: 'relative', width: 1, background: 'transparent' }}>
          <div style={{ position: 'absolute', top: -5, left: 0, width: 10, height: 10, background: DSC.panel, borderRadius: 999, transform: 'translateX(-50%)' }} />
          <div style={{ position: 'absolute', bottom: -5, left: 0, width: 10, height: 10, background: DSC.panel, borderRadius: 999, transform: 'translateX(-50%)' }} />
          <div style={{ position: 'absolute', inset: '8px 0', borderLeft: `2px dashed ${DSC.muted}`, borderRight: `2px dashed ${DSC.muted}`, width: 2, marginLeft: -1 }} />
        </div>
        {/* Stub */}
        <div style={{ background: DSC.cardAlt, padding: '16px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: DSF.mono, fontSize: 8.5, color: DSC.muted, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Seat · 08</div>
          <div style={{ fontFamily: DSF.display, fontSize: 24, fontWeight: 700, color: DSC.accent, letterSpacing: '-0.02em', lineHeight: 1 }}>08</div>
          <div style={{ fontFamily: DSF.mono, fontSize: 8.5, color: DSC.muted, letterSpacing: '0.10em', fontWeight: 600 }}>№142</div>
        </div>
      </div>
    </div>
  );
}

// ─── MOTION BEHAVIORS ──────────────────────────────────────────────────────

function InkRippleButton({ children, variant = 'primary' }) {
  const [ripples, setRipples] = React.useState([]);
  const bg = variant === 'ink' ? DSC.ink : DSC.accent;

  const click = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples(prev => [...prev, { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
    setTimeout(() => setRipples(prev => prev.filter(p => p.id !== id)), 700);
  };

  return (
    <button onClick={click} style={{ position: 'relative', overflow: 'hidden', background: bg, color: variant === 'ink' ? DSC.paper : '#fff', border: 'none', borderRadius: 999, padding: '11px 22px', fontFamily: DSF.body, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 0 rgba(255,255,255,.25) inset, 0 1px 2px rgba(42,34,26,0.08)' }}>
      {ripples.map(r => (
        <span key={r.id} style={{ position: 'absolute', left: r.x - 4, top: r.y - 4, width: 8, height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.55)', animation: 'ds-ripple-grow 700ms cubic-bezier(0.2,0.8,0.2,1) forwards', pointerEvents: 'none' }} />
      ))}
      <span style={{ position: 'relative' }}>{children}</span>
    </button>
  );
}

function CountUpDemo() {
  const target = 1284;
  const [value, setValue] = React.useState(0);
  const [seed, setSeed] = React.useState(0);

  React.useEffect(() => {
    const start = performance.now();
    const dur = 1200;
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seed]);

  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>Members</div>
        <span style={{ fontFamily: DSF.display, fontSize: 56, fontWeight: 600, color: DSC.accent, letterSpacing: '-0.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value.toLocaleString()}</span>
      </div>
      <DSButton size="sm" variant="outline" onClick={() => setSeed(s => s + 1)}>Replay</DSButton>
    </div>
  );
}

function BreathingDemo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <div style={{ position: 'relative', width: 56, height: 56, display: 'grid', placeItems: 'center' }}>
        <span style={{ position: 'absolute', inset: 0, borderRadius: 999, background: dshex(DSC.accent, 0.18), animation: 'ds-breath 2.2s ease-in-out infinite' }} />
        <span style={{ position: 'relative', width: 28, height: 28, borderRadius: 999, background: DSC.accent, boxShadow: `0 0 0 4px ${dshex(DSC.accent, 0.20)}` }} />
      </div>
      <div>
        <div style={{ fontFamily: DSF.body, fontSize: 13, fontWeight: 600, color: DSC.ink }}>Live · Iris is replying</div>
        <div style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted, marginTop: 2 }}>Active for 2 min</div>
      </div>
    </div>
  );
}

function StaggerDemo() {
  const [seed, setSeed] = React.useState(0);
  const items = ['Climate VC', 'Brooklyn', 'Class of \'11', 'Open to advising', '5-yr member'];
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', minHeight: 32, alignItems: 'center' }}>
        {items.map((it, i) => (
          <DSTag key={`${seed}-${i}`} tone="accent">
            <span style={{ display: 'inline-block', animation: `ds-tag-stagger 280ms cubic-bezier(0.2,0.8,0.2,1) ${i * 70}ms both` }}>{it}</span>
          </DSTag>
        ))}
      </div>
      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
        <DSButton size="sm" variant="outline" onClick={() => setSeed(s => s + 1)}>Replay</DSButton>
      </div>
    </div>
  );
}

function MagneticTiltDemo() {
  const ref = React.useRef(null);
  const [tilt, setTilt] = React.useState({ x: 0, y: 0 });

  const onMove = (e) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const cx = e.clientX - r.left - r.width / 2;
    const cy = e.clientY - r.top - r.height / 2;
    setTilt({ x: (cy / r.height) * -8, y: (cx / r.width) * 8 });
  };
  const reset = () => setTilt({ x: 0, y: 0 });

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={reset}
      style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: '20px 22px', cursor: 'pointer', transform: `perspective(500px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`, transition: 'transform 120ms ease-out', boxShadow: `0 ${10 + Math.abs(tilt.x) * 2}px ${20 + Math.abs(tilt.y) * 2}px rgba(42,34,26,0.10)` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <DSAvatar name="Iris Okonkwo" initials="IO" size={42} />
        <div>
          <div style={{ fontFamily: DSF.display, fontSize: 15, fontWeight: 600, color: DSC.ink }}>Iris Okonkwo</div>
          <div style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted, marginTop: 2 }}>Hover me · I tilt toward you</div>
        </div>
      </div>
    </div>
  );
}

function RevealDemo() {
  const ref = React.useRef(null);
  const [shown, setShown] = React.useState(false);
  const [seed, setSeed] = React.useState(0);

  React.useEffect(() => {
    if (!ref.current) return;
    setShown(false);
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setShown(true); }, { threshold: 0.4 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [seed]);

  return (
    <div>
      <div ref={ref} key={seed} style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 12, padding: '14px 16px', opacity: shown ? 1 : 0, transform: shown ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 400ms cubic-bezier(0.2,0.8,0.2,1), transform 400ms cubic-bezier(0.2,0.8,0.2,1)' }}>
        <div style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.ink, fontWeight: 500 }}>I slide up when scrolled into view.</div>
        <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, marginTop: 4 }}>Uses IntersectionObserver at 40% threshold.</div>
      </div>
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
        <DSButton size="sm" variant="outline" onClick={() => setSeed(s => s + 1)}>Replay</DSButton>
      </div>
    </div>
  );
}

window.MotionPlusSection = MotionPlusSection;
