// Direction C — Quoted Voices
// Reframes the page as a magazine: the AI match-brief is the hero,
// the person is the attribution. Featured pull quote at top, then
// 3-col grid of smaller "voice cards."

function DirectionC() {
  const featured = PEOPLE_MODERN[0];
  const rest = PEOPLE_MODERN.slice(1);

  return (
    <div style={{ width: '100%', minHeight: '100%', background: '#fafaf9' }}>
      {/* ── Hero (Midnight editorial surface) ───────────────────── */}
      <div style={{
        background: '#081126', color: '#fafaf9', padding: '56px 56px 48px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(147,197,253,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(147,197,253,0.08) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.5), transparent 70%)',
          pointerEvents: 'none',
        }}></div>
        <div style={{ position: 'relative', maxWidth: 980 }}>
          <div className="kicker" style={{ color: '#93c5fd', marginBottom: 16 }}>People · Voices from your circle</div>
          <h1 className="display" style={{ fontSize: 52, fontWeight: 600, lineHeight: 1.06, letterSpacing: '-0.025em', maxWidth: 880 }}>
            <span style={{ color: '#fafaf9' }}>You asked: </span>
            <span style={{ color: '#93c5fd', fontStyle: 'italic', fontWeight: 500 }}>
              "Moving from consulting into product management."
            </span>
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(250,250,249,0.68)', marginTop: 16, lineHeight: 1.6, maxWidth: 640 }}>
            36 people in your circle have done this, or something close.
            Here's why each one came up — in their context, not a score out of ten.
          </p>

          {/* Inline search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginTop: 28,
            background: 'rgba(250,250,249,0.06)', border: '1px solid rgba(250,250,249,0.16)',
            borderRadius: 12, padding: '12px 16px', maxWidth: 580,
          }}>
            <span style={{ color: 'rgba(250,250,249,0.5)', display: 'flex' }}>{Icon.search(16)}</span>
            <input type="text" placeholder="Refine your ask…" style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: 14, color: '#fafaf9',
            }} />
            <button style={{
              background: 'transparent', border: '1px solid rgba(250,250,249,0.18)',
              color: '#fafaf9', borderRadius: 8, fontSize: 11, fontWeight: 600,
              padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5,
            }}>
              {Icon.command(11)} K
            </button>
          </div>

          {/* Inline filter chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 18 }}>
            {[
              { label: 'All voices', count: 36, active: true },
              { label: 'Strong match', count: 8 },
              { label: 'Open right now', count: 12 },
              { label: 'Same cohort', count: 5 },
              { label: 'Friends', count: 3 },
            ].map(t => (
              <button key={t.label} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                background: t.active ? '#fafaf9' : 'transparent',
                color: t.active ? '#081126' : 'rgba(250,250,249,0.78)',
                border: `1px solid ${t.active ? '#fafaf9' : 'rgba(250,250,249,0.20)'}`,
                cursor: 'pointer', transition: 'all 150ms',
              }}>
                {t.label}
                <span className="mono" style={{
                  fontSize: 10, fontWeight: 500,
                  color: t.active ? 'rgba(8,17,38,0.55)' : 'rgba(250,250,249,0.5)',
                }}>{t.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '40px 56px 64px' }}>

        {/* ── Featured pull quote ───────────────────────────── */}
        <div style={{ marginBottom: 14 }}>
          <span className="mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: '#3b6e51' }}>
            ◆ Best match
          </span>
        </div>
        <FeaturedQuote p={featured} />

        {/* ── Divider ───────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '40px 0 28px' }}>
          <span className="mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: '#4d4d4a' }}>
            More voices · {rest.length} of 35
          </span>
          <div style={{ flex: 1, height: 1, background: '#dcdcd6' }}></div>
          <button className="btn btn-ghost btn-sm">Sort: Best match {Icon.chevron(11)}</button>
        </div>

        {/* ── 3-col voice cards ─────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {rest.map(p => <VoiceCard key={p.id} p={p} />)}
        </div>

        {/* ── Load more ─────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
          <button className="btn btn-outline btn-md" style={{ minWidth: 200 }}>
            Show 30 more voices {Icon.arrow(14)}
          </button>
        </div>
      </div>
    </div>
  );
}

function FeaturedQuote({ p }) {
  return (
    <article style={{
      background: '#fff', border: '1px solid #dcdcd6', borderRadius: 16,
      padding: '36px 40px', position: 'relative', overflow: 'hidden',
      boxShadow: '0 1px 0 rgba(12,12,11,0.03), 0 24px 48px -24px rgba(12,12,11,0.10)',
    }}>
      {/* Big quote mark */}
      <div style={{
        position: 'absolute', top: 20, right: 36,
        color: 'rgba(37,99,235,0.10)', fontSize: 160, lineHeight: 1,
        fontFamily: "'Inter Tight', serif", fontWeight: 700, pointerEvents: 'none',
      }}>"</div>

      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr auto', gap: 32 }}>
        <div>
          {/* Match brief = the headline */}
          <p className="display" style={{
            fontSize: 26, fontWeight: 500, fontStyle: 'italic', lineHeight: 1.35,
            color: '#0c0c0b', letterSpacing: '-0.01em', maxWidth: 720,
          }}>
            "{p.rationale}"
          </p>

          {/* Attribution */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 24 }}>
            <Avatar p={p} size={56} />
            <div>
              <div className="display" style={{ fontSize: 17, fontWeight: 600, color: '#0c0c0b' }}>{p.name}</div>
              <div style={{ fontSize: 13, color: '#4d4d4a', marginTop: 2 }}>
                {p.role} · {p.company}
              </div>
              <div style={{ fontSize: 12, color: '#4d4d4a', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{p.cohortLong}</span>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#dcdcd6' }}></span>
                <span>{p.city}</span>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#dcdcd6' }}></span>
                <span>{p.mutual}</span>
              </div>
            </div>
          </div>

          {/* Topics */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 20 }}>
            {p.topics.map((t, i) => (
              <span key={t} className={`topic ${i === 0 ? 'match-hit' : ''}`}>{t}</span>
            ))}
          </div>
        </div>

        {/* Right rail: scorecard + CTA */}
        <div style={{
          width: 220, display: 'flex', flexDirection: 'column', gap: 20,
          paddingLeft: 28, borderLeft: '1px solid #ebebe5',
        }}>
          <div>
            <div className="mono" style={{ fontSize: 10, color: '#4d4d4a', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
              Match
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span className="display" style={{ fontSize: 36, fontWeight: 600, color: '#3b6e51', letterSpacing: '-0.02em' }}>
                {p.matchScore}
              </span>
              <span style={{ fontSize: 13, color: '#4d4d4a' }}>/ 100</span>
            </div>
            <div style={{ fontSize: 11.5, color: '#3b6e51', marginTop: 2, fontWeight: 600 }}>Strong</div>
          </div>

          <div>
            <div className="mono" style={{ fontSize: 10, color: '#4d4d4a', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
              Status
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#3b6e51', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b6e51' }}></span>
              Open as mentor
            </div>
            <div style={{ marginTop: 8 }}>
              <CapacityBar p={p} w={140} />
            </div>
            <div style={{ fontSize: 11.5, color: '#4d4d4a', marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {Icon.clock(11)} typically replies in {p.responseDays} days
            </div>
          </div>

          <button className="btn btn-cta btn-lg" style={{ width: '100%', height: 44, fontSize: 13.5 }}>
            Ask {p.name.split(' ')[0]} {Icon.arrow(14)}
          </button>
          <button className="btn btn-ghost btn-sm" style={{ width: '100%' }}>
            View full profile
          </button>
        </div>
      </div>
    </article>
  );
}

function VoiceCard({ p }) {
  const isOpen = p.mentorOpen || p.adviceOpen;
  return (
    <article className="lift" style={{
      background: '#fff', border: '1px solid #dcdcd6', borderRadius: 14,
      padding: 22, display: 'flex', flexDirection: 'column', gap: 16,
      boxShadow: '0 1px 0 rgba(12,12,11,0.03)',
    }}>
      {/* Tier marker */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {p.matchTier
          ? <MatchPill tier={p.matchTier} score={p.matchScore} />
          : <span className="pill pill-weak"><span className="dot"></span>No active match</span>
        }
        {p.isFriend && (
          <span style={{ fontSize: 10.5, fontWeight: 600, color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.4, textTransform: 'uppercase' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#2563eb' }}></span>
            Friend
          </span>
        )}
      </div>

      {/* Quote or fallback */}
      {p.rationale ? (
        <p style={{
          fontStyle: 'italic', fontSize: 14.5, lineHeight: 1.5, color: '#0c0c0b',
          fontFamily: "'Inter', sans-serif", minHeight: 88,
        }}>
          "{p.rationale}"
        </p>
      ) : (
        <p style={{
          fontSize: 13, lineHeight: 1.55, color: '#4d4d4a', minHeight: 88,
          fontStyle: 'italic',
        }}>
          {p.paused
            ? "Currently paused — but you can still send a friend request and reach out when they're back."
            : "No specific match notes — surfaced because they're in your circle and work in adjacent areas."}
        </p>
      )}

      {/* Attribution */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 14, borderTop: '1px solid #ebebe5' }}>
        <Avatar p={p} size={44} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="display" style={{ fontSize: 14.5, fontWeight: 600, color: '#0c0c0b' }}>{p.name}</div>
          <div style={{ fontSize: 11.5, color: '#4d4d4a', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {p.role} · {p.company}
          </div>
        </div>
      </div>

      {/* Topics + meta */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {p.topics.slice(0, 2).map(t => <span key={t} className="topic">{t}</span>)}
        {p.topics.length > 2 && <span className="topic" style={{ background: 'transparent', borderStyle: 'dashed' }}>+{p.topics.length - 2}</span>}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 11, color: '#4d4d4a' }}>
          {p.cohortLong} · {p.mutual}
        </div>
        {isOpen ? (
          <button className="btn btn-cta btn-sm">Ask {Icon.arrow(12)}</button>
        ) : (
          <button className="btn btn-outline btn-sm">View</button>
        )}
      </div>
    </article>
  );
}

window.DirectionC = DirectionC;
