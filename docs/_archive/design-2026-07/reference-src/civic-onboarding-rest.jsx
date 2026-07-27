/* eslint-disable */
// BridgeCircle Civic — Onboarding Steps 3, 5, 6, 7: Career, Open to, Interests, Review

const CIVIC_HELP_TAG_OPTIONS = [
  'Pitch decks', 'Cold intros', 'Career switches', 'Hiring loops', 'Salary negotiations',
  'Design portfolio reviews', 'Eng leadership', 'Fundraising', 'Going from IC to manager',
  'Founding a company', 'Public speaking', 'Writing for the web', 'Compensation comps',
];

const CIVIC_HOBBY_OPTIONS = [
  'Cooking', 'Baking', 'Pottery', 'Open-water swimming', 'Distance running',
  'Cycling', 'Climbing', 'Letterpress printing', 'Polaroid portraits',
  'Live music', 'Long-form reading', 'Type design', 'Board games', 'Hiking',
];

const CIVIC_MOCK_CAREER = [
  { from: '2023', to: '',     role: 'Founder & Director', org: 'The Long Take Co.',  city: 'Brooklyn, NY', summary: 'Documentary studio focused on overlooked civic life.' },
  { from: '2020', to: '2023', role: 'Senior Producer',    org: 'Field Notes Media',  city: 'Brooklyn, NY', summary: 'Led a four-person team producing companion videos for WNYC and KQED.' },
  { from: '2017', to: '2020', role: 'Associate Producer', org: 'Public Counsel',     city: 'New York, NY', summary: 'Mini-docs for civil-rights nonprofits.' },
];

const CIVIC_MOCK_EDUCATION = [
  { from: '2017', to: '2019', degree: 'M.F.A., Documentary Practice', school: 'Hartwood College',    city: 'New York, NY',   honors: 'DPF Fellow' },
  { from: '2011', to: '2015', degree: 'B.A., English Literature',     school: 'University of Lagos', city: 'Lagos, Nigeria', honors: 'First-class honours' },
];

const CIVIC_OPEN_CATEGORIES = [
  { key: 'mentorship', label: 'Mentorship', sub: 'A few 30-min calls over a few weeks on a defined goal.' },
  { key: 'advice',     label: 'Advice',     sub: 'One-off questions, async or a short call. Lower commitment.' },
  { key: 'intros',     label: 'Intros',     sub: 'Connecting members in your network to other circle members.' },
  { key: 'hiring',     label: 'Hiring',     sub: 'Being open to talking about roles at your company.' },
];

function CivicOBSpinner({ color }) {
  return (
    <>
      <style>{`@keyframes cob-spin { to { transform: rotate(360deg) } }`}</style>
      <span style={{
        width: 20, height: 20, borderRadius: 999,
        border: `2px solid ${color}33`, borderTopColor: color,
        animation: 'cob-spin 0.7s linear infinite',
        display: 'inline-block', flexShrink: 0,
      }} />
    </>
  );
}

