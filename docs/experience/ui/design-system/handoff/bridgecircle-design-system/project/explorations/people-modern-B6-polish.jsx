// B6 — Polish pass
// Refined main view + active-query chip micro-variants + empty / no-results states.

// ─────────────────────────────────────────────────────────────────────────
// Refined B6 — tightened rhythm, sticky toolbar, hover preview, footer note
// ─────────────────────────────────────────────────────────────────────────
function DirectionB6v2() {
  return (
    <div style={{ width: '100%', minHeight: '100%', background: '#fafaf9' }}>
      {/* ── Thin context strip ────────────────────────────────────────── */}
      <div style={{
        background: '#fafaf9', borderBottom: '1px solid #dcdcd6',
        padding: '14px 56px', display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <span className="kicker" style={{ flexShrink: 0 }}>People</span>
        <span style={{ width: 1, alignSelf: 'stretch', background: '#dcdcd6' }}></span>
        <span className="mono" style={{ fontSize: 11, color: '#4d4d4a', letterSpacing: 0.5, flexShrink: 0 }}>
          36 RESULTS · 12 OPEN
        </span>
        <div style={{ flex: 1 }}></div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#fff', border: '1px solid #dcdcd6', borderRadius: 999,
          padding: '6px 6px 6px 14px', minWidth: 360,
        }}>
          <span style={{ color: '#4d4d4a', display: 'flex' }}>{Icon.search(13)}</span>
          <input type="text" placeholder="Search the network…" style={{
            flex: 1, border: 'none', outline: 'none', fontSize: 13, background: 'transparent',
          }} />
          <button className="btn btn-primary btn-sm" style={{ borderRadius: 999, height: 28, padding: '0 12px', fontSize: 11.5 }}>Search</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 32, padding: '24px 56px 64px' }}>
        <FilterRail />
        <div>
          {/* Sticky toolbar — visible shadow shows the sticky state */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 10,
            background: 'rgba(250,250,249,0.92)', backdropFilter: 'blur(8px)',
            margin: '-4px -8px 0', padding: '12px 8px 14px',
            borderBottom: '1px solid #dcdcd6',
            boxShadow: '0 6px 12px -8px rgba(12,12,11,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span className="mono" style={{ fontSize: 10, color: '#4d4d4a', letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 700, flexShrink: 0 }}>
                You asked
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '7px 12px 7px 14px', borderRadius: 999,
                background: '#fff', border: '1px solid #2563eb',
                fontSize: 13, color: '#0c0c0b', fontWeight: 500,
                boxShadow: '0 0 0 4px rgba(37,99,235,0.06)',
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563eb' }}></span>
                Moving from consulting into product management
                <span style={{ width: 1, height: 14, background: '#dcdcd6', margin: '0 2px' }}></span>
                <button style={{
                  background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer',
                  fontSize: 11.5, fontWeight: 600, fontFamily: "'Inter', sans-serif",
                  padding: 0, display: 'inline-flex', alignItems: 'center', gap: 3,
                }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"></path>
                  </svg>
                  Refine
                </button>
                <button style={{
                  background: 'none', border: 'none', color: '#4d4d4a', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  padding: 0, width: 16, height: 16, borderRadius: '50%',
                }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18M6 6l12 12"></path>
                  </svg>
                </button>
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 11px', borderRadius: 999, fontSize: 11.5, fontWeight: 600,
                background: 'rgba(37,99,235,0.08)', color: '#2563eb', border: '1px solid rgba(37,99,235,0.18)',
              }}>
                {Icon.sparkle(11)} AI ranked
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 11px', borderRadius: 999, fontSize: 11.5, fontWeight: 600,
                background: '#fff', color: '#0c0c0b', border: '1px solid #dcdcd6',
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#3b6e51' }}></span>
                Open now <span className="mono" style={{ fontSize: 10, color: '#4d4d4a', fontWeight: 500 }}>12</span>
              </span>
              <div style={{ flex: 1, minWidth: 12 }}></div>
              <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>Sort: Best match {Icon.chevron(11)}</button>
            </div>
          </div>

          {/* Result list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
            {PEOPLE_MODERN.map((p, i) => (
              <div key={p.id} style={i === 1 ? { position: 'relative' } : {}}>
                <StripRow p={p} featured={i === 0} />
                {/* Show a small hover-preview overlay on the second row */}
                {i === 1 && (
                  <div style={{
                    position: 'absolute', top: -6, right: -6,
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
                    letterSpacing: 0.6, textTransform: 'uppercase', color: '#2563eb',
                    background: '#fff', padding: '2px 6px', borderRadius: 4,
                    border: '1px solid rgba(37,99,235,0.3)',
                  }}>
                    ← hover state
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer feedback strip */}
          <div style={{
            marginTop: 24, padding: '14px 20px',
            background: '#fff', border: '1px dashed #dcdcd6', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#0c0c0b' }}>
                Are these the right people?
              </div>
              <div style={{ fontSize: 11.5, color: '#4d4d4a', marginTop: 2 }}>
                Tell us why a result felt off and we'll improve your matches.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-outline btn-sm">👎 Off-target</button>
              <button className="btn btn-outline btn-sm">👍 Helpful</button>
              <button className="btn btn-ghost btn-sm">Skip</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Active-query chip micro-variants
// ─────────────────────────────────────────────────────────────────────────
function B6ChipVariants() {
  return (
    <div style={{ width: '100%', minHeight: '100%', background: '#fafaf9', padding: '40px 48px' }}>
      <div className="kicker" style={{ marginBottom: 10 }}>Active query · 4 treatments</div>
      <h1 className="display" style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 6 }}>
        Where does the query live?
      </h1>
      <p style={{ fontSize: 13, color: '#4d4d4a', lineHeight: 1.5, marginBottom: 32, maxWidth: 640 }}>
        Each option occupies the same horizontal strip above the result list — the difference is
        how much editorial weight it carries and how the refine/clear affordances surface.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <ChipFrame label="A · Pill + ✕ — current">
          <ChipPill />
        </ChipFrame>

        <ChipFrame label="B · Editorial line — typographic, less chrome" recommended>
          <ChipEditorial />
        </ChipFrame>

        <ChipFrame label="C · Breadcrumb — system-y, integrates with search history">
          <ChipBreadcrumb />
        </ChipFrame>

        <ChipFrame label="D · Card strip — most information, occupies most space">
          <ChipCardStrip />
        </ChipFrame>
      </div>
    </div>
  );
}

function ChipFrame({ label, recommended, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span className="mono" style={{ fontSize: 10.5, color: '#4d4d4a', letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 700 }}>
          {label}
        </span>
        {recommended && (
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 700,
            letterSpacing: 0.8, textTransform: 'uppercase', color: '#3b6e51',
            padding: '2px 7px', borderRadius: 4,
            background: 'rgba(59,110,81,0.10)', border: '1px solid rgba(59,110,81,0.28)',
          }}>★ Recommended</span>
        )}
      </div>
      <div style={{
        background: '#fff', border: '1px solid #dcdcd6', borderRadius: 10,
        padding: '16px 20px',
      }}>
        {children}
      </div>
    </div>
  );
}

