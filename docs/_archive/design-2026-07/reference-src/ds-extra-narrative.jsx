/* eslint-disable */
// Atrium Design System — Extended Cards & Motion (Section 23)
// Index / Letter / Recipe / Library narrative cards
// Typewriter / Path-draw / Floating / Marquee / Wobble / Color-cycle motion

function ExtendedNarrativeSection() {
  return (
    <DSSection id="extracards" eyebrow="Components · 23" title="Extended Cards & Motion">

      <style>{`
        @keyframes ds-blink     { 50% { opacity: 0; } }
        @keyframes ds-float     { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes ds-marquee   { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes ds-wobble    { 0%,100% { transform: rotate(0); } 25% { transform: rotate(-4deg); } 75% { transform: rotate(4deg); } }
        @keyframes ds-hue-cycle { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(360deg); } }
        @keyframes ds-path-draw { from { stroke-dashoffset: var(--len, 100); } to { stroke-dashoffset: 0; } }
      `}</style>

      <DSSub title="Narrative cards — pull from real-world stationery">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          <VariantCard label="Index card" note="Ruled lines + red margin. Quick notes, briefs.">
            <IndexCard />
          </VariantCard>
          <VariantCard label="Letter card" note="Letter-paper texture with corner mark + signature.">
            <LetterCard />
          </VariantCard>
          <VariantCard label="Recipe card" note="Sectioned ingredients + instructions layout.">
            <RecipeCard />
          </VariantCard>
          <VariantCard label="Library card" note="Borrower log with date-stamped rows.">
            <LibraryCard />
          </VariantCard>
        </div>
      </DSSub>

      <DSSub title="More motion behaviors">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          <VariantCard label="Typewriter" note="Character-by-character reveal with blinking cursor.">
            <TypewriterDemo />
          </VariantCard>
          <VariantCard label="Path-draw underline" note="SVG line draws under a word. For emphasis.">
            <PathDrawDemo />
          </VariantCard>
          <VariantCard label="Floating" note="Subtle 6px bob. Indicates live or hovering state.">
            <FloatingDemo />
          </VariantCard>
          <VariantCard label="Marquee strip" note="Continuous horizontal scroll. For event banners.">
            <MarqueeDemo />
          </VariantCard>
          <VariantCard label="Wobble on attention" note="Single shake to draw the eye — never loops.">
            <WobbleDemo />
          </VariantCard>
          <VariantCard label="Color-cycle highlight" note="Slow hue shift. For Pride, anniversaries, themed weeks.">
            <ColorCycleDemo />
          </VariantCard>
        </div>
      </DSSub>

    </DSSection>
  );
}

// ─── NARRATIVE CARDS ───────────────────────────────────────────────────────

