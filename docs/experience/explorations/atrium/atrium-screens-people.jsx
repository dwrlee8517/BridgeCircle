/* eslint-disable */
// Atrium — People page v2
// Sidebar filters · discovery mode · results mode

// ─── Cohort dual-range slider ──────────────────────────────────────────────
function CohortRangeSlider({ yearMin, yearMax, onChange }) {
  const t = React.useContext(ThemeCtx);
  const RANGE_MIN = 2003, RANGE_MAX = 2024;
  const pctMin = ((yearMin - RANGE_MIN) / (RANGE_MAX - RANGE_MIN)) * 100;
  const pctMax = ((yearMax - RANGE_MIN) / (RANGE_MAX - RANGE_MIN)) * 100;

  const setMin = (e) => {
    const v = Math.min(parseInt(e.target.value), yearMax - 1);
    onChange(v, yearMax);
  };
  const setMax = (e) => {
    const v = Math.max(parseInt(e.target.value), yearMin + 1);
    onChange(yearMin, v);
  };

  const thumbBase = {
    position: 'absolute', top: 0, left: 0,
    width: '100%', height: '100%',
    opacity: 0, cursor: 'pointer', margin: 0, padding: 0,
    WebkitAppearance: 'none', appearance: 'none',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontFamily: t.font.mono, fontSize: 12, fontWeight: 700, color: t.palette.ink }}>
          {'\''+String(yearMin).slice(2)}
        </span>
        <span style={{ fontFamily: t.font.mono, fontSize: 11, color: t.palette.muted }}>to</span>
        <span style={{ fontFamily: t.font.mono, fontSize: 12, fontWeight: 700, color: t.palette.ink }}>
          {'\''+String(yearMax).slice(2)}
        </span>
      </div>
      <div style={{ position: 'relative', height: 22, userSelect: 'none' }}>
        {/* Track bg */}
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 4, background: t.palette.rule, borderRadius: 999, transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        {/* Active fill */}
        <div style={{ position: 'absolute', top: '50%', left: pctMin + '%', width: (pctMax - pctMin) + '%', height: 4, background: t.palette.accent, borderRadius: 999, transform: 'translateY(-50%)', pointerEvents: 'none', transition: 'left 30ms, width 30ms' }} />
        {/* Visual thumbs */}
        <div style={{ position: 'absolute', top: '50%', left: pctMin + '%', width: 18, height: 18, background: t.palette.accent, borderRadius: 999, border: '2px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,.22)', transform: 'translate(-50%,-50%)', pointerEvents: 'none', transition: 'left 30ms' }} />
        <div style={{ position: 'absolute', top: '50%', left: pctMax + '%', width: 18, height: 18, background: t.palette.accent, borderRadius: 999, border: '2px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,.22)', transform: 'translate(-50%,-50%)', pointerEvents: 'none', transition: 'left 30ms' }} />
        {/* Inputs (transparent overlay) */}
        <input type="range" min={RANGE_MIN} max={RANGE_MAX} value={yearMin} onChange={setMin}
          style={{ ...thumbBase, zIndex: yearMin >= yearMax - 2 ? 5 : 3 }} />
        <input type="range" min={RANGE_MIN} max={RANGE_MAX} value={yearMax} onChange={setMax}
          style={{ ...thumbBase, zIndex: 4 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
        <span style={{ fontFamily: t.font.mono, fontSize: 9.5, color: t.palette.mute2 }}>'03</span>
        <span style={{ fontFamily: t.font.mono, fontSize: 9.5, color: t.palette.mute2 }}>'24</span>
      </div>
    </div>
  );
}

