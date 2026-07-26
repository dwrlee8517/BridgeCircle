// Direction B — Variations
// Four alternate row treatments for the Profile Strip pattern.
// Each artboard ships a compact hero + filter chip row + 6-person list.

// ─── Compact shared hero ────────────────────────────────────────────────
function BHero({ chips }) {
  const TOPICS = chips || [
    { label: 'All', count: 36, active: true },
    { label: 'Career transitions', count: 12 },
    { label: 'Open now', count: 18, accent: '#3b6e51' },
    { label: 'Same cohort', count: 5 },
    { label: 'Friends', count: 3, accent: '#2563eb' },
  ];
  return (
    <div style={{ background: '#fafaf9', borderBottom: '1px solid #dcdcd6', padding: '28px 40px 22px' }}>
      <div className="kicker" style={{ marginBottom: 10 }}>Search · People · 36 results</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
        <h1 className="display" style={{ fontSize: 28, fontWeight: 600, lineHeight: 1.15, color: '#0c0c0b', maxWidth: 760 }}>
          "Moving from consulting into product management"
        </h1>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#fff', border: '1px solid #dcdcd6', borderRadius: 999,
          padding: '6px 6px 6px 14px', minWidth: 260,
        }}>
          <span style={{ color: '#4d4d4a', display: 'flex' }}>{Icon.search(13)}</span>
          <input type="text" placeholder="Refine…" style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12.5, background: 'transparent' }} />
          <button className="btn btn-primary btn-sm" style={{ borderRadius: 999, height: 28, padding: '0 12px', fontSize: 11.5 }}>Search</button>
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
        {TOPICS.map(t => (
          <button key={t.label} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '5px 11px', borderRadius: 999, fontSize: 11.5, fontWeight: 600,
            background: t.active ? '#0c0c0b' : '#fff',
            color: t.active ? '#fafaf9' : (t.accent || '#0c0c0b'),
            border: `1px solid ${t.active ? '#0c0c0b' : (t.accent ? `${t.accent}44` : '#dcdcd6')}`,
          }}>
            {t.accent && !t.active && <span style={{ width: 5, height: 5, borderRadius: '50%', background: t.accent }}></span>}
            {t.label}
            <span className="mono" style={{ fontSize: 10, color: t.active ? 'rgba(250,250,249,0.65)' : '#4d4d4a' }}>{t.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  B2 — Activity-Forward
// ═══════════════════════════════════════════════════════════════════════
const ACTIVITY = {
  p1: { line: 'Helped Jordan break into VC after consulting', when: '2d ago', kind: 'helped' },
  p2: { line: 'Answered "First fundraise — how to think about the round"', when: 'Yesterday', kind: 'answered' },
  p3: { line: 'Started mentoring Priya through her founder pivot', when: '4d ago', kind: 'mentor' },
  p4: { line: 'Posted: "5 things I wish I knew as an EM at Google"', when: '1w ago', kind: 'posted' },
  p5: { line: 'Currently paused · returning June 1', when: '—', kind: 'paused' },
  p6: { line: 'Joined the Tech Policy circle', when: '3w ago', kind: 'joined' },
};
const KIND_COLOR = { helped: '#3b6e51', answered: '#2563eb', mentor: '#3b6e51', posted: '#722f37', paused: '#a16207', joined: '#4d4d4a' };

function DirectionB2() {
  return (
    <div style={{ width: '100%', minHeight: '100%', background: '#fafaf9' }}>
      <BHero />
      <div style={{ padding: '24px 40px 48px' }}>
        <BToolbar label="B2 · Activity-Forward — row leads with recent behavior, not match rationale" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PEOPLE_MODERN.map(p => <ActivityRow key={p.id} p={p} activity={ACTIVITY[p.id]} />)}
        </div>
      </div>
    </div>
  );
}

function ActivityRow({ p, activity }) {
  const isOpen = p.mentorOpen || p.adviceOpen;
  const dotColor = KIND_COLOR[activity.kind] || '#4d4d4a';
  return (
    <div className="lift" style={{
      display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 20,
      alignItems: 'center', padding: '16px 22px',
      background: '#fff', border: '1px solid #dcdcd6', borderRadius: 12,
    }}>
      <Avatar p={p} size={64} />
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span className="display" style={{ fontSize: 17, fontWeight: 600 }}>{p.name}</span>
          <span style={{ fontSize: 12.5, color: '#4d4d4a' }}>
            {p.role} · {p.company} · {p.cohortLong}
          </span>
          <MatchPill tier={p.matchTier} score={p.matchScore} />
        </div>

        {/* Activity line — the hero of the row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 12px', borderRadius: 8,
          background: '#fafaf9', border: '1px solid #ebebe5',
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 22, height: 22, borderRadius: 6, flexShrink: 0,
            background: `${dotColor}1A`, color: dotColor,
          }}>
            <ActivityIcon kind={activity.kind} />
          </span>
          <span style={{ fontSize: 13, color: '#0c0c0b', flex: 1, minWidth: 0 }}>
            <span style={{ fontWeight: 600, color: dotColor, textTransform: 'uppercase', letterSpacing: 0.6, fontSize: 10.5, fontFamily: "'JetBrains Mono', monospace", marginRight: 8 }}>
              {activity.kind}
            </span>
            {activity.line}
          </span>
          <span className="mono" style={{ fontSize: 10.5, color: '#4d4d4a', flexShrink: 0 }}>
            {activity.when}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11.5, color: '#4d4d4a', flexWrap: 'wrap' }}>
          {p.topics.slice(0, 3).map(t => <span key={t} className="topic">{t}</span>)}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
        <StatusBits p={p} compact />
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-outline btn-sm">View</button>
          {isOpen
            ? <button className="btn btn-cta btn-sm">Ask {p.name.split(' ')[0]}</button>
            : <button className="btn btn-ghost btn-sm">Not open</button>
          }
        </div>
      </div>
    </div>
  );
}

function ActivityIcon({ kind }) {
  const paths = {
    helped: 'M20 6 9 17l-5-5', // check
    answered: 'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z',
    mentor: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    posted: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
    paused: 'M6 4h4v16H6zM14 4h4v16h-4z',
    joined: 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM20 8v6M23 11h-6',
  };
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[kind] || paths.helped}></path>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  B3 — Stats-Forward (reliability view)
// ═══════════════════════════════════════════════════════════════════════
function DirectionB3() {
  return (
    <div style={{ width: '100%', minHeight: '100%', background: '#fafaf9' }}>
      <BHero />
      <div style={{ padding: '24px 40px 48px' }}>
        <BToolbar label="B3 · Stats-Forward — sort by reliability, not topical fit" sort="Most reliable" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PEOPLE_MODERN.map(p => <StatsRow key={p.id} p={p} />)}
        </div>
      </div>
    </div>
  );
}

function StatsRow({ p }) {
  const isOpen = p.mentorOpen || p.adviceOpen;
  return (
    <div className="lift" style={{
      display: 'grid', gridTemplateColumns: 'auto 1.2fr 2fr auto auto', gap: 24,
      alignItems: 'center', padding: '18px 22px',
      background: '#fff', border: '1px solid #dcdcd6', borderRadius: 12,
    }}>
      <Avatar p={p} size={56} />

      <div style={{ minWidth: 0 }}>
        <div className="display" style={{ fontSize: 16, fontWeight: 600 }}>{p.name}</div>
        <div style={{ fontSize: 12.5, color: '#4d4d4a', marginTop: 3 }}>{p.role}</div>
        <div style={{ fontSize: 11.5, color: '#4d4d4a', marginTop: 2 }}>{p.company} · {p.city}</div>
        <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
          {p.topics.slice(0, 2).map(t => <span key={t} className="topic" style={{ fontSize: 10.5, padding: '2px 7px' }}>{t}</span>)}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <StatCell label="Reply rate" value={`${p.replyRate}%`} good={p.replyRate >= 85} />
        <StatCell label="Avg reply" value={p.responseDays != null ? `${p.responseDays}d` : '—'} good={p.responseDays != null && p.responseDays <= 3} />
        <StatCell label="People helped" value={p.helped} good={p.helped >= 15} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, minWidth: 110 }}>
        <MatchPill tier={p.matchTier} score={p.matchScore} />
        {p.mentorOpen && <CapacityBar p={p} w={90} />}
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        {isOpen
          ? <button className="btn btn-cta btn-sm">Ask</button>
          : <button className="btn btn-outline btn-sm">View</button>
        }
      </div>
    </div>
  );
}

function StatCell({ label, value, good }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: 9.5, color: '#4d4d4a', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>
        {label}
      </div>
      <div className="display" style={{
        fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em',
        color: good ? '#3b6e51' : '#0c0c0b', lineHeight: 1,
      }}>
        {value}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  B4 — Hairline Index (editorial directory)
// ═══════════════════════════════════════════════════════════════════════
function DirectionB4() {
  return (
    <div style={{ width: '100%', minHeight: '100%', background: '#fafaf9' }}>
      <BHero />
      <div style={{ padding: '24px 40px 48px' }}>
        <BToolbar label="B4 · Hairline Index — directory density, no card chrome" />

        {/* Column header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '48px 1.6fr 1.4fr 130px 110px 80px', gap: 18,
          padding: '10px 20px', borderTop: '1.5px solid #0c0c0b', borderBottom: '1px solid #dcdcd6',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 700,
          letterSpacing: 0.8, textTransform: 'uppercase', color: '#4d4d4a',
        }}>
          <span></span>
          <span>Member</span>
          <span>Helps with</span>
          <span>Status</span>
          <span style={{ textAlign: 'right' }}>Match</span>
          <span></span>
        </div>

        <div>
          {PEOPLE_MODERN.map(p => <HairlineRow key={p.id} p={p} />)}
        </div>

        {/* Expanded preview row */}
        <div style={{ marginTop: 28, padding: 18, background: '#fff', border: '1px solid #2563eb', borderRadius: 10, boxShadow: '0 8px 20px -10px rgba(37,99,235,0.18)' }}>
          <div className="mono" style={{ fontSize: 9.5, color: '#2563eb', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
            ▾ Expanded preview · hover state
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontStyle: 'italic', fontSize: 14, lineHeight: 1.5, color: '#0c0c0b', maxWidth: 640 }}>
                "{PEOPLE_MODERN[0].rationale}"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 12, fontSize: 11.5, color: '#4d4d4a' }}>
                <span><strong style={{ color: '#0c0c0b', fontWeight: 600 }}>{PEOPLE_MODERN[0].helped}</strong> helped</span>
                <span><strong style={{ color: '#0c0c0b', fontWeight: 600 }}>{PEOPLE_MODERN[0].replyRate}%</strong> reply rate</span>
                <span>typically replies in ~{PEOPLE_MODERN[0].responseDays} days</span>
                <span>{PEOPLE_MODERN[0].mutual}</span>
              </div>
            </div>
            <button className="btn btn-cta btn-md">Ask Jamie {Icon.arrow(13)}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HairlineRow({ p }) {
  const isOpen = p.mentorOpen || p.adviceOpen;
  const statusLabel = p.mentorOpen ? 'Open as mentor' : p.adviceOpen ? 'Open for advice' : p.paused ? 'Paused' : 'Closed';
  const statusColor = p.mentorOpen || p.adviceOpen ? '#3b6e51' : p.paused ? '#a16207' : '#4d4d4a';
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '48px 1.6fr 1.4fr 130px 110px 80px', gap: 18,
      padding: '14px 20px', borderBottom: '1px solid #ebebe5', alignItems: 'center',
      transition: 'background 150ms',
      cursor: 'pointer',
    }} onMouseEnter={e => e.currentTarget.style.background = '#fafaf9'}
       onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <Avatar p={p} size={40} ring={false} />
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span className="display" style={{ fontSize: 14.5, fontWeight: 600 }}>{p.name}</span>
          <span className="mono" style={{ fontSize: 10, color: '#4d4d4a' }}>{p.cohort}</span>
        </div>
        <div style={{ fontSize: 11.5, color: '#4d4d4a', marginTop: 2 }}>{p.role} · {p.company}</div>
      </div>
      <div style={{ fontSize: 12, color: '#0c0c0b', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {p.topics.slice(0, 2).map(t => <span key={t} style={{ color: '#4d4d4a' }}>{t}{t !== p.topics[1] && p.topics.length > 1 ? ',' : ''}</span>)}
        {p.topics.length > 2 && <span style={{ color: '#4d4d4a' }}>+{p.topics.length - 2}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: statusColor, fontWeight: 600 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor }}></span>
        {statusLabel}
      </div>
      <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
        {p.matchScore != null ? (
          <>
            <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: p.matchTier === 'strong' ? '#3b6e51' : p.matchTier === 'good' ? '#2563eb' : '#4d4d4a' }}>
              {p.matchScore}
            </span>
            <span style={{ width: 32, height: 4, background: '#ebebe5', borderRadius: 2, overflow: 'hidden' }}>
              <span style={{ display: 'block', height: '100%', width: `${p.matchScore}%`, background: p.matchTier === 'strong' ? '#3b6e51' : p.matchTier === 'good' ? '#2563eb' : '#dcdcd6' }}></span>
            </span>
          </>
        ) : <span style={{ color: '#dcdcd6' }}>—</span>}
      </div>
      <div style={{ textAlign: 'right' }}>
        {isOpen
          ? <button className="btn btn-cta btn-sm" style={{ height: 28, padding: '0 10px', fontSize: 11.5 }}>Ask</button>
          : <button className="btn btn-ghost btn-sm" style={{ height: 28, padding: '0 10px', fontSize: 11.5 }}>View</button>
        }
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  B5 — Topic-Tinted Rows (taxonomic rhythm)
// ═══════════════════════════════════════════════════════════════════════
const TOPIC_TINT = {
  'Career transitions':     { color: '#a16207', label: 'Career' },
  'Product management':     { color: '#2563eb', label: 'Product' },
  'Tech recruiting':        { color: '#2563eb', label: 'Product' },
  'VC & Startups':          { color: '#722f37', label: 'VC' },
  'Fundraising':            { color: '#722f37', label: 'VC' },
  'Pitch decks':            { color: '#722f37', label: 'VC' },
  'Entrepreneurship':       { color: '#3b6e51', label: 'Founders' },
  'Health tech':            { color: '#3b6e51', label: 'Founders' },
  'Early-stage':            { color: '#3b6e51', label: 'Founders' },
  'Engineering leadership': { color: '#0c0c0b', label: 'Engineering' },
  'Big tech career paths':  { color: '#0c0c0b', label: 'Engineering' },
  'Policy':                 { color: '#a16207', label: 'Policy' },
  'Government':             { color: '#a16207', label: 'Policy' },
  'Tech regulation':        { color: '#a16207', label: 'Policy' },
  'Strategy':               { color: '#4d4d4a', label: 'Strategy' },
  'Music & media':          { color: '#4d4d4a', label: 'Strategy' },
  'International':          { color: '#4d4d4a', label: 'Strategy' },
};

