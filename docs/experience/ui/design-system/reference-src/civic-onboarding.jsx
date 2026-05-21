/* eslint-disable */
// BridgeCircle Civic — Onboarding (shell + Steps 1, 2, 4)
// Steps: Welcome → Basics → Career → Education → Open to → Interests → Review

const CIVIC_OB_STEPS = [
  { id: 'welcome',   label: 'Welcome'      },
  { id: 'basics',    label: 'Basics'       },
  { id: 'career',    label: 'Career'       },
  { id: 'education', label: 'Education'    },
  { id: 'openTo',    label: 'How you help' },
  { id: 'interests', label: 'Interests'    },
  { id: 'review',    label: 'Review'       },
];

const CIVIC_OB_INITIAL = {
  org: 'The Hartwood Society',
  inviteNo: '0048',
  // basics
  fullName: '',
  cohort: '',
  city: '',
  currentRole: '',
  currentEmployer: '',
  bio: '',
  // career
  resumeStatus: 'idle',
  resumeFileName: '',
  career: [{ from: '', to: '', role: '', org: '', city: '', summary: '' }],
  // education
  education: [{ from: '', to: '', degree: '', school: '', city: '', honors: '' }],
  // open to
  openTo: { mentorship: 'yes', advice: 'yes', intros: 'yes', hiring: 'no' },
  helpTags: ['Pitch decks', 'Career switches'],
  // interests
  interests: [''],
  hobbies: ['Cooking', 'Open-water swimming'],
  languages: 'English',
};

function useCivicOBIsMobile(bp = 640) {
  const q = `(max-width:${bp}px)`;
  const [is, setIs] = React.useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches);
  React.useEffect(() => {
    const mql = window.matchMedia(q);
    const fn = e => setIs(e.matches);
    mql.addEventListener ? mql.addEventListener('change', fn) : mql.addListener(fn);
    setIs(mql.matches);
    return () => mql.removeEventListener ? mql.removeEventListener('change', fn) : mql.removeListener(fn);
  }, [q]);
  return is;
}