const QUERY = "Moving from consulting into product management";

function ChipPill() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <span className="mono" style={{ fontSize: 10, color: '#4d4d4a', letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 700 }}>
        You asked
      </span>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '7px 14px 7px 16px', borderRadius: 999,
        background: '#fff', border: '1px solid #2563eb',
        fontSize: 13, color: '#0c0c0b', fontWeight: 500,
        boxShadow: '0 0 0 4px rgba(37,99,235,0.06)',
      }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563eb' }}></span>
        {QUERY}
        <button style={{
          background: 'none', border: 'none', color: '#4d4d4a', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          padding: 0, width: 14, height: 14, marginLeft: 2,
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12"></path>
          </svg>
        </button>
      </span>
      <div style={{ flex: 1 }}></div>
      <button className="btn btn-ghost btn-sm">Sort: Best match {Icon.chevron(11)}</button>
    </div>
  );
}

function ChipEditorial() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <span className="display" style={{ fontSize: 15, fontWeight: 500, color: '#4d4d4a' }}>
        You asked
      </span>
      <span className="display" style={{
        fontSize: 19, fontWeight: 500, fontStyle: 'italic', color: '#0c0c0b',
        letterSpacing: '-0.01em',
      }}>
        "{QUERY}"
      </span>
      <button style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: 'transparent', border: 'none', cursor: 'pointer',
        fontSize: 12, fontWeight: 600, color: '#2563eb',
      }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"></path>
        </svg>
        Refine
      </button>
      <span style={{ color: '#dcdcd6' }}>·</span>
      <button style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        fontSize: 12, fontWeight: 500, color: '#4d4d4a',
      }}>
        Clear
      </button>
      <div style={{ flex: 1 }}></div>
      <span className="mono" style={{ fontSize: 11, color: '#4d4d4a', letterSpacing: 0.4 }}>
        36 results · sorted by match
      </span>
    </div>
  );
}

