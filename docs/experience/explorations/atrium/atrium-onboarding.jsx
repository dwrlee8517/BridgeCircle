/* eslint-disable */
// Atrium onboarding — six-step flow that takes a new (anchor-invited) member
// from their first landing to a complete profile on the network.
//
// Steps:
//   1. Welcome   — "Invited by Dev Ramachandran. Here's what BridgeCircle is."
//   2. Basics    — name, photo, cohort, city, role + employer
//   3. Career    — past roles (added inline, render in the same Timeline style)
//   4. Education — past degrees
//   5. Open to   — mentorship / advice / intros / hiring with three-way toggle
//   6. Interests — interests, hobbies, languages
//   7. Review    — preview of profile card, "Join the circle" CTA
//
// State is one object held in OnboardingApp; steps are pure components that
// receive { values, set, next, back }.

const STEPS = [
  { id: 'welcome',   label: 'Welcome' },
  { id: 'basics',    label: 'Basics' },
  { id: 'career',    label: 'Career' },
  { id: 'education', label: 'Education' },
  { id: 'openTo',    label: 'How you help' },
  { id: 'interests', label: 'Interests' },
  { id: 'review',    label: 'Review' },
];

const INITIAL = {
  invitedBy: 'The Hartwood Society',
  org: 'The Hartwood Society',
  // basics
  fullName: '',
  initials: '',
  cohort: '',
  city: '',
  currentRole: '',
  currentEmployer: '',
  bio: '',
  // resume — used by the AI-extraction shortcut at the top of Career step
  resumeStatus: 'idle', // 'idle' | 'uploading' | 'extracted'
  resumeFileName: '',
  // career — array of { from, to, role, org, city, summary }
  career: [
    { from: '', to: '', role: '', org: '', city: '', summary: '' },
  ],
  // education
  education: [
    { from: '', to: '', degree: '', school: '', city: '', honors: '' },
  ],
  // open to — values: 'yes' | 'no'
  openTo: {
    mentorship: 'yes',
    advice:     'yes',
    intros:     'yes',
    hiring:     'no',
  },
  helpTags: ['Pitch decks', 'Career switches'],
  // interests
  interests: [''],
  hobbies:   ['Cooking', 'Open-water swimming'],
  languages: 'English',
};

// useIsMobile — listens to a media query so layout can collapse to a single
// column / smaller type / stacked controls below 640px.
function useIsMobile(breakpoint = 640) {
  const query = `(max-width: ${breakpoint}px)`;
  const [is, setIs] = React.useState(() =>
    typeof window !== 'undefined' && window.matchMedia(query).matches);
  React.useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setIs(e.matches);
    mql.addEventListener ? mql.addEventListener('change', onChange) : mql.addListener(onChange);
    setIs(mql.matches);
    return () => { mql.removeEventListener ? mql.removeEventListener('change', onChange) : mql.removeListener(onChange); };
  }, [query]);
  return is;
}

