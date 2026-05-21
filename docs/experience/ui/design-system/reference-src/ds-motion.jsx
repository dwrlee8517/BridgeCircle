/* eslint-disable */
// Atrium Design System — Motion & Interaction tokens

function MotionSection() {
  const [durKey, setDurKey]     = React.useState(0);
  const [durPlay, setDurPlay]   = React.useState(false);
  const [easeKey, setEaseKey]   = React.useState(0);
  const [easePlay, setEasePlay] = React.useState(false);

  const playDur = () => {
    setDurPlay(false);
    setTimeout(() => { setDurKey(k => k + 1); setDurPlay(true); }, 30);
  };
  const playEase = () => {
    setEasePlay(false);
    setTimeout(() => { setEaseKey(k => k + 1); setEasePlay(true); }, 30);
  };

  const durations = [
    { label: 'Instant', ms: 0,   token: '--dur-instant', usage: 'Badge counts, state swaps' },
    { label: 'Fast',    ms: 80,  token: '--dur-fast',    usage: 'Background fills, border colors' },
    { label: 'Base',    ms: 120, token: '--dur-base',    usage: 'Buttons, nav pills, icons', isDefault: true },
    { label: 'Medium',  ms: 200, token: '--dur-medium',  usage: 'Menus, dropdowns appearing' },
    { label: 'Slow',    ms: 320, token: '--dur-slow',    usage: 'Sheet slide-ins, modals' },
    { label: 'Lazy',    ms: 500, token: '--dur-lazy',    usage: 'AI stage transitions' },
  ];

  const easings = [
    { label: 'Ease Out',   value: 'cubic-bezier(0,0,0.2,1)',     token: '--ease-out',   usage: 'Default for most transitions' },
    { label: 'Spring',     value: 'cubic-bezier(0.2,0.8,0.2,1)', token: '--ease-spring', usage: 'Toggle knob, press release' },
    { label: 'Ease In/Out',value: 'cubic-bezier(0.4,0,0.2,1)',   token: '--ease-inout',  usage: 'Back-and-forth motions' },
    { label: 'Linear',     value: 'linear',                       token: '--ease-linear', usage: 'Opacity, color fades' },
  ];

  const transitions = [
    { name: 'nav-color',  props: 'background, color',             dur: '120ms', ease: 'ease-out', usage: 'Nav pills, pill tabs' },
    { name: 'card-lift',  props: 'transform, box-shadow',         dur: '120ms', ease: 'ease-out', usage: 'Clickable cards on hover' },
    { name: 'toggle-bg',  props: 'background',                    dur: '120ms', ease: 'ease-out', usage: 'Toggle pills, switches' },
    { name: 'toggle-knob',props: 'left',                          dur: '140ms', ease: 'spring',   usage: 'Toggle switch knob' },
    { name: 'btn-press',  props: 'transform',                     dur: '100ms', ease: 'ease-out', usage: 'Button press (translateY 0.5px)' },
    { name: 'caret-flip', props: 'transform',                     dur: '120ms', ease: 'ease-out', usage: 'Dropdown carets, chevrons' },
    { name: 'border-focus',props: 'border-color',                 dur: '80ms',  ease: 'ease-out', usage: 'Input focus ring' },
    { name: 'menu-enter', props: 'opacity, transform',            dur: '200ms', ease: 'ease-out', usage: 'Dropdown menus, drawers' },
  ];

  return (
    <DSSection id="motion" eyebrow="Foundation · 04" title="Motion & Interaction">

      {/* Keyframe injection */}
      <style>{`
        @keyframes ds-ai-pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.35; transform:scale(0.65); } }
        @keyframes ds-fade-up  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes ds-slide-r  { from { transform:translateX(-12px); opacity:0; } to { transform:translateX(0); opacity:1; } }
        @keyframes ds-spin     { from { transform:rotate(0deg); } to { transform:rotate(180deg); } }
      `}</style>

      {/* Duration scale */}
      <DSSub title="Duration scale — click Play to run">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={playDur} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: DSC.ink, color: DSC.paper, border: 'none', borderRadius: 999, padding: '9px 18px', fontFamily: DSF.body, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor"><path d="M0 0l10 6-10 6z" /></svg>
            Play all
          </button>
          <span style={{ fontFamily: DSF.mono, fontSize: 11, color: DSC.muted, letterSpacing: '0.04em' }}>All tracks fill simultaneously — see relative speeds</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {durations.map(d => (
            <div key={d.label} style={{ display: 'grid', gridTemplateColumns: '88px 1fr 220px', gap: 16, alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontFamily: DSF.mono, fontSize: 11, color: DSC.ink, fontWeight: 600 }}>{d.label}</div>
                  {d.isDefault && <span style={{ fontFamily: DSF.mono, fontSize: 8.5, color: DSC.accent, background: dshex(DSC.accent, 0.12), padding: '2px 6px', borderRadius: 999, fontWeight: 700, letterSpacing: '0.06em' }}>DEFAULT</span>}
                </div>
                <div style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.muted, marginTop: 1 }}>{d.ms}ms</div>
              </div>
              <div style={{ position: 'relative', height: 8, background: DSC.rule, borderRadius: 999, overflow: 'hidden' }}>
                <div key={durKey} style={{ position: 'absolute', inset: 0, background: DSC.accent, borderRadius: 999, transformOrigin: 'left center', transform: 'scaleX(0)', transition: durPlay ? `transform ${d.ms}ms cubic-bezier(0,0,0.2,1)` : 'none', ...(durPlay ? { transform: 'scaleX(1)' } : {}) }} />
              </div>
              <div style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted }}>{d.usage}</div>
            </div>
          ))}
        </div>
      </DSSub>

      {/* Easing curves */}
      <DSSub title="Easing curves — click Play to compare">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={playEase} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: DSC.ink, color: DSC.paper, border: 'none', borderRadius: 999, padding: '9px 18px', fontFamily: DSF.body, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor"><path d="M0 0l10 6-10 6z" /></svg>
            Play all
          </button>
          <span style={{ fontFamily: DSF.mono, fontSize: 11, color: DSC.muted, letterSpacing: '0.04em' }}>Same 600ms duration — watch the acceleration differ</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {easings.map((e, i) => {
            const dotColors = [DSC.accent, DSC.ok, DSC.ink, DSC.warn];
            const col = dotColors[i];
            return (
              <div key={e.label} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 200px', gap: 16, alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: DSF.mono, fontSize: 11, color: DSC.ink, fontWeight: 600 }}>{e.label}</div>
                  <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, marginTop: 1, wordBreak: 'break-all' }}>{e.value.replace('cubic-bezier', 'cb')}</div>
                </div>
                <div style={{ position: 'relative', height: 24, background: DSC.rule, borderRadius: 999 }}>
                  {/* Start cap */}
                  <div style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, borderRadius: 999, background: dshex(col, 0.2), border: `1px solid ${col}` }} />
                  {/* Moving dot */}
                  <div key={easeKey} style={{ position: 'absolute', top: 4, left: 4, width: 16, height: 16, borderRadius: 999, background: col, boxShadow: `0 0 0 2px rgba(255,255,255,0.6)`, transition: easePlay ? `left 600ms ${e.value}` : 'none', ...(easePlay ? { left: 'calc(100% - 20px)' } : {}) }} />
                </div>
                <div style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted }}>{e.usage}</div>
              </div>
            );
          })}
        </div>
      </DSSub>

      {/* Interaction states */}
      <DSSub title="Interaction states — hover & click to test">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>

          {/* Hover lift */}
          <div>
            <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Card hover lift</div>
            <HoverLiftDemo />
            <p style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted, marginTop: 10, lineHeight: 1.5 }}>
              <code style={{ fontFamily: DSF.mono, fontSize: 10.5, background: dshex(DSC.ink, 0.07), padding: '1px 5px', borderRadius: 4 }}>translateY(−2px)</code> + shadow increase on hover. Reverts on leave.
            </p>
          </div>

          {/* Button press */}
          <div>
            <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Button press</div>
            <PressDemo />
            <p style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted, marginTop: 10, lineHeight: 1.5 }}>
              <code style={{ fontFamily: DSF.mono, fontSize: 10.5, background: dshex(DSC.ink, 0.07), padding: '1px 5px', borderRadius: 4 }}>translateY(0.5px)</code> on mousedown, reverts on up/leave.
            </p>
          </div>

          {/* Toggle spring */}
          <div>
            <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Toggle spring</div>
            <ToggleSpringDemo />
            <p style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted, marginTop: 10, lineHeight: 1.5 }}>
              Knob uses <code style={{ fontFamily: DSF.mono, fontSize: 10.5, background: dshex(DSC.ink, 0.07), padding: '1px 5px', borderRadius: 4 }}>cubic-bezier(0.2,0.8,0.2,1)</code> spring easing.
            </p>
          </div>
        </div>
      </DSSub>

      {/* Named keyframe animations */}
      <DSSub title="Named keyframe animations">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {/* AI pulse */}
          <ShowCard title="atrium-ai-pulse">
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0 12px' }}>
              <span style={{ width: 12, height: 12, borderRadius: 999, background: DSC.accent, display: 'inline-block', animation: 'ds-ai-pulse 1.2s ease-in-out infinite' }} />
            </div>
            <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, marginTop: 4 }}>1.2s · infinite · ease-in-out</div>
            <div style={{ fontSize: 11.5, color: DSC.muted, fontFamily: DSF.body, marginTop: 6, lineHeight: 1.4 }}>AI search loading state. Opacity 0.35 + scale 0.65 at midpoint.</div>
          </ShowCard>

          {/* Fade up */}
          <ShowCard title="ds-fade-up">
            <FadeUpDemo />
            <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, marginTop: 8 }}>200ms · ease-out · once</div>
            <div style={{ fontSize: 11.5, color: DSC.muted, fontFamily: DSF.body, marginTop: 6, lineHeight: 1.4 }}>Menu items, result cards appearing. Opacity 0→1 + translateY 10→0.</div>
          </ShowCard>

          {/* Slide right */}
          <ShowCard title="ds-slide-r">
            <SlideRightDemo />
            <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, marginTop: 8 }}>180ms · ease-out · once</div>
            <div style={{ fontSize: 11.5, color: DSC.muted, fontFamily: DSF.body, marginTop: 6, lineHeight: 1.4 }}>Sheet entrance, drawer slide-in from left edge.</div>
          </ShowCard>

          {/* Caret flip */}
          <ShowCard title="caret-flip">
            <CaretFlipDemo />
            <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, marginTop: 8 }}>120ms · ease-out · toggle</div>
            <div style={{ fontSize: 11.5, color: DSC.muted, fontFamily: DSF.body, marginTop: 6, lineHeight: 1.4 }}>Dropdown chevrons. rotate(0°) → rotate(180°) on open.</div>
          </ShowCard>
        </div>
      </DSSub>

      {/* Transition reference table */}
      <DSSub title="Named transition reference">
        <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 160px 70px 90px 1fr', background: DSC.panel, padding: '8px 16px', fontFamily: DSF.mono, fontSize: 10, letterSpacing: '0.07em', textTransform: 'uppercase', color: DSC.muted }}>
            <span>Name</span><span>Properties</span><span>Duration</span><span>Easing</span><span>Used on</span>
          </div>
          {transitions.map((t, i) => (
            <div key={t.name} style={{ display: 'grid', gridTemplateColumns: '140px 160px 70px 90px 1fr', padding: '9px 16px', borderTop: `1px solid ${DSC.ruleSoft}`, fontFamily: DSF.mono, fontSize: 11, alignItems: 'center' }}>
              <span style={{ color: DSC.accent, fontWeight: 600 }}>{t.name}</span>
              <span style={{ color: DSC.ink2 }}>{t.props}</span>
              <span style={{ color: DSC.ok }}>{t.dur}</span>
              <span style={{ color: DSC.muted }}>{t.ease}</span>
              <span style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted }}>{t.usage}</span>
            </div>
          ))}
        </div>
      </DSSub>

    </DSSection>
  );
}

