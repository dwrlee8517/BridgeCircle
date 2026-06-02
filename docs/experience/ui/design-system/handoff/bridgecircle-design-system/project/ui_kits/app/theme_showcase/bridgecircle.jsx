// ── BridgeCircle theme artboard ─────────────────────────────────────────────
// Editorial. Warm bone background. Inter Tight headings. Cobalt action
// color. Asymmetric grid, kicker bar before eyebrow, small caps tags.

function BridgeCircleBoard() {
  const C = {
    bg: '#fafaf9', surface: '#ffffff', subtle: '#f4f3ee',
    border: '#dcdcd6', hair: '#ebebe5',
    ink: '#0c0c0b', mute: '#4d4d4a', dim: '#7a7a75',
    brand: '#2563eb', warm: '#c8761a', sage: '#3b6e51',
  };
  const f = { sans: "'Inter', system-ui, sans-serif", tight: "'Inter Tight', sans-serif", mono: "'JetBrains Mono', monospace" };

  return (
    <div className="tb" style={{ background: C.bg, color: C.ink, fontFamily: f.sans }}>
      {/* Announcement strip */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 32px', background: 'rgba(37,99,235,0.04)',
        borderBottom: `1px solid ${C.border}`, fontSize: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.brand} strokeWidth="2"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
          <span style={{ fontFamily: f.mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: C.brand }}>Announcement</span>
          <span style={{ fontWeight: 500 }}>Spring Career Panel — Register by May 30</span>
        </div>
        <span style={{ color: C.mute }}>2d ago →</span>
      </div>

      {/* Hero band */}
      <section style={{
        padding: '52px 56px 44px',
        borderBottom: `1px solid ${C.border}`,
        background: `linear-gradient(180deg, rgba(255,255,255,.72), rgba(255,255,255,0)),
                     radial-gradient(circle at 12% 0%, rgba(37,99,235,0.07), transparent 32%),
                     ${C.bg}`,
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: C.brand, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
          <span style={{ display: 'block', width: 28, height: 2, borderRadius: 999, background: C.brand }} />
          Class of '20 · Cornell Alumni
        </div>
        <h1 style={{ fontFamily: f.tight, fontSize: 46, fontWeight: 600, lineHeight: 1.05, letterSpacing: '-0.02em', maxWidth: 720, textWrap: 'balance' }}>
          Find help from people who've <em style={{ fontStyle: 'italic', fontWeight: 500, color: C.brand }}>been there.</em>
        </h1>
        <p style={{ fontSize: 16, color: C.mute, marginTop: 14, maxWidth: 560, lineHeight: 1.55 }}>
          Ask anyone in your network for advice, intros, or mentorship. We'll match you with five people who've walked the path you're on.
        </p>

        {/* Ask field */}
        <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 6, maxWidth: 720, boxShadow: '0 1px 0 rgba(12,12,11,0.03)' }}>
          <span style={{ padding: '0 14px', color: C.dim, fontSize: 14, flex: 1 }}>
            "{SHOWCASE_ASK}"
          </span>
          <button style={{ background: C.ink, color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: f.sans }}>
            Find people →
          </button>
        </div>

        {/* Kicker stats */}
        <div style={{ marginTop: 28, display: 'flex', gap: 32, fontSize: 12, color: C.mute, fontFamily: f.mono, letterSpacing: '0.04em' }}>
          <span><strong style={{ color: C.ink, fontWeight: 700 }}>2,341</strong> alumni helping</span>
          <span><strong style={{ color: C.ink, fontWeight: 700 }}>87%</strong> reply within 3 days</span>
          <span><strong style={{ color: C.ink, fontWeight: 700 }}>1,118</strong> intros made this year</span>
        </div>
      </section>

      {/* People section */}
      <section style={{ padding: '32px 56px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontFamily: f.tight, fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}>People who can help you</h2>
          <span style={{ fontFamily: f.mono, fontSize: 11, color: C.mute, letterSpacing: '0.06em' }}>3 OF 5 SHOWN</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {SHOWCASE_PEOPLE.map(p => (
            <div key={p.id} style={{
              display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 20, alignItems: 'center',
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
              padding: '18px 22px', boxShadow: '0 1px 0 rgba(12,12,11,0.03)',
            }}>
              <ShowcaseAvatar person={p} size={56} radius={999} font={f.tight} />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: f.tight, fontSize: 17, fontWeight: 600 }}>{p.name}</span>
                  <span style={{ fontSize: 12.5, color: C.mute, fontFamily: f.mono, letterSpacing: '0.04em' }}>{p.cohort}</span>
                </div>
                <div style={{ fontSize: 13.5, marginTop: 3, fontWeight: 500 }}>{p.role}</div>
                <p style={{ fontStyle: 'italic', fontSize: 13, color: C.ink, lineHeight: 1.5, marginTop: 8, maxWidth: 540 }}>"{p.bio}"</p>
                <div style={{ display: 'flex', gap: 6, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  {p.topics.map(t => (
                    <span key={t} style={{ padding: '3px 9px', borderRadius: 999, background: C.subtle, border: `1px solid ${C.hair}`, fontSize: 11, color: C.mute }}>{t}</span>
                  ))}
                  <span style={{ width: 1, height: 14, background: C.border, margin: '0 6px' }} />
                  <span style={{ fontSize: 11.5, color: C.mute }}>
                    <strong style={{ color: C.ink, fontWeight: 600 }}>{p.helped}</strong> helped · <strong style={{ color: C.ink, fontWeight: 600 }}>{p.replyRate}%</strong> reply
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                <span style={{ fontFamily: f.mono, fontSize: 11, color: C.sage, fontWeight: 600, letterSpacing: '0.04em' }}>{p.fit}% MATCH</span>
                <button style={{ background: C.brand, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: f.sans }}>
                  Ask →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

window.BridgeCircleBoard = BridgeCircleBoard;