function primaryTopic(p) {
  for (const t of p.topics) if (TOPIC_TINT[t]) return TOPIC_TINT[t];
  return { color: '#4d4d4a', label: 'General' };
}

function DirectionB5() {
  return (
    <div style={{ width: '100%', minHeight: '100%', background: '#fafaf9' }}>
      <BHero />
      <div style={{ padding: '24px 40px 48px' }}>
        <BToolbar label="B5 · Topic-Tinted — left-edge color stripes scan rows by subject" />

        {/* Legend */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 14, padding: '8px 14px', background: '#fff', border: '1px solid #ebebe5', borderRadius: 8 }}>
          <span className="mono" style={{ fontSize: 9.5, color: '#4d4d4a', letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: 700 }}>Legend</span>
          {[
            ['Product', '#2563eb'], ['Founders', '#3b6e51'], ['VC', '#722f37'],
            ['Career', '#a16207'], ['Engineering', '#0c0c0b'], ['Policy', '#a16207'],
          ].map(([label, color]) => (
            <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4d4d4a' }}>
              <span style={{ width: 10, height: 3, background: color, borderRadius: 2 }}></span>
              {label}
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PEOPLE_MODERN.map(p => <TintedRow key={p.id} p={p} />)}
        </div>
      </div>
    </div>
  );
}

function TintedRow({ p }) {
  const isOpen = p.mentorOpen || p.adviceOpen;
  const topic = primaryTopic(p);
  return (
    <div className="lift" style={{
      display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 20,
      alignItems: 'center', padding: '18px 22px 18px 26px',
      background: `linear-gradient(90deg, ${topic.color}06 0%, #fff 280px)`,
      border: '1px solid #dcdcd6', borderLeft: `4px solid ${topic.color}`,
      borderRadius: 12,
      position: 'relative',
    }}>
      <Avatar p={p} size={64} />
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '2px 8px', borderRadius: 4,
              fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 700,
              letterSpacing: 0.8, textTransform: 'uppercase',
              background: `${topic.color}14`, color: topic.color, border: `1px solid ${topic.color}33`,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: topic.color }}></span>
              {topic.label}
            </span>
            <MatchPill tier={p.matchTier} score={p.matchScore} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span className="display" style={{ fontSize: 18, fontWeight: 600 }}>{p.name}</span>
            <span style={{ fontSize: 13, color: '#0c0c0b', fontWeight: 500 }}>
              {p.role} · {p.company}
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: '#4d4d4a', marginTop: 3 }}>
            {p.city} · {p.cohortLong} · {p.mutual}
          </div>
        </div>

        {p.rationale && (
          <p style={{
            fontStyle: 'italic', fontSize: 12.5, color: '#0c0c0b', lineHeight: 1.5,
            maxWidth: 680,
          }}>
            "{p.rationale}"
          </p>
        )}

        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {p.topics.slice(0, 3).map(t => <span key={t} className="topic">{t}</span>)}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, minWidth: 160 }}>
        <StatusBits p={p} compact />
        {p.mentorOpen && <CapacityBar p={p} w={88} />}
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-outline btn-sm">View</button>
          {isOpen
            ? <button className="btn btn-cta btn-sm">Ask {p.name.split(' ')[0]}</button>
            : <button className="btn btn-ghost btn-sm">Not open</button>
          }
        </div>
      </div>
    </div>
  );
}

// ─── Shared toolbar between hero & list ────────────────────────────────
function BToolbar({ label, sort = 'Best match' }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      paddingBottom: 14, marginBottom: 14, borderBottom: '1px solid #dcdcd6',
    }}>
      <span className="mono" style={{ fontSize: 10.5, color: '#4d4d4a', letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 600 }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button className="btn btn-ghost btn-sm">Sort: {sort} {Icon.chevron(11)}</button>
      </div>
    </div>
  );
}

Object.assign(window, { DirectionB2, DirectionB3, DirectionB4, DirectionB5 });