function ChipBreadcrumb() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12, color: '#4d4d4a', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {Icon.search(13)} Search
      </span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dcdcd6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m9 18 6-6-6-6"></path>
      </svg>
      <span style={{ fontSize: 12, color: '#4d4d4a' }}>People</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dcdcd6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m9 18 6-6-6-6"></path>
      </svg>
      <span style={{
        fontSize: 13, fontWeight: 500, color: '#0c0c0b',
        background: '#f4f3ee', padding: '4px 10px', borderRadius: 6,
        display: 'inline-flex', alignItems: 'center', gap: 8,
      }}>
        "{QUERY}"
        <button style={{
          background: 'none', border: 'none', color: '#4d4d4a', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          padding: 0, width: 13, height: 13,
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12"></path>
          </svg>
        </button>
      </span>
      <div style={{ flex: 1 }}></div>
      <button className="btn btn-ghost btn-sm" style={{ height: 26, padding: '0 10px', fontSize: 11.5 }}>
        ⤴ Recent searches
      </button>
      <button className="btn btn-ghost btn-sm" style={{ height: 26, padding: '0 10px', fontSize: 11.5 }}>
        Sort {Icon.chevron(10)}
      </button>
    </div>
  );
}

function ChipCardStrip() {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center',
      padding: '14px 16px', borderRadius: 10,
      background: 'linear-gradient(180deg, rgba(37,99,235,0.04), transparent)',
      border: '1px solid rgba(37,99,235,0.18)',
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563eb' }}></span>
          <span className="mono" style={{ fontSize: 10, color: '#2563eb', letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 700 }}>
            You asked
          </span>
        </div>
        <div className="display" style={{ fontSize: 16, fontWeight: 600, color: '#0c0c0b', marginTop: 4 }}>
          "{QUERY}"
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, fontSize: 11.5, color: '#4d4d4a' }}>
          {Icon.sparkle(11)} <span>AI found <strong style={{ color: '#0c0c0b', fontWeight: 600 }}>8 strong</strong>, <strong style={{ color: '#0c0c0b', fontWeight: 600 }}>14 good</strong>, <strong style={{ color: '#0c0c0b', fontWeight: 600 }}>14 possible</strong> matches</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button className="btn btn-outline btn-sm">Refine</button>
        <button className="btn btn-ghost btn-sm">Clear</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Empty / browse state (no active query)