// ─── INTERACTION DEMO HELPERS ──────────────────────────────────────────────

function HoverLiftDemo() {
  const [hov, setHov] = React.useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: '16px 18px', cursor: 'pointer', transition: 'transform 120ms cubic-bezier(0,0,0.2,1), box-shadow 120ms cubic-bezier(0,0,0.2,1)', transform: hov ? 'translateY(-2px)' : 'translateY(0)', boxShadow: hov ? '0 1px 0 rgba(255,255,255,.6) inset, 0 8px 24px rgba(42,34,26,0.10)' : '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
      <DSAvatar name="Iris Okonkwo" initials="IO" size={32} />
      <div style={{ fontFamily: DSF.display, fontSize: 14, fontWeight: 600, color: DSC.ink, marginTop: 8 }}>Iris Okonkwo</div>
      <div style={{ fontSize: 12, color: DSC.muted, fontFamily: DSF.body, marginTop: 2 }}>Hover me →</div>
    </div>
  );
}

function PressDemo() {
  const [dn, setDn] = React.useState(false);
  return (
    <button
      onMouseDown={() => setDn(true)} onMouseUp={() => setDn(false)} onMouseLeave={() => setDn(false)}
      style={{ width: '100%', background: DSC.accent, color: '#fff', border: 'none', borderRadius: 999, padding: '13px 20px', fontFamily: DSF.body, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', transition: 'transform 100ms cubic-bezier(0,0,0.2,1)', transform: dn ? 'translateY(0.5px)' : 'translateY(0)', boxShadow: '0 1px 0 rgba(255,255,255,.25) inset, 0 1px 2px rgba(42,34,26,0.08)' }}>
      {dn ? 'Pressing…' : 'Hold to press'}
    </button>
  );
}

function ToggleSpringDemo() {
  const [on, setOn] = React.useState(false);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <button onClick={() => setOn(v => !v)} style={{ width: 48, height: 26, padding: 0, border: 'none', cursor: 'pointer', borderRadius: 999, background: on ? DSC.accent : DSC.rule, position: 'relative', transition: 'background 120ms ease', flexShrink: 0 }}>
        <span style={{ position: 'absolute', top: 3, left: on ? 24 : 3, width: 20, height: 20, borderRadius: 999, background: '#fff', transition: 'left 140ms cubic-bezier(0.2,0.8,0.2,1)', boxShadow: '0 1px 3px rgba(42,34,26,0.22)' }} />
      </button>
      <span style={{ fontFamily: DSF.body, fontSize: 13, color: on ? DSC.accent : DSC.muted, fontWeight: 600, transition: 'color 120ms ease' }}>{on ? 'On' : 'Off'}</span>
    </div>
  );
}

function FadeUpDemo() {
  const [key, setKey] = React.useState(0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }} onClick={() => setKey(k => k + 1)}>
      {[0, 60, 120].map((delay, i) => (
        <div key={`${key}-${i}`} style={{ background: dshex(DSC.accent, 0.12), borderRadius: 8, padding: '6px 10px', fontFamily: DSF.body, fontSize: 12, color: DSC.ink, animation: `ds-fade-up 200ms cubic-bezier(0,0,0.2,1) ${delay}ms both` }}>
          Result {i + 1}
        </div>
      ))}
      <div style={{ fontSize: 10.5, fontFamily: DSF.mono, color: DSC.muted, marginTop: 4 }}>click to replay</div>
    </div>
  );
}

function SlideRightDemo() {
  const [key, setKey] = React.useState(0);
  return (
    <div style={{ overflow: 'hidden', borderRadius: 10 }} onClick={() => setKey(k => k + 1)}>
      <div key={key} style={{ background: DSC.ink, borderRadius: 10, padding: '12px 14px', animation: 'ds-slide-r 180ms cubic-bezier(0,0,0.2,1) both' }}>
        <div style={{ fontFamily: DSF.body, fontSize: 12, color: '#fff', fontWeight: 600 }}>Sheet title</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>click to replay</div>
      </div>
    </div>
  );
}

function CaretFlipDemo() {
  const [open, setOpen] = React.useState(false);
  return (
    <button onClick={() => setOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: 999, padding: '10px 16px', cursor: 'pointer', width: '100%', justifyContent: 'space-between' }}>
      <span style={{ fontFamily: DSF.body, fontSize: 13, fontWeight: 600, color: DSC.ink }}>More options</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={DSC.muted} strokeWidth="2.2" strokeLinecap="round" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 120ms cubic-bezier(0,0,0.2,1)' }}>
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );
}

window.MotionSection = MotionSection;
