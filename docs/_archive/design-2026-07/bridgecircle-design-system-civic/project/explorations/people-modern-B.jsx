// Direction B — Profile Strip
// LinkedIn-density horizontal rows. Left filter rail. Each row is a
// data-rich strip with avatar, identity, match, topics, stats, actions.

function DirectionB() {
  return (
    <div style={{ width: '100%', minHeight: '100%', background: '#fafaf9' }}>
      {/* ── Hero band ──────────────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0)),
                     radial-gradient(circle at 80% 0%, rgba(37,99,235,0.06), transparent 38%),
                     #fafaf9`,
        borderBottom: '1px solid #dcdcd6', padding: '40px 56px 32px',
      }}>
        <div className="kicker" style={{ marginBottom: 12 }}>Search · People</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 32, flexWrap: 'wrap' }}>
          <div>
            <h1 className="display" style={{ fontSize: 38, fontWeight: 600, lineHeight: 1.12, color: '#0c0c0b' }}>
              "Moving from consulting into product management"
            </h1>
            <p style={{ fontSize: 14, color: '#4d4d4a', marginTop: 8, lineHeight: 1.5 }}>
              <strong style={{ color: '#0c0c0b', fontWeight: 600 }}>36 people</strong> in your circle can help with this
              <span style={{ margin: '0 8px', color: '#dcdcd6' }}>·</span>
              <strong style={{ color: '#3b6e51', fontWeight: 600 }}>12 open right now</strong>
            </p>
          </div>
          <SearchBarLarge />
        </div>
      </div>

      {/* ── Two-col layout: filter rail + results ─────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 32, padding: '28px 56px 64px' }}>
        <FilterRail />
        <div>
          {/* Top toolbar */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            paddingBottom: 14, marginBottom: 14, borderBottom: '1px solid #dcdcd6',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="mono" style={{ fontSize: 11, color: '#4d4d4a', letterSpacing: 0.6, textTransform: 'uppercase' }}>
                {PEOPLE_MODERN.length} of 36 results
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: 'rgba(37,99,235,0.08)', color: '#2563eb', border: '1px solid rgba(37,99,235,0.18)' }}>
                {Icon.sparkle(11)} AI ranked
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button className="btn btn-ghost btn-sm">Sort: Best match {Icon.chevron(11)}</button>
              <div style={{ width: 1, height: 18, background: '#dcdcd6' }}></div>
              <div style={{ display: 'flex', gap: 2, background: '#f4f3ee', borderRadius: 8, padding: 3 }}>
                <button style={tabBtn(true)}>List</button>
                <button style={tabBtn(false)}>Cards</button>
                <button style={tabBtn(false)}>Map</button>
              </div>
            </div>
          </div>

          {/* Strip rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PEOPLE_MODERN.map((p, i) => <StripRow key={p.id} p={p} featured={i === 0} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

const tabBtn = (active) => ({
  border: 'none', background: active ? '#fff' : 'transparent',
  color: active ? '#0c0c0b' : '#4d4d4a', fontWeight: 600, fontSize: 12,
  padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
  boxShadow: active ? '0 1px 3px rgba(12,12,11,0.08)' : 'none',
});

function SearchBarLarge() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: '#fff', border: '1px solid #dcdcd6', borderRadius: 999,
      padding: '8px 8px 8px 18px', minWidth: 380,
      boxShadow: '0 1px 0 rgba(12,12,11,0.03)',
    }}>
      <span style={{ color: '#4d4d4a', display: 'flex' }}>{Icon.search(15)}</span>
      <input type="text" placeholder="Search the network…" style={{
        flex: 1, border: 'none', outline: 'none', fontSize: 13.5, color: '#0c0c0b',
        background: 'transparent', minWidth: 140,
      }} />
      <button className="btn btn-primary btn-sm" style={{ borderRadius: 999, height: 32, padding: '0 14px' }}>
        Search
      </button>
    </div>
  );
}

function FilterRail() {
  const SECTIONS = [
    { title: 'Status', items: [
      { label: 'Open as mentor', count: 18, dot: '#3b6e51' },
      { label: 'Open for advice', count: 27, dot: '#3b6e51' },
      { label: 'Friends only', count: 8, dot: '#2563eb' },
      { label: 'Include paused', count: null, muted: true },
    ]},
    { title: 'Topic', items: [
      { label: 'Career transitions', count: 42, active: true },
      { label: 'Product management', count: 28 },
      { label: 'VC & Startups', count: 19 },
      { label: 'Founders', count: 23 },
      { label: 'Engineering leadership', count: 17 },
    ]},
    { title: 'Cohort', items: [
      { label: "Cornell '16–'18", count: 64 },
      { label: "Cornell '19–'21", count: 92 },
      { label: "Cornell '22–'24", count: 73 },
    ]},
    { title: 'Location', items: [
      { label: 'New York', count: 86 },
      { label: 'San Francisco', count: 51 },
      { label: 'Seattle', count: 22 },
      { label: 'International', count: 38 },
    ]},
  ];

  return (
    <aside style={{ position: 'sticky', top: 24, height: 'fit-content' }}>
      <div style={{
        background: '#fff', border: '1px solid #dcdcd6', borderRadius: 12,
        padding: 20, display: 'flex', flexDirection: 'column', gap: 22,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="display" style={{ fontSize: 15, fontWeight: 600 }}>Filters</span>
          <button style={{ background: 'none', border: 'none', fontSize: 11.5, color: '#2563eb', fontWeight: 600 }}>Clear all</button>
        </div>

        {SECTIONS.map(sec => (
          <div key={sec.title}>
            <div className="mono" style={{
              fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
              textTransform: 'uppercase', color: '#4d4d4a', marginBottom: 10,
            }}>{sec.title}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {sec.items.map(it => (
                <button key={it.label} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '7px 10px', borderRadius: 8, border: 'none',
                  background: it.active ? 'rgba(37,99,235,0.08)' : 'transparent',
                  color: it.active ? '#2563eb' : it.muted ? '#4d4d4a' : '#0c0c0b',
                  fontSize: 12.5, fontWeight: it.active ? 600 : 500,
                  textAlign: 'left', cursor: 'pointer',
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    {it.dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: it.dot }}></span>}
                    {it.label}
                  </span>
                  {it.count != null && (
                    <span className="mono" style={{ fontSize: 10.5, color: '#4d4d4a' }}>{it.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        <button className="btn btn-outline btn-sm" style={{ width: '100%' }}>
          Save this search
        </button>
      </div>
    </aside>
  );
}

function StripRow({ p, featured }) {
  const isOpen = p.mentorOpen || p.adviceOpen;
  return (
    <div className="lift" style={{
      display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 20,
      alignItems: 'center', padding: '18px 22px',
      background: '#fff', border: '1px solid #dcdcd6', borderRadius: 12,
      boxShadow: '0 1px 0 rgba(12,12,11,0.03)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Featured indicator stripe */}
      {featured && (
        <div style={{
          position: 'absolute', top: 0, bottom: 0, left: 0, width: 3,
          background: 'linear-gradient(180deg, #2563eb, #3b6e51)',
        }}></div>
      )}

      {/* Avatar */}
      <Avatar p={p} size={72} />

      {/* Identity column */}
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span className="display" style={{ fontSize: 18, fontWeight: 600, color: '#0c0c0b' }}>{p.name}</span>
            <MatchPill tier={p.matchTier} score={p.matchScore} />
            {p.isFriend && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#2563eb', padding: '2px 8px', borderRadius: 999, background: 'rgba(37,99,235,0.10)', border: '1px solid rgba(37,99,235,0.22)' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#2563eb' }}></span>
                Friend
              </span>
            )}
          </div>
          <div style={{ fontSize: 13.5, color: '#0c0c0b', marginTop: 3, fontWeight: 500 }}>
            {p.role} <span style={{ color: '#dcdcd6', margin: '0 4px' }}>·</span> {p.company}
            <span style={{ color: '#4d4d4a', fontWeight: 400, marginLeft: 10 }}>
              {p.city} · {p.cohortLong}
            </span>
          </div>
        </div>

        {/* Match rationale — single line inline */}
        {p.rationale && (
          <p style={{
            fontStyle: 'italic', fontSize: 13, color: '#0c0c0b', lineHeight: 1.5,
            display: 'flex', alignItems: 'flex-start', gap: 8, maxWidth: 720,
          }}>
            <span style={{ color: '#2563eb', flexShrink: 0, marginTop: 2 }}>{Icon.quote(14)}</span>
            <span>{p.rationale}</span>
          </p>
        )}

        {/* Bottom meta row: topics + stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {p.topics.slice(0, 3).map(t => <span key={t} className="topic">{t}</span>)}
          <span style={{ width: 1, height: 14, background: '#dcdcd6' }}></span>
          <span style={{ fontSize: 11.5, color: '#4d4d4a', display: 'inline-flex', alignItems: 'center', gap: 12 }}>
            <span>
              <strong style={{ color: '#0c0c0b', fontWeight: 600 }}>{p.helped}</strong> helped
            </span>
            <span>
              <strong style={{ color: '#0c0c0b', fontWeight: 600 }}>{p.replyRate}%</strong> reply rate
            </span>
            {p.mutual && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#dcdcd6' }}></span>
                {p.mutual}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Right column: status, capacity, actions */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, minWidth: 180 }}>
        <StatusBits p={p} compact />
        {p.mentorOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <span className="mono" style={{ fontSize: 10, color: '#4d4d4a', letterSpacing: 0.4, textTransform: 'uppercase' }}>
              Capacity
            </span>
            <CapacityBar p={p} w={88} />
          </div>
        )}
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          <button className="btn btn-outline btn-sm">View</button>
          {isOpen ? (
            <button className="btn btn-cta btn-sm">Ask {p.name.split(' ')[0]}</button>
          ) : (
            <button className="btn btn-ghost btn-sm" style={{ color: '#4d4d4a' }}>Not open</button>
          )}
        </div>
      </div>
    </div>
  );
}

window.DirectionB = DirectionB;
window.StripRow = StripRow;
window.FilterRail = FilterRail;
window.SearchBarLarge = SearchBarLarge;
window.tabBtn = tabBtn;
