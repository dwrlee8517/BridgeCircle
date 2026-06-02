// ── Apple theme artboard — "keynote spec sheet" creative interpretation ────
// Display-type drama (huge centered words), spec-comparison person cards
// like "Compare Models" pages, glassmorphic depth, hairline rules, system
// blue accents. Same components as BridgeCircle.

function AppleBoard() {
  const C = {
    bg: '#f5f5f7', surface: '#ffffff', subtle: '#fbfbfd', dark: '#1d1d1f',
    border: '#d2d2d7', hair: '#e5e5ea',
    ink: '#1d1d1f', mute: '#6e6e73', dim: '#86868b',
    brand: '#0071e3', brandDeep: '#0040b0',
    success: '#34c759',
  };
  const f = {
    sf: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
    serif: '"Instrument Serif", "New York", "Times New Roman", serif',
  };

  // Subtle "metallic" gradient used on spec card tops
  const metallic = 'linear-gradient(180deg, #fbfbfd 0%, #f5f5f7 100%)';

  return (
    <div className="tb" style={{ background: C.bg, color: C.ink, fontFamily: f.sf, letterSpacing: '-0.005em', position: 'relative' }}>
      {/* Announcement strip — apple.com-style minimal centered black band */}
      <div style={{
        background: C.dark, color: '#f5f5f7', textAlign: 'center',
        padding: '11px 32px', fontSize: 13, letterSpacing: '-0.01em',
      }}>
        Spring Career Panel — Register by May 30.&nbsp;
        <span style={{ color: '#2997ff', fontWeight: 500, cursor: 'pointer' }}>Get tickets &rsaquo;</span>
      </div>

      {/* Translucent top nav */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 32,
        padding: '0 56px', height: 44, fontSize: 13.5,
        background: 'rgba(255,255,255,0.72)', backdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: `1px solid ${C.hair}`,
      }}>
        <span style={{ fontWeight: 600, letterSpacing: '-0.02em', fontSize: 18 }}>bridgecircle</span>
        <span style={{ flex: 1 }} />
        <span>Ask</span><span>People</span><span>Events</span><span>Inbox</span>
        <span style={{ color: C.dim }}>·</span>
        <span style={{ color: C.brand, fontWeight: 500 }}>Sign in</span>
      </div>

      {/* Hero band */}
      <section style={{ padding: '64px 56px 56px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Eyebrow */}
        <div style={{ fontSize: 14, color: C.brand, fontWeight: 500, marginBottom: 6, letterSpacing: '-0.005em' }}>
          New&nbsp;·&nbsp;Class of '20 · Cornell Alumni
        </div>
        <h1 style={{
          fontSize: 88, fontWeight: 700, lineHeight: 0.98, letterSpacing: '-0.045em',
          maxWidth: 980, textWrap: 'balance',
        }}>
          Help, <span style={{ fontFamily: f.serif, fontWeight: 400, fontStyle: 'italic', letterSpacing: '-0.02em' }}>reimagined.</span>
        </h1>
        <p style={{
          fontSize: 23, color: C.mute, marginTop: 18, maxWidth: 700,
          lineHeight: 1.32, fontWeight: 400, letterSpacing: '-0.012em',
        }}>
          One ask. Five alumni. Replies in under a day — usually before lunch.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 24, marginTop: 22, alignItems: 'center' }}>
          <button style={{
            background: C.brand, color: '#fff', border: 'none',
            padding: '12px 28px', borderRadius: 999, fontSize: 15, fontWeight: 500,
            cursor: 'pointer', fontFamily: f.sf, letterSpacing: '-0.005em',
          }}>
            Start your ask
          </button>
          <span style={{ color: C.brand, fontWeight: 500, fontSize: 15, cursor: 'pointer' }}>
            Learn more &rsaquo;
          </span>
        </div>

        {/* Ask field as a frosted glass capsule */}
        <div style={{
          marginTop: 40, width: '100%', maxWidth: 720,
          background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(20px)',
          border: `1px solid ${C.hair}`, borderRadius: 999,
          padding: '14px 6px 14px 22px',
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.03)',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.mute} strokeWidth="1.8">
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>
          </svg>
          <span style={{ flex: 1, color: C.mute, fontSize: 15, letterSpacing: '-0.005em', textAlign: 'left' }}>
            "{SHOWCASE_ASK}"
          </span>
          <button style={{
            background: C.ink, color: '#fff', border: 'none',
            padding: '8px 18px', borderRadius: 999, fontSize: 13.5, fontWeight: 500,
            cursor: 'pointer', fontFamily: f.sf,
          }}>
            Find people
          </button>
        </div>

        {/* Stats — display numerals, keynote feel */}
        <div style={{ marginTop: 56, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, width: '100%', maxWidth: 880 }}>
          {[
            ['2,341', 'Alumni helping'],
            ['<24h',  'Avg first reply'],
            ['96%',   'Asks answered'],
          ].map(([n, l]) => (
            <div key={l}>
              <div style={{ fontSize: 52, fontWeight: 600, letterSpacing: '-0.035em' }}>{n}</div>
              <div style={{ fontSize: 14, color: C.mute, marginTop: 2, letterSpacing: '-0.005em' }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* People — spec-comparison aesthetic */}
      <section style={{ padding: '24px 56px 64px', background: '#fff', borderTop: `1px solid ${C.hair}` }}>
        <div style={{ textAlign: 'center', marginBottom: 36, marginTop: 24 }}>
          <div style={{ fontSize: 14, color: C.brand, fontWeight: 500, marginBottom: 6 }}>Matched · 3 of 5 shown</div>
          <h2 style={{ fontSize: 44, fontWeight: 600, letterSpacing: '-0.035em' }}>
            <span style={{ fontFamily: f.serif, fontWeight: 400, fontStyle: 'italic' }}>Choose</span> who answers.
          </h2>
          <p style={{ fontSize: 17, color: C.mute, marginTop: 6, letterSpacing: '-0.005em' }}>
            Specs that matter, side by side.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: C.hair, border: `1px solid ${C.hair}`, borderRadius: 20, overflow: 'hidden' }}>
          {SHOWCASE_PEOPLE.map((p, idx) => (
            <div key={p.id} style={{
              background: '#fff', padding: '32px 24px 28px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center',
              position: 'relative',
            }}>
              {/* Fit badge — pinned top right */}
              <span style={{
                position: 'absolute', top: 16, right: 16,
                fontSize: 11, fontWeight: 500, color: C.brand,
                background: 'rgba(0,113,227,0.10)', padding: '3px 9px', borderRadius: 999,
                letterSpacing: '-0.005em',
              }}>
                {p.fit}% match
              </span>

              {/* Metallic-top hero — like a product card header */}
              <div style={{
                width: 96, height: 96, borderRadius: '50%',
                background: metallic, border: `1px solid ${C.hair}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 4,
              }}>
                <ShowcaseAvatar person={p} size={78} radius={999} font={f.sf} />
              </div>

              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 4 }}>{p.name}</div>
              <div style={{ fontSize: 14, color: C.mute, letterSpacing: '-0.005em' }}>{p.role}</div>
              <div style={{ fontSize: 12.5, color: C.dim, letterSpacing: '-0.005em' }}>{p.cohort}</div>

              {/* Italic bio — keynote pull-quote serif */}
              <p style={{
                fontFamily: f.serif, fontStyle: 'italic', fontSize: 17,
                color: C.ink, lineHeight: 1.4, marginTop: 12, maxWidth: 320,
              }}>
                "{p.bio}"
              </p>

              {/* Spec rows — the "Compare iPhone" treatment */}
              <div style={{ width: '100%', marginTop: 16, borderTop: `1px solid ${C.hair}` }}>
                {[
                  ['Helped', `${p.helped} people`],
                  ['Reply rate', `${p.replyRate}%`],
                  ['Topics', p.topics.join(' · ')],
                ].map(([k, v]) => (
                  <div key={k} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 0', borderBottom: `1px solid ${C.hair}`,
                    fontSize: 13, letterSpacing: '-0.005em',
                  }}>
                    <span style={{ color: C.mute }}>{k}</span>
                    <span style={{ color: C.ink, fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{v}</span>
                  </div>
                ))}
              </div>

              {/* CTAs in keynote pattern */}
              <div style={{ display: 'flex', gap: 14, marginTop: 16, alignItems: 'center' }}>
                <button style={{
                  background: C.brand, color: '#fff', border: 'none',
                  padding: '8px 20px', borderRadius: 999, fontSize: 13.5, fontWeight: 500,
                  cursor: 'pointer', fontFamily: f.sf,
                }}>
                  Ask {p.name.split(' ')[0]}
                </button>
                <span style={{ color: C.brand, fontWeight: 500, fontSize: 13.5, cursor: 'pointer' }}>
                  Profile &rsaquo;
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

window.AppleBoard = AppleBoard;