// ─────────────────────────────────────────────────────────────────────────
function DirectionB6Empty() {
  return (
    <div style={{ width: '100%', minHeight: '100%', background: '#fafaf9' }}>
      <div style={{
        background: '#fafaf9', borderBottom: '1px solid #dcdcd6',
        padding: '14px 56px', display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <span className="kicker" style={{ flexShrink: 0 }}>People</span>
        <span style={{ width: 1, alignSelf: 'stretch', background: '#dcdcd6' }}></span>
        <span className="mono" style={{ fontSize: 11, color: '#4d4d4a', letterSpacing: 0.5, flexShrink: 0 }}>
          248 IN YOUR CIRCLE · 64 OPEN
        </span>
        <div style={{ flex: 1 }}></div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#fff', border: '1px solid #dcdcd6', borderRadius: 999,
          padding: '6px 6px 6px 14px', minWidth: 360,
        }}>
          <span style={{ color: '#4d4d4a', display: 'flex' }}>{Icon.search(13)}</span>
          <input type="text" placeholder="What are you trying to figure out?" style={{
            flex: 1, border: 'none', outline: 'none', fontSize: 13, background: 'transparent',
          }} />
          <button className="btn btn-primary btn-sm" style={{ borderRadius: 999, height: 28, padding: '0 12px', fontSize: 11.5 }}>Search</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 32, padding: '24px 56px 64px' }}>
        <FilterRail />
        <div>
          {/* Suggested asks block */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span className="mono" style={{ fontSize: 10, color: '#4d4d4a', letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 700 }}>
                ◇ Suggested starts
              </span>
              <div style={{ flex: 1, height: 1, background: '#dcdcd6' }}></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                'Anyone who moved from consulting into product?',
                'PMs hiring this fall — open to chat?',
                'Founders who pivoted after grad school',
              ].map(q => (
                <button key={q} style={{
                  textAlign: 'left', background: '#fff', border: '1px solid #dcdcd6',
                  borderRadius: 10, padding: '14px 16px', cursor: 'pointer',
                  fontSize: 13.5, color: '#0c0c0b', lineHeight: 1.4, fontFamily: 'inherit',
                  display: 'flex', alignItems: 'flex-start', gap: 10, transition: 'all 150ms',
                }}>
                  <span style={{ color: '#2563eb', marginTop: 2, flexShrink: 0, display: 'flex' }}>{Icon.sparkle(13)}</span>
                  <span style={{ flex: 1 }}>{q}</span>
                  <span style={{ color: '#4d4d4a', flexShrink: 0, display: 'flex', marginTop: 2 }}>{Icon.arrow(12)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Toolbar — directory mode */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            paddingBottom: 14, marginBottom: 14, borderBottom: '1px solid #dcdcd6',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="mono" style={{ fontSize: 11, color: '#4d4d4a', letterSpacing: 0.6, textTransform: 'uppercase' }}>
                Browse your circle · 248 members
              </span>
            </div>
            <button className="btn btn-ghost btn-sm">Sort: Recently active {Icon.chevron(11)}</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PEOPLE_MODERN.slice(0, 4).map(p => <StripRow key={p.id} p={{ ...p, rationale: null, matchTier: null, matchScore: null }} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// No-results state
// ─────────────────────────────────────────────────────────────────────────
function DirectionB6NoResults() {
  return (
    <div style={{ width: '100%', minHeight: '100%', background: '#fafaf9' }}>
      <div style={{
        background: '#fafaf9', borderBottom: '1px solid #dcdcd6',
        padding: '14px 56px', display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <span className="kicker" style={{ flexShrink: 0 }}>People</span>
        <span style={{ width: 1, alignSelf: 'stretch', background: '#dcdcd6' }}></span>
        <span className="mono" style={{ fontSize: 11, color: '#4d4d4a', letterSpacing: 0.5, flexShrink: 0 }}>
          0 RESULTS
        </span>
        <div style={{ flex: 1 }}></div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#fff', border: '1px solid #dcdcd6', borderRadius: 999,
          padding: '6px 6px 6px 14px', minWidth: 360,
        }}>
          <span style={{ color: '#4d4d4a', display: 'flex' }}>{Icon.search(13)}</span>
          <input type="text" placeholder="Search the network…" style={{
            flex: 1, border: 'none', outline: 'none', fontSize: 13, background: 'transparent',
          }} />
          <button className="btn btn-primary btn-sm" style={{ borderRadius: 999, height: 28, padding: '0 12px', fontSize: 11.5 }}>Search</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 32, padding: '24px 56px 64px' }}>
        <FilterRail />
        <div>
          {/* Active query chip with conflicting filter callout */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
            padding: '0 0 16px', marginBottom: 16, borderBottom: '1px solid #dcdcd6',
          }}>
            <span className="mono" style={{ fontSize: 10, color: '#4d4d4a', letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 700 }}>
              You asked
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '7px 14px', borderRadius: 999,
              background: '#fff', border: '1px solid #2563eb',
              fontSize: 13, color: '#0c0c0b', fontWeight: 500,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563eb' }}></span>
              Bioinformatics PhD applications for international students
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 11px', borderRadius: 999, fontSize: 11.5, fontWeight: 600,
              background: 'rgba(161,98,7,0.12)', color: '#0c0c0b', border: '1px solid rgba(161,98,7,0.28)',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#a16207' }}></span>
              Filtered to Friends only · 0 match
            </span>
          </div>

          {/* Empty state callout */}
          <div style={{
            background: '#fff', border: '1px solid #dcdcd6', borderRadius: 12,
            padding: '32px 32px 28px', textAlign: 'center', maxWidth: 720, margin: '8px auto 24px',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: '#f4f3ee', margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4d4d4a',
            }}>
              {Icon.search(22)}
            </div>
            <div className="display" style={{ fontSize: 20, fontWeight: 600, color: '#0c0c0b', marginBottom: 6 }}>
              No friends match that ask
            </div>
            <p style={{ fontSize: 13.5, color: '#4d4d4a', lineHeight: 1.55, maxWidth: 480, margin: '0 auto 20px' }}>
              Your filter is set to <strong style={{ color: '#0c0c0b', fontWeight: 600 }}>Friends only</strong>.
              Widening to your full circle finds <strong style={{ color: '#3b6e51', fontWeight: 600 }}>7 strong matches</strong> — most have responded to similar asks before.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="btn btn-cta btn-md">
                Widen to full circle · 7 matches
              </button>
              <button className="btn btn-outline btn-md">Edit your ask</button>
            </div>
          </div>

          {/* Suggested adjacent searches */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span className="mono" style={{ fontSize: 10, color: '#4d4d4a', letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 700 }}>
                Try adjacent
              </span>
              <div style={{ flex: 1, height: 1, background: '#dcdcd6' }}></div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                'PhD application advice — any field',
                'International student support',
                'Grad school admissions reviewers',
                'Friends in biotech',
              ].map(s => (
                <button key={s} style={{
                  padding: '8px 14px', borderRadius: 999, fontSize: 12.5, fontWeight: 500,
                  background: '#fff', color: '#0c0c0b', border: '1px solid #dcdcd6', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}>
                  {Icon.search(11)} {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DirectionB6v2, B6ChipVariants, DirectionB6Empty, DirectionB6NoResults });
