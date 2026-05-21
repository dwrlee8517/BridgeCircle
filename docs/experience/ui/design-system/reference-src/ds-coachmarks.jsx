/* eslint-disable */
// Atrium Design System — Onboarding Tour & Coach Marks (Section 44)
// Spotlight cutout · tooltip · step counter · tour controls.

function CoachMarksSection() {
  return (
    <DSSection id="coachmarks" eyebrow="Components · 44" title="Onboarding Tour & Coach Marks">

      <DSSub title="Spotlight tour — live 5-step walkthrough">
        <SpotlightTourDemo />
      </DSSub>

      <DSSub title="Coach-mark variants — anchored, pulsing, dismissible">
        <CoachMarkVariants />
      </DSSub>

      <DSSub title="Anatomy & placement rules">
        <CoachMarkRules />
      </DSSub>

    </DSSection>
  );
}

// ─── SPOTLIGHT TOUR ────────────────────────────────────────────────────────

const TOUR_STEPS = [
  {
    target: 'nav',
    title: 'Find anywhere with ⌘K',
    body: 'Open the command palette from any screen — jump between members, events, or threads in one keystroke.',
    placement: 'bottom',
  },
  {
    target: 'avatar',
    title: 'Your desk lives here',
    body: 'Profile, settings, and Helper Mode all live behind your avatar. Toggle Helper off when you need quiet hours.',
    placement: 'bottom',
  },
  {
    target: 'bell',
    title: 'Three replies waiting',
    body: "We don't ping. The bell only lights up for things you'd want to know about.",
    placement: 'bottom',
  },
  {
    target: 'banner',
    title: 'Spring Supper · Tue',
    body: "Iris is hosting. You're seated next to Sam. RSVP before Friday.",
    placement: 'right',
  },
  {
    target: 'cta',
    title: 'Start with one intro',
    body: "Pick a member from the directory and send them a short note. The supper starts with strangers.",
    placement: 'left',
  },
];

