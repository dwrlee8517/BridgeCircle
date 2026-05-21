/* eslint-disable */
// Atrium Design System — Home Feed Blocks (§58)
// Cohort snapshot · Movements (career + location) · Network (nearby alumni)

// ─── COHORT BLOCK ─────────────────────────────────────────────────────────

function CohortBlockRender() {
  const industries = [
    { label: 'Tech',       count: 62 },
    { label: 'Finance',    count: 38 },
    { label: 'Medicine',   count: 26 },
    { label: 'Consulting', count: 20 },
    { label: 'Other',      count: 38 },
  ];
  const maxInd = Math.max(...industries.map(i => i.count));

  const cities = [
    { city: 'San Francisco', count: 42 },
    { city: 'New York',      count: 31 },
    { city: 'Los Angeles',   count: 22 },
    { city: 'Seoul',         count: 14 },
    { city: 'London',        count: 9  },
  ];

  return (
    <div style={{ maxWidth: 680 }}>
      {/* Section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
        <div>
          <DSEyebrow>Cohort</DSEyebrow>
          <h2 style={{
            fontFamily: DSF.display, fontSize: 30, fontWeight: 600,
            color: DSC.ink, margin: '6px 0 0', letterSpacing: '-0.025em', lineHeight: 1.05,
          }}>Your class right now</h2>
        </div>
        <button style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: DSF.body, fontSize: 13.5, fontWeight: 600, color: DSC.accent,
          padding: 0,
        }}>See all '17s →</button>
      </div>

      {/* Card */}
      <div style={{
        background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14,
        padding: '20px 24px',
        boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 3px rgba(42,34,26,0.06)',
      }}>
        {/* Card eyebrow row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <DSEyebrow>Class of '17 · 184 in the circle</DSEyebrow>
          <span style={{
            fontFamily: DSF.body, fontSize: 12, fontWeight: 700,
            color: DSC.ok, background: dshex(DSC.ok, 0.12),
            border: `1px solid ${dshex(DSC.ok, 0.26)}`,
            padding: '4px 12px', borderRadius: 999,
          }}>+4 this month</span>
        </div>

        <h3 style={{
          fontFamily: DSF.display, fontSize: 21, fontWeight: 600,
          color: DSC.ink, margin: '0 0 22px', letterSpacing: '-0.02em',
        }}>A picture of where you all landed.</h3>

        {/* Two-column: bars + cities */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>

          {/* Industry bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {industries.map(ind => (
              <div key={ind.label} style={{
                display: 'grid', gridTemplateColumns: '88px 1fr 28px',
                alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.ink, fontWeight: 500 }}>{ind.label}</span>
                <div style={{ background: dshex(DSC.accent, 0.14), borderRadius: 999, height: 7, overflow: 'hidden' }}>
                  <div style={{
                    background: DSC.accent, height: '100%',
                    width: `${(ind.count / maxInd) * 100}%`,
                    borderRadius: 999,
                    transition: 'width 400ms ease',
                  }} />
                </div>
                <span style={{
                  fontFamily: DSF.body, fontSize: 12.5, color: DSC.muted,
                  textAlign: 'right', fontVariantNumeric: 'tabular-nums',
                }}>{ind.count}</span>
              </div>
            ))}
          </div>

          {/* City list */}
          <div>
            {cities.map((c, i) => (
              <div key={c.city} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '7px 0',
                borderBottom: i < cities.length - 1 ? `1px solid ${DSC.ruleSoft}` : 'none',
              }}>
                <span style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.ink, fontWeight: 500 }}>{c.city}</span>
                <span style={{
                  fontFamily: DSF.body, fontSize: 13, color: DSC.muted,
                  fontVariantNumeric: 'tabular-nums',
                }}>{c.count}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── MOVEMENTS BLOCK ──────────────────────────────────────────────────────

function MovementsBlockRender() {
  const [tab, setTab] = React.useState('career');

  const careerMoves = [
    { id: 'dk', name: 'Daniel Kim',  initials: 'DK', cohort: "'16", from: 'Stripe',   to: 'Senior PM at Anthropic',  when: '2d ago', fresh: true  },
    { id: 'jl', name: 'Jane Lee',    initials: 'JL', cohort: "'14", from: 'Goldman',  to: 'VP at Bridgewater',        when: '5d ago', fresh: false },
    { id: 'at', name: 'Alex Tan',    initials: 'AT', cohort: "'19", from: null,        to: 'Started residency at UCSF',when: '1w ago', fresh: false },
  ];

  const locationMoves = [
    { id: 'rh', name: 'Rosa Hwang',   initials: 'RH', cohort: "'17", from: 'New York',  to: 'San Francisco', when: '3d ago', fresh: true  },
    { id: 'tf', name: 'Theo Fischer', initials: 'TF', cohort: "'13", from: 'London',    to: 'Brooklyn',      when: '1w ago', fresh: false },
    { id: 'ms', name: 'Mei Sato',     initials: 'MS', cohort: "'20", from: 'Chicago',   to: 'Austin',        when: '2w ago', fresh: false },
  ];

  const moves = tab === 'career' ? careerMoves : locationMoves;

  return (
    <div style={{ maxWidth: 680 }}>
      {/* Section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
        <div>
          <DSEyebrow>Movement</DSEyebrow>
          <h2 style={{
            fontFamily: DSF.display, fontSize: 30, fontWeight: 600,
            color: DSC.ink, margin: '6px 0 0', letterSpacing: '-0.025em', lineHeight: 1.05,
          }}>
            {tab === 'career' ? 'Career moves in your circle' : 'Location moves in your circle'}
          </h2>
        </div>
        <button style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: DSF.body, fontSize: 13.5, fontWeight: 600, color: DSC.accent,
          padding: 0,
        }}>View all →</button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'inline-flex', gap: 3, padding: 3,
        background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: 999,
        marginBottom: 16,
      }}>
        {[
          { id: 'career',   label: 'Career' },
          { id: 'location', label: 'Location' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: tab === t.id ? DSC.ink : 'transparent',
            color: tab === t.id ? DSC.paper : DSC.muted,
            border: 'none', padding: '6px 18px', borderRadius: 999,
            fontFamily: DSF.body, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
            transition: 'background 120ms ease, color 120ms ease',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Feed card */}
      <div style={{
        background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 3px rgba(42,34,26,0.06)',
      }}>
        {moves.map((move, i) => (
          <div key={move.id} style={{
            display: 'grid', gridTemplateColumns: 'auto 1fr auto',
            gap: 16, padding: '16px 22px',
            borderTop: i > 0 ? `1px solid ${DSC.ruleSoft}` : 'none',
            alignItems: 'center',
          }}>
            <DSAvatar name={move.name} initials={move.initials} size={44} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{
                  fontFamily: DSF.display, fontSize: 15, fontWeight: 600,
                  color: DSC.ink, letterSpacing: '-0.01em',
                }}>{move.name}</span>
                <span style={{ color: DSC.mute2, fontSize: 12 }}>·</span>
                <span style={{
                  fontFamily: DSF.mono, fontSize: 10.5, color: DSC.muted,
                  letterSpacing: '0.04em',
                }}>{move.cohort}</span>
              </div>
              <div style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.ink2, marginTop: 3, lineHeight: 1.4 }}>
                {move.from
                  ? <><span style={{ color: DSC.muted }}>{move.from}</span><span style={{ color: DSC.muted }}> → </span><strong style={{ fontWeight: 600, color: DSC.ink }}>{move.to}</strong></>
                  : <strong style={{ fontWeight: 500, color: DSC.ink2 }}>{move.to}</strong>}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              {move.fresh && (
                <span style={{ width: 7, height: 7, borderRadius: 999, background: DSC.ok, flexShrink: 0 }} />
              )}
              <span style={{
                fontFamily: DSF.body, fontSize: 12.5,
                color: move.fresh ? DSC.ink2 : DSC.muted,
                whiteSpace: 'nowrap',
              }}>{move.when}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── NETWORK BLOCK ────────────────────────────────────────────────────────

function NetworkBlockRender() {
  const nearby = [
    { id: 'ps', name: 'Priya Shah',   initials: 'PS', cohort: "'18", title: 'Software Engineer', employer: 'Stripe',   city: 'San Francisco' },
    { id: 'mo', name: 'Marcus Ong',   initials: 'MO', cohort: "'16", title: 'Strategy',          employer: 'Sequoia',  city: 'Menlo Park'    },
    { id: 'hp', name: 'Hana Park',    initials: 'HP', cohort: "'20", title: 'Research',           employer: 'OpenAI',   city: 'San Francisco' },
  ];

  return (
    <div style={{ maxWidth: 680 }}>
      {/* Section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
        <div>
          <DSEyebrow>Network</DSEyebrow>
          <h2 style={{
            fontFamily: DSF.display, fontSize: 30, fontWeight: 600,
            color: DSC.ink, margin: '6px 0 0', letterSpacing: '-0.025em', lineHeight: 1.05,
          }}>New alumni in your area</h2>
        </div>
        <button style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: DSF.body, fontSize: 13.5, fontWeight: 600, color: DSC.accent,
          padding: 0,
        }}>Open people →</button>
      </div>

      {/* 3-up grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {nearby.map(m => (
          <div key={m.id} style={{
            background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14,
            padding: '18px 20px',
            boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 3px rgba(42,34,26,0.06)',
            display: 'flex', flexDirection: 'column', gap: 0,
          }}>
            <h3 style={{
              fontFamily: DSF.display, fontSize: 16, fontWeight: 600,
              color: DSC.ink, margin: '0 0 5px', letterSpacing: '-0.01em', lineHeight: 1.2,
            }}>{m.name}</h3>
            <div style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.ink2, marginBottom: 16, lineHeight: 1.4 }}>
              {m.title} at <strong style={{ fontWeight: 600, color: DSC.ink }}>{m.employer}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto' }}>
              <span style={{
                fontFamily: DSF.body, fontSize: 11.5, fontWeight: 600,
                color: DSC.muted,
                background: dshex(DSC.muted, 0.11),
                border: `1px solid ${dshex(DSC.muted, 0.22)}`,
                padding: '3px 9px', borderRadius: 999,
              }}>{m.cohort}</span>
              <span style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.muted }}>{m.city}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SECTION ──────────────────────────────────────────────────────────────

function HomeBlocksSection() {
  return (
    <DSSection id="home-blocks" eyebrow="Components · 58" title="Home Feed Blocks">
      <p style={{
        fontFamily: DSF.body, fontSize: 13, color: DSC.muted, lineHeight: 1.6,
        maxWidth: 680, marginTop: -28, marginBottom: 32,
      }}>
        Three contextual feed blocks for the home screen. Each surfaces a different layer of the circle — your cohort snapshot, recent movements, and new alumni nearby.
      </p>

      <ComponentCard
        name="CohortBlock"
        status="stable"
        summary="Cohort snapshot — industry distribution bars + top-cities list."
        renderFn={() => <CohortBlockRender />}
        jsx={`<CohortBlock
  cohort="'17"
  total={184}
  newThisMonth={4}
  industries={[
    { label: 'Tech',       count: 62 },
    { label: 'Finance',    count: 38 },
    { label: 'Medicine',   count: 26 },
    { label: 'Consulting', count: 20 },
    { label: 'Other',      count: 38 },
  ]}
  cities={[
    { city: 'San Francisco', count: 42 },
    { city: 'New York',      count: 31 },
    { city: 'Los Angeles',   count: 22 },
  ]}
  onViewAll={() => goto('people')}
/>`}
        usage={`// On the home screen — placed below the KPI strip
<CohortBlock
  cohort={viewer.cohortShort}
  total={cohort.total}
  newThisMonth={cohort.newThisMonth}
  industries={cohort.industries}
  cities={cohort.topCities.slice(0, 5)}
  onViewAll={() => goto('cohort')}
/>

// Data is pre-aggregated server-side from the members table.
// Bars scale relative to the highest-count industry.`}
        props={[
          { prop: 'cohort',       type: 'string',     req: true, default: '—',   desc: 'Short label shown in eyebrow, e.g. "\'17"' },
          { prop: 'total',        type: 'number',     req: true, default: '—',   desc: 'Total members in the cohort' },
          { prop: 'newThisMonth', type: 'number',               default: '0',    desc: 'Delta badge — omit to hide' },
          { prop: 'industries',   type: '{ label: string, count: number }[]', req: true, default: '—', desc: 'Bar chart rows; up to 6' },
          { prop: 'cities',       type: '{ city: string, count: number }[]',  req: true, default: '—', desc: 'City list rows; up to 5' },
          { prop: 'onViewAll',    type: '() => void',            default: '—',   desc: 'Called when "See all" is clicked' },
        ]}
      />

      <ComponentCard
        name="MovementsBlock"
        status="stable"
        summary="Career and location moves feed — tabbed, sorted most-recent first."
        renderFn={() => <MovementsBlockRender />}
        jsx={`<MovementsBlock
  careerMoves={[
    { id: 'dk', name: 'Daniel Kim', initials: 'DK',
      cohort: "'16", from: 'Stripe',
      to: 'Senior PM at Anthropic', when: '2d ago', fresh: true },
  ]}
  locationMoves={[
    { id: 'rh', name: 'Rosa Hwang', initials: 'RH',
      cohort: "'17", from: 'New York',
      to: 'San Francisco', when: '3d ago', fresh: true },
  ]}
  onViewAll={() => goto('movements')}
/>`}
        usage={`// "fresh" = updated within the last 3 days — shows the green pip.
// from can be null for a first job, first city, etc.
// Limit to 3–5 items per tab; link out for the full feed.

<MovementsBlock
  careerMoves={recentCareerMoves}
  locationMoves={recentLocationMoves}
  onViewAll={() => goto('movements')}
/>

// Both tabs share the same Move type:
// { id, name, initials, cohort, from?, to, when, fresh }`}
        props={[
          { prop: 'careerMoves',   type: 'Move[]',     req: true, default: '—', desc: 'Career transition items — from role to role' },
          { prop: 'locationMoves', type: 'Move[]',     req: true, default: '—', desc: 'Location moves — from city to city' },
          { prop: 'onViewAll',     type: '() => void',            default: '—', desc: 'Link target for "View all"' },
        ]}
      />

      <ComponentCard
        name="NetworkBlock"
        status="stable"
        summary="New alumni near the viewer — 3-up compact cards."
        renderFn={() => <NetworkBlockRender />}
        jsx={`<NetworkBlock
  members={[
    { id: 'ps', name: 'Priya Shah', initials: 'PS',
      cohort: "'18", title: 'Software Engineer',
      employer: 'Stripe', city: 'San Francisco' },
    { id: 'mo', name: 'Marcus Ong', initials: 'MO',
      cohort: "'16", title: 'Strategy',
      employer: 'Sequoia', city: 'Menlo Park' },
    { id: 'hp', name: 'Hana Park', initials: 'HP',
      cohort: "'20", title: 'Research',
      employer: 'OpenAI', city: 'San Francisco' },
  ]}
  onOpenPeople={() => goto('people')}
/>`}
        usage={`// Sourced from the "near me" filter — members whose city
// matches (or neighbours) the viewer's registered city.
// Always show exactly 3 cards; add the "See more" link for overflow.

<NetworkBlock
  members={nearbyMembers.slice(0, 3)}
  onOpenPeople={() => goto('people')}
/>

// Tapping a card should navigate to the member profile.
// The block intentionally omits avatar art — name + role is enough.`}
        props={[
          { prop: 'members',      type: '{ id, name, initials, cohort, title, employer, city }[]', req: true, default: '—', desc: 'Up to 3 nearby members' },
          { prop: 'onOpenPeople', type: '() => void', default: '—', desc: 'Called when "Open people" link is clicked' },
          { prop: 'onSelect',     type: '(member) => void', default: '—', desc: 'Card tap — navigate to profile' },
        ]}
      />

    </DSSection>
  );
}

window.HomeBlocksSection = HomeBlocksSection;
