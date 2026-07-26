/* eslint-disable */
// Atrium Design System — Atmosphere & Texture (Section 19)
// Calendar week strip, Pinboard sticky notes, Confetti celebration

function AtmosphereSection() {
  return (
    <DSSection id="atmosphere" eyebrow="Components · 19" title="Atmosphere & Texture">

      <style>{`
        @keyframes ds-confetti-fall {
          0%   { transform: translate(var(--dx, 0px), -40px) rotate(0deg);  opacity: 0; }
          15%  { opacity: 1; }
          100% { transform: translate(var(--dx, 0px) translateX(var(--dx-end, 0px)), 280px) rotate(var(--r, 540deg)); opacity: 0; }
        }
      `}</style>

      <DSSub title="Calendar week strip — 7 days, scannable at a glance">
        <CalendarWeekStrip />
      </DSSub>

      <DSSub title="Pinboard — sticky notes from members, cork-board energy">
        <Pinboard />
        <p style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.muted, lineHeight: 1.6, marginTop: 16, maxWidth: 640 }}>
          Each card is rotated ±3°, attached with an SVG push-pin, and uses one of three paper tones (oat, parchment, chalk). Cards never overlap by more than 24px — the board still reads as a grid up close.
        </p>
      </DSSub>

      <DSSub title="Confetti celebration — replay-able milestone moment">
        <ConfettiMoment />
      </DSSub>

    </DSSection>
  );
}