function SpotlightTourDemo() {
  const [step, setStep] = React.useState(0);
  const [done, setDone] = React.useState(false);

  const finish = () => setDone(true);
  const next = () => step < TOUR_STEPS.length - 1 ? setStep(step + 1) : finish();
  const prev = () => setStep(s => Math.max(0, s - 1));
  const restart = () => { setStep(0); setDone(false); };

  const TARGETS = {
    nav:    { x: 80,  y: 84,  w: 220, h: 36 },
    avatar: { x: 660, y: 84,  w: 36,  h: 36 },
    bell:   { x: 610, y: 84,  w: 36,  h: 36 },
    banner: { x: 24,  y: 156, w: 360, h: 92 },
    cta:    { x: 596, y: 320, w: 100, h: 36 },
  };
  const current = TOUR_STEPS[step];
  const target = TARGETS[current.target];

  // Tooltip placement helper
  const tipPos = () => {
    if (current.placement === 'bottom') return { left: target.x + target.w / 2, top: target.y + target.h + 14, transform: 'translateX(-50%)' };
    if (current.placement === 'right')  return { left: target.x + target.w + 16, top: target.y + target.h / 2, transform: 'translateY(-50%)' };
    if (current.placement === 'left')   return { left: target.x - 16, top: target.y + target.h / 2, transform: 'translate(-100%, -50%)' };
    return { left: target.x + target.w / 2, top: target.y - 14, transform: 'translate(-50%, -100%)' };
  };
  const tip = tipPos();

  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: 18 }}>
      {/* App canvas — simulated home screen */}
      <div style={{ position: 'relative', width: '100%', height: 460, background: DSC.paper, borderRadius: 12, overflow: 'hidden', border: `1px solid ${DSC.rule}` }}>
        {/* Header */}
        <div style={{ position: 'absolute', inset: '20px 24px auto', height: 50, padding: '8px 14px', background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <svg width="28" height="20" viewBox="0 0 32 24"><circle cx="11" cy="12" r="9" fill={DSC.accent} fillOpacity="0.85" /><circle cx="21" cy="12" r="9" fill={DSC.ok} fillOpacity="0.85" /></svg>
            <div style={{ display: 'flex', gap: 4 }}>
              {['Home', 'People', 'Inbox', 'Events'].map((it, i) => (
                <span key={it} style={{ padding: '6px 12px', borderRadius: 999, background: i === 0 ? DSC.ink : 'transparent', color: i === 0 ? DSC.paper : DSC.muted, fontFamily: DSF.body, fontSize: 12.5, fontWeight: 600 }}>{it}</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ position: 'relative', width: 28, height: 28, borderRadius: 999, background: DSC.card, border: `1px solid ${DSC.rule}`, display: 'grid', placeItems: 'center', color: DSC.ink }}>
              <Icon name="bell" size={13} color="currentColor" />
              <span style={{ position: 'absolute', top: -2, right: -2, width: 14, height: 14, borderRadius: 999, background: DSC.accent, color: '#fff', fontFamily: DSF.body, fontSize: 9, fontWeight: 700, display: 'grid', placeItems: 'center', border: `2px solid ${DSC.card}` }}>3</span>
            </span>
            <DSAvatar name="Maren Holt" initials="MH" size={28} />
          </div>
        </div>

        {/* Banner */}
        <div style={{ position: 'absolute', left: 24, top: 156, width: 360, padding: '14px 16px', background: dshex(DSC.accent, 0.08), border: `1px solid ${dshex(DSC.accent, 0.22)}`, borderRadius: 12 }}>
          <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.accent, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>T−8d · You're hosting</div>
          <div style={{ fontFamily: DSF.display, fontSize: 16, fontWeight: 600, color: DSC.ink, marginTop: 4 }}>Spring Supper · Tue 27 May</div>
          <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, marginTop: 2 }}>Iris is hosting · 14 of 20 going</div>
        </div>

        {/* Member card */}
        <div style={{ position: 'absolute', left: 396, top: 156, right: 24, height: 184, padding: 16, background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <DSAvatar name="Iris Okonkwo" initials="IO" size={36} />
            <div>
              <div style={{ fontFamily: DSF.display, fontSize: 14, fontWeight: 600, color: DSC.ink }}>Iris Okonkwo</div>
              <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted }}>VP Investments · Common Capital</div>
            </div>
          </div>
          <p style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, lineHeight: 1.5, margin: '12px 0 0' }}>Open to climate fintech founders this month. Send a quick intro to get started.</p>
          <div style={{ position: 'absolute', right: 16, bottom: 16, padding: '7px 14px', background: DSC.accent, color: '#fff', borderRadius: 999, fontFamily: DSF.body, fontSize: 12, fontWeight: 600 }}>Send intro →</div>
        </div>

        {/* Spotlight overlay */}
        {!done && (
          <>
            <svg width="100%" height="100%" viewBox="0 0 720 460" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <defs>
                <mask id="spot-mask">
                  <rect width="720" height="460" fill="white" />
                  <rect x={target.x - 6} y={target.y - 6} width={target.w + 12} height={target.h + 12} rx="10" fill="black" />
                </mask>
              </defs>
              <rect width="720" height="460" fill="rgba(26, 18, 12, 0.55)" mask="url(#spot-mask)" />
              {/* Pulsing ring around target */}
              <rect x={target.x - 4} y={target.y - 4} width={target.w + 8} height={target.h + 8} rx="10" fill="none" stroke={DSC.accent} strokeWidth="2" opacity="0.85" />
            </svg>

            {/* Tooltip */}
            <div style={{ position: 'absolute', ...tip, background: DSC.ink, color: DSC.paper, borderRadius: 12, padding: '14px 16px', width: 260, boxShadow: '0 16px 36px rgba(42,34,26,0.28)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.accent, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>Step {step + 1} of {TOUR_STEPS.length}</span>
                <button onClick={finish} aria-label="Dismiss tour" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.55)', padding: 0 }}>
                  <Icon name="close" size={13} color="currentColor" />
                </button>
              </div>
              <div style={{ fontFamily: DSF.display, fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>{current.title}</div>
              <p style={{ fontFamily: DSF.body, fontSize: 12.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, margin: '6px 0 12px' }}>{current.body}</p>
              {/* Dots */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                {TOUR_STEPS.map((_, i) => (
                  <span key={i} style={{ width: i === step ? 18 : 6, height: 6, borderRadius: 999, background: i === step ? DSC.accent : 'rgba(255,255,255,0.20)', transition: 'all 200ms ease' }} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                {step > 0 ? <button onClick={prev} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontFamily: DSF.body, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}>← Back</button> : <span />}
                <button onClick={next} style={{ background: DSC.accent, color: '#fff', border: 'none', borderRadius: 999, padding: '7px 16px', fontFamily: DSF.body, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{step === TOUR_STEPS.length - 1 ? 'Finish' : 'Next →'}</button>
              </div>
            </div>
          </>
        )}

        {/* Completed banner */}
        {done && (
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', background: DSC.ink, color: DSC.paper, borderRadius: 14, padding: '20px 24px', textAlign: 'center', boxShadow: '0 16px 36px rgba(42,34,26,0.28)' }}>
            <div style={{ width: 38, height: 38, borderRadius: 999, background: DSC.ok, color: '#fff', display: 'grid', placeItems: 'center', margin: '0 auto 10px' }}>
              <Icon name="check" size={18} color="currentColor" strokeWidth={2.8} />
            </div>
            <div style={{ fontFamily: DSF.display, fontSize: 18, fontWeight: 600 }}>You're set.</div>
            <p style={{ fontFamily: DSF.body, fontSize: 12.5, color: 'rgba(255,255,255,0.65)', margin: '6px 0 14px' }}>You can always reopen the tour from <strong style={{ color: '#fff' }}>Help & guidelines</strong>.</p>
            <button onClick={restart} style={{ background: DSC.accent, color: '#fff', border: 'none', borderRadius: 999, padding: '8px 16px', fontFamily: DSF.body, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Replay tour</button>
          </div>
        )}
      </div>

      {/* Outside controls */}
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.muted }}>{done ? 'Tour complete.' : <>Currently on <strong style={{ color: DSC.ink, fontWeight: 700 }}>Step {step + 1}</strong> — spotlight on <code style={{ fontFamily: DSF.mono, fontSize: 11, background: dshex(DSC.ink, 0.06), padding: '1px 6px', borderRadius: 4 }}>{current.target}</code></>}</div>
        <DSButton size="sm" variant="outline" onClick={restart}>Restart tour</DSButton>
      </div>
    </div>
  );
}

// ─── COACH MARK VARIANTS ───────────────────────────────────────────────────

function CoachMarkVariants() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
      <VariantCard label="First-run coach mark · ⌘K" note="Standalone tip with sparkle and dismiss. No spotlight.">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: DSC.ink, color: DSC.paper, borderRadius: 12, boxShadow: '0 10px 24px rgba(42,34,26,0.28)' }}>
          <span style={{ width: 28, height: 28, borderRadius: 999, background: dshex(DSC.accent, 0.20), color: DSC.accent, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Icon name="sparkle" size={14} color="currentColor" />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: DSF.body, fontSize: 13, fontWeight: 600 }}>Press <KbdKey>⌘</KbdKey><KbdKey>K</KbdKey> to jump anywhere</div>
            <div style={{ fontFamily: DSF.body, fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>Find people, RSVP, change tone, anything.</div>
          </div>
          <button aria-label="Dismiss" style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 4 }}>
            <Icon name="close" size={13} color="currentColor" />
          </button>
        </div>
      </VariantCard>

      <VariantCard label="Pulsing 'new' dot" note="Anchored to a feature button. Disappears after first click.">
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <DSButton variant="outline">Helper mode</DSButton>
          <span style={{ position: 'absolute', top: -4, right: -4, width: 12, height: 12, borderRadius: 999, background: DSC.accent, boxShadow: `0 0 0 3px ${dshex(DSC.accent, 0.20)}, 0 0 0 6px ${dshex(DSC.accent, 0.08)}` }} />
        </div>
      </VariantCard>

      <VariantCard label="Inline tip with arrow" note="Anchored tooltip with a 6px arrow pointing to the target.">
        <div style={{ position: 'relative', display: 'inline-block', marginTop: 50 }}>
          <button style={{ background: DSC.cardAlt, color: DSC.ink, border: `1px solid ${DSC.rule}`, borderRadius: 999, padding: '8px 16px', fontFamily: DSF.body, fontSize: 13, fontWeight: 600 }}>Settings</button>
          <div style={{ position: 'absolute', bottom: 'calc(100% + 12px)', left: '50%', transform: 'translateX(-50%)', background: DSC.ink, color: DSC.paper, borderRadius: 8, padding: '7px 12px', fontFamily: DSF.body, fontSize: 11.5, fontWeight: 500, whiteSpace: 'nowrap', boxShadow: '0 6px 14px rgba(42,34,26,0.28)' }}>
            Try the new Lamplight mode
            <span style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: `6px solid ${DSC.ink}` }} />
          </div>
        </div>
      </VariantCard>

      <VariantCard label="Floating product update" note="Bottom-right card for big updates. Slide-in entrance.">
        <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12, boxShadow: '0 12px 28px rgba(42,34,26,0.16)', maxWidth: 300 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: dshex(DSC.accent, 0.12), color: DSC.accent, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Icon name="sparkle" size={16} color="currentColor" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.accent, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>New · May 2026</div>
            <div style={{ fontFamily: DSF.display, fontSize: 13.5, fontWeight: 600, color: DSC.ink, marginTop: 4 }}>Office hours · booking</div>
            <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, marginTop: 4, lineHeight: 1.5 }}>Set 15-min slots for the cohort to book directly.</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <a style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.accent, fontWeight: 700, cursor: 'pointer' }}>See how →</a>
              <a style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, fontWeight: 500, cursor: 'pointer' }}>Dismiss</a>
            </div>
          </div>
        </div>
      </VariantCard>
    </div>
  );
}