// ─── Filter checkbox row ───────────────────────────────────────────────────
function FilterCheckItem({ label, count, checked, onToggle }) {
  const t = React.useContext(ThemeCtx);
  return (
    <button onClick={onToggle} style={{
      display: 'flex', alignItems: 'center', gap: 9,
      padding: '5px 0', background: 'none', border: 'none',
      cursor: 'pointer', width: '100%', textAlign: 'left',
    }}>
      <span style={{
        width: 15, height: 15, borderRadius: 4, flexShrink: 0,
        background: checked ? t.palette.accent : 'transparent',
        border: '1.5px solid ' + (checked ? t.palette.accent : t.palette.rule),
        display: 'grid', placeItems: 'center',
        transition: 'background 90ms, border-color 90ms',
      }}>
        {checked && (
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3.5L3.5 6L8 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span style={{ fontFamily: t.font.body, fontSize: 12.5, color: t.palette.ink, flex: 1, lineHeight: 1.3 }}>{label}</span>
      {count != null && (
        <span style={{ fontFamily: t.font.mono, fontSize: 10, color: t.palette.mute2, flexShrink: 0 }}>{count}</span>
      )}
    </button>
  );
}

// ─── Helping-signal pill ───────────────────────────────────────────────────
function FilterSignalPill({ label, active, onToggle }) {
  const t = React.useContext(ThemeCtx);
  return (
    <button onClick={onToggle} style={{
      background: active ? t.palette.accent : t.palette.cardAlt,
      color: active ? '#fff' : t.palette.ink,
      border: '1px solid ' + (active ? t.palette.accent : t.palette.rule),
      borderRadius: 999, padding: '6px 12px',
      fontFamily: t.font.body, fontSize: 12, fontWeight: 600,
      cursor: 'pointer', whiteSpace: 'nowrap',
      transition: 'background 90ms, color 90ms, border-color 90ms',
    }}>{label}</button>
  );
}

// ─── Filter sidebar ────────────────────────────────────────────────────────
function AtriumPeopleFilters({ filters, onChange }) {
  const t = React.useContext(ThemeCtx);

  const CITIES = [
    { label: 'New York',      count: 94 },
    { label: 'San Francisco', count: 76 },
    { label: 'Los Angeles',   count: 45 },
    { label: 'Brooklyn',      count: 38 },
    { label: 'Chicago',       count: 29 },
    { label: 'London',        count: 22 },
    { label: 'Seoul',         count: 18 },
    { label: 'Austin',        count: 14 },
  ];
  const INDUSTRIES = [
    { label: 'Tech',        count: 312 },
    { label: 'Finance',     count: 198 },
    { label: 'Medicine',    count: 142 },
    { label: 'Consulting',  count: 118 },
    { label: 'Law',         count: 87  },
    { label: 'Academia',    count: 64  },
    { label: 'Creative',    count: 56  },
    { label: 'Nonprofit',   count: 43  },
  ];
  const MAJORS = [
    { label: 'Economics',         count: 224 },
    { label: 'CS / Engineering',  count: 198 },
    { label: 'Biology / Pre-med', count: 134 },
    { label: 'Political Science', count: 98  },
    { label: 'English / Lit',     count: 76  },
    { label: 'History',           count: 54  },
    { label: 'Art / Design',      count: 42  },
    { label: 'Philosophy',        count: 28  },
  ];
  const SIGNALS = ['Open to mentor', 'Open to advice', 'Looking for mentor', 'Looking for advice'];

  const toggle = (key, val) => {
    const arr = filters[key] || [];
    const next = arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
    onChange({ ...filters, [key]: next });
  };

  const hasAny = (filters.cities||[]).length || (filters.industries||[]).length || (filters.majors||[]).length || (filters.signals||[]).length || filters.cohortMin > 2003 || filters.cohortMax < 2024;

  const sectionLabel = (txt) => (
    <div style={{ fontFamily: t.font.mono, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: t.palette.muted, marginBottom: 10 }}>{txt}</div>
  );

  return (
    <aside style={{
      position: 'sticky', top: 82,
      background: t.palette.card,
      border: '1px solid ' + t.palette.rule,
      borderRadius: t.radius + 4,
      overflow: 'hidden',
      maxHeight: 'calc(100vh - 100px)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Sidebar header */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid ' + t.palette.ruleSoft, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <AtriumEyebrow>Filters</AtriumEyebrow>
        {hasAny ? (
          <button onClick={() => onChange({ cohortMin: 2003, cohortMax: 2024, cities: [], industries: [], majors: [], signals: [] })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: t.font.body, fontSize: 11.5, fontWeight: 600, color: t.palette.accent, padding: 0 }}>
            Clear all
          </button>
        ) : null}
      </div>

      {/* Scrollable body */}
      <div style={{ padding: '16px 18px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* Cohort */}
        <div>
          {sectionLabel('Cohort')}
          <CohortRangeSlider
            yearMin={filters.cohortMin} yearMax={filters.cohortMax}
            onChange={(min, max) => onChange({ ...filters, cohortMin: min, cohortMax: max })}
          />
        </div>

        {/* Helping signals */}
        <div>
          {sectionLabel('Helping signals')}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {SIGNALS.map(s => (
              <FilterSignalPill key={s} label={s} active={(filters.signals||[]).includes(s)} onToggle={() => toggle('signals', s)} />
            ))}
          </div>
        </div>

        {/* City */}
        <div>
          {sectionLabel('City')}
          {CITIES.map(c => (
            <FilterCheckItem key={c.label} label={c.label} count={c.count} checked={(filters.cities||[]).includes(c.label)} onToggle={() => toggle('cities', c.label)} />
          ))}
        </div>

        {/* Industry */}
        <div>
          {sectionLabel('Industry')}
          {INDUSTRIES.map(i => (
            <FilterCheckItem key={i.label} label={i.label} count={i.count} checked={(filters.industries||[]).includes(i.label)} onToggle={() => toggle('industries', i.label)} />
          ))}
        </div>

        {/* Major */}
        <div>
          {sectionLabel('Major')}
          {MAJORS.map(m => (
            <FilterCheckItem key={m.label} label={m.label} count={m.count} checked={(filters.majors||[]).includes(m.label)} onToggle={() => toggle('majors', m.label)} />
          ))}
        </div>

      </div>
    </aside>
  );
}

// ─── Activity spotlight ────────────────────────────────────────────────────
function AtriumPeopleActivitySpotlight() {
  const t = React.useContext(ThemeCtx);
  const sparkData = [14, 18, 12, 22, 20, 24];
  const sparkMax = Math.max(...sparkData);
  const SW = 7, SG = 3, SH = 30;

  const stats = [
    { value: '24', label: 'mentorship sessions', color: t.palette.ok,     spark: true  },
    { value: '12', label: 'advice conversations', color: t.palette.accent, spark: false },
    { value: '8',  label: 'thank-you notes sent', color: t.palette.ink,    spark: false },
    { value: "'14", label: 'most active cohort',   color: t.palette.ink2,   spark: false },
  ];

  return (
    <div style={t.cardSurface({ padding: '18px 22px' })}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <AtriumEyebrow>This month in your circle</AtriumEyebrow>
        <span style={{ fontFamily: t.font.mono, fontSize: 10, color: t.palette.muted, letterSpacing: '0.06em' }}>May 2026</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {stats.map((s, i) => (
          <div key={i}>
            <div style={{ ...t.display, fontSize: 28, fontWeight: 700, color: s.color, letterSpacing: '-0.03em', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontFamily: t.font.body, fontSize: 12, color: t.palette.muted, marginTop: 4, lineHeight: 1.4 }}>{s.label}</div>
            {s.spark && (
              <svg width={(SW + SG) * sparkData.length} height={SH} style={{ marginTop: 8, display: 'block' }}>
                {sparkData.map((v, j) => {
                  const bh = Math.round((v / sparkMax) * SH);
                  return <rect key={j} x={j * (SW + SG)} y={SH - bh} width={SW} height={bh} rx="2"
                    fill={j === sparkData.length - 1 ? t.palette.ok : hex(t.palette.ok, 0.32)} />;
                })}
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Thank-you spotlight ───────────────────────────────────────────────────
function AtriumPeopleThankYou() {
  const t = React.useContext(ThemeCtx);
  return (
    <div style={{
      ...t.cardSurface({ padding: '18px 22px' }),
      background: hex(t.palette.ok, 0.07),
      border: '1px solid ' + hex(t.palette.ok, 0.22),
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill={t.palette.ok}>
          <path d="M6 0l1.5 4.5H12L8.25 7.3l1.5 4.5L6 9l-3.75 2.8 1.5-4.5L0 4.5h4.5z" />
        </svg>
        <AtriumEyebrow>Spotlight · thank-you of the week</AtriumEyebrow>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex' }}>
          <AtriumAvatar name="Jane Lee"   initials="JL" size={34} />
          <div style={{ marginLeft: -8 }}>
            <AtriumAvatar name="Rosa Hwang" initials="RH" size={34} />
          </div>
        </div>
        <div>
          <p style={{ fontFamily: t.font.display, fontSize: 14.5, fontStyle: 'italic', color: t.palette.ink, margin: 0, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
            "Rosa connected me with two people at Bridgewater in one afternoon. I signed my offer letter last week."
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: t.font.body, fontSize: 12.5, fontWeight: 600, color: t.palette.ink }}>Jane Lee</span>
            <span style={{ fontFamily: t.font.mono, fontSize: 10, color: t.palette.muted }}>'17</span>
            <span style={{ color: t.palette.rule }}>·</span>
            <span style={{ fontFamily: t.font.body, fontSize: 12.5, color: t.palette.muted }}>thanked Rosa Hwang '12</span>
            <span style={{ color: t.palette.rule }}>·</span>
            <span style={{ fontFamily: t.font.mono, fontSize: 10, color: t.palette.mute2 }}>2d ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Match recommendation card ─────────────────────────────────────────────
function AtriumPeopleMatchCard({ member, reason, matchType }) {
  const t = React.useContext(ThemeCtx);
  const { goto, setActiveProfile } = useAtriumRoute();
  const isGive = matchType === 'mentor';
  const toneColor = isGive ? t.palette.accent : t.palette.ok;

  return (
    <button onClick={() => { setActiveProfile(member.id); goto('profile'); }} style={{
      ...t.cardSurface({ cursor: 'pointer', textAlign: 'left', overflow: 'hidden', display: 'flex', flexDirection: 'column' }),
      padding: 0,
      transition: 'transform 120ms ease',
    }}
    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
    onMouseLeave={e => e.currentTarget.style.transform = ''}>
      {/* Type badge */}
      <div style={{ padding: '8px 16px', background: hex(toneColor, 0.09), borderBottom: '1px solid ' + hex(toneColor, 0.18), display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 7, height: 7, borderRadius: 999, background: toneColor, flexShrink: 0 }} />
        <span style={{ fontFamily: t.font.mono, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: toneColor }}>
          {isGive ? 'You could mentor them' : 'They can help you'}
        </span>
      </div>
      <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Member row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AtriumAvatar name={member.name} initials={member.initials} size={42} />
          <div style={{ minWidth: 0 }}>
            <div style={{ ...t.display, fontSize: 15, fontWeight: 600 }}>{member.name}</div>
            <div style={{ fontFamily: t.font.mono, fontSize: 10, color: t.palette.muted, letterSpacing: '0.06em', marginTop: 3 }}>
              {member.title} · {member.city ? member.city.split(',')[0] : ''}
            </div>
          </div>
        </div>
        {/* Reason */}
        <p style={{ fontFamily: t.font.body, fontSize: 12.5, color: t.palette.ink2, margin: 0, lineHeight: 1.55, paddingTop: 10, borderTop: '1px solid ' + t.palette.ruleSoft }}>
          {reason}
        </p>
        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {(member.tags || []).slice(0, 3).map(tag => <AtriumTag key={tag} tone="muted">{tag}</AtriumTag>)}
        </div>
      </div>
    </button>
  );
}

// ─── One-degree-away card ──────────────────────────────────────────────────
function AtriumConnectionCard({ member, sharedWith, context }) {
  const t = React.useContext(ThemeCtx);
  const { goto, setActiveProfile } = useAtriumRoute();
  return (
    <button onClick={() => { setActiveProfile(member.id); goto('profile'); }} style={{
      ...t.cardSurface({ cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 0 }),
      padding: '16px 18px',
      transition: 'transform 120ms ease',
    }}
    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
    onMouseLeave={e => e.currentTarget.style.transform = ''}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <AtriumAvatar name={member.name} initials={member.initials} size={44} />
        <div>
          <div style={{ ...t.display, fontSize: 16, fontWeight: 600, lineHeight: 1.2 }}>{member.name}</div>
          <div style={{ fontFamily: t.font.body, fontSize: 12.5, color: t.palette.ink2, marginTop: 3 }}>
            {member.title} <span style={{ color: t.palette.muted }}>at</span> {member.employer}
          </div>
        </div>
      </div>
      {/* Mutual connection pill */}
      <div style={{ padding: '9px 12px', background: t.palette.panel, borderRadius: t.radius - 2, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex' }}>
          {sharedWith.map((s, i) => (
            <div key={i} style={{ marginLeft: i > 0 ? -7 : 0, borderRadius: 999 }}>
              <AtriumAvatar name={s.name} initials={s.initials} size={22} />
            </div>
          ))}
        </div>
        <span style={{ fontFamily: t.font.body, fontSize: 12, color: t.palette.ink2, lineHeight: 1.35 }}>
          <strong style={{ fontWeight: 600, color: t.palette.ink }}>{sharedWith.map(s => s.name.split(' ')[0]).join(' & ')}</strong>
          {' knows you both'}
        </span>
      </div>
      {context && (
        <div style={{ fontFamily: t.font.mono, fontSize: 10, color: t.palette.muted, letterSpacing: '0.06em', marginTop: 8 }}>{context}</div>
      )}
    </button>
  );
}

// ─── Discovery view (pre-search, no active filters) ────────────────────────
function AtriumPeopleDiscovery() {
  const t = React.useContext(ThemeCtx);
  const { MEMBERS } = window.BC_DATA;

  const byId = (id) => MEMBERS.find(m => m.id === id) || MEMBERS[0];

  const myMatches = [
    {
      member: byId('iris-okonkwo'),
      reason: 'Iris is navigating fundraising for her documentary studio — you raised a seed round at Topfield in 2019 and know this path well.',
      matchType: 'mentor',
    },
    {
      member: byId('dev-ramachandran'),
      reason: 'Dev leads engineering at Brevity and has navigated the PM↔Eng relationship you flagged in your profile.',
      matchType: 'learn',
    },
    {
      member: byId('matty-osei'),
      reason: 'Matty invests in climate adaptation and runs Hartwood office hours on Thursdays. Matches your note on impact-adjacent work.',
      matchType: 'learn',
    },
  ];

  const oneAway = [
    {
      member: byId('lena-park'),
      sharedWith: [{ name: 'Sam Aldridge', initials: 'SA' }],
      context: 'Both attended Spring Supper 2025',
    },
    {
      member: byId('priya-sastry'),
      sharedWith: [{ name: 'Iris Okonkwo', initials: 'IO' }, { name: 'Dev R.', initials: 'DR' }],
      context: "Iris mentioned she'd intro you at the June supper",
    },
    {
      member: byId('sam-aldridge'),
      sharedWith: [{ name: 'Matty Osei', initials: 'MO' }],
      context: "Met Matty at the Feb supper · haven't connected yet",
    },
  ];

  const sectionHeader = (title, sub, count) => (
    <div style={{ borderTop: '2px solid ' + t.palette.ink, paddingTop: 14, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <div>
        <h2 style={{ ...t.display, fontSize: 22, fontWeight: 600, margin: 0, letterSpacing: '-0.025em' }}>{title}</h2>
        {sub && <div style={{ fontFamily: t.font.body, fontSize: 13, color: t.palette.muted, marginTop: 4, lineHeight: 1.4 }}>{sub}</div>}
      </div>
      {count && <span style={{ fontFamily: t.font.mono, fontSize: 10, color: t.palette.muted, letterSpacing: '0.06em' }}>{count}</span>}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

      {/* Activity + thank-you */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 14, alignItems: 'stretch' }}>
        <AtriumPeopleActivitySpotlight />
        <AtriumPeopleThankYou />
      </div>

      {/* Your matches */}
      <section>
        {sectionHeader('Your matches', 'Based on what you want to learn and what you can offer.', myMatches.length + ' recommendations')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {myMatches.map((m, i) => <AtriumPeopleMatchCard key={i} member={m.member} reason={m.reason} matchType={m.matchType} />)}
        </div>
      </section>

      {/* One degree away */}
      <section>
        {sectionHeader('One degree away', "People who share a mutual member with you — a connection worth making.", null)}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {oneAway.map((c, i) => <AtriumConnectionCard key={i} member={c.member} sharedWith={c.sharedWith} context={c.context} />)}
        </div>
      </section>

    </div>
  );
}

// ─── View/sort control bar ─────────────────────────────────────────────────
function PeopleControlBar({ viewMode, onViewMode, sortBy, onSortBy }) {
  const t = React.useContext(ThemeCtx);
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  const SORTS = [
    { id: 'match',  label: 'Best match'      },
    { id: 'name',   label: 'Name A\u2013Z'        },
    { id: 'cohort', label: 'Cohort (newest)' },
    { id: 'recent', label: 'Recently joined' },
  ];
  const current = SORTS.find(s => s.id === sortBy) || SORTS[0];

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 10 }}>

      {/* Sort — split-button style dropdown */}
      <div ref={ref} style={{ position: 'relative' }}>
        <div style={{ display: 'inline-flex', borderRadius: 999, overflow: 'visible', border: '1px solid ' + t.palette.rule, background: t.palette.cardAlt }}>
          {/* Label half */}
          <button onClick={() => setOpen(v => !v)} style={{
            background: 'transparent', border: 'none', borderRight: '1px solid ' + t.palette.rule,
            padding: '7px 14px', fontFamily: t.font.body, fontSize: 12.5, fontWeight: 600,
            color: t.palette.ink, cursor: 'pointer', borderRadius: '999px 0 0 999px',
            whiteSpace: 'nowrap',
          }}>
            {current.label}
          </button>
          {/* Chevron half */}
          <button onClick={() => setOpen(v => !v)} style={{
            background: 'transparent', border: 'none',
            padding: '7px 12px', cursor: 'pointer', display: 'grid', placeItems: 'center',
            borderRadius: '0 999px 999px 0',
          }}>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none"
                 style={{ transition: 'transform 120ms ease-out', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              <path d="M1 1l4 4 4-4" stroke={t.palette.muted} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Dropdown menu */}
        {open && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 40,
            background: t.palette.card, border: '1px solid ' + t.palette.rule,
            borderRadius: t.radius + 2, overflow: 'hidden', minWidth: 160,
            boxShadow: '0 8px 24px rgba(42,34,26,0.12)',
          }}>
            {SORTS.map(s => (
              <button key={s.id} onClick={() => { onSortBy(s.id); setOpen(false); }} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 10, width: '100%', padding: '10px 14px',
                background: s.id === sortBy ? hex(t.palette.accent, 0.08) : 'transparent',
                color: s.id === sortBy ? t.palette.accent : t.palette.ink,
                border: 'none', borderBottom: '1px solid ' + t.palette.ruleSoft,
                fontFamily: t.font.body, fontSize: 13, fontWeight: s.id === sortBy ? 600 : 400,
                cursor: 'pointer', textAlign: 'left',
              }}>
                {s.label}
                {s.id === sortBy && (
                  <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                    <path d="M1 5l3.5 3.5L11 1" stroke={t.palette.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* View toggle */}
      <div style={{ display: 'inline-flex', gap: 2, padding: 2, background: t.palette.cardAlt, border: '1px solid ' + t.palette.rule, borderRadius: 10 }}>
        <button onClick={() => onViewMode('card')} title="Card view" style={{
          background: viewMode === 'card' ? t.palette.ink : 'transparent',
          color: viewMode === 'card' ? t.palette.paper : t.palette.muted,
          border: 'none', borderRadius: 7, width: 32, height: 32,
          display: 'grid', placeItems: 'center', cursor: 'pointer',
          transition: 'background 120ms ease-out',
        }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor">
            <rect x="0" y="0" width="5.5" height="5.5" rx="1.5" />
            <rect x="7.5" y="0" width="5.5" height="5.5" rx="1.5" />
            <rect x="0" y="7.5" width="5.5" height="5.5" rx="1.5" />
            <rect x="7.5" y="7.5" width="5.5" height="5.5" rx="1.5" />
          </svg>
        </button>
        <button onClick={() => onViewMode('list')} title="List view" style={{
          background: viewMode === 'list' ? t.palette.ink : 'transparent',
          color: viewMode === 'list' ? t.palette.paper : t.palette.muted,
          border: 'none', borderRadius: 7, width: 32, height: 32,
          display: 'grid', placeItems: 'center', cursor: 'pointer',
          transition: 'background 120ms ease-out',
        }}>
          <svg width="13" height="11" viewBox="0 0 13 11" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
            <line x1="0" y1="1.5" x2="13" y2="1.5" />
            <line x1="0" y1="5.5" x2="13" y2="5.5" />
            <line x1="0" y1="9.5" x2="13" y2="9.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── List-view member row ──────────────────────────────────────────────────
function AtriumPeopleMemberRow({ m, rationale, onClick }) {
  const t = React.useContext(ThemeCtx);
  const openMap = { mentor: { tone: 'accent', label: 'Open to mentor' }, advice: { tone: 'ok', label: 'Open to advice' }, mentee: { tone: 'muted', label: 'Looking for advice' } };
  const om = openMap[m.open] || openMap.mentee;
  return (
    <button onClick={onClick} style={{
      display: 'grid', gridTemplateColumns: 'auto 1fr auto',
      gap: 14, padding: '12px 18px',
      background: t.palette.card, border: 'none', width: '100%', textAlign: 'left',
      borderBottom: '1px solid ' + t.palette.ruleSoft,
      cursor: 'pointer', transition: 'background 80ms',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = hex(t.palette.accent, 0.05); }}
    onMouseLeave={e => { e.currentTarget.style.background = t.palette.card; }}>
      <AtriumAvatar name={m.name} initials={m.initials} size={38} />
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ ...t.display, fontSize: 14, fontWeight: 600 }}>{m.name}</span>
          <span style={{ fontFamily: t.font.mono, fontSize: 10, color: t.palette.muted, letterSpacing: '0.08em' }}>
            {"'" + String(m.year || '').slice(2) + ' \u00b7 ' + (m.city ? m.city.split(',')[0] : '')}
          </span>
          <AtriumTag tone={om.tone} dot>{om.label}</AtriumTag>
        </div>
        <div style={{ fontFamily: t.font.body, fontSize: 12.5, color: t.palette.ink2, marginTop: 2 }}>
          {m.title} <span style={{ color: t.palette.muted }}>at</span> {m.employer}
        </div>
        {rationale && (
          <div style={{ fontFamily: t.font.body, fontSize: 12, color: t.palette.muted, fontStyle: 'italic', marginTop: 3, lineHeight: 1.4 }}>{rationale}</div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center', maxWidth: 130, justifyContent: 'flex-end' }}>
        {(m.tags || []).slice(0, 2).map(tag => <AtriumTag key={tag} tone="muted">{tag}</AtriumTag>)}
      </div>
    </button>
  );
}

// ─── Results view (search active or filters applied) ───────────────────────
function AtriumPeopleResults({ ai, filters, viewMode, sortBy }) {
  const t = React.useContext(ThemeCtx);
  const { MEMBERS } = window.BC_DATA;

  const MemberCard = window.AtriumMemberCard;

  const baseSet = ai.results
    ? ai.results.map(r => MEMBERS.find(m => m.id === r.id)).filter(Boolean)
    : MEMBERS;

  const filtered = React.useMemo(() => {
    return baseSet.filter(m => {
      if (filters.cohortMin > 2003 || filters.cohortMax < 2024) {
        if (!m.year || m.year < filters.cohortMin || m.year > filters.cohortMax) return false;
      }
      if ((filters.cities||[]).length) {
        const inCity = filters.cities.some(c => m.city && m.city.toLowerCase().includes(c.toLowerCase()));
        if (!inCity) return false;
      }
      return true;
    });
  }, [baseSet, filters.cohortMin, filters.cohortMax, filters.cities]);

  const rationaleById = React.useMemo(() => {
    const map = new Map();
    if (ai.results) for (const r of ai.results) map.set(r.id, r.rationale);
    return map;
  }, [ai.results]);

  const sorted = React.useMemo(() => {
    const arr = [...filtered];
    if (sortBy === 'name')   arr.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'cohort') arr.sort((a, b) => (b.year || 0) - (a.year || 0));
    if (sortBy === 'recent') arr.sort((a, b) => {
      const wa = (a.joined || '').replace(/[^0-9]/g,'') || '999';
      const wb = (b.joined || '').replace(/[^0-9]/g,'') || '999';
      return parseInt(wa) - parseInt(wb);
    });
    return arr;
  }, [filtered, sortBy]);

  return (
    <div>
      {/* Result meta row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
        <span style={{ fontFamily: t.font.body, fontSize: 13, color: t.palette.muted }}>
          {ai.results
            ? <span>Showing <strong style={{ color: t.palette.ink, fontWeight: 600 }}>{filtered.length}</strong> AI match{filtered.length !== 1 ? 'es' : ''} for "{ai.query}"</span>
            : <span>Showing <strong style={{ color: t.palette.ink, fontWeight: 600 }}>{filtered.length}</strong> of {MEMBERS.length} members</span>}
        </span>
        {ai.results && (
          <button onClick={ai.clear} style={{ fontFamily: t.font.body, fontSize: 13, fontWeight: 600, color: t.palette.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            Clear search
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={t.cardSurface({ padding: '32px 24px', textAlign: 'center', color: t.palette.muted })}>
          No matches. Try adjusting your filters or search terms.
        </div>
      ) : viewMode === 'list' ? (
        <div style={{ border: '1px solid ' + t.palette.rule, borderRadius: t.radius + 4, overflow: 'hidden' }}>
          {sorted.map((mm, i) => (
            <AtriumPeopleMemberRow key={mm.id} m={mm} rationale={rationaleById.get(mm.id)} onClick={() => {}} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {sorted.map(mm => MemberCard
            ? <MemberCard key={mm.id} m={mm} rationale={rationaleById.get(mm.id)} />
            : null)}
        </div>
      )}
    </div>
  );
}

// ─── People page v2 ────────────────────────────────────────────────────────
function AtriumPeopleV2() {
  const t = React.useContext(ThemeCtx);
  const { MEMBERS } = window.BC_DATA;
  const m = t.isMobile;
  const ai = useAISearch(MEMBERS);
  const [viewMode, setViewMode] = React.useState('card');
  const [sortBy,   setSortBy]   = React.useState('match');

  const [filters, setFilters] = React.useState({
    cohortMin: 2003, cohortMax: 2024,
    cities: [], industries: [], majors: [], signals: [],
  });

  const hasActiveFilters =
    (filters.cities||[]).length   > 0 ||
    (filters.industries||[]).length > 0 ||
    (filters.majors||[]).length    > 0 ||
    (filters.signals||[]).length   > 0 ||
    filters.cohortMin > 2003 ||
    filters.cohortMax < 2024;

  const showResults = ai.results !== null || hasActiveFilters;
  const busy = ['reading','looking','reasoning'].includes(ai.stage);

  return (
    <section style={{
      maxWidth: 1280, margin: '0 auto', boxSizing: 'border-box',
      padding: m ? '24px 16px 56px' : '40px 32px 64px',
    }}>

      {/* Header */}
      <div style={{ marginBottom: m ? 20 : 28 }}>
        <AtriumEyebrow accent>The directory · {MEMBERS.length} members</AtriumEyebrow>
        <h1 style={{ ...t.display, fontSize: m ? 36 : 56, margin: m ? '10px 0 0' : '14px 0 0', lineHeight: 1.03 }}>
          Find your people.
        </h1>
        <p style={{ fontSize: m ? 14.5 : 16, color: t.palette.muted, marginTop: m ? 10 : 14, maxWidth: 600, lineHeight: 1.55, margin: (m ? '10px 0 0' : '14px 0 0') }}>
          Tell me what they do, where they are, or what they care about.
        </p>
      </div>

      {/* AI search bar */}
      <AtriumAISearch ai={ai} />

      {/* Two-column layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: m ? '1fr' : '240px 1fr',
        gap: m ? 16 : 28,
        marginTop: m ? 20 : 32,
        alignItems: 'flex-start',
      }}>

        {/* Filters sidebar */}
        {!m && <AtriumPeopleFilters filters={filters} onChange={setFilters} />}

        {/* Main pane */}
        <div>
          {/* Control bar — always visible above content */}
          <PeopleControlBar
            viewMode={viewMode} onViewMode={setViewMode}
            sortBy={sortBy} onSortBy={setSortBy}
          />

          {/* AI stage indicator */}
          {busy && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: t.palette.accent, display: 'inline-block', animation: 'atrium-ai-pulse 1.2s ease-in-out infinite' }} />
              <span style={{ fontFamily: t.font.body, fontSize: 13.5, color: t.palette.ink2, fontWeight: 500 }}>
                {typeof AI_STAGE_COPY !== 'undefined' ? AI_STAGE_COPY[ai.stage] : 'Searching…'}
              </span>
            </div>
          )}

          {showResults
            ? <AtriumPeopleResults ai={ai} filters={filters} viewMode={viewMode} sortBy={sortBy} />
            : <AtriumPeopleDiscovery />}
        </div>

      </div>
    </section>
  );
}

// Override the existing export from atrium-screens-home.jsx
window.AtriumPeople = AtriumPeopleV2;