function OnboardingApp() {
  const t = React.useContext(ThemeCtx);
  const isMobile = useIsMobile();
  const [stepIdx, setStepIdx] = React.useState(0);
  const [values, setValues] = React.useState(INITIAL);
  const step = STEPS[stepIdx];

  const set = (patch) => setValues(v => ({ ...v, ...patch }));
  const next = () => setStepIdx(i => Math.min(i + 1, STEPS.length - 1));
  const back = () => setStepIdx(i => Math.max(i - 1, 0));

  // Sync body bg to the current tone preset.
  React.useEffect(() => {
    document.body.style.background = t.palette.paper;
  }, [t.palette.paper]);

  return (
    <div data-screen-label={`Onboarding · ${step.id}`} style={{
      minHeight: '100vh', background: t.palette.paper, color: t.palette.ink,
      fontFamily: t.font.body, display: 'flex', flexDirection: 'column',
    }}>
      <OnboardingHeader />
      <ProgressStrip stepIdx={stepIdx} isMobile={isMobile} />

      <main style={{ flex: 1, padding: isMobile ? '16px 14px 32px' : '24px 24px 40px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 840 }}>
          {step.id === 'welcome'   ? <StepWelcome   values={values} /> : null}
          {step.id === 'basics'    ? <StepBasics    values={values} set={set} /> : null}
          {step.id === 'career'    ? <StepCareer    values={values} set={set} /> : null}
          {step.id === 'education' ? <StepEducation values={values} set={set} /> : null}
          {step.id === 'openTo'    ? <StepOpenTo    values={values} set={set} /> : null}
          {step.id === 'interests' ? <StepInterests values={values} set={set} /> : null}
          {step.id === 'review'    ? <StepReview    values={values} /> : null}

          {/* Step navigation sits RIGHT BELOW the cards, inside the content
              column. No floating footer — easier to find, easier to tap. */}
          <OnboardingFooter step={step} stepIdx={stepIdx} total={STEPS.length} onBack={back} onNext={next} isMobile={isMobile} />
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header + footer + progress
// ---------------------------------------------------------------------------

function OnboardingHeader() {
  const t = React.useContext(ThemeCtx);
  const isMobile = useIsMobile();
  return (
    <header style={{ borderBottom: `1px solid ${t.palette.rule}`, background: t.palette.paper }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: isMobile ? '12px 14px' : '16px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <svg width="32" height="24" viewBox="0 0 32 24" aria-hidden="true">
            <circle cx="11" cy="12" r="9" fill={t.palette.accent} fillOpacity="0.85" />
            <circle cx="21" cy="12" r="9" fill={t.palette.ok}     fillOpacity="0.85" />
          </svg>
          <span style={{ ...t.display, fontSize: 18, letterSpacing: '-0.02em', color: t.palette.ink, fontWeight: 600 }}>
            BridgeCircle
          </span>
        </div>
        <button style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: t.palette.muted, fontFamily: t.font.body, fontSize: 13, fontWeight: 500,
          whiteSpace: 'nowrap',
        }}>Sign out</button>
      </div>
    </header>
  );
}

function ProgressStrip({ stepIdx, isMobile }) {
  const t = React.useContext(ThemeCtx);

  // ─── Mobile: condensed bar with a single label + dots row ─────────────
  if (isMobile) {
    const cur = STEPS[stepIdx];
    return (
      <div style={{ background: t.palette.cardAlt, borderBottom: `1px solid ${t.palette.ruleSoft}` }}>
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
            <div style={{
              fontFamily: t.font.mono, fontSize: 10.5, letterSpacing: '0.14em',
              color: t.palette.ink, fontWeight: 700,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {String(stepIdx + 1).padStart(2, '0')} · {cur.label.toUpperCase()}
            </div>
            <div style={{
              fontFamily: t.font.mono, fontSize: 10.5, letterSpacing: '0.14em',
              color: t.palette.mute2, fontWeight: 600, whiteSpace: 'nowrap',
            }}>
              {stepIdx + 1} / {STEPS.length}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${STEPS.length}, 1fr)`, gap: 4 }}>
            {STEPS.map((s, i) => {
              const done   = i < stepIdx;
              const active = i === stepIdx;
              return (
                <div key={s.id} style={{
                  height: 3, borderRadius: 999,
                  background: done || active ? t.palette.accent : t.palette.rule,
                }} />
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── Desktop: full seven-column labelled progress ─────────────────────
  return (
    <div style={{ background: t.palette.cardAlt, borderBottom: `1px solid ${t.palette.ruleSoft}` }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${STEPS.length}, 1fr)`, gap: 8 }}>
          {STEPS.map((s, i) => {
            const done   = i < stepIdx;
            const active = i === stepIdx;
            return (
              <div key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{
                  height: 3, borderRadius: 999,
                  background: done || active ? t.palette.accent : t.palette.rule,
                }} />
                <div style={{
                  fontFamily: t.font.mono, fontSize: 10, letterSpacing: '0.14em',
                  color: active ? t.palette.ink : t.palette.mute2,
                  fontWeight: 600,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {String(i + 1).padStart(2, '0')} · {s.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function OnboardingFooter({ step, stepIdx, total, onBack, onNext, isMobile }) {
  const t = React.useContext(ThemeCtx);
  const isFirst = stepIdx === 0;
  const isLast  = stepIdx === total - 1;

  // ─── Mobile: two-button row, step label tucked above ──────────────────
  if (isMobile) {
    return (
      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span style={{
          fontFamily: t.font.mono, fontSize: 10.5, letterSpacing: '0.14em',
          color: t.palette.muted, fontWeight: 600, textAlign: 'center',
        }}>
          STEP {String(stepIdx + 1).padStart(2, '0')} OF {String(total).padStart(2, '0')} · {step.label.toUpperCase()}
        </span>
        <div style={{ display: 'flex', gap: 10 }}>
          {isFirst ? null : (
            <div style={{ flex: '0 0 auto' }}>
              <AtriumButton variant="ghost" size="md" onClick={onBack}>← Back</AtriumButton>
            </div>
          )}
          <div style={{ flex: 1, display: 'flex' }}>
            <AtriumButton size="md" onClick={onNext} style={{ width: '100%', justifyContent: 'center' }}>
              {isLast ? 'Join the circle' : stepIdx === 0 ? 'Get started →' : 'Continue →'}
            </AtriumButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      marginTop: 20,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
    }}>
      <AtriumButton variant="ghost" size="md" onClick={onBack} style={{ visibility: isFirst ? 'hidden' : 'visible' }}>
        ← Back
      </AtriumButton>
      <span style={{ fontFamily: t.font.mono, fontSize: 11, letterSpacing: '0.14em', color: t.palette.muted, fontWeight: 600 }}>
        STEP {String(stepIdx + 1).padStart(2, '0')} OF {String(total).padStart(2, '0')} · {step.label.toUpperCase()}
      </span>
      <AtriumButton size="md" onClick={onNext}>
        {isLast ? 'Join the circle' : stepIdx === 0 ? 'Get started →' : 'Continue →'}
      </AtriumButton>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step primitives — reusable form atoms
// ---------------------------------------------------------------------------

function StepHeading({ eyebrow, title, sub }) {
  const t = React.useContext(ThemeCtx);
  const isMobile = useIsMobile();
  return (
    <div style={{ marginBottom: isMobile ? 18 : 24 }}>
      <AtriumEyebrow accent>{eyebrow}</AtriumEyebrow>
      <h1 style={{ ...t.display, fontSize: isMobile ? 28 : 44, lineHeight: isMobile ? 1.15 : 1.1, margin: isMobile ? '10px 0 0' : '12px 0 0', maxWidth: 700 }}>
        {title}
      </h1>
      {sub ? (
        <p style={{ fontSize: isMobile ? 14.5 : 16, lineHeight: 1.55, color: t.palette.muted, margin: isMobile ? '10px 0 0' : '12px 0 0', maxWidth: 620 }}>
          {sub}
        </p>
      ) : null}
    </div>
  );
}

function Field({ label, helper, optional, children }) {
  const t = React.useContext(ThemeCtx);
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 0 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: t.palette.ink }}>
        {label}
        {optional ? (
          <span style={{ fontSize: 12, color: t.palette.mute2, fontWeight: 500, marginLeft: 6 }}>(optional)</span>
        ) : null}
      </span>
      {children}
      {helper ? <span style={{ fontSize: 12, color: t.palette.muted }}>{helper}</span> : null}
    </label>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text', onKeyDown }) {
  const t = React.useContext(ThemeCtx);
  return (
    <input
      type={type} value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      style={{
        boxSizing: 'border-box', width: '100%',
        background: t.palette.card, color: t.palette.ink,
        border: `1px solid ${t.palette.rule}`,
        borderRadius: t.radius - 4,
        padding: '11px 14px',
        fontFamily: t.font.body, fontSize: 14,
        outline: 'none', transition: 'border-color 120ms ease',
      }}
      onFocus={(e) => { e.target.style.borderColor = t.palette.ink; }}
      onBlur={(e)  => { e.target.style.borderColor = t.palette.rule; }}
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }) {
  const t = React.useContext(ThemeCtx);
  return (
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        boxSizing: 'border-box', width: '100%', resize: 'vertical',
        background: t.palette.card, color: t.palette.ink,
        border: `1px solid ${t.palette.rule}`,
        borderRadius: t.radius - 4,
        padding: '11px 14px',
        fontFamily: t.font.body, fontSize: 14, lineHeight: 1.55,
        outline: 'none', transition: 'border-color 120ms ease',
      }}
      onFocus={(e) => { e.target.style.borderColor = t.palette.ink; }}
      onBlur={(e)  => { e.target.style.borderColor = t.palette.rule; }}
    />
  );
}

function FieldRow({ children }) {
  const isMobile = useIsMobile();
  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 14, flexWrap: 'wrap' }}>{children}</div>
  );
}

function SectionCard({ title, action, children }) {
  const t = React.useContext(ThemeCtx);
  const isMobile = useIsMobile();
  return (
    <div style={t.cardSurface({ padding: isMobile ? 16 : 24, marginBottom: isMobile ? 12 : 16 })}>
      {title ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: isMobile ? 12 : 16, gap: 12 }}>
          <AtriumEyebrow>{title}</AtriumEyebrow>
          {action}
        </div>
      ) : null}
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Welcome
// ---------------------------------------------------------------------------

function StepWelcome({ values }) {
  const t = React.useContext(ThemeCtx);
  const isMobile = useIsMobile();
  return (
    <div>
      <div style={{
        ...t.cardSurface({ padding: isMobile ? 22 : 48, position: 'relative', overflow: 'hidden' }),
        background: `linear-gradient(180deg, ${t.palette.cardAlt} 0%, ${t.palette.card} 100%)`,
      }}>
        <svg aria-hidden="true" width="640" height="480" viewBox="0 0 640 480"
             style={{ position: 'absolute', right: isMobile ? -160 : -100, top: isMobile ? -100 : -60, opacity: isMobile ? 0.3 : 0.45, pointerEvents: 'none' }}>
          <circle cx="240" cy="260" r="190" fill="none" stroke={t.palette.accent} strokeOpacity="0.35" strokeWidth="1.5" />
          <circle cx="380" cy="260" r="190" fill="none" stroke={t.palette.ok}     strokeOpacity="0.35" strokeWidth="1.5" />
        </svg>

        <div style={{ position: 'relative', maxWidth: 560 }}>
          <AtriumEyebrow accent>Invitation No. 048 · {values.org}</AtriumEyebrow>

          <h1 style={{ ...t.display, fontSize: isMobile ? 34 : 56, lineHeight: isMobile ? 1.1 : 1.05, margin: isMobile ? '14px 0 0' : '18px 0 0' }}>
            Welcome to <span style={{ color: t.palette.accent }}>BridgeCircle.</span>
          </h1>

          <p style={{ fontSize: isMobile ? 14.5 : 17, lineHeight: 1.6, color: t.palette.muted, margin: isMobile ? '14px 0 0' : '20px 0 0' }}>
            <strong style={{ color: t.palette.ink2, fontWeight: 600 }}>{values.org}</strong> has invited you to join. We’ll spend the next few minutes setting up your profile — small things now, easier asks later.
          </p>

          {/* Org verification card — Hartwood vouches for you, not a single member. */}
          <div style={{
            marginTop: isMobile ? 20 : 28, padding: isMobile ? 14 : 18, background: t.palette.paper, border: `1px solid ${t.palette.rule}`, borderRadius: t.radius,
            display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: t.radius - 4, flexShrink: 0,
              background: t.palette.cardAlt, border: `1px solid ${t.palette.rule}`,
              display: 'grid', placeItems: 'center',
            }} aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={t.palette.accent} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z" />
                <path d="M9 12.5l2 2 4-4.5" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{values.org} · Admissions</div>
              <div style={{ fontSize: 12, color: t.palette.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Verified your eligibility · {values.org} alumni records</div>
            </div>
            <AtriumTag tone="ok" dot>Verified</AtriumTag>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: isMobile ? '20px 0 0' : '28px 0 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { n: '01', t: 'Verified', d: 'Members are admitted by the organization. No bots, no strangers.' },
              { n: '02', t: 'Members-first', d: 'No ads. No engagement loops. The product exists to make the circle useful.' },
              { n: '03', t: 'Reciprocal', d: 'You can ask for help and you can give help. Both matter.' },
            ].map(b => (
              <li key={b.n} style={{ display: 'grid', gridTemplateColumns: isMobile ? '24px 1fr' : '32px 1fr', gap: isMobile ? 10 : 14, alignItems: 'baseline', fontSize: isMobile ? 13.5 : 14, lineHeight: 1.55 }}>
                <span style={{ fontFamily: t.font.mono, fontSize: 11, color: t.palette.accent, letterSpacing: '0.14em', fontWeight: 700 }}>{b.n}</span>
                <span>
                  <strong style={{ fontWeight: 600, color: t.palette.ink }}>{b.t}.</strong>
                  <span style={{ color: t.palette.muted }}> {b.d}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p style={{ fontSize: 13, color: t.palette.muted, textAlign: 'center', marginTop: 18 }}>
        Takes about <strong style={{ color: t.palette.ink2, fontWeight: 600 }}>4 minutes.</strong> You can edit anything later from your profile.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Basics
// ---------------------------------------------------------------------------

function StepBasics({ values, set }) {
  const t = React.useContext(ThemeCtx);
  const initials = (values.fullName || '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?';
  return (
    <div>
      <StepHeading
        eyebrow="Step 02 · Basics"
        title="Start with the basics."
        sub="What we’ll print on your profile card. Initials are computed from your full name, but you can override the photo later."
      />

      <SectionCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <div style={{ position: 'relative' }}>
            <AtriumAvatar name={values.fullName || 'You'} initials={initials} size={80} />
            <button style={{
              position: 'absolute', bottom: -2, right: -2,
              background: t.palette.ink, color: t.palette.paper,
              border: `2px solid ${t.palette.card}`, borderRadius: 999,
              width: 28, height: 28, cursor: 'pointer',
              fontSize: 14, lineHeight: 1, fontWeight: 600,
            }}>+</button>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>Profile photo</div>
            <div style={{ fontSize: 12.5, color: t.palette.muted, marginTop: 4, lineHeight: 1.5 }}>
              Upload one or keep the gradient initials. JPG / PNG up to 5 MB.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <FieldRow>
            <Field label="Full name" helper="As you’d like to be addressed.">
              <TextInput value={values.fullName} onChange={(v) => set({ fullName: v })} placeholder="Maren Vasilakis" />
            </Field>
            <Field label="Cohort year" helper="The year you graduated from Hartwood.">
              <TextInput value={values.cohort} onChange={(v) => set({ cohort: v })} placeholder="2014" />
            </Field>
          </FieldRow>

          <Field label="Where you live" helper="City and country. Use the place you actually live, not where you’re from.">
            <TextInput value={values.city} onChange={(v) => set({ city: v })} placeholder="Brooklyn, NY" />
          </Field>

          <FieldRow>
            <Field label="Current role">
              <TextInput value={values.currentRole} onChange={(v) => set({ currentRole: v })} placeholder="VP of Product" />
            </Field>
            <Field label="At">
              <TextInput value={values.currentEmployer} onChange={(v) => set({ currentEmployer: v })} placeholder="Topfield" />
            </Field>
          </FieldRow>

          <Field label="In your own words" helper="A line or two on what you’re working on and what you might want help with." optional>
            <TextArea value={values.bio} onChange={(v) => set({ bio: v })}
              placeholder="Building a small documentary studio focused on overlooked civic life. Looking to talk with anyone who has navigated investor pitches for art-leaning work."
              rows={3} />
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Resume / LinkedIn upload — shortcut on the Career step that pre-fills both
// career and education via the AI extraction pipeline. Mocked in this
// prototype; in production it hits the extraction endpoint.
// ---------------------------------------------------------------------------

const MOCK_EXTRACTED_CAREER = [
  { from: 2023, to: '',   role: 'Founder & Director',  org: 'The Long Take Co.',    city: 'Brooklyn, NY',   summary: 'Documentary studio focused on overlooked civic life.' },
  { from: 2020, to: 2023, role: 'Senior Producer',     org: 'Field Notes Media',    city: 'Brooklyn, NY',   summary: 'Led a four-person team producing public-radio companion videos for WNYC and KQED.' },
  { from: 2017, to: 2020, role: 'Associate Producer',  org: 'Public Counsel',       city: 'New York, NY',   summary: 'Mini-docs for civil-rights nonprofits.' },
];

const MOCK_EXTRACTED_EDUCATION = [
  { from: 2017, to: 2019, degree: 'M.F.A., Documentary Practice', school: 'Hartwood College',    city: 'New York, NY',   honors: 'DPF Fellow' },
  { from: 2011, to: 2015, degree: 'B.A., English Literature',     school: 'University of Lagos', city: 'Lagos, Nigeria', honors: 'First-class honours' },
];

function ResumeUpload({ values, set }) {
  const t = React.useContext(ThemeCtx);
  const isMobile = useIsMobile();
  const inputRef = React.useRef(null);
  const [dragOver, setDragOver] = React.useState(false);

  const beginExtraction = (fileName) => {
    set({ resumeStatus: 'uploading', resumeFileName: fileName });
    // Simulate the extraction pipeline; in production this awaits the API.
    setTimeout(() => {
      set({
        resumeStatus: 'extracted',
        resumeFileName: fileName,
        career: MOCK_EXTRACTED_CAREER,
        education: MOCK_EXTRACTED_EDUCATION,
      });
    }, 1800);
  };

  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (f) beginExtraction(f.name);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) beginExtraction(f.name);
  };

  const reset = () => {
    set({
      resumeStatus: 'idle', resumeFileName: '',
      // Don't wipe edits — keep what the user has now. Only clear the file pill.
    });
  };

  // ─── State: extracted ──────────────────────────────────────────────────
  if (values.resumeStatus === 'extracted') {
    return (
      <div style={{
        ...t.cardSurface({ padding: isMobile ? 14 : 18, marginBottom: isMobile ? 12 : 16 }),
        background: t.palette.cardAlt,
        display: 'grid',
        gridTemplateColumns: isMobile ? 'auto 1fr' : 'auto 1fr auto',
        gap: isMobile ? 10 : 14,
        alignItems: 'center',
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 999, background: hex(t.palette.ok, 0.14),
          display: 'grid', placeItems: 'center', flexShrink: 0,
        }} aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.palette.ok} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l4 4 10-10" />
          </svg>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>
            Extracted {MOCK_EXTRACTED_CAREER.length} roles and {MOCK_EXTRACTED_EDUCATION.length} degrees.
          </div>
          <div style={{ fontSize: 12.5, color: t.palette.muted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            From <strong style={{ color: t.palette.ink2, fontWeight: 600 }}>{values.resumeFileName}</strong> — please review and edit below.
          </div>
        </div>
        <button onClick={reset} style={{
          gridColumn: isMobile ? '1 / -1' : 'auto',
          justifySelf: isMobile ? 'stretch' : 'auto',
          background: 'transparent', border: `1px solid ${t.palette.rule}`,
          borderRadius: 999, padding: '8px 14px', cursor: 'pointer',
          fontFamily: t.font.body, fontSize: 12.5, fontWeight: 600, color: t.palette.muted,
          whiteSpace: 'nowrap',
        }}>Replace file</button>
      </div>
    );
  }

  // ─── State: uploading ──────────────────────────────────────────────────
  if (values.resumeStatus === 'uploading') {
    return (
      <div style={{
        ...t.cardSurface({ padding: 22, marginBottom: 16 }),
        background: t.palette.cardAlt,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Spinner color={t.palette.accent} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Reading {values.resumeFileName}…</div>
            <div style={{ fontSize: 12.5, color: t.palette.muted, marginTop: 2 }}>
              Extracting your roles and degrees. This takes a few seconds.
            </div>
          </div>
        </div>
        <div style={{ marginTop: 14, height: 3, background: t.palette.rule, borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            width: '40%', height: '100%', background: t.palette.accent,
            animation: 'bc-resume-pulse 1.4s ease-in-out infinite',
          }} />
        </div>
        <style>{`@keyframes bc-resume-pulse { 0% { margin-left: -40% } 100% { margin-left: 100% } }`}</style>
      </div>
    );
  }

  // ─── State: idle ───────────────────────────────────────────────────────
  const [showHelp, setShowHelp] = React.useState(false);
  return (
    <div style={{
      ...t.cardSurface({ padding: 22, marginBottom: 16 }),
      background: t.palette.cardAlt,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: t.radius - 6,
          background: hex(t.palette.accent, 0.14),
          display: 'grid', placeItems: 'center', flexShrink: 0,
        }} aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.palette.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 3h11l3 3v15a0 0 0 0 1 0 0H5z" />
            <path d="M9 13h6M9 17h4M9 9h2" />
          </svg>
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Speed this up with your resume / CV or LinkedIn PDF</div>
            <button onClick={() => setShowHelp(s => !s)} aria-expanded={showHelp} aria-label="How to download your LinkedIn profile as PDF" style={{
              width: 18, height: 18, padding: 0,
              background: 'transparent', border: `1px solid ${t.palette.muted}`,
              borderRadius: 999, cursor: 'pointer',
              color: t.palette.muted, fontFamily: t.font.body, fontSize: 11, fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, lineHeight: 1,
            }}>i</button>
          </div>
          <div style={{ fontSize: 12.5, color: t.palette.muted, marginTop: 4, lineHeight: 1.5 }}>
            Upload your resume/CV or a PDF of your LinkedIn profile and we’ll pre-fill your roles and degrees. You can edit anything afterwards.
          </div>
        </div>
      </div>

      {showHelp ? (
        <div style={{
          marginBottom: 14, padding: 14,
          background: t.palette.paper,
          border: `1px solid ${t.palette.rule}`,
          borderRadius: t.radius - 4,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <AtriumEyebrow accent>How to download your LinkedIn as PDF</AtriumEyebrow>
            <button onClick={() => setShowHelp(false)} aria-label="Close" style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: t.palette.mute2, fontSize: 14, lineHeight: 1, padding: 2,
            }}>×</button>
          </div>
          <ol style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { n: '01', t: 'On LinkedIn, go to your profile.', d: 'Click your photo at the top, then “View profile.”' },
              { n: '02', t: 'Open the Resources menu.', d: 'Below your headline, click “Resources.”' },
              { n: '03', t: 'Choose Save to PDF.', d: 'LinkedIn will generate a PDF of your profile and download it.' },
              { n: '04', t: 'Drop the file below.', d: 'We’ll read your roles and education and pre-fill the form.' },
            ].map(b => (
              <li key={b.n} style={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: 10, alignItems: 'baseline', fontSize: 13, lineHeight: 1.5 }}>
                <span style={{ fontFamily: t.font.mono, fontSize: 10, color: t.palette.accent, letterSpacing: '0.14em', fontWeight: 700 }}>{b.n}</span>
                <span>
                  <strong style={{ fontWeight: 600, color: t.palette.ink }}>{b.t}</strong>
                  <span style={{ color: t.palette.muted }}> {b.d}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {/* Drop / pick zone — full width now that the LinkedIn URL has been removed */}
      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          gap: 8,
          border: `1.5px dashed ${dragOver ? t.palette.accent : t.palette.rule}`,
          background: dragOver ? hex(t.palette.accent, 0.06) : t.palette.card,
          borderRadius: t.radius - 4,
          padding: '28px 20px', cursor: 'pointer',
          transition: 'border-color 120ms, background 120ms',
        }}>
        <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" onChange={onPick}
          style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} />
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={t.palette.muted} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3v13M7 8l5-5 5 5" />
          <path d="M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
        </svg>
        <div style={{ fontSize: 14, fontWeight: 600, color: t.palette.ink }}>
          Drop a PDF here, or <span style={{ color: t.palette.accent }}>browse</span>
        </div>
        <div style={{ fontSize: 12, color: t.palette.mute2 }}>PDF · DOC · DOCX · up to 10 MB</div>
      </label>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 11.5, color: t.palette.mute2 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span>Your file is processed in your browser — never shared with other members.</span>
      </div>
    </div>
  );
}

function Spinner({ color }) {
  return (
    <span style={{
      width: 22, height: 22, borderRadius: 999,
      border: `2px solid ${color}33`,
      borderTopColor: color,
      animation: 'bc-spin 0.8s linear infinite',
      display: 'inline-block', flexShrink: 0,
    }}>
      <style>{`@keyframes bc-spin { to { transform: rotate(360deg) } }`}</style>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Career
// ---------------------------------------------------------------------------

function StepCareer({ values, set }) {
  const t = React.useContext(ThemeCtx);
  const updateRole = (i, patch) => {
    const next = values.career.slice();
    next[i] = { ...next[i], ...patch };
    set({ career: next });
  };
  const addRole = () => set({ career: [...values.career, { from: '', to: '', role: '', org: '', city: '', summary: '' }] });
  const removeRole = (i) => set({ career: values.career.filter((_, j) => j !== i) });

  return (
    <div>
      <StepHeading
        eyebrow="Step 03 · Career"
        title="A short career history."
        sub="The two or three roles that best describe what you do — and what you can help with. You can leave the end year blank for your current role."
      />

      {/* Resume / LinkedIn shortcut — runs the extraction pipeline and
          pre-fills career + education. Collapses to a success state once
          extracted; if the user skips, the form is still here to fill in. */}
      <ResumeUpload values={values} set={set} />

      {values.career.map((r, i) => (
        <SectionCard key={i}
          title={i === 0 ? 'Most recent role' : `Earlier role ${String(i + 1).padStart(2, '0')}`}
          action={values.career.length > 1 ? (
            <button onClick={() => removeRole(i)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: t.palette.muted, fontSize: 12, fontWeight: 500 }}>
              Remove
            </button>
          ) : null}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <FieldRow>
              <Field label="From"><TextInput value={r.from} onChange={(v) => updateRole(i, { from: v })} placeholder="2020" /></Field>
              <Field label="To" helper="Leave blank for current"><TextInput value={r.to} onChange={(v) => updateRole(i, { to: v })} placeholder="2023" /></Field>
            </FieldRow>
            <FieldRow>
              <Field label="Role"><TextInput value={r.role} onChange={(v) => updateRole(i, { role: v })} placeholder="Senior Producer" /></Field>
              <Field label="Company / organization"><TextInput value={r.org} onChange={(v) => updateRole(i, { org: v })} placeholder="Field Notes Media" /></Field>
            </FieldRow>
            <Field label="City" optional><TextInput value={r.city} onChange={(v) => updateRole(i, { city: v })} placeholder="Brooklyn, NY" /></Field>
            <Field label="What you did there" optional helper="One or two sentences. What scope, what scale, what you learned.">
              <TextArea value={r.summary} onChange={(v) => updateRole(i, { summary: v })} rows={2}
                placeholder="Led a four-person team producing public-radio companion videos for WNYC and KQED." />
            </Field>
          </div>
        </SectionCard>
      ))}

      <button onClick={addRole} style={{
        background: 'transparent', border: `1px dashed ${t.palette.rule}`,
        borderRadius: t.radius, padding: '14px 20px', cursor: 'pointer',
        color: t.palette.muted, fontFamily: t.font.body, fontSize: 13.5, fontWeight: 600,
        width: '100%',
      }}>+ Add another role</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — Education
// ---------------------------------------------------------------------------

function StepEducation({ values, set }) {
  const t = React.useContext(ThemeCtx);
  const update = (i, patch) => {
    const next = values.education.slice();
    next[i] = { ...next[i], ...patch };
    set({ education: next });
  };
  const add = () => set({ education: [...values.education, { from: '', to: '', degree: '', school: '', city: '', honors: '' }] });
  const remove = (i) => set({ education: values.education.filter((_, j) => j !== i) });

  return (
    <div>
      <StepHeading
        eyebrow="Step 04 · Education"
        title="Education — and how you got here."
        sub="Hartwood goes here too. Add the one or two degrees that show up on your formal CV — and any honors that matter to you."
      />

      {values.education.map((r, i) => (
        <SectionCard key={i}
          title={i === 0 ? 'Most recent degree' : `Earlier degree ${String(i + 1).padStart(2, '0')}`}
          action={values.education.length > 1 ? (
            <button onClick={() => remove(i)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: t.palette.muted, fontSize: 12, fontWeight: 500 }}>
              Remove
            </button>
          ) : null}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <FieldRow>
              <Field label="From"><TextInput value={r.from} onChange={(v) => update(i, { from: v })} placeholder="2017" /></Field>
              <Field label="To"><TextInput value={r.to} onChange={(v) => update(i, { to: v })} placeholder="2019" /></Field>
            </FieldRow>
            <FieldRow>
              <Field label="Degree"><TextInput value={r.degree} onChange={(v) => update(i, { degree: v })} placeholder="M.F.A., Documentary Practice" /></Field>
              <Field label="School"><TextInput value={r.school} onChange={(v) => update(i, { school: v })} placeholder="Hartwood College" /></Field>
            </FieldRow>
            <FieldRow>
              <Field label="City" optional><TextInput value={r.city} onChange={(v) => update(i, { city: v })} placeholder="New York, NY" /></Field>
              <Field label="Honors" optional><TextInput value={r.honors} onChange={(v) => update(i, { honors: v })} placeholder="DPF Fellow · First-class honours" /></Field>
            </FieldRow>
          </div>
        </SectionCard>
      ))}

      <button onClick={add} style={{
        background: 'transparent', border: `1px dashed ${t.palette.rule}`,
        borderRadius: t.radius, padding: '14px 20px', cursor: 'pointer',
        color: t.palette.muted, fontFamily: t.font.body, fontSize: 13.5, fontWeight: 600,
        width: '100%',
      }}>+ Add another degree</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5 — Open to
// ---------------------------------------------------------------------------

const OPEN_LEVELS = [
  { id: 'yes', label: 'Yes' },
  { id: 'no',  label: 'Not now' },
];

const HELP_TAG_OPTIONS = [
  'Pitch decks', 'Cold intros', 'Career switches', 'Hiring loops', 'Salary negotiations',
  'Design portfolio reviews', 'Eng leadership', 'Fundraising', 'Going from IC to manager',
  'Founding a company', 'Public speaking', 'Writing for the web', 'Compensation comps',
];

function StepOpenTo({ values, set }) {
  const t = React.useContext(ThemeCtx);
  const isMobile = useIsMobile();
  const setLevel = (k, v) => set({ openTo: { ...values.openTo, [k]: v } });
  const toggleHelpTag = (tag) => {
    const has = values.helpTags.includes(tag);
    set({ helpTags: has ? values.helpTags.filter(x => x !== tag) : [...values.helpTags, tag] });
  };
  return (
    <div>
      <StepHeading
        eyebrow="Step 05 · How you help"
        title="What you’re open to."
        sub="Be honest. Members can ask for what you’re open to and never for what you’re not — and you can change this any time."
      />

      <SectionCard title="Open to">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {[
            { key: 'mentorship', label: 'Mentorship', sub: 'A few 30-min calls over a few weeks on a defined goal.' },
            { key: 'advice',     label: 'Advice',     sub: 'One-off questions, async or a short call. Lower commitment.' },
            { key: 'intros',     label: 'Intros',     sub: 'Connecting members in your network to other Hartwood folks.' },
            { key: 'hiring',     label: 'Hiring',     sub: 'Being open to talking about roles at your company.' },
          ].map(r => (
            <div key={r.key} style={{
              display: isMobile ? 'flex' : 'grid',
              flexDirection: isMobile ? 'column' : undefined,
              gridTemplateColumns: isMobile ? undefined : '1fr auto',
              gap: isMobile ? 10 : 16,
              alignItems: isMobile ? 'flex-start' : 'center',
              padding: '14px 0', borderBottom: `1px solid ${t.palette.ruleSoft}`,
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{r.label}</div>
                <div style={{ fontSize: 12.5, color: t.palette.muted, marginTop: 2, lineHeight: 1.5 }}>{r.sub}</div>
              </div>
              <ThreeWaySegment value={values.openTo[r.key]} onChange={(v) => setLevel(r.key, v)} />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="And what you’re good at helping with">
        <p style={{ fontSize: 13, color: t.palette.muted, margin: '0 0 14px', lineHeight: 1.55 }}>
          Pick a few. Members search by these tags when they’re looking for someone — better to be specific than to claim everything.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {HELP_TAG_OPTIONS.map(tag => {
            const on = values.helpTags.includes(tag);
            return (
              <button key={tag} onClick={() => toggleHelpTag(tag)} style={{
                background: on ? t.palette.ink : 'transparent',
                color: on ? t.palette.paper : t.palette.muted,
                border: `1px solid ${on ? t.palette.ink : t.palette.rule}`,
                padding: '7px 12px', borderRadius: 999,
                fontFamily: t.font.body, fontSize: 12.5, fontWeight: 600,
                cursor: 'pointer',
              }}>{tag}</button>
            );
          })}

          {/* Custom help tags — anything in values.helpTags that isn't a
              preset. Rendered with × so the user can remove them. */}
          {values.helpTags.filter(tag => !HELP_TAG_OPTIONS.includes(tag)).map(tag => (
            <span key={tag} style={{
              background: t.palette.ink, color: t.palette.paper,
              border: `1px solid ${t.palette.ink}`,
              padding: '7px 7px 7px 12px', borderRadius: 999,
              fontFamily: t.font.body, fontSize: 12.5, fontWeight: 600,
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              {tag}
              <button onClick={() => toggleHelpTag(tag)} aria-label={`Remove ${tag}`} style={{
                width: 18, height: 18, padding: 0,
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: t.palette.paper, fontSize: 14, lineHeight: 1,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 999, opacity: 0.7,
              }}>×</button>
            </span>
          ))}
        </div>

        <CustomTagAdder
          listKey="helpTags"
          values={values}
          set={set}
          hint="Don’t see it? Add what you can actually help with — specific beats broad (“Series A pitch decks” > “Fundraising”)."
          placeholder="Add a help tag and press Enter"
        />
      </SectionCard>
    </div>
  );
}

function ThreeWaySegment({ value, onChange }) {
  const t = React.useContext(ThemeCtx);
  return (
    <div style={{
      display: 'inline-flex', gap: 2, padding: 3,
      background: t.palette.paper, border: `1px solid ${t.palette.rule}`, borderRadius: 999,
    }}>
      {OPEN_LEVELS.map(l => {
        const active = value === l.id;
        return (
          <button key={l.id} onClick={() => onChange(l.id)} style={{
            background: active ? t.palette.ink : 'transparent',
            color: active ? t.palette.paper : t.palette.muted,
            border: 'none', cursor: 'pointer',
            padding: '6px 14px', borderRadius: 999,
            fontFamily: t.font.body, fontSize: 12.5, fontWeight: 600,
            whiteSpace: 'nowrap',
            transition: 'background 120ms ease',
          }}>{l.label}</button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 6 — Interests
// ---------------------------------------------------------------------------

const HOBBY_OPTIONS = [
  'Cooking', 'Baking', 'Pottery', 'Open-water swimming', 'Distance running',
  'Cycling', 'Climbing', 'Letterpress printing', 'Polaroid portraits',
  'Live music', 'Long-form reading', 'Type design', 'Board games', 'Hiking',
];

function StepInterests({ values, set }) {
  const t = React.useContext(ThemeCtx);
  const updateInterest = (i, v) => {
    const next = values.interests.slice();
    next[i] = v;
    set({ interests: next });
  };
  const addInterest = () => set({ interests: [...values.interests, ''] });
  const removeInterest = (i) => set({ interests: values.interests.filter((_, j) => j !== i) });
  const toggleHobby = (h) => {
    const has = values.hobbies.includes(h);
    set({ hobbies: has ? values.hobbies.filter(x => x !== h) : [...values.hobbies, h] });
  };
  return (
    <div>
      <StepHeading
        eyebrow="Step 06 · Interests"
        title="What you’re reading, watching, and curious about."
        sub="The conversational stuff. Useful for members who want to find people thinking about the same problems, or just looking for a coffee."
      />

      <SectionCard title="Currently interested in">
        <p style={{ fontSize: 13, color: t.palette.muted, margin: '0 0 14px', lineHeight: 1.55 }}>
          One short phrase per line. Quietly specific is better than broad (“federal arts funding policy” &gt; “politics”).
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {values.interests.map((it, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 28px', gap: 10, alignItems: 'center' }}>
              <span style={{ fontFamily: t.font.mono, fontSize: 11, color: t.palette.accent, letterSpacing: '0.14em', fontWeight: 700 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <TextInput value={it} onChange={(v) => updateInterest(i, v)} placeholder="Documentary as public memory" />
              {values.interests.length > 1 ? (
                <button onClick={() => removeInterest(i)} aria-label="Remove" style={{
                  width: 28, height: 28, padding: 0,
                  background: 'transparent', border: `1px solid ${t.palette.rule}`, borderRadius: 999,
                  cursor: 'pointer', color: t.palette.muted, fontSize: 14, lineHeight: 1,
                }}>×</button>
              ) : <span />}
            </div>
          ))}
          <button onClick={addInterest} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: t.palette.accent, fontFamily: t.font.body, fontSize: 13, fontWeight: 600,
            padding: '6px 0 0', alignSelf: 'flex-start',
          }}>+ Add another</button>
        </div>
      </SectionCard>

      <SectionCard title="Hobbies">
        <p style={{ fontSize: 13, color: t.palette.muted, margin: '0 0 14px', lineHeight: 1.55 }}>
          Pick anything that feels true. Members surface mutual hobbies when meeting in person.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {HOBBY_OPTIONS.map(h => {
            const on = values.hobbies.includes(h);
            return (
              <button key={h} onClick={() => toggleHobby(h)} style={{
                background: on ? hex(t.palette.accent, 0.14) : 'transparent',
                color: on ? t.palette.accent : t.palette.muted,
                border: on ? 'none' : `1px solid ${t.palette.rule}`,
                padding: '6px 12px', borderRadius: 999,
                fontFamily: t.font.body, fontSize: 12.5, fontWeight: 600,
                cursor: 'pointer',
              }}>{h}</button>
            );
          })}

          {/* Custom hobbies — anything in values.hobbies that isn't a preset.
              Rendered with a × so the user can remove them. */}
          {values.hobbies.filter(h => !HOBBY_OPTIONS.includes(h)).map(h => (
            <span key={h} style={{
              background: hex(t.palette.accent, 0.14), color: t.palette.accent,
              padding: '6px 6px 6px 12px', borderRadius: 999,
              fontFamily: t.font.body, fontSize: 12.5, fontWeight: 600,
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              {h}
              <button onClick={() => toggleHobby(h)} aria-label={`Remove ${h}`} style={{
                width: 18, height: 18, padding: 0,
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: t.palette.accent, fontSize: 14, lineHeight: 1,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 999,
              }}>×</button>
            </span>
          ))}
        </div>

        <CustomTagAdder
          listKey="hobbies"
          values={values}
          set={set}
          hint={<>Don’t see it? Add your own — short and specific is best (“Backgammon” &gt; “Games”).</>}
          placeholder="Add a hobby and press Enter"
        />
      </SectionCard>

      <SectionCard title="Languages">
        <Field label="What you speak" helper="Comma-separated; you can mark fluency in parens.">
          <TextInput value={values.languages} onChange={(v) => set({ languages: v })} placeholder="English, Igbo (conversational), Yoruba (reading)" />
        </Field>
      </SectionCard>
    </div>
  );
}

// CustomTagAdder — generic inline "add your own" row used wherever the user
// picks chips from a preset list (hobbies, help tags, etc). `listKey` is the
// values[] array to append to. Duplicates are ignored; trim before adding.
function CustomTagAdder({ listKey, values, set, hint, placeholder }) {
  const t = React.useContext(ThemeCtx);
  const [draft, setDraft] = React.useState('');
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    const list = values[listKey] || [];
    if (list.includes(v)) { setDraft(''); return; }
    set({ [listKey]: [...list, v] });
    setDraft('');
  };
  return (
    <div style={{
      marginTop: 16, paddingTop: 16, borderTop: `1px solid ${t.palette.ruleSoft}`,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {hint ? <div style={{ fontSize: 12, color: t.palette.muted }}>{hint}</div> : null}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <TextInput
            value={draft}
            onChange={setDraft}
            placeholder={placeholder}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          />
        </div>
        <AtriumButton size="md" variant="outline" onClick={add}
          style={{ whiteSpace: 'nowrap', opacity: draft.trim() ? 1 : 0.5, pointerEvents: draft.trim() ? 'auto' : 'none' }}>
          + Add
        </AtriumButton>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 7 — Review
// ---------------------------------------------------------------------------

function StepReview({ values }) {
  const t = React.useContext(ThemeCtx);
  const isMobile = useIsMobile();
  const initials = (values.fullName || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?';
  const yearShort = values.cohort ? `’${String(values.cohort).slice(-2)}` : '—';

  return (
    <div>
      <StepHeading
        eyebrow="Step 07 · Review"
        title="Last look before you join."
        sub="Here’s the card other members will see when they find you. You can edit any of it from your profile after you join."
      />

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 12 : 18 }}>
        {/* Left: rendered profile card preview */}
        <div style={t.cardSurface({ padding: isMobile ? 18 : 28 })}>
          <AtriumEyebrow accent>Profile card preview</AtriumEyebrow>
          <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
            <AtriumAvatar name={values.fullName || 'You'} initials={initials} size={isMobile ? 56 : 64} />
            <div style={{ minWidth: 0 }}>
              <h3 style={{ ...t.display, fontSize: isMobile ? 22 : 26, margin: 0, fontWeight: 600 }}>{values.fullName || 'Your name'}</h3>
              <div style={{ fontSize: 13, color: t.palette.muted, marginTop: 2 }}>{yearShort} · {values.city || 'City'}</div>
            </div>
          </div>
          <div style={{ fontSize: 14, color: t.palette.ink2, marginTop: 16, fontWeight: 500 }}>
            {values.currentRole || 'Your role'} <span style={{ color: t.palette.muted, fontWeight: 400 }}>at</span> {values.currentEmployer || 'Your company'}
          </div>
          {values.bio ? (
            <p style={{ fontSize: 13.5, lineHeight: 1.55, color: t.palette.muted, marginTop: 12 }}>
              {values.bio}
            </p>
          ) : null}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
            {values.helpTags.slice(0, 4).map(t => <AtriumTag key={t} tone="muted">{t}</AtriumTag>)}
          </div>
        </div>

        {/* Right: summary of choices */}
        <div style={t.cardSurface({ padding: isMobile ? 18 : 28 })}>
          <AtriumEyebrow>What you said</AtriumEyebrow>
          <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0' }}>
            <SummaryRow label="Roles in history" value={`${values.career.filter(c => c.role || c.org).length} role${values.career.length === 1 ? '' : 's'}`} />
            <SummaryRow label="Education entries" value={`${values.education.filter(e => e.degree || e.school).length}`} />
            <SummaryRow label="Open to mentorship" value={values.openTo.mentorship === 'yes' ? 'Yes' : 'Not now'} />
            <SummaryRow label="Open to advice"     value={values.openTo.advice === 'yes' ? 'Yes' : 'Not now'} />
            <SummaryRow label="Open to intros"     value={values.openTo.intros === 'yes' ? 'Yes' : 'Not now'} />
            <SummaryRow label="Open to hiring"     value={values.openTo.hiring === 'yes' ? 'Yes' : 'Not now'} />
            <SummaryRow label="Help tags"          value={`${values.helpTags.length}`} />
            <SummaryRow label="Interests"          value={`${values.interests.filter(Boolean).length}`} />
            <SummaryRow label="Hobbies"            value={`${values.hobbies.length}`} />
            <SummaryRow label="Languages"          value={values.languages || '—'} />
          </ul>
        </div>
      </div>

      <div style={{
        ...t.cardSurface({ padding: isMobile ? 16 : 22, marginTop: isMobile ? 14 : 18 }),
        background: t.palette.cardAlt,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: t.palette.ok, flexShrink: 0 }} />
        <div style={{ fontSize: 13.5, color: t.palette.ink2, lineHeight: 1.55 }}>
          <strong style={{ fontWeight: 600 }}>{values.org}</strong> has already verified you. Click <em>Join the circle</em> to land in the network.
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  const t = React.useContext(ThemeCtx);
  return (
    <li style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: `1px solid ${t.palette.ruleSoft}`, fontSize: 13.5 }}>
      <span style={{ color: t.palette.muted, flexShrink: 0 }}>{label}</span>
      <span style={{ color: t.palette.ink, fontWeight: 500, textAlign: 'right', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
    </li>
  );
}

window.OnboardingApp = OnboardingApp;