// ── Resume upload ──────────────────────────────────────────────────────────
function CivicResumeUpload({ values, set }) {
  const t = React.useContext(ThemeCtx);
  const isMobile = useCivicOBIsMobile();
  const inputRef = React.useRef(null);
  const [dragOver, setDragOver] = React.useState(false);

  const beginExtraction = fileName => {
    set({ resumeStatus: 'uploading', resumeFileName: fileName });
    setTimeout(() => {
      set({ resumeStatus: 'extracted', resumeFileName: fileName,
            career: CIVIC_MOCK_CAREER, education: CIVIC_MOCK_EDUCATION });
    }, 1800);
  };

  const onPick = e => { const f = e.target.files?.[0]; if (f) beginExtraction(f.name); };
  const onDrop = e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer?.files?.[0]; if (f) beginExtraction(f.name); };
  const reset  = () => set({ resumeStatus: 'idle', resumeFileName: '' });

  if (values.resumeStatus === 'extracted') {
    return (
      <div style={{
        ...t.cardSurface({ padding: isMobile ? 14 : 18, marginBottom: 14 }),
        background: t.palette.panel,
        display: 'flex', flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center', gap: 12,
      }}>
        <div style={{ width: 36, height: 36, borderRadius: 2, flexShrink: 0, border: `1px solid ${t.palette.ok}`, display: 'grid', placeItems: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.palette.ok} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l4 4 10-10" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>
            Extracted {CIVIC_MOCK_CAREER.length} roles · {CIVIC_MOCK_EDUCATION.length} degrees
          </div>
          <div style={{ fontSize: 12, color: t.palette.muted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            From <strong style={{ color: t.palette.ink2 }}>{values.resumeFileName}</strong> — review and edit below.
          </div>
        </div>
        <button onClick={reset} style={{
          alignSelf: isMobile ? 'stretch' : 'auto',
          background: 'transparent', border: `1px solid ${t.palette.rule}`,
          borderRadius: 2, padding: '7px 14px', cursor: 'pointer',
          fontFamily: t.font.body, fontSize: 12, fontWeight: 600, color: t.palette.muted,
          whiteSpace: 'nowrap',
        }}>Replace file</button>
      </div>
    );
  }

  if (values.resumeStatus === 'uploading') {
    return (
      <div style={{ ...t.cardSurface({ padding: 20, marginBottom: 14 }), background: t.palette.panel }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <CivicOBSpinner color={t.palette.accent} />
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>Reading {values.resumeFileName}…</div>
            <div style={{ fontSize: 12, color: t.palette.muted, marginTop: 2 }}>Extracting your roles and degrees.</div>
          </div>
        </div>
        <div style={{ marginTop: 14, height: 2, background: t.palette.rule, borderRadius: 999, overflow: 'hidden' }}>
          <style>{`@keyframes cob-slide { 0%{margin-left:-40%} 100%{margin-left:100%} }`}</style>
          <div style={{ width: '40%', height: '100%', background: t.palette.accent, animation: 'cob-slide 1.4s ease-in-out infinite' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...t.cardSurface({ padding: isMobile ? 16 : 20, marginBottom: 14 }), background: t.palette.panel }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 34, height: 34, borderRadius: 2, flexShrink: 0, border: `1px solid ${t.palette.accent}`, display: 'grid', placeItems: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.palette.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 3h11l3 3v15H5z" /><path d="M9 13h6M9 17h4M9 9h2" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700 }}>Speed this up — drop your resume or LinkedIn PDF</div>
          <div style={{ fontSize: 12, color: t.palette.muted, marginTop: 3, lineHeight: 1.5 }}>
            Upload a resume or PDF export of your LinkedIn profile and we'll pre-fill your roles and degrees. Edit anything afterwards.
          </div>
        </div>
      </div>
      <label
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 8, border: `1.5px dashed ${dragOver ? t.palette.accent : t.palette.rule}`,
          background: dragOver ? `${t.palette.accent}0d` : t.palette.card,
          borderRadius: 2, padding: '26px 20px', cursor: 'pointer',
          transition: 'border-color 120ms, background 120ms',
        }}>
        <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" onChange={onPick}
          style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} />
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={t.palette.muted} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v13M7 8l5-5 5 5" /><path d="M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
        </svg>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: t.palette.ink }}>
          Drop a file here, or <span style={{ color: t.palette.accent }}>browse</span>
        </div>
        <div style={{ fontSize: 11.5, color: t.palette.mute2 }}>PDF · DOC · DOCX · up to 10 MB</div>
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 12, fontSize: 11, color: t.palette.mute2 }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span>Your file is processed in your browser — never shared with other members.</span>
      </div>
    </div>
  );
}

