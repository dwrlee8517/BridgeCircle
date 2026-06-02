// Direction A — Editorial Index
// 2-col rich card grid. Bigger circular avatars with capacity ring,
// mutual-cohort callout, match brief as primary content, soft chips.

function DirectionA() {
  const QUERY = "Moving from consulting into product management";
  const TOPICS = [
    { label: 'All', count: 248, active: true },
    { label: 'Career transitions', count: 42 },
    { label: 'Product', count: 28 },
    { label: 'VC & Startups', count: 19 },
    { label: 'Founders', count: 23 },
    { label: 'Engineering', count: 34 },
    { label: 'Policy', count: 8 },
  ];

  return (
    <div style={{ width: '100%', minHeight: '100%', background: '#fafaf9', padding: '40px 56px 64px' }}>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <div className="kicker" style={{ marginBottom: 14 }}>People · 248 in your circle</div>
        <h1 className="display" style={{ fontSize: 44, fontWeight: 600, lineHeight: 1.1, color: '#0c0c0b', maxWidth: 820 }}>
          Find someone who's done<br/>what you're about to do.
        </h1>
        <p style={{ fontSize: 16, color: '#4d4d4a', marginTop: 12, lineHeight: 1.55, maxWidth: 620 }}>
          Search by what you're trying to figure out — your past matches, recent asks,
          and open helpers show up first.
        </p>
      </div>

      {/* ── Search ─────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: '#fff', border: '1px solid #dcdcd6', borderRadius: 14,
        padding: '14px 18px', marginBottom: 16,
        boxShadow: '0 2px 0 rgba(12,12,11,0.025), 0 12px 24px -16px rgba(12,12,11,0.08)',
      }}>
        <span style={{ color: '#0c0c0b', display: 'flex' }}>{Icon.search(20)}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 500, color: '#0c0c0b' }}>
            {QUERY}
          </div>
          <div style={{ fontSize: 12, color: '#4d4d4a', marginTop: 2, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.4 }}>
            36 people match · ranked by relevance
          </div>
        </div>
        <button className="btn btn-outline btn-sm" style={{ gap: 8 }}>
          {Icon.command(11)} <span>K</span>
        </button>
        <button className="btn btn-primary btn-md">
          Refine ask {Icon.arrow(13)}
        </button>
      </div>

      {/* ── Filter chips (counts) ──────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 28 }}>
        {TOPICS.map(t => (
          <button key={t.label} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '7px 14px', borderRadius: 999, fontSize: 12.5, fontWeight: 600,
            background: t.active ? '#0c0c0b' : '#fff',
            color: t.active ? '#fafaf9' : '#0c0c0b',
            border: `1px solid ${t.active ? '#0c0c0b' : '#dcdcd6'}`,
            transition: 'all 150ms',
          }}>
            {t.label}
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 500,
              color: t.active ? 'rgba(250,250,249,0.7)' : '#4d4d4a',
              padding: '1px 5px', background: t.active ? 'rgba(250,250,249,0.12)' : '#ebebe5',
              borderRadius: 4,
            }}>{t.count}</span>
          </button>
        ))}
        <span style={{ width: 1, alignSelf: 'stretch', background: '#dcdcd6', margin: '0 6px' }}></span>
        <button style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 999, fontSize: 12.5, fontWeight: 600,
          background: '#fff', color: '#4d4d4a', border: '1px solid #dcdcd6',
        }}>
          {Icon.filter(13)} More filters
        </button>
      </div>

      {/* ── Result meta row ────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
        <p className="mono" style={{ fontSize: 11, color: '#4d4d4a', letterSpacing: 0.6, textTransform: 'uppercase' }}>
          Showing {PEOPLE_MODERN.length} of 36 · open helpers first
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#4d4d4a' }}>
          <span>Sort:</span>
          <button style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 600, color: '#0c0c0b', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            Best match {Icon.chevron(11)}
          </button>
        </div>
      </div>

      {/* ── 2-col rich cards ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {PEOPLE_MODERN.map(p => <RichCard key={p.id} p={p} />)}
      </div>
    </div>
  );
}

function RichCard({ p }) {
  const isOpen = p.mentorOpen || p.adviceOpen;
  return (
    <div className="lift" style={{
      background: '#fff', border: '1px solid #dcdcd6', borderRadius: 14,
      padding: 22, display: 'flex', flexDirection: 'column', gap: 16,
      boxShadow: '0 1px 0 rgba(12,12,11,0.03)',
    }}>
      {/* Header: avatar + identity + match pill */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <Avatar p={p} size={64} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div className="display" style={{ fontSize: 19, fontWeight: 600, color: '#0c0c0b', lineHeight: 1.2 }}>
                {p.name}
              </div>
              <div style={{ fontSize: 13.5, color: '#0c0c0b', marginTop: 3, fontWeight: 500 }}>
                {p.role} <span style={{ color: '#4d4d4a', fontWeight: 400 }}>·</span> {p.company}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, fontSize: 12, color: '#4d4d4a' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{Icon.pin(11)} {p.city}</span>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#dcdcd6' }}></span>
                <span>{p.cohortLong}</span>
              </div>
            </div>
            <MatchPill tier={p.matchTier} score={p.matchScore} />
          </div>

          {/* Mutual / connection callout */}
          {p.mutualNote && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10,
              fontSize: 11.5, color: '#4d4d4a',
            }}>
              <span style={{ display: 'inline-flex', marginLeft: 0 }}>
                <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#dcdcd6', border: '2px solid #fff', display: 'inline-block' }}></span>
                <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#c0c0b8', border: '2px solid #fff', display: 'inline-block', marginLeft: -6 }}></span>
                <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#a3a39c', border: '2px solid #fff', display: 'inline-block', marginLeft: -6 }}></span>
              </span>
              <span style={{ fontWeight: 500, color: '#0c0c0b' }}>{p.mutual}</span>
              <span>· {p.mutualNote}</span>
            </div>
          )}
        </div>
      </div>

      {/* Match brief — italic, no kicker, with leading sapphire dot */}
      {p.rationale && (
        <div style={{
          background: '#fafaf9', border: '1px solid #ebebe5', borderLeft: '3px solid #2563eb',
          padding: '12px 14px', borderRadius: '0 8px 8px 0',
        }}>
          <p style={{
            fontFamily: "'Inter', sans-serif", fontStyle: 'italic',
            fontSize: 13.5, lineHeight: 1.55, color: '#0c0c0b',
          }}>
            "{p.rationale}"
          </p>
        </div>
      )}

      {/* Topics with match-hit highlighting */}
      {p.topics.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {p.topics.map((t, i) => (
            <span key={t} className={`topic ${i === 0 && p.matchTier === 'strong' ? 'match-hit' : ''}`}>{t}</span>
          ))}
        </div>
      )}

      {/* Capacity + status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingTop: 14, borderTop: '1px solid #ebebe5' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
          <StatusBits p={p} />
          {p.mentorOpen && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: '#4d4d4a' }}>
              <CapacityBar p={p} w={70} />
              {p.responseDays != null && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  {Icon.clock(11)} replies in ~{p.responseDays}d
                </span>
              )}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button className="btn btn-ghost btn-sm">View</button>
          {isOpen ? (
            <button className="btn btn-cta btn-sm">Ask for help {Icon.arrow(12)}</button>
          ) : (
            <button className="btn btn-outline btn-sm">Not open</button>
          )}
        </div>
      </div>
    </div>
  );
}

window.DirectionA = DirectionA;