// ─── RULES ─────────────────────────────────────────────────────────────────

function CoachMarkRules() {
  const rules = [
    { ok: true,  text: 'Trigger on first sign-in only, and after a 5-day pause.' },
    { ok: true,  text: 'Always include "Skip tour" — never force the walkthrough.' },
    { ok: true,  text: 'Spotlight one target at a time. The cutout has 8px breathing room.' },
    { ok: true,  text: 'Tooltip placement: bottom by default; flip to top/side if it overflows.' },
    { ok: true,  text: 'Persist completion in localStorage. Reopen-able from Help & guidelines.' },
    { ok: false, text: "Don't run a tour on every release. Add a single 'new' dot instead." },
    { ok: false, text: "Don't block destructive escape routes (Esc must always dismiss)." },
    { ok: false, text: 'Never run more than 6 steps. After that it\u2019s a manual.' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
      {rules.map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 14px', background: r.ok ? dshex(DSC.ok, 0.06) : dshex(DSC.bad, 0.05), border: `1px solid ${r.ok ? dshex(DSC.ok, 0.22) : dshex(DSC.bad, 0.22)}`, borderRadius: 10 }}>
          <span style={{ width: 18, height: 18, borderRadius: 999, background: r.ok ? DSC.ok : DSC.bad, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>
            <Icon name={r.ok ? 'check' : 'close'} size={10} color="currentColor" strokeWidth={3.2} />
          </span>
          <span style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.ink2, lineHeight: 1.5 }}>{r.text}</span>
        </div>
      ))}
    </div>
  );
}

window.CoachMarksSection = CoachMarksSection;