// ── Step 3: Career ─────────────────────────────────────────────────────────
function CivicStepCareer({ values, set }) {
  const t = React.useContext(ThemeCtx);
  const updateRole = (i, patch) => {
    const next = values.career.slice();
    next[i] = { ...next[i], ...patch };
    set({ career: next });
  };
  const addRole    = () => set({ career: [...values.career, { from: '', to: '', role: '', org: '', city: '', summary: '' }] });
  const removeRole = i  => set({ career: values.career.filter((_, j) => j !== i) });

  return (
    <div>
      <CivicStepHeading n="02" title="A short career history."
        sub="The two or three roles that best describe what you do — and what you can help with. Leave the end year blank for your current role." />

      <CivicResumeUpload values={values} set={set} />

      {values.career.map((r, i) => (
        <CivicOBCard key={i}
          eyebrow={i === 0 ? 'Most recent role' : `Earlier role ${String(i + 1).padStart(2, '0')}`}
          action={values.career.length > 1 ? (
            <button onClick={() => removeRole(i)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: t.palette.muted, fontSize: 12, fontWeight: 500 }}>Remove</button>
          ) : null}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <CivicOBFieldRow>
              <CivicOBField label="From"><CivicOBInput value={r.from} onChange={v => updateRole(i, { from: v })} placeholder="2020" /></CivicOBField>
              <CivicOBField label="To" helper="Leave blank for current"><CivicOBInput value={r.to} onChange={v => updateRole(i, { to: v })} placeholder="2023" /></CivicOBField>
            </CivicOBFieldRow>
            <CivicOBFieldRow>
              <CivicOBField label="Role"><CivicOBInput value={r.role} onChange={v => updateRole(i, { role: v })} placeholder="Senior Producer" /></CivicOBField>
              <CivicOBField label="Company / organization"><CivicOBInput value={r.org} onChange={v => updateRole(i, { org: v })} placeholder="Field Notes Media" /></CivicOBField>
            </CivicOBFieldRow>
            <CivicOBField label="City" optional><CivicOBInput value={r.city} onChange={v => updateRole(i, { city: v })} placeholder="Brooklyn, NY" /></CivicOBField>
            <CivicOBField label="What you did there" optional helper="One or two sentences. What scope, what scale, what you learned.">
              <CivicOBTextArea value={r.summary} onChange={v => updateRole(i, { summary: v })} rows={2}
                placeholder="Led a four-person team producing public-radio companion videos for WNYC and KQED." />
            </CivicOBField>
          </div>
        </CivicOBCard>
      ))}

      <button onClick={addRole} style={{
        background: 'transparent', border: `1px dashed ${t.palette.rule}`,
        borderRadius: 2, padding: '13px 20px', cursor: 'pointer',
        color: t.palette.muted, fontFamily: t.font.body, fontSize: 13, fontWeight: 600,
        width: '100%',
      }}>+ Add another role</button>
    </div>
  );
}