function IndexCard() {
  const lines = 7;
  return (
    <div style={{ background: '#fcfaf2', borderRadius: 4, border: `1px solid ${dshex(DSC.muted, 0.32)}`, boxShadow: '0 4px 10px rgba(42,34,26,0.10)', padding: '14px 14px 12px 28px', position: 'relative', overflow: 'hidden', minHeight: 200 }}>
      {/* Red margin */}
      <div style={{ position: 'absolute', left: 18, top: 0, bottom: 0, width: 1.5, background: dshex(DSC.bad, 0.45) }} />
      {/* Ruled lines */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 36, height: 'calc(100% - 36px)', backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 19px, ${dshex(DSC.muted, 0.22)} 19px 20px)`, pointerEvents: 'none' }} />
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 6, borderBottom: `1px solid ${dshex(DSC.muted, 0.32)}`, marginBottom: 10 }}>
          <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>Brief</div>
          <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.08em' }}>05·19·26</div>
        </div>
        <div style={{ fontFamily: '"Inter Tight", system-ui, sans-serif', fontSize: 14, color: DSC.ink, lineHeight: '20px', fontWeight: 500 }}>
          Climate VC intro — Iris O.
        </div>
        <div style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.ink2, lineHeight: '20px', marginTop: 0 }}>
          Met at Hartwood Supper '23.<br />
          Looking for early-stage climate fintech.<br />
          Wants 30 min on go-to-market.<br />
          Has read Cornell paper.<br />
          Open to coffee next Tue.
        </div>
      </div>
    </div>
  );
}

function LetterCard() {
  return (
    <div style={{ background: '#fdfaf0', borderRadius: 6, border: `1px solid ${dshex(DSC.muted, 0.28)}`, padding: '20px 22px 18px', position: 'relative', boxShadow: '0 6px 14px rgba(42,34,26,0.12)', minHeight: 220 }}>
      {/* Corner mark */}
      <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true" style={{ position: 'absolute', top: 8, right: 8, opacity: 0.55 }}>
        <circle cx="14" cy="20" r="11" fill="none" stroke={DSC.accent} strokeWidth="1" />
        <circle cx="22" cy="20" r="11" fill="none" stroke={DSC.ok} strokeWidth="1" />
      </svg>
      <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>Hartwood Society · Brooklyn</div>
      <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.06em', marginTop: 4 }}>19 May 2026</div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontFamily: '"Inter Tight", system-ui, sans-serif', fontStyle: 'italic', fontSize: 15, color: DSC.ink2, lineHeight: 1.55 }}>
          Dear Iris,
        </div>
        <p style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.ink2, lineHeight: 1.65, margin: '8px 0 0' }}>
          Maren mentioned you're moving on climate underwriting this quarter. I'd love thirty minutes — happy to come to your end of town.
        </p>
      </div>

      <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px dashed ${dshex(DSC.muted, 0.30)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ fontFamily: '"Inter Tight", system-ui, sans-serif', fontStyle: 'italic', fontSize: 18, color: DSC.accent, fontWeight: 500, transform: 'rotate(-3deg)', letterSpacing: '-0.01em' }}>~ Maren</div>
        <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.06em' }}>— Member №142</div>
      </div>
    </div>
  );
}

function RecipeCard() {
  return (
    <div style={{ background: '#fbf6e6', borderRadius: 4, border: `1px solid ${dshex(DSC.muted, 0.32)}`, padding: 0, boxShadow: '0 4px 12px rgba(42,34,26,0.10)', overflow: 'hidden', minHeight: 220 }}>
      {/* Title bar */}
      <div style={{ padding: '12px 16px 10px', borderBottom: `2px dashed ${dshex(DSC.accent, 0.55)}`, background: dshex(DSC.accent, 0.06) }}>
        <div style={{ fontFamily: DSF.mono, fontSize: 9, color: DSC.accent, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>Spring Supper · serves 12</div>
        <div style={{ fontFamily: '"Inter Tight", system-ui, sans-serif', fontSize: 19, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.02em', marginTop: 4 }}>Slow-roast pork shoulder, fennel pickle</div>
      </div>
      {/* Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        {/* Ingredients */}
        <div style={{ padding: '12px 16px', borderRight: `1px dashed ${dshex(DSC.muted, 0.30)}` }}>
          <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>You bring</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontFamily: DSF.body, fontSize: 11.5, color: DSC.ink2, lineHeight: 1.7 }}>
            {['1 fennel bulb', '2 lemons', 'Crusty bread', 'A bottle of red', 'Curiosity'].map((it, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <span style={{ color: DSC.accent, fontWeight: 700 }}>·</span>
                {it}
              </li>
            ))}
          </ul>
        </div>
        {/* Instructions */}
        <div style={{ padding: '12px 16px' }}>
          <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>Method</div>
          <ol style={{ paddingLeft: 18, margin: 0, fontFamily: DSF.body, fontSize: 11.5, color: DSC.ink2, lineHeight: 1.6 }}>
            <li>Arrive at 7:00 sharp.</li>
            <li>Greet two strangers.</li>
            <li>Sit where Sam tells you.</li>
            <li>Listen first.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function LibraryCard() {
  const log = [
    { date: '03·14·26', who: 'Iris Okonkwo', action: 'Borrowed' },
    { date: '04·02·26', who: 'Iris Okonkwo', action: 'Returned, +note' },
    { date: '04·19·26', who: 'Dev Patel',    action: 'Borrowed' },
    { date: '05·07·26', who: 'Dev Patel',    action: 'Returned' },
    { date: '05·18·26', who: 'Maren Holt',   action: 'Borrowed' },
  ];
  return (
    <div style={{ background: '#f6f1e2', borderRadius: 2, border: `1px solid ${dshex(DSC.muted, 0.40)}`, padding: 0, boxShadow: '0 4px 10px rgba(42,34,26,0.10), 0 1px 0 rgba(255,255,255,.6) inset', overflow: 'hidden', minHeight: 220 }}>
      <div style={{ padding: '12px 16px 8px', borderBottom: `2px solid ${dshex(DSC.muted, 0.40)}`, background: dshex(DSC.muted, 0.06) }}>
        <div style={{ fontFamily: DSF.mono, fontSize: 9, color: DSC.muted, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>Hartwood Society Library</div>
        <div style={{ fontFamily: '"Inter Tight", system-ui, sans-serif', fontSize: 14, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.01em', marginTop: 3 }}>How to See — A Field Guide</div>
        <div style={{ fontFamily: DSF.body, fontStyle: 'italic', fontSize: 11, color: DSC.muted, marginTop: 2 }}>by Iris Okonkwo, '11</div>
      </div>
      <div style={{ padding: '8px 16px 14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr auto', gap: 4, fontFamily: DSF.mono, fontSize: 9, color: DSC.muted, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, paddingBottom: 4, borderBottom: `1px solid ${dshex(DSC.muted, 0.30)}` }}>
          <span>Date</span><span>Borrower</span><span>Action</span>
        </div>
        {log.map((l, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '70px 1fr auto', gap: 4, padding: '6px 0', borderBottom: i === log.length - 1 ? 'none' : `1px dashed ${dshex(DSC.muted, 0.22)}`, fontFamily: DSF.body, fontSize: 11.5, color: DSC.ink2 }}>
            <span style={{ fontFamily: DSF.mono, color: DSC.accent, fontWeight: 600 }}>{l.date}</span>
            <span style={{ fontWeight: 500 }}>{l.who}</span>
            <span style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.muted, letterSpacing: '0.04em', fontWeight: 600 }}>{l.action}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MOTION EXTRAS ─────────────────────────────────────────────────────────

function TypewriterDemo() {
  const fullText = "Maren, I'd love thirty minutes — happy to come to your end of town.";
  const [chars, setChars] = React.useState(0);
  const [seed, setSeed] = React.useState(0);

  React.useEffect(() => {
    setChars(0);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setChars(i);
      if (i >= fullText.length) clearInterval(id);
    }, 32);
    return () => clearInterval(id);
  }, [seed]);

  return (
    <div>
      <div style={{ background: DSC.ink, color: DSC.paper, padding: '14px 16px', borderRadius: 8, fontFamily: DSF.mono, fontSize: 12.5, lineHeight: 1.55, minHeight: 84 }}>
        {fullText.slice(0, chars)}
        <span style={{ display: 'inline-block', width: 7, height: 14, marginLeft: 2, background: DSC.accent, verticalAlign: -2, animation: 'ds-blink 0.9s steps(1) infinite' }} />
      </div>
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
        <DSButton size="sm" variant="outline" onClick={() => setSeed(s => s + 1)}>Replay</DSButton>
      </div>
    </div>
  );
}

function PathDrawDemo() {
  const [seed, setSeed] = React.useState(0);
  return (
    <div>
      <p style={{ fontFamily: DSF.display, fontSize: 22, fontWeight: 500, color: DSC.ink, lineHeight: 1.3, margin: 0, letterSpacing: '-0.015em' }}>
        We are a small, slow,{' '}
        <span style={{ position: 'relative', display: 'inline-block' }}>
          <span style={{ position: 'relative', zIndex: 1 }}>verified</span>
          <svg key={seed} width="86" height="14" viewBox="0 0 86 14" style={{ position: 'absolute', left: 0, bottom: -6, pointerEvents: 'none' }}>
            <path d="M2,9 Q22,2 42,8 T84,7" fill="none" stroke={DSC.accent} strokeWidth="3" strokeLinecap="round" strokeDasharray="120" strokeDashoffset="120" style={{ animation: `ds-path-draw 700ms cubic-bezier(0.2,0.8,0.2,1) forwards`, ['--len']: 120 }} />
          </svg>
        </span>{' '}
        circle.
      </p>
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <DSButton size="sm" variant="outline" onClick={() => setSeed(s => s + 1)}>Replay</DSButton>
      </div>
    </div>
  );
}

function FloatingDemo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, justifyContent: 'center', padding: '6px 0 0' }}>
      <div style={{ animation: 'ds-float 3s ease-in-out infinite' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: DSC.ink, color: DSC.paper, padding: '10px 14px', borderRadius: 14, fontFamily: DSF.body, fontSize: 12.5, fontWeight: 600, boxShadow: '0 8px 20px rgba(42,34,26,0.20)' }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: DSC.ok, boxShadow: `0 0 0 3px ${dshex(DSC.ok, 0.30)}` }} />
          Iris is online
        </span>
      </div>
      <div style={{ animation: 'ds-float 3s ease-in-out infinite', animationDelay: '0.4s' }}>
        <div style={{ width: 44, height: 44, borderRadius: 999, background: `linear-gradient(135deg, ${DSC.accent}, ${DSC.ok})`, display: 'grid', placeItems: 'center', color: '#fff', fontFamily: DSF.display, fontSize: 14, fontWeight: 700, boxShadow: '0 8px 20px rgba(42,34,26,0.20)' }}>IO</div>
      </div>
      <div style={{ animation: 'ds-float 3s ease-in-out infinite', animationDelay: '0.8s' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: dshex(DSC.accent, 0.13), color: DSC.accent, padding: '6px 11px', borderRadius: 999, fontFamily: DSF.body, fontSize: 11.5, fontWeight: 700, boxShadow: `0 4px 12px ${dshex(DSC.accent, 0.20)}` }}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5L9.3 6.7L14.5 8L9.3 9.3L8 14.5L6.7 9.3L1.5 8L6.7 6.7Z" /></svg>
          New match
        </span>
      </div>
    </div>
  );
}

function MarqueeDemo() {
  const items = ['Spring Supper · Tue', 'Brooklyn Breakfast · Thu', 'Climate panel · Fri', '12 new members this week', 'Sunday Letter · 9 am', 'Office Hours · Fri 2 pm'];
  // Duplicate items for seamless loop
  const loop = [...items, ...items];
  return (
    <div style={{ background: DSC.ink, color: DSC.paper, borderRadius: 999, padding: '10px 0', overflow: 'hidden', position: 'relative', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
      {/* Gradient masks at edges */}
      <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 40, background: `linear-gradient(to right, ${DSC.ink}, transparent)`, pointerEvents: 'none', zIndex: 2 }} />
      <span style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 40, background: `linear-gradient(to left, ${DSC.ink}, transparent)`, pointerEvents: 'none', zIndex: 2 }} />
      <div style={{ display: 'inline-flex', whiteSpace: 'nowrap', animation: 'ds-marquee 22s linear infinite' }}>
        {loop.map((it, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '0 22px' }}>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: DSC.accent }} />
            <span style={{ fontFamily: DSF.body, fontSize: 12.5, fontWeight: 500, letterSpacing: '0.04em' }}>{it}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function WobbleDemo() {
  const [wob, setWob] = React.useState(0);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <span key={wob} onAnimationEnd={() => setWob(w => w + 0)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', background: dshex(DSC.warn, 0.14), color: DSC.warn, fontFamily: DSF.body, fontSize: 12, fontWeight: 700, borderRadius: 999, animation: wob === 0 ? 'none' : 'ds-wobble 420ms ease-in-out 1', transformOrigin: 'center' }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor' }} />
        3 replies waiting
      </span>
      <DSButton size="sm" variant="outline" onClick={() => setWob(w => w + 1)}>Wobble</DSButton>
    </div>
  );
}

function ColorCycleDemo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 14px', background: DSC.accent, color: '#fff', fontFamily: DSF.body, fontSize: 12, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', borderRadius: 999, animation: 'ds-hue-cycle 8s linear infinite' }}>
        <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5L9.3 6.7L14.5 8L9.3 9.3L8 14.5L6.7 9.3L1.5 8L6.7 6.7Z" /></svg>
        Anniversary week
      </span>
      <div style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted, lineHeight: 1.4 }}>
        Uses <code style={{ fontFamily: DSF.mono, fontSize: 10.5, background: dshex(DSC.ink, 0.06), padding: '1px 5px', borderRadius: 4 }}>filter: hue-rotate</code> — base accent untouched.
      </div>
    </div>
  );
}

window.ExtendedNarrativeSection = ExtendedNarrativeSection;
window.IndexCard      = IndexCard;
window.LetterCard     = LetterCard;
window.RecipeCard     = RecipeCard;
window.LibraryCard    = LibraryCard;