function CalendarWeekStrip() {
  const days = [
    { dow: 'Mon', date: 19, label: 'today', events: [{ name: 'Office hours', dot: DSC.accent }] },
    { dow: 'Tue', date: 20, events: [{ name: 'Spring Supper · hosting', dot: DSC.accent }, { name: '1:1 Iris', dot: DSC.ok }] },
    { dow: 'Wed', date: 21, events: [] },
    { dow: 'Thu', date: 22, events: [{ name: 'Brooklyn Breakfast', dot: '#3f5680' }] },
    { dow: 'Fri', date: 23, events: [{ name: 'Climate panel', dot: DSC.ok }, { name: 'Cohort dinner', dot: DSC.accent }, { name: 'Brunch', dot: '#b88033' }] },
    { dow: 'Sat', date: 24, events: [] },
    { dow: 'Sun', date: 25, events: [{ name: 'Sunday Letter', dot: '#7a3a5e' }] },
  ];
  const [selected, setSelected] = React.useState(1);

  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 18, padding: '20px 22px 22px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <DSEyebrow accent>Week of May 19 — 25, 2026</DSEyebrow>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={{ background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: 999, width: 28, height: 28, cursor: 'pointer', display: 'grid', placeItems: 'center', color: DSC.muted }}>‹</button>
          <button style={{ background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: 999, width: 28, height: 28, cursor: 'pointer', display: 'grid', placeItems: 'center', color: DSC.muted }}>›</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {days.map((d, i) => {
          const isToday    = d.label === 'today';
          const isSelected = i === selected;
          return (
            <button key={i} onClick={() => setSelected(i)} style={{ background: isSelected ? DSC.ink : (isToday ? dshex(DSC.accent, 0.10) : DSC.cardAlt), color: isSelected ? DSC.paper : DSC.ink, border: `1px solid ${isSelected ? DSC.ink : (isToday ? dshex(DSC.accent, 0.32) : DSC.rule)}`, borderRadius: 12, padding: '12px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'all 140ms ease', minHeight: 110 }}>
              <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: isSelected ? dshex(DSC.paper, 0.7) : DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 600 }}>{d.dow}</div>
              <div style={{ fontFamily: DSF.display, fontSize: 24, fontWeight: 600, color: isSelected ? DSC.paper : (isToday ? DSC.accent : DSC.ink), lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{d.date}</div>
              {/* Event dots */}
              <div style={{ display: 'flex', gap: 3, marginTop: 'auto', minHeight: 8 }}>
                {d.events.slice(0, 3).map((e, j) => (
                  <span key={j} style={{ width: 6, height: 6, borderRadius: 999, background: e.dot }} />
                ))}
                {d.events.length > 3 && <span style={{ width: 6, height: 6, borderRadius: 999, background: DSC.mute2 }} />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Expanded selected day */}
      <div style={{ marginTop: 18, padding: '16px 18px', background: DSC.cardAlt, borderRadius: 14, border: `1px solid ${DSC.rule}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: days[selected].events.length ? 12 : 0 }}>
          <div style={{ fontFamily: DSF.display, fontSize: 18, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.015em' }}>{days[selected].dow}, May {days[selected].date}</div>
          <div style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.muted, letterSpacing: '0.06em' }}>{days[selected].events.length} {days[selected].events.length === 1 ? 'event' : 'events'}</div>
        </div>
        {days[selected].events.length === 0 ? (
          <div style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.muted, fontStyle: 'italic' }}>Quiet day. Use it well.</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {days[selected].events.map((e, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: DSC.card, border: `1px solid ${DSC.ruleSoft}`, borderRadius: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: e.dot }} />
                <span style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.ink, fontWeight: 500 }}>{e.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Pinboard() {
  const notes = [
    { text: 'I came for the alumni network. Stayed for the suppers.',                        who: 'Lena Vasquez', cohort: "'13", tone: 'oat',       rot: -2.5 },
    { text: "Iris's intro to climate VCs changed my entire year.",                            who: 'Theo Harrington', cohort: "'20", tone: 'parchment', rot: 1.8 },
    { text: 'Hartwood is the only network where "how are you" means it.',                    who: 'Maren Holt',   cohort: "'14", tone: 'oat',       rot: -1.2 },
    { text: "Best small-batch group for actually changing your mind.",                        who: 'Dev Patel',    cohort: "'11", tone: 'chalk',     rot: 2.6 },
    { text: 'The supper notes find their way into my journal more than my own thoughts do.', who: 'Rosa Ferrara', cohort: "'17", tone: 'parchment', rot: -2.0 },
    { text: "I joined to mentor. I ended up needing one. Got both.",                          who: 'Juno Park',    cohort: "'18", tone: 'oat',       rot: 1.3 },
  ];
  const toneBg = {
    oat:       { bg: '#f8f1e2', shadow: '#d8ccb6' },
    parchment: { bg: '#f5edd8', shadow: '#cdb98c' },
    chalk:     { bg: '#f2f1eb', shadow: '#cfccba' },
  };

  return (
    <div style={{ background: `repeating-linear-gradient(45deg, ${DSC.panel} 0px, ${DSC.panel} 2px, ${dshex(DSC.muted, 0.05)} 2px, ${dshex(DSC.muted, 0.05)} 3px)`, border: `1px solid ${DSC.rule}`, borderRadius: 18, padding: 22, boxShadow: 'inset 0 1px 4px rgba(42,34,26,0.10)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, alignItems: 'flex-start' }}>
        {notes.map((n, i) => {
          const t = toneBg[n.tone];
          return (
            <div key={i} style={{ position: 'relative', transform: `rotate(${n.rot}deg)`, transformOrigin: 'top center', transition: 'transform 200ms cubic-bezier(0.2,0.8,0.2,1)' }}
                 onMouseEnter={e => { e.currentTarget.style.transform = `rotate(${n.rot * 0.3}deg) translateY(-2px)`; e.currentTarget.style.zIndex = 2; }}
                 onMouseLeave={e => { e.currentTarget.style.transform = `rotate(${n.rot}deg)`; e.currentTarget.style.zIndex = ''; }}>
              {/* Push pin */}
              <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" style={{ position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)', zIndex: 1, filter: 'drop-shadow(0 2px 2px rgba(42,34,26,0.30))' }}>
                <defs>
                  <radialGradient id={`pin-${i}`} cx="35%" cy="30%">
                    <stop offset="0" stopColor="#ffffff" stopOpacity="0.7" />
                    <stop offset="0.5" stopColor={DSC.accent} />
                    <stop offset="1" stopColor="#8a3a20" />
                  </radialGradient>
                </defs>
                <circle cx="11" cy="10" r="6" fill={`url(#pin-${i})`} />
                <circle cx="11" cy="10" r="6" fill="none" stroke="rgba(0,0,0,0.20)" strokeWidth="0.6" />
                <ellipse cx="8" cy="8" rx="2.5" ry="1.5" fill="rgba(255,255,255,0.55)" />
              </svg>
              {/* Note */}
              <div style={{ background: t.bg, padding: '24px 18px 16px', borderRadius: 4, boxShadow: `0 6px 12px ${dshex(t.shadow, 0.45)}, 0 1px 0 rgba(255,255,255,0.45) inset`, minHeight: 130, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontFamily: DSF.display, fontSize: 14, fontWeight: 500, color: DSC.ink2, lineHeight: 1.4, margin: 0, letterSpacing: '-0.005em' }}>
                  "{n.text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto' }}>
                  <DSAvatar name={n.who} initials={n.who.split(' ').map(s => s[0]).join('')} size={22} />
                  <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, lineHeight: 1.3 }}>
                    <strong style={{ color: DSC.ink2, fontWeight: 600 }}>{n.who.split(' ')[0]}</strong>, {n.cohort}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConfettiMoment() {
  const [bursts, setBursts] = React.useState(0);
  const colors = [DSC.accent, DSC.ok, '#3f5680', '#b88033', '#7a3a5e', '#2f6e6c'];
  const particles = React.useMemo(() => {
    if (bursts === 0) return [];
    return Array.from({ length: 26 }, (_, i) => ({
      id: `${bursts}-${i}`,
      left: 10 + Math.random() * 80,
      delay: Math.random() * 200,
      duration: 1100 + Math.random() * 800,
      dx: (Math.random() - 0.5) * 80,
      rot: 360 + Math.random() * 540,
      color: colors[i % colors.length],
      shape: i % 3,
    }));
  }, [bursts]);

  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 18, padding: '32px 32px 28px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)', position: 'relative', overflow: 'hidden' }}>
      {/* Confetti particles */}
      {particles.map(p => (
        <span key={p.id} style={{ position: 'absolute', top: 0, left: `${p.left}%`, width: p.shape === 0 ? 8 : 6, height: p.shape === 0 ? 12 : 6, background: p.color, borderRadius: p.shape === 1 ? 999 : 2, transform: 'translateY(-40px)', animation: `ds-confetti-fall ${p.duration}ms cubic-bezier(0.2,0.6,0.4,1) ${p.delay}ms both`, pointerEvents: 'none', zIndex: 2, ['--dx']: `${p.dx}px`, ['--r']: `${p.rot}deg`, opacity: 0 }} />
      ))}

      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 22, alignItems: 'center' }}>
        {/* Decorative sparkle */}
        <div style={{ width: 64, height: 64, borderRadius: 999, background: `radial-gradient(circle at 35% 30%, ${dshex('#ffffff', 0.7)}, ${DSC.accent} 70%)`, display: 'grid', placeItems: 'center', boxShadow: `0 6px 18px ${dshex(DSC.accent, 0.40)}, inset 0 0 0 1px rgba(0,0,0,0.10)` }}>
          <svg width="28" height="28" viewBox="0 0 16 16" fill="none"><path d="M8 1L9.5 6.5L15 8L9.5 9.5L8 15L6.5 9.5L1 8L6.5 6.5Z" fill="#fff" /></svg>
        </div>
        {/* Text */}
        <div>
          <DSEyebrow>Confirmed · See you Tuesday</DSEyebrow>
          <h2 style={{ fontFamily: DSF.display, fontSize: 28, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.1, color: DSC.ink, margin: '8px 0 6px' }}>
            You're going to <span style={{ color: DSC.accent }}>Spring Supper</span>.
          </h2>
          <div style={{ fontFamily: DSF.body, fontSize: 13.5, color: DSC.muted, lineHeight: 1.5 }}>
            Tuesday May 27 · 7:30 pm · Iris is hosting · You're seated next to Sam Aldridge ('11).
          </div>
        </div>
        {/* Replay button */}
        <button onClick={() => setBursts(b => b + 1)} style={{ background: DSC.accent, color: '#fff', border: 'none', borderRadius: 999, padding: '11px 18px', fontFamily: DSF.body, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 0 rgba(255,255,255,.25) inset, 0 1px 2px rgba(42,34,26,0.08)', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1L9.5 6.5L15 8L9.5 9.5L8 15L6.5 9.5L1 8L6.5 6.5Z" /></svg>
          {bursts === 0 ? 'Celebrate' : 'Again!'}
        </button>
      </div>

      <p style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.muted, marginTop: 22, lineHeight: 1.55, position: 'relative' }}>
        Confetti uses 6 accent shades — squares, circles, and rectangles fall asymmetrically over ~1.5s. Replay-able; never auto-loops. Reserve for true milestones: first RSVP, first intro accepted, anniversaries.
      </p>
    </div>
  );
}

window.AtmosphereSection = AtmosphereSection;
