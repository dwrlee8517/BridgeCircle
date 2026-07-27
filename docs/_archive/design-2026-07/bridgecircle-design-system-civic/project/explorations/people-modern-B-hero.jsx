// Direction B — Hero treatments
// Same left-rail + right-list layout as B. Three takes on the page header:
//   B6 — No hero (straight to results, query is a chip in the toolbar)
//   B7 — Iconic numeric (the "36" is the mark)
//   B8 — Network sigil (small bold motif + tight query line)

// ─── Shared shell ─────────────────────────────────────────────────────────
function BShell({ hero, children }) {
  return (
    <div style={{ width: '100%', minHeight: '100%', background: '#fafaf9' }}>
      {hero}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 32, padding: '28px 56px 64px' }}>
        <FilterRail />
        <div>
          {children}
        </div>
      </div>
    </div>
  );
}

function BResultList({ toolbar, featuredIdx = 0 }) {
  return (
    <>
      {toolbar}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {PEOPLE_MODERN.map((p, i) => <StripRow key={p.id} p={p} featured={i === featuredIdx} />)}
      </div>
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════
//  B6 — No hero
// ═════════════════════════════════════════════════════════════════════════
function DirectionB6() {
  return (
    <BShell
      hero={
        // Just a thin context strip — no display heading, no big copy.
        <div style={{
          background: '#fafaf9', borderBottom: '1px solid #dcdcd6',
          padding: '14px 56px',
          display: 'flex', alignItems: 'center', gap: 16,
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
      }
    >
      {/* Active-query chip + facets — replaces the hero's editorial framing */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        padding: '0 0 16px', marginBottom: 16, borderBottom: '1px solid #dcdcd6',
      }}>
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
          Moving from consulting into product management
          <button style={{
            background: 'none', border: 'none', color: '#4d4d4a', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            padding: 0, width: 14, height: 14,
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12"></path>
            </svg>
          </button>
        </span>
        <span style={{ width: 1, height: 18, background: '#dcdcd6' }}></span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 999, fontSize: 11.5, fontWeight: 600,
          background: 'rgba(37,99,235,0.08)', color: '#2563eb', border: '1px solid rgba(37,99,235,0.18)',
        }}>
          {Icon.sparkle(11)} AI ranked
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 999, fontSize: 11.5, fontWeight: 600,
          background: '#fff', color: '#0c0c0b', border: '1px solid #dcdcd6',
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#3b6e51' }}></span>
          Open now <span className="mono" style={{ fontSize: 10, color: '#4d4d4a', fontWeight: 500 }}>12</span>
        </span>
        <div style={{ flex: 1 }}></div>
        <button className="btn btn-ghost btn-sm">Sort: Best match {Icon.chevron(11)}</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {PEOPLE_MODERN.map((p, i) => <StripRow key={p.id} p={p} featured={i === 0} />)}
      </div>
    </BShell>
  );
}

// ═════════════════════════════════════════════════════════════════════════
//  B7 — Iconic numeric ("36" is the mark)
// ═════════════════════════════════════════════════════════════════════════
function DirectionB7() {
  return (
    <BShell
      hero={
        <div style={{
          background: '#fafaf9', borderBottom: '1px solid #dcdcd6', padding: '36px 56px 32px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            {/* The iconic numeric mark */}
            <div style={{
              position: 'relative', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 132, height: 132,
            }}>
              {/* Concentric rings */}
              <svg width="132" height="132" viewBox="0 0 132 132" style={{ position: 'absolute', inset: 0 }}>
                <circle cx="66" cy="66" r="64" fill="none" stroke="#dcdcd6" strokeWidth="1" />
                <circle cx="66" cy="66" r="52" fill="none" stroke="#ebebe5" strokeWidth="1" />
                <circle cx="66" cy="66" r="40" fill="none" stroke="#f4f3ee" strokeWidth="1" />
                {/* Node dots arranged like a network */}
                <circle cx="66" cy="2" r="3" fill="#2563eb" />
                <circle cx="118" cy="44" r="2.5" fill="#3b6e51" />
                <circle cx="106" cy="106" r="2.5" fill="#722f37" />
                <circle cx="26" cy="106" r="2.5" fill="#a16207" />
                <circle cx="14" cy="44" r="2.5" fill="#0c0c0b" />
              </svg>
              <div style={{ position: 'relative', textAlign: 'center' }}>
                <div className="display" style={{
                  fontSize: 56, fontWeight: 600, lineHeight: 1, letterSpacing: '-0.04em', color: '#0c0c0b',
                }}>36</div>
                <div className="mono" style={{
                  fontSize: 9.5, color: '#4d4d4a', letterSpacing: 0.8, textTransform: 'uppercase',
                  fontWeight: 700, marginTop: 4,
                }}>in your circle</div>
              </div>
            </div>

            {/* Right side: query + search */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="kicker" style={{ marginBottom: 8 }}>You asked</div>
              <div className="display" style={{
                fontSize: 26, fontWeight: 500, fontStyle: 'italic', color: '#0c0c0b',
                lineHeight: 1.25, maxWidth: 680,
              }}>
                "Moving from consulting into product management"
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14, fontSize: 12, color: '#4d4d4a' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b6e51' }}></span>
                  <strong style={{ color: '#3b6e51', fontWeight: 600 }}>12 open</strong> right now
                </span>
                <span><strong style={{ color: '#0c0c0b', fontWeight: 600 }}>8</strong> strong matches</span>
                <span><strong style={{ color: '#0c0c0b', fontWeight: 600 }}>5</strong> in your cohort</span>
                <span><strong style={{ color: '#2563eb', fontWeight: 600 }}>3</strong> friends</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
                <SearchBarLarge />
                <button className="btn btn-ghost btn-sm">Refine ask {Icon.arrow(12)}</button>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <BResultList toolbar={<DefaultToolbar />} />
    </BShell>
  );
}

// ═════════════════════════════════════════════════════════════════════════
//  B8 — Network sigil
// ═════════════════════════════════════════════════════════════════════════
function DirectionB8() {
  return (
    <BShell
      hero={
        <div style={{
          background: '#081126', color: '#fafaf9', padding: '32px 56px 28px',
          position: 'relative', overflow: 'hidden',
          borderBottom: '1px solid #081126',
        }}>
          {/* Decorative ambient mark */}
          <NetworkSigil
            style={{ position: 'absolute', right: -40, top: -40, width: 280, height: 280, opacity: 0.18 }}
            color="#93c5fd"
          />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 18 }}>
            {/* Foreground sigil */}
            <div style={{
              flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 64, height: 64, borderRadius: 14,
              background: 'rgba(250,250,249,0.06)', border: '1px solid rgba(250,250,249,0.14)',
            }}>
              <NetworkSigil style={{ width: 36, height: 36 }} color="#93c5fd" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="kicker" style={{ color: '#93c5fd', marginBottom: 6 }}>People · your circle</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
                <span className="display" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.015em' }}>
                  "Moving from consulting into product management"
                </span>
                <span className="mono" style={{ fontSize: 11.5, color: 'rgba(250,250,249,0.55)', letterSpacing: 0.6 }}>
                  36 results · 12 open now
                </span>
              </div>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(250,250,249,0.06)', border: '1px solid rgba(250,250,249,0.16)',
              borderRadius: 999, padding: '6px 6px 6px 14px', minWidth: 320,
            }}>
              <span style={{ color: 'rgba(250,250,249,0.55)', display: 'flex' }}>{Icon.search(13)}</span>
              <input type="text" placeholder="Refine your ask…" style={{
                flex: 1, border: 'none', outline: 'none', fontSize: 12.5,
                background: 'transparent', color: '#fafaf9',
              }} />
              <button style={{
                background: '#fafaf9', color: '#081126', border: 'none', borderRadius: 999,
                height: 28, padding: '0 14px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
              }}>Search</button>
            </div>
          </div>
        </div>
      }
    >
      <BResultList toolbar={<DefaultToolbar />} />
    </BShell>
  );
}

// ─── Iconic network sigil ────────────────────────────────────────────────
// Five nodes in a pentagonal arrangement with weighted connections —
// the BridgeCircle network motif reduced to a glyph.
function NetworkSigil({ color = '#2563eb', style = {} }) {
  return (
    <svg viewBox="0 0 64 64" style={style}>
      {/* Connections */}
      <g stroke={color} strokeWidth="1.2" opacity="0.5" fill="none">
        <line x1="32" y1="8"  x2="56" y2="26" />
        <line x1="32" y1="8"  x2="8"  y2="26" />
        <line x1="32" y1="8"  x2="32" y2="44" />
        <line x1="56" y1="26" x2="46" y2="56" />
        <line x1="8"  y1="26" x2="18" y2="56" />
        <line x1="32" y1="44" x2="46" y2="56" />
        <line x1="32" y1="44" x2="18" y2="56" />
        <line x1="56" y1="26" x2="8"  y2="26" opacity="0.3" />
      </g>
      {/* Nodes */}
      <circle cx="32" cy="8"  r="4" fill={color} />
      <circle cx="56" cy="26" r="3" fill={color} />
      <circle cx="8"  cy="26" r="3" fill={color} />
      <circle cx="46" cy="56" r="3" fill={color} />
      <circle cx="18" cy="56" r="3" fill={color} />
      <circle cx="32" cy="44" r="5" fill={color} stroke={color} strokeWidth="2" />
      <circle cx="32" cy="44" r="2" fill="#fafaf9" opacity="0.95" />
    </svg>
  );
}

// ─── Default toolbar (shared between B7, B8) ─────────────────────────────
function DefaultToolbar() {
  return (
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
  );
}

Object.assign(window, { DirectionB6, DirectionB7, DirectionB8 });
