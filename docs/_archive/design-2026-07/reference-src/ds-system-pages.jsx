/* eslint-disable */
// Atrium Design System — System Pages (Section 32)
// Sign-in, 404, profile shell (empty), maintenance — the pages users meet first.

function SystemPagesSection() {
  return (
    <DSSection id="syspages" eyebrow="Components · 32" title="System Pages">

      <DSSub title="Sign-in — the first impression of the circle">
        <SignInPage />
      </DSSub>

      <DSSub title="404 · Lost in the circle — a warm dead end">
        <NotFoundPage />
      </DSSub>

      <DSSub title="Profile shell · empty state — what a brand-new member sees">
        <EmptyProfilePage />
      </DSSub>

      <DSSub title="Maintenance · we'll be back — graceful pause">
        <MaintenancePage />
      </DSSub>

    </DSSection>
  );
}

// ─── PAGE FRAME (shared chrome) ────────────────────────────────────────────

function PageFrame({ children, label, bg = DSC.paper }) {
  return (
    <div style={{ borderRadius: 18, border: `1px solid ${DSC.rule}`, overflow: 'hidden', boxShadow: '0 4px 14px rgba(42,34,26,0.08)' }}>
      <div style={{ padding: '10px 16px', background: DSC.cardAlt, borderBottom: `1px solid ${DSC.rule}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ display: 'flex', gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: 999, background: dshex(DSC.muted, 0.35) }} />
          <span style={{ width: 9, height: 9, borderRadius: 999, background: dshex(DSC.muted, 0.35) }} />
          <span style={{ width: 9, height: 9, borderRadius: 999, background: dshex(DSC.muted, 0.35) }} />
        </span>
        <span style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.muted, letterSpacing: '0.06em', marginLeft: 8 }}>{label}</span>
      </div>
      <div style={{ background: bg, minHeight: 420 }}>{children}</div>
    </div>
  );
}

// ─── 1. SIGN-IN ────────────────────────────────────────────────────────────

function SignInPage() {
  return (
    <PageFrame label="hartwood.org/sign-in">
      <div style={{ padding: '40px 24px 48px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', minHeight: 420 }}>
        {/* Background circles */}
        <svg aria-hidden="true" width="640" height="380" viewBox="0 0 640 380" style={{ position: 'absolute', right: -80, bottom: -60, opacity: 0.18, pointerEvents: 'none' }}>
          <circle cx="240" cy="200" r="160" fill="none" stroke={DSC.accent} strokeWidth="1.4" />
          <circle cx="360" cy="200" r="160" fill="none" stroke={DSC.ok}     strokeWidth="1.4" />
        </svg>

        <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 18, padding: '34px 36px 28px', width: '100%', maxWidth: 380, boxShadow: '0 16px 36px rgba(42,34,26,0.10), 0 1px 0 rgba(255,255,255,.6) inset', position: 'relative' }}>
          {/* Wordmark */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
            <svg width="32" height="22" viewBox="0 0 32 24" aria-hidden="true">
              <circle cx="11" cy="12" r="9" fill={DSC.accent} fillOpacity="0.85" />
              <circle cx="21" cy="12" r="9" fill={DSC.ok}     fillOpacity="0.85" />
            </svg>
            <span style={{ fontFamily: DSF.display, fontSize: 17, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.02em' }}>BridgeCircle</span>
          </div>

          <h2 style={{ fontFamily: DSF.display, fontSize: 26, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.025em', lineHeight: 1.05, margin: 0 }}>
            Welcome back to Hartwood.
          </h2>
          <p style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.muted, marginTop: 8, lineHeight: 1.55 }}>
            The supper's on Tuesday. Iris asked after you.
          </p>

          {/* Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 22 }}>
            <div>
              <label style={{ fontFamily: DSF.body, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: DSC.muted, display: 'block', marginBottom: 6 }}>Email</label>
              <input defaultValue="maren@hartwood.org" style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', border: `1px solid ${DSC.rule}`, borderRadius: 10, fontFamily: DSF.body, fontSize: 14, background: DSC.cardAlt, color: DSC.ink, outline: 'none' }} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <label style={{ fontFamily: DSF.body, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: DSC.muted }}>Password</label>
                <a style={{ fontFamily: DSF.body, fontSize: 11.5, fontWeight: 600, color: DSC.accent, cursor: 'pointer' }}>Forgot?</a>
              </div>
              <input type="password" defaultValue="passwordplaceholder" style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', border: `1px solid ${DSC.rule}`, borderRadius: 10, fontFamily: DSF.body, fontSize: 14, background: DSC.cardAlt, color: DSC.ink, outline: 'none' }} />
            </div>
            <DSButton style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>Sign in</DSButton>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
              <div style={{ flex: 1, height: 1, background: DSC.rule }} />
              <span style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.mute2, letterSpacing: '0.10em', textTransform: 'uppercase' }}>or</span>
              <div style={{ flex: 1, height: 1, background: DSC.rule }} />
            </div>
            <DSButton variant="outline" style={{ width: '100%', justifyContent: 'center' }} leadIcon={<Icon name="send" size={13} color="currentColor" />}>Email me a magic link</DSButton>
          </div>

          {/* Footer */}
          <div style={{ marginTop: 22, paddingTop: 16, borderTop: `1px solid ${DSC.ruleSoft}`, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ flexShrink: 0, color: DSC.muted, paddingTop: 2 }}>
              <Icon name="lock" size={13} color="currentColor" />
            </span>
            <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, lineHeight: 1.5 }}>
              New here? Hartwood admits members by <strong style={{ color: DSC.ink2, fontWeight: 600 }}>invitation from the Society</strong> — if you're an alumna and don't have a key, write to admissions.
            </div>
          </div>
        </div>
      </div>
    </PageFrame>
  );
}

// ─── 2. 404 ────────────────────────────────────────────────────────────────

function NotFoundPage() {
  return (
    <PageFrame label="hartwood.org/wherever-you-tried">
      <div style={{ padding: '50px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden', minHeight: 420 }}>
        {/* Big 404 with circles */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <svg aria-hidden="true" width="320" height="220" viewBox="0 0 320 220" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', opacity: 0.18, pointerEvents: 'none' }}>
            <circle cx="120" cy="110" r="100" fill="none" stroke={DSC.accent} strokeWidth="1.4" />
            <circle cx="200" cy="110" r="100" fill="none" stroke={DSC.ok}     strokeWidth="1.4" />
          </svg>
          <div style={{ fontFamily: DSF.display, fontSize: 132, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.05em', lineHeight: 1, position: 'relative', fontVariantNumeric: 'tabular-nums' }}>
            4<span style={{ color: DSC.accent }}>0</span>4
          </div>
        </div>

        <DSEyebrow accent>Page not found · or never built</DSEyebrow>
        <h2 style={{ fontFamily: DSF.display, fontSize: 28, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.025em', lineHeight: 1.1, margin: '12px 0 8px', maxWidth: 520 }}>
          You wandered off the path.
        </h2>
        <p style={{ fontFamily: DSF.body, fontSize: 14, color: DSC.muted, lineHeight: 1.6, margin: 0, maxWidth: 420 }}>
          Even the best supper has a wrong door. Try one of these — or press <KbdKey>⌘</KbdKey><KbdKey>K</KbdKey> to find it.
        </p>

        <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
          <DSButton leadIcon={<Icon name="home" size={13} color="currentColor" />}>Take me home</DSButton>
          <DSButton variant="outline" leadIcon={<Icon name="inbox" size={13} color="currentColor" />}>Open my inbox</DSButton>
          <DSButton variant="outline" leadIcon={<Icon name="people" size={13} color="currentColor" />}>Browse the directory</DSButton>
        </div>

        <div style={{ marginTop: 28, fontFamily: DSF.mono, fontSize: 10, color: DSC.mute2, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Issue №142 · Path: /unknown/dinner-list
        </div>
      </div>
    </PageFrame>
  );
}

// ─── 3. EMPTY PROFILE SHELL ────────────────────────────────────────────────

function EmptyProfilePage() {
  // Tasks mirror the actual onboarding flow:
  // Welcome → Basics → Career → Education → Open to → Interests → Review.
  // Email + cohort already done; the rest reflects what's still missing on a draft profile.
  const tasks = [
    { done: true,  label: 'Verify email',          sub: 'maren@hartwood.org',                              icon: 'check' },
    { done: true,  label: 'Confirm cohort year',   sub: "Class of '14",                                    icon: 'check' },
    { done: false, label: 'Add a portrait',         sub: 'Profile photo · 1:1 crop, JPG or PNG',            icon: 'image', cta: 'Upload →' },
    { done: false, label: 'Write your bio',         sub: "A line or two on what you're working on",         icon: 'edit',  cta: 'Write →' },
    { done: false, label: 'Add career history',     sub: "Two or three roles — we'll pre-fill from your CV", icon: 'file',  cta: 'Add →' },
    { done: false, label: 'Add education',          sub: 'Schools and degrees',                              icon: 'file',  cta: 'Add →' },
    { done: false, label: "Set what you're open to", sub: 'Mentorship · advice · intros · hiring',          icon: 'wave',  cta: 'Set →' },
    { done: false, label: 'Add interests & hobbies', sub: 'What you’re currently curious about',             icon: 'sparkle', cta: 'Add →' },
  ];
  const doneCount = tasks.filter(t => t.done).length;
  const pct = (doneCount / tasks.length) * 100;
  const r = 26, c = 2 * Math.PI * r;

  return (
    <PageFrame label="hartwood.org/me">
      <div style={{ padding: '34px 30px 40px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 22, marginBottom: 22, flexWrap: 'wrap' }}>
          {/* Hatched portrait placeholder */}
          <div style={{ position: 'relative', width: 96, height: 96, borderRadius: 16, background: `repeating-linear-gradient(135deg, ${DSC.panel} 0 8px, ${dshex(DSC.muted, 0.20)} 8px 9px)`, border: `1px dashed ${DSC.muted}`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Icon name="image" size={26} color={DSC.muted} />
            <span style={{ position: 'absolute', bottom: -7, left: '50%', transform: 'translateX(-50%)', background: DSC.accent, color: '#fff', fontFamily: DSF.mono, fontSize: 8.5, fontWeight: 700, letterSpacing: '0.08em', padding: '2px 8px', borderRadius: 999, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Add photo</span>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <DSEyebrow accent>Class of '14 · Brand new</DSEyebrow>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <h1 style={{ fontFamily: DSF.display, fontSize: 32, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.025em', lineHeight: 1.05, margin: 0 }}>Maren Holt</h1>
              <span style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, background: dshex(DSC.muted, 0.10), padding: '3px 8px', borderRadius: 999, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>Draft</span>
            </div>
            <p style={{ fontFamily: DSF.body, fontStyle: 'italic', fontSize: 13.5, color: DSC.muted, lineHeight: 1.55, marginTop: 8, padding: '8px 12px', background: DSC.cardAlt, border: `1px dashed ${DSC.rule}`, borderRadius: 8, maxWidth: 460 }}>
              No focus statement yet. Tell people what you're making sense of.
            </p>
          </div>

          {/* Progress ring */}
          <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
            <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="36" cy="36" r={r} fill="none" stroke={DSC.rule} strokeWidth="5" />
              <circle cx="36" cy="36" r={r} fill="none" stroke={DSC.accent} strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} style={{ transition: 'stroke-dashoffset 400ms cubic-bezier(0.2,0.8,0.2,1)' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: DSF.display, fontSize: 16, fontWeight: 700, color: DSC.ink, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>{Math.round(pct)}%</div>
          </div>
        </div>

        {/* Setup tasks */}
        <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${DSC.ruleSoft}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: DSC.cardAlt }}>
            <div>
              <div style={{ fontFamily: DSF.display, fontSize: 15, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.01em' }}>Set up your profile</div>
              <div style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted, marginTop: 2 }}>{doneCount} of {tasks.length} done · ~4 min</div>
            </div>
            <DSButton size="sm" variant="ghost">Skip for now</DSButton>
          </div>
          {tasks.map((t, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '24px 1fr auto', gap: 14, padding: '12px 18px', borderTop: `1px solid ${DSC.ruleSoft}`, alignItems: 'center', background: DSC.card }}>
              <span style={{ width: 22, height: 22, borderRadius: 999, background: t.done ? DSC.ok : DSC.cardAlt, border: `1.5px solid ${t.done ? DSC.ok : DSC.rule}`, color: t.done ? '#fff' : DSC.muted, display: 'grid', placeItems: 'center' }}>
                {t.done ? <Icon name="check" size={12} color="currentColor" strokeWidth={3.2} /> : <Icon name={t.icon} size={11} color="currentColor" />}
              </span>
              <div>
                <div style={{ fontFamily: DSF.body, fontSize: 13, fontWeight: 600, color: t.done ? DSC.muted : DSC.ink, textDecoration: t.done ? 'line-through' : 'none' }}>{t.label}</div>
                <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, marginTop: 1 }}>{t.sub}</div>
              </div>
              {t.cta && <DSButton size="sm" variant="outline">{t.cta}</DSButton>}
            </div>
          ))}
        </div>
      </div>
    </PageFrame>
  );
}

// ─── 4. MAINTENANCE ────────────────────────────────────────────────────────

function MaintenancePage() {
  return (
    <PageFrame label="hartwood.org · status: paused">
      <div style={{ padding: '50px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden', minHeight: 420 }}>
        {/* Wax seal-ish ornament */}
        <div style={{ width: 90, height: 90, borderRadius: 999, background: `radial-gradient(circle at 35% 30%, ${dshex('#ffffff', 0.5)}, ${DSC.accent} 70%)`, color: '#fff', display: 'grid', placeItems: 'center', boxShadow: `0 8px 22px ${dshex(DSC.accent, 0.32)}, inset 0 0 0 1px rgba(0,0,0,0.12)`, marginBottom: 24, animation: 'ds-breath 3s ease-in-out infinite' }}>
          <Icon name="clock" size={36} color="currentColor" />
        </div>

        <DSEyebrow accent>Status · paused for upkeep</DSEyebrow>
        <h2 style={{ fontFamily: DSF.display, fontSize: 30, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.025em', lineHeight: 1.05, margin: '12px 0 10px', maxWidth: 520 }}>
          We're tending the circle.
        </h2>
        <p style={{ fontFamily: DSF.body, fontSize: 14, color: DSC.muted, lineHeight: 1.6, margin: 0, maxWidth: 460 }}>
          A few quiet hours to update the directory and rotate the wax. Hartwood will be back by <strong style={{ color: DSC.ink2, fontWeight: 600 }}>6:00 pm Eastern · Sunday</strong>. Iris is still hosting Tuesday.
        </p>

        <div style={{ display: 'flex', gap: 22, marginTop: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { label: 'Started', value: '3:00 pm Sun' },
            { label: 'ETA',     value: '6:00 pm Sun', accent: true },
            { label: 'Status',  value: 'Database',    sub: 'rotating indexes' },
          ].map((s, i) => (
            <div key={i} style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 12, padding: '12px 18px', textAlign: 'left', minWidth: 130 }}>
              <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: s.accent ? DSC.accent : DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>{s.label}</div>
              <div style={{ fontFamily: DSF.display, fontSize: 15, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.005em', marginTop: 4 }}>{s.value}</div>
              {s.sub && <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, marginTop: 2 }}>{s.sub}</div>}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 28, fontFamily: DSF.mono, fontSize: 10, color: DSC.mute2, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Updates · hartwood.org/status
        </div>
      </div>
    </PageFrame>
  );
}

window.SystemPagesSection = SystemPagesSection;