// ── Step 5: Open to ────────────────────────────────────────────────────────
function CivicStepOpenTo({ values, set }) {
  const t = React.useContext(ThemeCtx);
  const isMobile = useCivicOBIsMobile();
  const setLevel = (k, v) => set({ openTo: { ...values.openTo, [k]: v } });
  const toggleTag = tag => {
    const has = values.helpTags.includes(tag);
    set({ helpTags: has ? values.helpTags.filter(x => x !== tag) : [...values.helpTags, tag] });
  };

  return (
    <div>
      <CivicStepHeading n="04" title="What you're open to."
        sub="Be honest. Members can ask for what you're open to and never for what you're not — and you can change this any time." />

      <CivicOBCard eyebrow="Open to">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {CIVIC_OPEN_CATEGORIES.map((cat, i) => (
            <div key={cat.key} style={{
              display: isMobile ? 'flex' : 'grid',
              flexDirection: isMobile ? 'column' : undefined,
              gridTemplateColumns: isMobile ? undefined : '1fr auto',
              gap: isMobile ? 10 : 16,
              alignItems: isMobile ? 'flex-start' : 'center',
              padding: '14px 0',
              borderBottom: i < CIVIC_OPEN_CATEGORIES.length - 1 ? `1px solid ${t.palette.ruleSoft}` : 'none',
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{cat.label}</div>
                <div style={{ fontSize: 12.5, color: t.palette.muted, marginTop: 2, lineHeight: 1.5 }}>{cat.sub}</div>
              </div>
              <div style={{ display: 'inline-flex', border: `1px solid ${t.palette.rule}`, borderRadius: 2, overflow: 'hidden', flexShrink: 0 }}>
                {[{ v: 'yes', l: 'Yes' }, { v: 'no', l: 'Not now' }].map((opt, j) => (
                  <button key={j} onClick={() => setLevel(cat.key, opt.v)} style={{
                    padding: '7px 14px',
                    background: values.openTo[cat.key] === opt.v ? t.palette.ink : t.palette.card,
                    color: values.openTo[cat.key] === opt.v ? t.palette.paper : t.palette.muted,
                    border: 'none',
                    borderLeft: j > 0 ? `1px solid ${t.palette.rule}` : 'none',
                    fontFamily: t.font.body, fontSize: 12.5, fontWeight: 600,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    transition: 'background 120ms, color 120ms',
                  }}>{opt.l}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CivicOBCard>

      <CivicOBCard eyebrow="And what you're good at helping with">
        <p style={{ fontSize: 13, color: t.palette.muted, margin: '0 0 14px', lineHeight: 1.55 }}>
          Pick a few. Members search by these tags when they're looking for someone — better to be specific than to claim everything.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {CIVIC_HELP_TAG_OPTIONS.map(tag => {
            const on = values.helpTags.includes(tag);
            return (
              <button key={tag} onClick={() => toggleTag(tag)} style={{
                background: on ? t.palette.ink : 'transparent',
                color: on ? t.palette.paper : t.palette.muted,
                border: `1px solid ${on ? t.palette.ink : t.palette.rule}`,
                padding: '5px 10px', borderRadius: 2,
                fontFamily: t.font.mono, fontSize: 10,
                letterSpacing: '0.10em', textTransform: 'uppercase',
                fontWeight: 500, cursor: 'pointer',
                transition: 'background 120ms, color 120ms, border-color 120ms',
              }}>{tag}</button>
            );
          })}
        </div>
      </CivicOBCard>
    </div>
  );
}

// ── Step 6: Interests ──────────────────────────────────────────────────────
function CivicStepInterests({ values, set }) {
  const t = React.useContext(ThemeCtx);

  const updateInterest = (i, v) => {
    const next = values.interests.slice();
    next[i] = v;
    set({ interests: next });
  };
  const addInterest    = () => set({ interests: [...values.interests, ''] });
  const removeInterest = i  => set({ interests: values.interests.filter((_, j) => j !== i) });
  const toggleHobby    = h  => {
    const has = values.hobbies.includes(h);
    set({ hobbies: has ? values.hobbies.filter(x => x !== h) : [...values.hobbies, h] });
  };

  return (
    <div>
      <CivicStepHeading n="05" title="What you're reading, watching, and curious about."
        sub="The conversational stuff. Useful for members who want to find people thinking about the same problems, or just looking for a coffee." />

      <CivicOBCard eyebrow="Currently interested in">
        <p style={{ fontSize: 13, color: t.palette.muted, margin: '0 0 14px', lineHeight: 1.55 }}>
          {'One short phrase per line. Quietly specific is better than broad (\u201cfederal arts funding policy\u201d > \u201cpolitics\u201d).'}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {values.interests.map((it, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 28px', gap: 10, alignItems: 'center' }}>
              <span style={{ fontFamily: t.font.mono, fontSize: 10, color: t.palette.accent, letterSpacing: '0.14em', fontWeight: 700 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <CivicOBInput value={it} onChange={v => updateInterest(i, v)} placeholder="Documentary as public memory" />
              {values.interests.length > 1 ? (
                <button onClick={() => removeInterest(i)} style={{
                  width: 28, height: 28, padding: 0,
                  background: 'transparent', border: `1px solid ${t.palette.rule}`,
                  borderRadius: 2, cursor: 'pointer', color: t.palette.muted,
                  fontSize: 14, display: 'grid', placeItems: 'center',
                }}>×</button>
              ) : <span />}
            </div>
          ))}
          <button onClick={addInterest} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: t.palette.accent, fontFamily: t.font.body, fontSize: 13, fontWeight: 600,
            padding: '4px 0', textAlign: 'left',
          }}>+ Add another</button>
        </div>
      </CivicOBCard>

      <CivicOBCard eyebrow="Outside of work">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {CIVIC_HOBBY_OPTIONS.map(h => {
            const on = values.hobbies.includes(h);
            return (
              <button key={h} onClick={() => toggleHobby(h)} style={{
                background: on ? t.palette.ink : 'transparent',
                color: on ? t.palette.paper : t.palette.muted,
                border: `1px solid ${on ? t.palette.ink : t.palette.rule}`,
                padding: '6px 12px', borderRadius: 2,
                fontFamily: t.font.body, fontSize: 12.5, fontWeight: 600,
                cursor: 'pointer', transition: 'background 120ms, color 120ms',
              }}>{h}</button>
            );
          })}
        </div>
      </CivicOBCard>

      <CivicOBCard eyebrow="Languages">
        <CivicOBField label="Languages you speak">
          <CivicOBInput value={values.languages} onChange={v => set({ languages: v })} placeholder="English, Spanish, Yoruba" />
        </CivicOBField>
      </CivicOBCard>
    </div>
  );
}

// ── Step 7: Review ─────────────────────────────────────────────────────────
function CivicStepReview({ values }) {
  const t = React.useContext(ThemeCtx);
  const isMobile = useCivicOBIsMobile();
  const initials = (values.fullName || '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?';
  const openToSummary = Object.entries(values.openTo).filter(([, v]) => v === 'yes').map(([k]) => k).join(', ') || 'None';

  return (
    <div>
      <div style={{ borderTop: `2px solid ${t.palette.ink}`, paddingTop: 10, marginBottom: 24, display: 'flex', alignItems: 'baseline', gap: 16 }}>
        <span style={{ ...t.eyebrow, color: t.palette.muted }}>Review</span>
        <h1 style={{ ...t.display, fontSize: isMobile ? 26 : 40, margin: 0 }}>Looks good?</h1>
      </div>

      {/* Profile card preview */}
      <div style={{ ...t.cardSurface({ padding: isMobile ? 16 : 24, marginBottom: 20 }), background: t.palette.panel }}>
        <span style={{ ...t.eyebrow, color: t.palette.muted, display: 'block', marginBottom: 16 }}>Profile preview</span>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <CivicAvatar name={values.fullName || 'You'} initials={initials} size={isMobile ? 52 : 64} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...t.display, fontSize: isMobile ? 20 : 26, letterSpacing: '-0.02em' }}>
              {values.fullName || <span style={{ color: t.palette.mute2, fontStyle: 'italic' }}>Your name</span>}
            </div>
            {(values.currentRole || values.currentEmployer) && (
              <div style={{ fontSize: 13.5, color: t.palette.muted, marginTop: 3 }}>
                {[values.currentRole, values.currentEmployer].filter(Boolean).join(' at ')}
              </div>
            )}
            {values.cohort && (
              <div style={{ ...t.eyebrow, color: t.palette.mute2, marginTop: 6 }}>Class of {values.cohort}</div>
            )}
            {values.city && (
              <div style={{ fontSize: 12, color: t.palette.mute2, marginTop: 3 }}>{values.city}</div>
            )}
            {values.helpTags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
                {values.helpTags.slice(0, 4).map(s => <CivicChip key={s} tone="muted">{s}</CivicChip>)}
                {values.helpTags.length > 4 && <CivicChip tone="muted">+{values.helpTags.length - 4}</CivicChip>}
              </div>
            )}
          </div>
        </div>
        {values.bio && (
          <p style={{ fontSize: 13, color: t.palette.muted, lineHeight: 1.55, margin: '14px 0 0', paddingTop: 14, borderTop: `1px solid ${t.palette.ruleSoft}` }}>
            {values.bio}
          </p>
        )}
      </div>

      {/* Data record */}
      <div style={{ ...t.cardSurface({ padding: isMobile ? 16 : 20, marginBottom: 14 }) }}>
        <span style={{ ...t.eyebrow, color: t.palette.muted, display: 'block', marginBottom: 16 }}>Your record</span>
        {[
          { n: '01', label: 'Name',      value: values.fullName || '—',  sub: values.cohort ? `Class of ${values.cohort}` : null },
          { n: '02', label: 'Location',  value: values.city    || '—' },
          { n: '03', label: 'Current',   value: [values.currentRole, values.currentEmployer].filter(Boolean).join(' at ') || '—' },
          { n: '04', label: 'Education', value: values.education[0]?.school ? `${values.education[0].degree || 'Degree'} · ${values.education[0].school}` : '—' },
          { n: '05', label: 'Career',    value: values.career.filter(r => r.role).length > 0 ? `${values.career.filter(r => r.role).length} role(s) added` : '—' },
          { n: '06', label: 'Open to',   value: openToSummary, sub: values.helpTags.length > 0 ? values.helpTags.slice(0, 3).join(', ') + (values.helpTags.length > 3 ? ` +${values.helpTags.length - 3}` : '') : null },
          { n: '07', label: 'Interests', value: values.interests.filter(Boolean).length > 0 ? `${values.interests.filter(Boolean).length} topic(s)` : '—', sub: values.hobbies.length > 0 ? values.hobbies.slice(0, 3).join(', ') : null },
        ].map((row, i, arr) => (
          <div key={row.n} style={{
            display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: 12,
            padding: '10px 0',
            borderBottom: i < arr.length - 1 ? `1px solid ${t.palette.ruleSoft}` : 'none',
            alignItems: 'baseline',
          }}>
            <span style={{ fontFamily: t.font.mono, fontSize: 10, color: t.palette.mute2, letterSpacing: '0.14em', fontWeight: 600 }}>{row.n}</span>
            <span style={{ fontSize: 13, color: t.palette.muted }}>{row.label}</span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: t.palette.ink }}>{row.value}</div>
              {row.sub && <div style={{ fontSize: 11, color: t.palette.mute2, marginTop: 2 }}>{row.sub}</div>}
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 12.5, color: t.palette.muted, margin: '16px 0 0', lineHeight: 1.55 }}>
        Everything here is visible to fellow members. You can edit any field from your profile after joining.
      </p>
    </div>
  );
}
