/* eslint-disable */
// Atrium Design System — Creative additions: Feedback & Trust
// Section 12: Feedback & Status — Toast, Banner, Skeleton
// Section 13: Trust & Community — Vouching, Verification stepper, Mutual constellation

// ─── SECTION 12 — FEEDBACK & STATUS ────────────────────────────────────────

function FeedbackSection() {
  return (
    <DSSection id="feedback" eyebrow="Components · 12" title="Feedback & Status">

      <style>{`
        @keyframes ds-slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes ds-shimmer  { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>

      <DSSub title="Toast — bottom-anchored notification with undo">
        <ToastDemo />
      </DSSub>

      <DSSub title="Banners — inline alerts across 4 tones">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Banner tone="info"        title="Heads up — Spring Supper RSVPs close Friday." action="Open event" />
          <Banner tone="success"     title="Your intro to Iris Okonkwo was sent." sub="Most members reply within 4 days." action="View thread" />
          <Banner tone="warn"        title="3 mentor requests have been waiting more than 5 days." action="Open inbox" />
          <Banner tone="celebration" title="Hartwood reached 1,284 members today." sub="That's 27% growth this quarter. ↑ Anchored by you, Maren." action="See cohort breakdown" />
        </div>
        <p style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.muted, lineHeight: 1.55, marginTop: 16, maxWidth: 580 }}>
          Banners live <strong>inside</strong> a section context, never floating over it. The <em>celebration</em> tone uses the accent with a soft circle motif — reserve it for community milestones.
        </p>
      </DSSub>

      <DSSub title="Skeleton loaders — match the resting card shape">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {[0, 1, 2].map(i => <SkeletonCard key={i} delay={i * 120} />)}
        </div>
        <p style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.muted, lineHeight: 1.55, marginTop: 16, maxWidth: 580 }}>
          Shimmer uses an oat-tinted gradient that respects the surface tone. Stagger the delay across siblings (120ms) so the wave reads as one continuous motion rather than a flicker.
        </p>
      </DSSub>

    </DSSection>
  );
}

function ToastDemo() {
  const [toasts, setToasts] = React.useState([]);
  const spawn = (kind) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev.slice(-2), { id, kind }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };
  const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const kinds = {
    success: { bg: DSC.ink,    fg: DSC.paper, dot: DSC.ok,     msg: 'Reply sent to Jordan Reyes.',         action: null },
    info:    { bg: DSC.ink,    fg: DSC.paper, dot: DSC.accent, msg: 'Iris just opened your message.',      action: null },
    undo:    { bg: DSC.ink,    fg: DSC.paper, dot: DSC.warn,   msg: 'Skipped Theo Harrington.',            action: 'Undo' },
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <DSButton onClick={() => spawn('success')}>Spawn success</DSButton>
        <DSButton variant="outline" onClick={() => spawn('info')}>Spawn info</DSButton>
        <DSButton variant="outline" onClick={() => spawn('undo')}>Spawn undo</DSButton>
      </div>
      <div style={{ position: 'relative', minHeight: 180, background: DSC.panel, borderRadius: 14, padding: 16, border: `1px dashed ${DSC.rule}` }}>
        <div style={{ position: 'absolute', top: 12, left: 16, fontFamily: DSF.mono, fontSize: 10, letterSpacing: '0.08em', color: DSC.muted, textTransform: 'uppercase' }}>Viewport ↓ bottom-anchored</div>
        <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {toasts.map(t => {
            const k = kinds[t.kind];
            return (
              <div key={t.id} style={{ background: k.bg, color: k.fg, padding: '12px 14px 12px 16px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 12, animation: 'ds-slide-up 240ms cubic-bezier(0.2,0.8,0.2,1)', boxShadow: '0 10px 30px rgba(42,34,26,0.32), 0 1px 0 rgba(255,255,255,.10) inset' }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: k.dot, flexShrink: 0 }} />
                <span style={{ fontFamily: DSF.body, fontSize: 13.5, fontWeight: 500, flex: 1 }}>{k.msg}</span>
                {k.action && (
                  <button onClick={() => dismiss(t.id)} style={{ background: 'transparent', color: DSC.accent, border: 'none', cursor: 'pointer', fontFamily: DSF.body, fontSize: 13, fontWeight: 700, padding: '2px 6px', filter: 'brightness(1.35)' }}>{k.action}</button>
                )}
                <button onClick={() => dismiss(t.id)} aria-label="Dismiss" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.45)', padding: 0, fontSize: 18, lineHeight: 1 }}>×</button>
              </div>
            );
          })}
          {toasts.length === 0 && (
            <div style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.mute2, letterSpacing: '0.04em', textAlign: 'center', padding: 8 }}>spawn one ↑</div>
          )}
        </div>
      </div>
      <p style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.muted, lineHeight: 1.55, marginTop: 12, maxWidth: 580 }}>
        Auto-dismiss after 5s. Up to 3 stacked; oldest scrolls off first. Status dot color carries the meaning — text stays warm-neutral.
      </p>
    </div>
  );
}

function Banner({ tone, title, sub, action }) {
  const tones = {
    info:        { bg: DSC.cardAlt,                  fg: DSC.ink2,    accent: DSC.muted, icon: 'info',  border: DSC.rule },
    success:     { bg: dshex(DSC.ok, 0.10),          fg: DSC.ink,     accent: DSC.ok,     icon: 'check', border: dshex(DSC.ok, 0.28) },
    warn:        { bg: dshex(DSC.warn, 0.10),        fg: DSC.ink,     accent: DSC.warn,   icon: 'alert', border: dshex(DSC.warn, 0.28) },
    celebration: { bg: dshex(DSC.accent, 0.10),      fg: DSC.ink,     accent: DSC.accent, icon: 'spark', border: dshex(DSC.accent, 0.28) },
  };
  const t = tones[tone];
  return (
    <div style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: 14, padding: '14px 16px 14px 14px', display: 'flex', alignItems: 'flex-start', gap: 12, position: 'relative', overflow: 'hidden' }}>
      {tone === 'celebration' && (
        <svg aria-hidden="true" width="200" height="80" viewBox="0 0 200 80" style={{ position: 'absolute', right: -10, top: -20, opacity: 0.35, pointerEvents: 'none' }}>
          <circle cx="60" cy="50" r="34" fill="none" stroke={DSC.accent} strokeWidth="1.2" />
          <circle cx="110" cy="50" r="34" fill="none" stroke={DSC.ok}     strokeWidth="1.2" />
        </svg>
      )}
      <div style={{ width: 28, height: 28, borderRadius: 999, background: dshex(t.accent, 0.18), display: 'grid', placeItems: 'center', flexShrink: 0, color: t.accent }}>
        <BannerIcon kind={t.icon} />
      </div>
      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
        <div style={{ fontFamily: DSF.body, fontSize: 13.5, fontWeight: 600, color: t.fg, lineHeight: 1.4 }}>{title}</div>
        {sub && <div style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.muted, marginTop: 4, lineHeight: 1.5 }}>{sub}</div>}
      </div>
      {action && (
        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: t.accent, fontFamily: DSF.body, fontSize: 12.5, fontWeight: 700, padding: 0, whiteSpace: 'nowrap', flexShrink: 0, position: 'relative' }}>{action} →</button>
      )}
    </div>
  );
}

function BannerIcon({ kind }) {
  const p = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (kind) {
    case 'info':  return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 8v.5M12 11v6" /></svg>;
    case 'check': return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M8 12.5l3 3 5-6" /></svg>;
    case 'alert': return <svg {...p}><path d="M12 3l10 18H2L12 3z" /><path d="M12 10v4M12 17v.5" /></svg>;
    case 'spark': return <svg {...p}><path d="M12 3l1.6 6.4L20 11l-6.4 1.6L12 19l-1.6-6.4L4 11l6.4-1.6L12 3z" fill="currentColor" stroke="none" /></svg>;
    default:      return null;
  }
}

function SkeletonCard({ delay = 0 }) {
  const shimmer = {
    background: `linear-gradient(90deg, ${dshex(DSC.rule, 0.55)} 0%, ${dshex(DSC.ruleSoft, 0.85)} 50%, ${dshex(DSC.rule, 0.55)} 100%)`,
    backgroundSize: '200% 100%',
    animation: `ds-shimmer 1.6s ease-in-out infinite`,
    animationDelay: `${delay}ms`,
    borderRadius: 6,
  };
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 16, padding: 18, boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ ...shimmer, width: 70, height: 10 }} />
        <div style={{ ...shimmer, width: 80, height: 16, borderRadius: 999 }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
        <div style={{ ...shimmer, width: 44, height: 44, borderRadius: 999, flexShrink: 0 }} />
        <div style={{ ...shimmer, height: 18, width: '70%', alignSelf: 'center' }} />
      </div>
      <div style={{ ...shimmer, height: 11, width: '90%', marginBottom: 6 }} />
      <div style={{ ...shimmer, height: 11, width: '78%', marginBottom: 12 }} />
      <div style={{ display: 'flex', gap: 6 }}>
        <div style={{ ...shimmer, height: 18, width: 60, borderRadius: 999 }} />
        <div style={{ ...shimmer, height: 18, width: 48, borderRadius: 999 }} />
        <div style={{ ...shimmer, height: 18, width: 70, borderRadius: 999 }} />
      </div>
    </div>
  );
}

// ─── SECTION 13 — TRUST & COMMUNITY ────────────────────────────────────────

function TrustSection() {
  return (
    <DSSection id="trust" eyebrow="Components · 13" title="Trust & Community">

      <DSSub title="Member card — verified by the Society, invited by a member">
        <VouchingCard />
      </DSSub>

      <DSSub title="Verification path — a 3-step stepper that earns trust progressively">
        <VerificationStepper />
        <p style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.muted, lineHeight: 1.55, marginTop: 16, maxWidth: 580 }}>
          Shown during onboarding and as a small inline indicator on profile pages. Hartwood admissions confirms eligibility against the alumni roster; an existing member's invitation finishes the loop.
        </p>
      </DSSub>

      <DSSub title="Mutual constellation — show why two people are 2 degrees apart">
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, alignItems: 'stretch' }}>
          <MutualConstellation />
          <TrustRing />
        </div>
      </DSSub>

    </DSSection>
  );
}

function VouchingCard() {
  const invitedBy = [
    { name: 'Dev Patel',    initials: 'DP', when: 'Invited you in May 2021' },
    { name: 'Sam Aldridge', initials: 'SA', when: 'Class of \'11' },
  ];
  const cohortMates = [
    { name: 'Iris Okonkwo', initials: 'IO' },
    { name: 'Rosa Ferrara', initials: 'RF' },
    { name: 'Juno Park',    initials: 'JP' },
    { name: 'Lena Vasquez', initials: 'LV' },
    { name: 'Ollie Kim',    initials: 'OK' },
  ];
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 18, padding: '22px 24px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)', maxWidth: 560 }}>
      {/* Header — member */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 18, borderBottom: `1px solid ${DSC.ruleSoft}` }}>
        <DSAvatar name="Maren Holt" initials="MH" size={56} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: DSF.display, fontSize: 19, fontWeight: 600, letterSpacing: '-0.02em', color: DSC.ink, display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', flexWrap: 'nowrap' }}>
            Maren Holt
            <VerifiedBadge />
          </div>
          <div style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.muted, marginTop: 3 }}>Class of '14 · verified by the Hartwood Society</div>
        </div>
      </div>

      {/* Org verification card */}
      <div style={{ padding: '14px 0 12px', borderBottom: `1px solid ${DSC.ruleSoft}`, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 38, height: 38, borderRadius: 8, background: dshex(DSC.accent, 0.10), display: 'grid', placeItems: 'center', flexShrink: 0, color: DSC.accent }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z" />
            <path d="M9 12.5l2 2 4-4.5" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: DSF.body, fontSize: 13, fontWeight: 600, color: DSC.ink }}>The Hartwood Society · Admissions</div>
          <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, marginTop: 2 }}>Confirmed against alumni records · May 2021</div>
        </div>
        <DSTag tone="ok" dot>Verified</DSTag>
      </div>

      {/* Invited by */}
      <div style={{ padding: '14px 0 12px', borderBottom: `1px solid ${DSC.ruleSoft}` }}>
        <span style={{ whiteSpace: 'nowrap' }}><DSEyebrow>Invited by</DSEyebrow></span>
        <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
          {invitedBy.map(a => (
            <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <DSAvatar name={a.name} initials={a.initials} size={28} />
              <div>
                <div style={{ fontFamily: DSF.body, fontSize: 12.5, fontWeight: 600, color: DSC.ink, lineHeight: 1.2 }}>{a.name}</div>
                <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.mute2, letterSpacing: '0.06em', marginTop: 1 }}>{a.when}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cohort mates */}
      <div style={{ padding: '14px 0 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ whiteSpace: 'nowrap' }}><DSEyebrow>{cohortMates.length} members from your cohort</DSEyebrow></span>
          <button style={{ background: 'none', border: 'none', color: DSC.accent, fontFamily: DSF.body, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0, whiteSpace: 'nowrap' }}>See class of '14 →</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 12 }}>
          {cohortMates.slice(0, 4).map((v, i) => (
            <div key={v.name} style={{ marginLeft: i === 0 ? 0 : -10, border: `2px solid ${DSC.card}`, borderRadius: 999 }}>
              <DSAvatar name={v.name} initials={v.initials} size={36} />
            </div>
          ))}
          <div style={{ marginLeft: -10, width: 36, height: 36, borderRadius: 999, background: dshex(DSC.ink, 0.06), border: `2px solid ${DSC.card}`, display: 'grid', placeItems: 'center', fontFamily: DSF.body, fontSize: 11.5, fontWeight: 700, color: DSC.ink2, letterSpacing: '0.03em' }}>+{cohortMates.length - 4}</div>
          <div style={{ marginLeft: 14, fontFamily: DSF.body, fontSize: 12.5, color: DSC.muted, lineHeight: 1.4 }}>
            <strong style={{ color: DSC.ink, fontWeight: 600 }}>Iris</strong>, <strong style={{ color: DSC.ink, fontWeight: 600 }}>Rosa</strong>, <strong style={{ color: DSC.ink, fontWeight: 600 }}>Juno</strong> and 2 more share your class year.
          </div>
        </div>
      </div>
    </div>
  );
}

function VerifiedBadge() {
  return (
    <span title="Fully verified" style={{ width: 18, height: 18, borderRadius: 999, background: DSC.ok, display: 'grid', placeItems: 'center', boxShadow: 'inset 0 0 0 2px ' + DSC.card }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4 4 10-10" /></svg>
    </span>
  );
}

function VerificationStepper() {
  const [step, setStep] = React.useState(1); // 0-2 — step 1 is "current"
  const steps = [
    { label: 'Email',     sub: 'verified@hartwood.org' },
    { label: 'Cohort',    sub: "Confirming class of '14" },
    { label: 'Verified',  sub: 'Full access granted' },
  ];

  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 18, padding: '24px 26px 22px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', gap: 0 }}>
        {/* Background track */}
        <div style={{ position: 'absolute', top: 14, left: '8%', right: '8%', height: 2, background: DSC.rule }} />
        {/* Accent fill — up to current */}
        <div style={{ position: 'absolute', top: 14, left: '8%', width: `${(step / (steps.length - 1)) * 84}%`, height: 2, background: DSC.accent, transition: 'width 240ms cubic-bezier(0.2,0.8,0.2,1)' }} />
        {steps.map((s, i) => {
          const done    = i < step;
          const current = i === step;
          return (
            <button key={s.label} onClick={() => setStep(i)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative', flex: 1, textAlign: 'center' }}>
              <div style={{ width: 30, height: 30, borderRadius: 999, background: done ? DSC.accent : (current ? DSC.card : DSC.card), border: `2px solid ${done ? DSC.accent : (current ? DSC.accent : DSC.rule)}`, boxShadow: current ? `0 0 0 4px ${dshex(DSC.accent, 0.15)}` : 'none', display: 'grid', placeItems: 'center', color: done ? '#fff' : (current ? DSC.accent : DSC.mute2), fontFamily: DSF.body, fontSize: 12, fontWeight: 700, transition: 'all 180ms cubic-bezier(0.2,0.8,0.2,1)' }}>
                {done ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4 4 10-10" /></svg>
                ) : i + 1}
              </div>
              <div>
                <div style={{ fontFamily: DSF.body, fontSize: 12.5, fontWeight: 600, color: done || current ? DSC.ink : DSC.mute2 }}>{s.label}</div>
                <div style={{ fontFamily: DSF.body, fontSize: 11, color: current ? DSC.ink2 : DSC.mute2, marginTop: 2, maxWidth: 130, lineHeight: 1.35 }}>{s.sub}</div>
              </div>
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, padding: '12px 14px', background: DSC.cardAlt, borderRadius: 12 }}>
        <div style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.muted }}>
          Click any circle to step through · <strong style={{ color: DSC.ink, fontWeight: 600 }}>Step {step + 1}/{steps.length}</strong>
        </div>
        <DSButton size="sm" onClick={() => setStep(s => Math.min(s + 1, steps.length - 1))}>Continue →</DSButton>
      </div>
    </div>
  );
}

function MutualConstellation() {
  // Avatar positions in a 320×220 SVG-ish space
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 18, padding: '22px 24px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)', position: 'relative', overflow: 'hidden' }}>
      <DSEyebrow>3 mutuals between you and Maren</DSEyebrow>

      <div style={{ position: 'relative', height: 200, marginTop: 14 }}>
        {/* Connecting lines via SVG */}
        <svg width="100%" height="100%" viewBox="0 0 360 200" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <defs>
            <linearGradient id="ds-connect" x1="0" x2="1">
              <stop offset="0" stopColor={DSC.accent} stopOpacity="0.7" />
              <stop offset="1" stopColor={DSC.ok}     stopOpacity="0.7" />
            </linearGradient>
          </defs>
          {/* You → mutuals → Maren */}
          {[[50, 100, 130, 50], [50, 100, 180, 100], [50, 100, 130, 150]].map(([x1, y1, x2, y2], i) => (
            <line key={`l-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#ds-connect)" strokeWidth="1.4" />
          ))}
          {[[180, 100, 310, 100], [130, 50, 310, 100], [130, 150, 310, 100]].map(([x1, y1, x2, y2], i) => (
            <line key={`r-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#ds-connect)" strokeWidth="1.4" />
          ))}
        </svg>

        {/* You (left anchor) */}
        <div style={{ position: 'absolute', left: 18, top: 76, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <DSAvatar name="You" initials="YOU" size={48} />
          <div style={{ fontFamily: DSF.mono, fontSize: 9.5, fontWeight: 700, color: DSC.ink, letterSpacing: '0.08em', textTransform: 'uppercase' }}>You</div>
        </div>

        {/* Mutual middle column */}
        {[
          { name: 'Iris Okonkwo', initials: 'IO', top: 26, left: 130, label: 'Iris' },
          { name: 'Dev Patel',    initials: 'DP', top: 76, left: 158, label: 'Dev'  },
          { name: 'Sam Aldridge', initials: 'SA', top: 126,left: 130, label: 'Sam'  },
        ].map((m, i) => (
          <div key={m.name} style={{ position: 'absolute', left: m.left, top: m.top, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <DSAvatar name={m.name} initials={m.initials} size={38} />
            <div style={{ fontFamily: DSF.body, fontSize: 11, fontWeight: 600, color: DSC.ink2 }}>{m.label}</div>
          </div>
        ))}

        {/* Target (right anchor) */}
        <div style={{ position: 'absolute', right: 18, top: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <DSAvatar name="Maren Holt" initials="MH" size={56} />
          <div style={{ fontFamily: DSF.body, fontSize: 12, fontWeight: 700, color: DSC.ink }}>Maren</div>
        </div>
      </div>

      <div style={{ marginTop: 12, padding: '10px 14px', background: dshex(DSC.accent, 0.08), border: `1px solid ${dshex(DSC.accent, 0.22)}`, borderRadius: 12, fontFamily: DSF.body, fontSize: 12.5, color: DSC.ink2, lineHeight: 1.5 }}>
        <strong style={{ color: DSC.accent, fontWeight: 700 }}>Iris</strong> and <strong style={{ color: DSC.accent, fontWeight: 700 }}>Sam</strong> both worked with Maren at Common Capital. <strong style={{ color: DSC.accent, fontWeight: 700 }}>Dev</strong> co-hosted last winter's supper with her.
      </div>
    </div>
  );
}

function TrustRing() {
  const pct = 72;
  const r = 56, c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 18, padding: '22px 24px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)', display: 'flex', flexDirection: 'column' }}>
      <DSEyebrow>Trust ring</DSEyebrow>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0' }}>
        <div style={{ position: 'relative', width: 140, height: 140 }}>
          <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="70" cy="70" r={r} fill="none" stroke={DSC.rule}   strokeWidth="8" />
            <circle cx="70" cy="70" r={r} fill="none" stroke={DSC.accent} strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(0.2,0.8,0.2,1)' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', flexDirection: 'column', textAlign: 'center' }}>
            <div>
              <div style={{ fontFamily: DSF.display, fontSize: 32, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.02em', lineHeight: 1 }}>{pct}<span style={{ fontSize: 16, color: DSC.muted }}>%</span></div>
              <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>Verified</div>
            </div>
          </div>
        </div>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {[
          { ok: true, label: 'Email verified' },
          { ok: true, label: "Cohort '14 confirmed" },
          { ok: true, label: 'Invited by Dev & Sam' },
          { ok: false, label: 'Profile 64% complete' },
        ].map((it, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: DSF.body, fontSize: 12, color: it.ok ? DSC.ink2 : DSC.muted }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: it.ok ? DSC.ok : DSC.rule, flexShrink: 0 }} />
            {it.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

window.FeedbackSection = FeedbackSection;
window.TrustSection    = TrustSection;
