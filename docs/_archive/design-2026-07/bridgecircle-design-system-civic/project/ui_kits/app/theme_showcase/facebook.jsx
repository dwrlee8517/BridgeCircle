// ── Facebook theme artboard — "newsfeed social" creative interpretation ────
// Cool blue header bar, "What's on your mind?" ask composer, reaction-bar
// stat treatment, friend-suggestion person cards in a 3-up grid, rounded
// chips, like/comment/share footer rows. Component parity with BridgeCircle.

function FacebookBoard() {
  const C = {
    bg: '#f0f2f5', surface: '#ffffff', subtle: '#f7f8fa',
    border: '#dadde1', hair: '#e4e6eb',
    ink: '#050505', mute: '#65676B', dim: '#8a8d91',
    brand: '#1877F2', brandDeep: '#0a5dc9',
    success: '#42b72a', love: '#f33e58', sun: '#f7b928',
  };
  const f = { sans: '"Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif' };

  // Reaction pill — circular gradient with emoji
  const Reaction = ({ emoji, bg }) => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 22, height: 22, borderRadius: 999, background: bg,
      fontSize: 12, border: '2px solid #fff',
      boxShadow: '0 0 0 0.5px rgba(0,0,0,0.05)',
    }}>{emoji}</span>
  );

  return (
    <div className="tb" style={{ background: C.bg, color: C.ink, fontFamily: f.sans }}>
      {/* Top header bar — FB-style blue band with search */}
      <div style={{
        background: '#fff', borderBottom: `1px solid ${C.border}`,
        display: 'grid', gridTemplateColumns: '280px 1fr 280px', alignItems: 'center',
        padding: '8px 16px', gap: 16, height: 56,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* FB-style circular monogram */}
          <div style={{
            width: 40, height: 40, borderRadius: 999, background: C.brand,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 24, fontWeight: 700, fontFamily: 'Georgia, serif',
            letterSpacing: '-0.03em',
          }}>b</div>
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: C.hair, borderRadius: 999, padding: '8px 14px', flex: 1, maxWidth: 240,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.mute} strokeWidth="2.2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
            <span style={{ fontSize: 13, color: C.mute }}>Search bridgecircle</span>
          </div>
        </div>
        {/* Center tabs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          {[
            { label: 'Home', active: true, icon: '🏠' },
            { label: 'People', icon: '👥' },
            { label: 'Events', icon: '📅' },
            { label: 'Asks', icon: '💬' },
          ].map(t => (
            <div key={t.label} style={{
              padding: '10px 36px', borderRadius: 8,
              color: t.active ? C.brand : C.mute, fontSize: 13, fontWeight: 600,
              borderBottom: t.active ? `3px solid ${C.brand}` : '3px solid transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontSize: 18 }}>{t.icon}</span>{t.label}
            </div>
          ))}
        </div>
        {/* Right cluster */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
          {[ '🔔', '✉️', '⚙️' ].map((e, i) => (
            <div key={i} style={{ width: 38, height: 38, borderRadius: 999, background: C.hair, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{e}</div>
          ))}
          <ShowcaseAvatar person={SHOWCASE_PEOPLE[0]} size={38} radius={999} font={f.sans} />
        </div>
      </div>

      {/* Announcement strip — pinned post style */}
      <div style={{
        background: '#fff', borderBottom: `1px solid ${C.hair}`,
        padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 12, fontSize: 13.5,
      }}>
        <span style={{ background: 'rgba(24,119,242,0.10)', color: C.brand, padding: '2px 9px', borderRadius: 4, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>📌 Pinned</span>
        <span style={{ color: C.ink, fontWeight: 500 }}>Spring Career Panel — Register by May 30</span>
        <span style={{ color: C.mute }}>· 2d</span>
        <span style={{ marginLeft: 'auto', color: C.brand, fontWeight: 600, cursor: 'pointer' }}>Going · 142</span>
      </div>

      {/* Main column — feed centered */}
      <section style={{ padding: '20px 24px 24px', maxWidth: 720, margin: '0 auto' }}>
        {/* Eyebrow + headline (as a "Stories" panel header) */}
        <div style={{
          background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10,
          padding: '16px 18px', marginBottom: 14,
          boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
        }}>
          <div style={{ fontSize: 11, color: C.brand, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
            Class of '20 · Cornell Alumni
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.015em' }}>
            Catch up with your network.
          </h1>
          <p style={{ fontSize: 15, color: C.mute, marginTop: 6, lineHeight: 1.45 }}>
            Drop an ask in the feed — five alumni who've been there will reply, usually within a day.
          </p>
        </div>

        {/* "What's on your mind?" ask composer */}
        <div style={{
          background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10,
          padding: '14px 18px', boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShowcaseAvatar person={SHOWCASE_PEOPLE[0]} size={40} radius={999} font={f.sans} />
            <div style={{
              flex: 1, background: C.hair, borderRadius: 999, padding: '10px 16px',
              fontSize: 14, color: C.mute, fontStyle: 'italic',
            }}>
              "{SHOWCASE_ASK}"
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.hair}` }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.mute, fontWeight: 600 }}>
              <span style={{ fontSize: 18 }}>🎯</span> Pick topic
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.mute, fontWeight: 600 }}>
              <span style={{ fontSize: 18 }}>👥</span> Tag alumni
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.mute, fontWeight: 600 }}>
              <span style={{ fontSize: 18 }}>⚡</span> Urgent
            </span>
            <button style={{
              background: C.brand, color: '#fff', border: 'none',
              padding: '8px 28px', borderRadius: 6, fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: f.sans,
            }}>
              Post ask
            </button>
          </div>
        </div>

        {/* Stats — reaction bar / engagement card */}
        <div style={{
          background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10,
          padding: '14px 18px', marginTop: 12,
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0,
          boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
        }}>
          {[
            { n: '2,341', l: 'alumni helping', icon: <><Reaction emoji="👍" bg={C.brand} /><Reaction emoji="❤️" bg={C.love} /><Reaction emoji="😊" bg={C.sun} /></>, sub: 'Maya, Jordan and 2,339 others' },
            { n: '<24h',  l: 'avg first reply', icon: <span style={{ fontSize: 20 }}>⚡</span>, sub: '18s faster than last month' },
            { n: '96%',   l: 'asks answered',  icon: <span style={{ fontSize: 20 }}>✅</span>, sub: '+2pp quarter-over-quarter' },
          ].map((s, i) => (
            <div key={s.l} style={{
              padding: '4px 16px',
              borderLeft: i ? `1px solid ${C.hair}` : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: C.ink }}>{s.n}</div>
              <div style={{ fontSize: 12.5, color: C.mute, marginTop: 1 }}>{s.l}</div>
              <div style={{ fontSize: 11.5, color: C.dim, marginTop: 4 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* People — friend suggestions */}
        <div style={{
          background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10,
          padding: '14px 18px 18px', marginTop: 12,
          boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: C.ink }}>People you may want to ask</h2>
            <span style={{ fontSize: 13, color: C.brand, fontWeight: 600, cursor: 'pointer' }}>See all (3 of 5)</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {SHOWCASE_PEOPLE.map(p => (
              <div key={p.id} style={{
                border: `1px solid ${C.border}`, borderRadius: 10,
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
              }}>
                {/* Cover banner with avatar overlap */}
                <div style={{
                  height: 64, background: `linear-gradient(135deg, ${C.brand}, #4267B2)`,
                  position: 'relative',
                }}>
                  <span style={{
                    position: 'absolute', top: 8, right: 8,
                    background: 'rgba(0,0,0,0.65)', color: '#fff',
                    padding: '2px 8px', borderRadius: 4,
                    fontSize: 11, fontWeight: 700,
                  }}>{p.fit}% match</span>
                </div>
                <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: -34 }}>
                  <div style={{ borderRadius: 999, border: '4px solid #fff', background: '#fff' }}>
                    <ShowcaseAvatar person={p} size={64} radius={999} font={f.sans} />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginTop: 8, color: C.ink }}>{p.name}</div>
                  <div style={{ fontSize: 12.5, color: C.mute, marginTop: 2 }}>{p.role}</div>
                  <div style={{ fontSize: 11.5, color: C.dim, marginTop: 2 }}>{p.cohort.split(' · ')[0]}</div>

                  {/* italic bio */}
                  <p style={{
                    fontStyle: 'italic', fontSize: 12, color: C.ink, lineHeight: 1.45, marginTop: 8, opacity: 0.85,
                  }}>"{p.bio}"</p>

                  {/* mutuals row — like FB's "12 mutual friends" */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                    <div style={{ display: 'flex' }}>
                      {SHOWCASE_PEOPLE.filter(o => o.id !== p.id).slice(0, 2).map((m, i) => (
                        <div key={m.id} style={{ marginLeft: i ? -8 : 0, border: '2px solid #fff', borderRadius: 999 }}>
                          <ShowcaseAvatar person={m} size={20} radius={999} font={f.sans} />
                        </div>
                      ))}
                    </div>
                    <span style={{ fontSize: 11.5, color: C.mute }}>
                      <strong style={{ color: C.ink }}>{p.helped}</strong> helped · {p.replyRate}% reply
                    </span>
                  </div>

                  {/* topic chips */}
                  <div style={{ display: 'flex', gap: 4, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {p.topics.slice(0, 2).map(t => (
                      <span key={t} style={{
                        padding: '2px 8px', borderRadius: 4,
                        background: C.hair, fontSize: 11, color: C.mute, fontWeight: 600,
                      }}>{t}</span>
                    ))}
                  </div>

                  {/* Actions — FB friend-card buttons */}
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                    <button style={{
                      background: C.brand, color: '#fff', border: 'none',
                      padding: '7px 0', borderRadius: 6, fontSize: 13, fontWeight: 700,
                      cursor: 'pointer', fontFamily: f.sans,
                    }}>
                      Ask {p.name.split(' ')[0]}
                    </button>
                    <button style={{
                      background: C.hair, color: C.ink, border: 'none',
                      padding: '7px 0', borderRadius: 6, fontSize: 13, fontWeight: 700,
                      cursor: 'pointer', fontFamily: f.sans,
                    }}>
                      Message
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

window.FacebookBoard = FacebookBoard;
