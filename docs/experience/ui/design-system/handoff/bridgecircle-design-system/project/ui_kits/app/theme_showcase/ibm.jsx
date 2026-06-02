// ── IBM theme artboard — "Carbon enterprise" creative interpretation ───────
// IBM Plex typography, sharp-cornered rectangles, structural grid lines,
// 8-bar IBM-logo motif, data-table person rows, schematic accents.
// Component parity with BridgeCircle.

function IBMBoard() {
  const C = {
    bg: '#ffffff', surface: '#f4f4f4', subtle: '#e0e0e0',
    border: '#c6c6c6', hair: '#e0e0e0',
    ink: '#161616', mute: '#525252', dim: '#6f6f6f',
    brand: '#0f62fe', brandHover: '#0353e9', brandDeep: '#002d9c',
    accent: '#ee5396', cyan: '#1192e8', success: '#198038',
  };
  const f = {
    sans: '"IBM Plex Sans", system-ui, sans-serif',
    mono: '"IBM Plex Mono", monospace',
    serif: '"IBM Plex Serif", serif',
  };

  // IBM's iconic 8-bar mark — pure CSS striping
  const IBMMark = ({ size = 24 }) => (
    <div style={{
      width: size * 2.5, height: size, display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between',
    }}>
      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
        <div key={i} style={{ height: 2, background: C.ink, width: i % 2 === 0 ? '100%' : '92%' }} />
      ))}
    </div>
  );

  return (
    <div className="tb" style={{ background: C.bg, color: C.ink, fontFamily: f.sans, letterSpacing: '-0.005em', position: 'relative' }}>
      {/* Faint Carbon-style grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage:
          `linear-gradient(${C.hair} 1px, transparent 1px),
           linear-gradient(90deg, ${C.hair} 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
        opacity: 0.4,
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Top nav — Carbon UI shell */}
        <div style={{
          background: C.ink, color: '#fff', height: 48,
          display: 'flex', alignItems: 'center', padding: '0 16px', gap: 0,
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: f.mono, color: '#fff' }}>bridgecircle</span>
            <span style={{ color: '#a8a8a8', fontWeight: 400 }}>[Network Platform]</span>
          </span>
          <div style={{ flex: 1 }} />
          {['Ask', 'People', 'Events', 'Inbox', 'Admin'].map((l, i) => (
            <span key={l} style={{
              padding: '0 16px', height: 48, display: 'flex', alignItems: 'center',
              fontSize: 14, color: i === 0 ? '#fff' : '#c6c6c6', fontWeight: i === 0 ? 600 : 400,
              borderBottom: i === 0 ? '3px solid #fff' : '3px solid transparent',
              cursor: 'pointer',
            }}>{l}</span>
          ))}
        </div>

        {/* Announcement strip — Carbon notification banner */}
        <div style={{
          background: '#fff', borderBottom: `1px solid ${C.border}`,
          padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 14,
          borderLeft: `3px solid ${C.brand}`,
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 18, height: 18, borderRadius: 999, background: C.brand, color: '#fff',
            fontSize: 11, fontFamily: f.mono, fontWeight: 700,
          }}>i</span>
          <span style={{ fontFamily: f.mono, fontSize: 11, color: C.dim, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            NOTICE.05-30-2026
          </span>
          <span style={{ fontSize: 13.5, color: C.ink }}>
            <strong style={{ fontWeight: 600 }}>Spring Career Panel</strong> — registration window closes May 30
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 13, color: C.brand, fontWeight: 500, cursor: 'pointer' }}>
            Register —{'>'}
          </span>
        </div>

        {/* Hero band — left-aligned structural type */}
        <section style={{ padding: '40px 56px 32px' }}>
          {/* Eyebrow with 8-bar mark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
            <IBMMark size={20} />
            <span style={{
              fontFamily: f.mono, fontSize: 11, fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase', color: C.dim,
            }}>
              Class&nbsp;'20 / Cornell&nbsp;Alumni / Network&nbsp;Module&nbsp;v2.4
            </span>
          </div>

          <h1 style={{
            fontSize: 60, fontWeight: 300, lineHeight: 1.05, letterSpacing: '-0.025em',
            maxWidth: 920, textWrap: 'balance',
          }}>
            Help is a <span style={{ fontWeight: 600 }}>system</span>{' '}
            <span style={{ fontFamily: f.serif, fontStyle: 'italic', fontWeight: 400 }}>—</span>{' '}
            <span style={{ color: C.brand, fontWeight: 600 }}>route, match, resolve.</span>
          </h1>
          <p style={{ fontSize: 17, color: C.mute, marginTop: 18, maxWidth: 620, lineHeight: 1.5 }}>
            Bridge any ask to five alumni who've been there. Predictable routing. Instrumented response. Built for scale.
          </p>

          {/* Ask field — Carbon-style input */}
          <div style={{ marginTop: 30, maxWidth: 760 }}>
            <label style={{
              display: 'block', fontFamily: f.mono, fontSize: 11, fontWeight: 500,
              color: C.dim, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6,
            }}>
              Ask · STRING
            </label>
            <div style={{
              display: 'flex', alignItems: 'stretch',
              background: '#fff', border: `1px solid ${C.border}`,
              borderBottom: `1px solid ${C.ink}`,
            }}>
              <span style={{
                padding: '12px 14px', flex: 1, fontSize: 14.5, color: C.ink, fontStyle: 'italic',
                background: '#fff',
              }}>
                "{SHOWCASE_ASK}"
              </span>
              <button style={{
                background: C.brand, color: '#fff', border: 'none',
                padding: '12px 22px', fontSize: 14, fontWeight: 500, fontFamily: f.sans,
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10,
                letterSpacing: '-0.005em',
              }}>
                Route ask <span style={{ fontFamily: f.mono, fontSize: 14 }}>→</span>
              </button>
            </div>
            <div style={{ marginTop: 8, fontFamily: f.mono, fontSize: 11, color: C.dim }}>
              SLA: first-reply &lt; 24h · routing-confidence 0.94 · 5 alumni matched
            </div>
          </div>

          {/* Stats — Carbon KPI tiles */}
          <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: C.border, border: `1px solid ${C.border}` }}>
            {[
              { n: '2,341',   l: 'Alumni helping',      delta: '+128 / 7d',     trend: 'up' },
              { n: '<24h',    l: 'Avg first reply',     delta: '-18s / 30d',    trend: 'up' },
              { n: '96.4%',   l: 'Asks answered',       delta: '+2.1pp / Q',    trend: 'up' },
            ].map(s => (
              <div key={s.l} style={{ background: '#fff', padding: '18px 20px' }}>
                <div style={{ fontFamily: f.mono, fontSize: 10.5, color: C.dim, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.l}</div>
                <div style={{ fontSize: 36, fontWeight: 300, letterSpacing: '-0.025em', marginTop: 10, color: C.ink, fontFamily: f.sans }}>{s.n}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontFamily: f.mono, fontSize: 11.5, color: C.success }}>
                  <span style={{ fontSize: 10 }}>▲</span> {s.delta}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* People — data-table aesthetic */}
        <section style={{ padding: '0 56px 48px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.015em' }}>Routed alumni</h2>
              <div style={{ fontFamily: f.mono, fontSize: 11.5, color: C.dim, marginTop: 2, letterSpacing: '0.02em' }}>
                3 of 5 records · sorted by fit DESC
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{
                background: '#fff', color: C.ink, border: `1px solid ${C.border}`,
                padding: '7px 14px', fontSize: 13, fontFamily: f.sans, cursor: 'pointer',
              }}>Filter ⌄</button>
              <button style={{
                background: C.ink, color: '#fff', border: 'none',
                padding: '7px 14px', fontSize: 13, fontFamily: f.sans, cursor: 'pointer',
              }}>Export ↓</button>
            </div>
          </div>

          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '40px 280px 1fr 120px 90px 130px',
            background: C.surface, padding: '12px 16px', gap: 16,
            fontFamily: f.mono, fontSize: 11, color: C.mute,
            letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600,
            borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
          }}>
            <span>ID</span>
            <span>Alumni</span>
            <span>Match rationale</span>
            <span>Reply rate</span>
            <span>Helped</span>
            <span style={{ textAlign: 'right' }}>Action</span>
          </div>

          {/* Table rows */}
          {SHOWCASE_PEOPLE.map((p, i) => (
            <div key={p.id} style={{
              display: 'grid', gridTemplateColumns: '40px 280px 1fr 120px 90px 130px',
              padding: '18px 16px', gap: 16, alignItems: 'center',
              background: '#fff', borderBottom: `1px solid ${C.hair}`,
            }}>
              <span style={{ fontFamily: f.mono, fontSize: 12, color: C.dim }}>
                A-{String(p.id).slice(-2).padStart(2, '0')}{i + 1}
              </span>

              {/* Alumni cell */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <ShowcaseAvatar person={p} size={40} radius={0} font={f.sans} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: '-0.005em' }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: C.mute, marginTop: 2 }}>{p.role}</div>
                  <div style={{ fontFamily: f.mono, fontSize: 11, color: C.dim, marginTop: 2 }}>{p.cohort}</div>
                </div>
              </div>

              {/* Rationale + topic chips + italic bio */}
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{
                    background: 'rgba(15,98,254,0.10)', color: C.brandDeep,
                    fontFamily: f.mono, fontSize: 11, fontWeight: 600,
                    padding: '2px 8px', letterSpacing: '0.04em',
                  }}>FIT {p.fit}%</span>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {p.topics.map(t => (
                      <span key={t} style={{
                        background: C.surface, color: C.ink,
                        fontSize: 11, padding: '1px 7px', fontFamily: f.mono,
                      }}>{t}</span>
                    ))}
                  </div>
                </div>
                <p style={{
                  fontFamily: f.serif, fontStyle: 'italic', fontSize: 13.5,
                  color: C.ink, lineHeight: 1.45, opacity: 0.85,
                }}>"{p.bio}"</p>
              </div>

              {/* Reply rate — with bar */}
              <div>
                <div style={{ fontFamily: f.mono, fontSize: 16, fontWeight: 500 }}>{p.replyRate}%</div>
                <div style={{ height: 4, background: C.hair, marginTop: 6, position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 0, width: `${p.replyRate}%`, background: C.brand }} />
                </div>
              </div>

              {/* Helped count */}
              <div style={{ fontFamily: f.mono, fontSize: 16, fontWeight: 500 }}>{p.helped}</div>

              {/* Action button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button style={{
                  background: C.brand, color: '#fff', border: 'none',
                  padding: '8px 18px', fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', fontFamily: f.sans, letterSpacing: '-0.005em',
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                }}>
                  Ask <span style={{ fontFamily: f.mono }}>→</span>
                </button>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

window.IBMBoard = IBMBoard;