// ── Main orchestrator ──────────────────────────────────────────────────────
function CivicOnboardingApp() {
  const t = React.useContext(ThemeCtx);
  const isMobile = useCivicOBIsMobile();
  const [stepIdx, setStepIdx] = React.useState(0);
  const [values, setValues] = React.useState(CIVIC_OB_INITIAL);
  const step = CIVIC_OB_STEPS[stepIdx];
  const set = patch => setValues(v => ({ ...v, ...patch }));
  const next = () => { setStepIdx(i => Math.min(i + 1, CIVIC_OB_STEPS.length - 1)); window.scrollTo({ top: 0, behavior: 'instant' }); };
  const back = () => { setStepIdx(i => Math.max(i - 1, 0)); window.scrollTo({ top: 0, behavior: 'instant' }); };

  React.useEffect(() => { document.body.style.background = t.palette.paper; }, [t.palette.paper]);

  return (
    <div data-screen-label={`Civic Onboarding · ${step.label}`} style={{
      minHeight: '100vh', background: t.palette.paper, color: t.palette.ink,
      fontFamily: t.font.body, display: 'flex', flexDirection: 'column',
    }}>
      <CivicOBHeader />
      <CivicOBProgress stepIdx={stepIdx} isMobile={isMobile} />
      <main style={{ flex: 1, padding: isMobile ? '20px 14px 48px' : '28px 24px 56px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 820 }}>
          {step.id === 'welcome'   && <CivicStepWelcome   values={values} />}
          {step.id === 'basics'    && <CivicStepBasics    values={values} set={set} />}
          {step.id === 'career'    && <CivicStepCareer    values={values} set={set} />}
          {step.id === 'education' && <CivicStepEducation values={values} set={set} />}
          {step.id === 'openTo'    && <CivicStepOpenTo    values={values} set={set} />}
          {step.id === 'interests' && <CivicStepInterests values={values} set={set} />}
          {step.id === 'review'    && <CivicStepReview    values={values} />}
          <CivicOBFooter step={step} stepIdx={stepIdx} total={CIVIC_OB_STEPS.length} onBack={back} onNext={next} isMobile={isMobile} />
        </div>
      </main>
    </div>
  );
}

// ── Header ─────────────────────────────────────────────────────────────────
function CivicOBHeader() {
  const t = React.useContext(ThemeCtx);
  const isMobile = useCivicOBIsMobile();
  return (
    <header style={{ borderBottom: `1px solid ${t.palette.rule}`, background: t.palette.paper }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: isMobile ? '11px 14px' : '13px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="28" height="20" viewBox="0 0 32 24" aria-hidden="true">
            <circle cx="11" cy="12" r="9" fill={t.palette.accent} fillOpacity="0.85" />
            <circle cx="21" cy="12" r="9" fill={t.palette.ok}     fillOpacity="0.85" />
          </svg>
          <span style={{ ...t.display, fontSize: 17, letterSpacing: '-0.025em', fontWeight: 600, color: t.palette.ink }}>
            BridgeCircle
          </span>
          {!isMobile && (
            <span style={{ ...t.eyebrow, color: t.palette.mute2, marginLeft: 2 }}>Civic</span>
          )}
        </div>
        <button style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: t.palette.muted, fontFamily: t.font.body, fontSize: 13, fontWeight: 500,
        }}>Sign out</button>
      </div>
    </header>
  );
}

// ── Progress strip ─────────────────────────────────────────────────────────
function CivicOBProgress({ stepIdx, isMobile }) {
  const t = React.useContext(ThemeCtx);

  if (isMobile) {
    const cur = CIVIC_OB_STEPS[stepIdx];
    return (
      <div style={{ borderBottom: `1px solid ${t.palette.rule}`, background: t.palette.panel }}>
        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ ...t.eyebrow, color: t.palette.ink }}>
              {String(stepIdx + 1).padStart(2, '0')} · {cur.label.toUpperCase()}
            </span>
            <span style={{ ...t.eyebrow, color: t.palette.mute2 }}>
              {stepIdx + 1} / {CIVIC_OB_STEPS.length}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${CIVIC_OB_STEPS.length}, 1fr)`, gap: 3 }}>
            {CIVIC_OB_STEPS.map((s, i) => (
              <div key={s.id} style={{
                height: 2,
                background: i <= stepIdx ? t.palette.accent : t.palette.rule,
                transition: 'background 200ms ease',
              }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ borderBottom: `1px solid ${t.palette.rule}`, background: t.palette.panel }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${CIVIC_OB_STEPS.length}, 1fr)` }}>
          {CIVIC_OB_STEPS.map((s, i) => {
            const done   = i < stepIdx;
            const active = i === stepIdx;
            return (
              <div key={s.id} style={{
                padding: '11px 16px 12px',
                borderBottom: `2px solid ${active ? t.palette.accent : done ? t.palette.ink : 'transparent'}`,
                borderRight: i < CIVIC_OB_STEPS.length - 1 ? `1px solid ${t.palette.rule}` : 'none',
                transition: 'border-color 200ms ease',
              }}>
                <span style={{
                  fontFamily: t.font.mono, fontSize: 10, letterSpacing: '0.14em', fontWeight: 600,
                  color: active ? t.palette.ink : done ? t.palette.muted : t.palette.mute2,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block',
                }}>
                  {String(i + 1).padStart(2, '0')} · {s.label.toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Footer / nav ───────────────────────────────────────────────────────────
function CivicOBFooter({ step, stepIdx, total, onBack, onNext, isMobile }) {
  const t = React.useContext(ThemeCtx);
  const isFirst = stepIdx === 0;
  const isLast  = stepIdx === total - 1;

  if (isMobile) {
    return (
      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span style={{ ...t.eyebrow, color: t.palette.muted, textAlign: 'center' }}>
          STEP {String(stepIdx + 1).padStart(2, '0')} OF {String(total).padStart(2, '0')} · {step.label.toUpperCase()}
        </span>
        <div style={{ display: 'flex', gap: 10 }}>
          {!isFirst && (
            <CivicButton variant="outline" size="md" onClick={onBack} style={{ flexShrink: 0 }}>← Back</CivicButton>
          )}
          <CivicButton variant={isLast ? 'accent' : 'primary'} size="md" onClick={onNext}
            style={{ flex: 1, justifyContent: 'center' }}>
            {isLast ? 'Join the circle' : isFirst ? 'Get started →' : 'Continue →'}
          </CivicButton>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      marginTop: 22, paddingTop: 16, borderTop: `1px solid ${t.palette.rule}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <CivicButton variant="ghost" size="md" onClick={onBack} style={{ visibility: isFirst ? 'hidden' : 'visible' }}>
        ← Back
      </CivicButton>
      <span style={{ ...t.eyebrow, color: t.palette.muted }}>
        {String(stepIdx + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </span>
      <CivicButton variant={isLast ? 'accent' : 'primary'} size="md" onClick={onNext}>
        {isLast ? 'Join the circle' : isFirst ? 'Get started →' : 'Continue →'}
      </CivicButton>
    </div>
  );
}

// ── Form primitives ────────────────────────────────────────────────────────
function CivicOBField({ label, helper, optional, error, children }) {
  const t = React.useContext(ThemeCtx);
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1, minWidth: 0 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: t.palette.ink2, letterSpacing: '0.01em' }}>
        {label}
        {optional && <span style={{ fontSize: 11, color: t.palette.mute2, fontWeight: 400, marginLeft: 5 }}>(optional)</span>}
      </span>
      {children}
      {helper && !error && <span style={{ fontSize: 11.5, color: t.palette.muted, lineHeight: 1.5 }}>{helper}</span>}
      {error && <span style={{ fontSize: 11.5, color: t.palette.bad, lineHeight: 1.4 }}>{error}</span>}
    </label>
  );
}

function CivicOBInput({ value, onChange, placeholder, type = 'text', onKeyDown }) {
  const t = React.useContext(ThemeCtx);
  const [focus, setFocus] = React.useState(false);
  return (
    <input
      type={type} value={value || ''}
      onChange={e => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      style={{
        boxSizing: 'border-box', width: '100%',
        background: t.palette.card, color: t.palette.ink,
        border: `1px solid ${focus ? t.palette.ink : t.palette.rule}`,
        borderRadius: 2, padding: '10px 12px',
        fontFamily: t.font.body, fontSize: 14,
        outline: 'none', transition: 'border-color 120ms ease',
      }}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
    />
  );
}

function CivicOBTextArea({ value, onChange, placeholder, rows = 3 }) {
  const t = React.useContext(ThemeCtx);
  const [focus, setFocus] = React.useState(false);
  return (
    <textarea
      value={value || ''} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} rows={rows}
      style={{
        boxSizing: 'border-box', width: '100%', resize: 'vertical',
        background: t.palette.card, color: t.palette.ink,
        border: `1px solid ${focus ? t.palette.ink : t.palette.rule}`,
        borderRadius: 2, padding: '10px 12px',
        fontFamily: t.font.body, fontSize: 14, lineHeight: 1.55,
        outline: 'none', transition: 'border-color 120ms ease',
      }}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
    />
  );
}

function CivicOBFieldRow({ children }) {
  const isMobile = useCivicOBIsMobile();
  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 12, flexWrap: 'wrap' }}>
      {children}
    </div>
  );
}

function CivicOBCard({ eyebrow, action, children, style: extra }) {
  const t = React.useContext(ThemeCtx);
  const isMobile = useCivicOBIsMobile();
  return (
    <div style={{ marginBottom: 14, ...t.cardSurface({ padding: isMobile ? 16 : 20 }), ...extra }}>
      {eyebrow && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <span style={{ ...t.eyebrow, color: t.palette.muted }}>{eyebrow}</span>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

function CivicStepHeading({ n, title, sub }) {
  const t = React.useContext(ThemeCtx);
  const isMobile = useCivicOBIsMobile();
  return (
    <div style={{ marginBottom: isMobile ? 18 : 24 }}>
      <div style={{
        borderTop: `2px solid ${t.palette.ink}`, paddingTop: 10, marginBottom: 10,
        display: 'flex', alignItems: 'baseline', gap: 16,
      }}>
        <h1 style={{ ...t.display, fontSize: isMobile ? 26 : 40, margin: 0 }}>{title}</h1>
      </div>
      {sub && <p style={{ fontSize: isMobile ? 13.5 : 15, color: t.palette.muted, margin: 0, lineHeight: 1.55, maxWidth: 580 }}>{sub}</p>}
    </div>
  );
}

// ── Step 1: Welcome ────────────────────────────────────────────────────────
function CivicStepWelcome({ values }) {
  const t = React.useContext(ThemeCtx);
  const isMobile = useCivicOBIsMobile();
  return (
    <div>
      <div style={{ ...t.cardSurface({ padding: isMobile ? 22 : 44, position: 'relative', overflow: 'hidden' }) }}>
        <svg aria-hidden="true" width="520" height="420" viewBox="0 0 520 420" style={{
          position: 'absolute', right: isMobile ? -200 : -80, top: -100,
          opacity: isMobile ? 0.15 : 0.22, pointerEvents: 'none',
        }}>
          <circle cx="200" cy="210" r="195" fill="none" stroke={t.palette.accent} strokeWidth="1.5" />
          <circle cx="320" cy="210" r="195" fill="none" stroke={t.palette.ok}     strokeWidth="1.5" />
        </svg>

        <div style={{ position: 'relative', maxWidth: 560 }}>
          <div style={{ ...t.eyebrow, color: t.palette.muted, marginBottom: 20 }}>
            Invitation No. {values.inviteNo} · {values.org}
          </div>

          <h1 style={{ ...t.display, fontSize: isMobile ? 34 : 54, margin: 0 }}>
            Welcome to{' '}
            <span style={{ color: t.palette.accent }}>BridgeCircle.</span>
          </h1>

          <p style={{ fontSize: isMobile ? 14.5 : 16.5, lineHeight: 1.6, color: t.palette.muted, margin: isMobile ? '14px 0 0' : '20px 0 0' }}>
            <strong style={{ color: t.palette.ink2, fontWeight: 600 }}>{values.org}</strong> has invited you to join. We'll spend the next few minutes setting up your profile — small things now, easier asks later.
          </p>

          <div style={{
            marginTop: isMobile ? 20 : 28,
            display: 'flex', alignItems: 'center', gap: 14,
            padding: isMobile ? 12 : 16,
            border: `1px solid ${t.palette.rule}`, borderRadius: 2,
            background: t.palette.panel,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 2, flexShrink: 0,
              background: t.palette.card, border: `1px solid ${t.palette.rule}`,
              display: 'grid', placeItems: 'center',
            }} aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.palette.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z" />
                <path d="M9 12.5l2 2 4-4.5" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{values.org} · Admissions</div>
              <div style={{ fontSize: 12, color: t.palette.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Verified your eligibility · {values.org} alumni records
              </div>
            </div>
            <CivicChip tone="ok">✓ Verified</CivicChip>
          </div>

          <div style={{ marginTop: isMobile ? 22 : 30 }}>
            {[
              { n: '01', title: 'Verified.',       desc: 'Members are admitted by the organization. No bots, no strangers.' },
              { n: '02', title: 'Members-first.',  desc: 'No ads. No engagement loops. The product exists to make the circle useful.' },
              { n: '03', title: 'Reciprocal.',     desc: 'You can ask for help and you can give help. Both matter.' },
            ].map((b, i) => (
              <div key={b.n} style={{
                display: 'grid', gridTemplateColumns: '32px 1fr', gap: 12,
                padding: '12px 0',
                borderTop: i === 0 ? `1px solid ${t.palette.ruleSoft}` : 'none',
                borderBottom: `1px solid ${t.palette.ruleSoft}`,
                fontSize: isMobile ? 13 : 13.5, lineHeight: 1.55, alignItems: 'baseline',
              }}>
                <span style={{ fontFamily: t.font.mono, fontSize: 10, color: t.palette.accent, letterSpacing: '0.14em', fontWeight: 700 }}>{b.n}</span>
                <span>
                  <strong style={{ fontWeight: 600, color: t.palette.ink }}>{b.title}</strong>
                  <span style={{ color: t.palette.muted }}> {b.desc}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p style={{ fontSize: 12.5, color: t.palette.muted, textAlign: 'center', marginTop: 16 }}>
        Takes about <strong style={{ color: t.palette.ink2, fontWeight: 600 }}>4 minutes.</strong>{' '}
        You can edit anything later from your profile.
      </p>
    </div>
  );
}

// ── Step 2: Basics ─────────────────────────────────────────────────────────
function CivicStepBasics({ values, set }) {
  const t = React.useContext(ThemeCtx);
  const initials = (values.fullName || '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?';
  return (
    <div>
      <CivicStepHeading n="01" title="Start with the basics."
        sub="What we'll print on your profile card. Initials are computed from your full name, but you can upload a photo later." />

      <CivicOBCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22, paddingBottom: 18, borderBottom: `1px solid ${t.palette.ruleSoft}` }}>
          <div style={{ position: 'relative' }}>
            <CivicAvatar name={values.fullName || 'You'} initials={initials} size={60} />
            <button style={{
              position: 'absolute', bottom: -3, right: -3,
              background: t.palette.ink, color: t.palette.paper,
              border: `2px solid ${t.palette.card}`, borderRadius: 2,
              width: 21, height: 21, cursor: 'pointer',
              fontSize: 13, lineHeight: 1, fontWeight: 700,
              display: 'grid', placeItems: 'center',
            }}>+</button>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Profile photo</div>
            <div style={{ fontSize: 12, color: t.palette.muted, marginTop: 3, lineHeight: 1.5 }}>
              Upload one or keep the initials block. JPG / PNG up to 5 MB.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <CivicOBFieldRow>
            <CivicOBField label="Full name" helper="As you'd like to be addressed.">
              <CivicOBInput value={values.fullName} onChange={v => set({ fullName: v })} placeholder="Maren Vasilakis" />
            </CivicOBField>
            <CivicOBField label="Cohort year" helper="The year you graduated from Hartwood.">
              <CivicOBInput value={values.cohort} onChange={v => set({ cohort: v })} placeholder="2014" />
            </CivicOBField>
          </CivicOBFieldRow>
          <CivicOBField label="Where you live" helper="City and country. Use the place you actually live, not where you're from.">
            <CivicOBInput value={values.city} onChange={v => set({ city: v })} placeholder="Brooklyn, NY" />
          </CivicOBField>
          <CivicOBFieldRow>
            <CivicOBField label="Current role">
              <CivicOBInput value={values.currentRole} onChange={v => set({ currentRole: v })} placeholder="VP of Product" />
            </CivicOBField>
            <CivicOBField label="At">
              <CivicOBInput value={values.currentEmployer} onChange={v => set({ currentEmployer: v })} placeholder="Topfield" />
            </CivicOBField>
          </CivicOBFieldRow>
          <CivicOBField label="In your own words" optional helper="A line or two on what you're working on and what you might want help with.">
            <CivicOBTextArea value={values.bio} onChange={v => set({ bio: v })} rows={3}
              placeholder="Building a small documentary studio focused on overlooked civic life. Looking to talk with anyone who has navigated investor pitches for art-leaning work." />
          </CivicOBField>
        </div>
      </CivicOBCard>
    </div>
  );
}

// ── Step 4: Education ──────────────────────────────────────────────────────
function CivicStepEducation({ values, set }) {
  const t = React.useContext(ThemeCtx);
  const update = (i, patch) => {
    const next = values.education.slice();
    next[i] = { ...next[i], ...patch };
    set({ education: next });
  };
  const add    = () => set({ education: [...values.education, { from: '', to: '', degree: '', school: '', city: '', honors: '' }] });
  const remove = i  => set({ education: values.education.filter((_, j) => j !== i) });

  return (
    <div>
      <CivicStepHeading n="03" title="Education — and how you got here."
        sub="Hartwood goes here too. Add the one or two degrees that show up on your formal CV — and any honors that matter to you." />

      {values.education.map((r, i) => (
        <CivicOBCard key={i}
          eyebrow={i === 0 ? '§ Most recent degree' : `§ Earlier degree ${String(i + 1).padStart(2, '0')}`}
          action={values.education.length > 1 ? (
            <button onClick={() => remove(i)} style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: t.palette.muted, fontSize: 12, fontWeight: 500,
            }}>Remove</button>
          ) : null}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <CivicOBFieldRow>
              <CivicOBField label="From"><CivicOBInput value={r.from} onChange={v => update(i, { from: v })} placeholder="2017" /></CivicOBField>
              <CivicOBField label="To"><CivicOBInput value={r.to} onChange={v => update(i, { to: v })} placeholder="2019" /></CivicOBField>
            </CivicOBFieldRow>
            <CivicOBFieldRow>
              <CivicOBField label="Degree"><CivicOBInput value={r.degree} onChange={v => update(i, { degree: v })} placeholder="M.F.A., Documentary Practice" /></CivicOBField>
              <CivicOBField label="School"><CivicOBInput value={r.school} onChange={v => update(i, { school: v })} placeholder="Hartwood College" /></CivicOBField>
            </CivicOBFieldRow>
            <CivicOBFieldRow>
              <CivicOBField label="City" optional><CivicOBInput value={r.city} onChange={v => update(i, { city: v })} placeholder="New York, NY" /></CivicOBField>
              <CivicOBField label="Honors" optional><CivicOBInput value={r.honors} onChange={v => update(i, { honors: v })} placeholder="DPF Fellow · First-class honours" /></CivicOBField>
            </CivicOBFieldRow>
          </div>
        </CivicOBCard>
      ))}

      <button onClick={add} style={{
        background: 'transparent', border: `1px dashed ${t.palette.rule}`,
        borderRadius: 2, padding: '13px 20px', cursor: 'pointer',
        color: t.palette.muted, fontFamily: t.font.body, fontSize: 13, fontWeight: 600,
        width: '100%',
      }}>+ Add another degree</button>
    </div>
  );
}

// ── Exports ────────────────────────────────────────────────────────────────
Object.assign(window, {
  CIVIC_OB_STEPS,
  CIVIC_OB_INITIAL,
  useCivicOBIsMobile,
  CivicOnboardingApp,
  CivicOBHeader,
  CivicOBProgress,
  CivicOBFooter,
  CivicOBField,
  CivicOBInput,
  CivicOBTextArea,
  CivicOBFieldRow,
  CivicOBCard,
  CivicStepHeading,
});
