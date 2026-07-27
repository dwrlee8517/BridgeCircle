/* eslint-disable */
// Atrium Design System — Search Results (Section 43)
// The directory results page — facets + result rows + meta header.

const FACET_DATA = {
  cohort:   [{ id: '11', label: "Class of '11", count: 47 }, { id: '14', label: "Class of '14", count: 38 }, { id: '17', label: "Class of '17", count: 52 }, { id: '20', label: "Class of '20", count: 33 }],
  city:     [{ id: 'bk', label: 'Brooklyn', count: 124 }, { id: 'sf', label: 'San Francisco', count: 89 }, { id: 'la', label: 'Lagos', count: 14 }, { id: 'lo', label: 'London', count: 47 }, { id: 'me', label: 'Mexico CDMX', count: 12 }],
  open:     [{ id: 'mentor', label: 'Open to mentor', count: 347 }, { id: 'advice', label: 'Open to advice', count: 228 }, { id: 'hiring', label: 'Hiring', count: 41 }, { id: 'intros', label: 'Open to intros', count: 412 }],
  field:    [{ id: 'cli', label: 'Climate', count: 86 }, { id: 'fin', label: 'Finance', count: 142 }, { id: 'des', label: 'Design', count: 67 }, { id: 'eng', label: 'Engineering', count: 178 }, { id: 'pol', label: 'Policy', count: 32 }],
};

const RESULT_ROWS = [
  { id: 1, name: 'Iris Okonkwo',    init: 'IO', cohort: "'11", city: 'Brooklyn',     role: 'VP Investments',     company: 'Common Capital', match: ['Climate', 'Underwriting', 'Brooklyn'], snippet: 'Spent five years underwriting climate infrastructure — open to advising first-time climate fintech founders.', tags: ['Mentor'] },
  { id: 2, name: 'Dev Patel',       init: 'DP', cohort: "'11", city: 'San Francisco', role: 'Partner',           company: 'Greenleaf Ventures', match: ['Climate', 'VC'], snippet: 'Focused on climate infrastructure deals; led three rounds in the last 18 months across geothermal and storage.', tags: ['Mentor'] },
  { id: 3, name: 'Rosa Ferrara',    init: 'RF', cohort: "'17", city: 'Lagos',         role: 'CEO',               company: 'Solaris Grid',   match: ['Climate', 'Operator', 'Lagos'], snippet: 'Operator-turned-VC who runs a distributed solar company across West Africa; advises four early-stage climate companies.', tags: ['Mentor', 'Advice'] },
  { id: 4, name: 'Sam Aldridge',    init: 'SA', cohort: "'11", city: 'Brooklyn',      role: 'Climate engineer',  company: 'Watershed',      match: ['Climate', 'Underwriting'], snippet: 'Reformulating how reinsurance models climate risk — happy to share notes on the underwriting deck.', tags: ['Advice'] },
];

function SearchResultsSection() {
  return (
    <DSSection id="search" eyebrow="Components · 43" title="Search Results Page">

      <DSSub title="Full results layout — facets + meta header + rows">
        <SearchResultsPage />
      </DSSub>

      <DSSub title="Atoms — how the result row builds up">
        <SearchAtoms />
      </DSSub>

    </DSSection>
  );
}

function SearchResultsPage() {
  const [query, setQuery] = React.useState('climate underwriting');
  const [sort, setSort] = React.useState('relevance');
  const [active, setActive] = React.useState({ open: ['mentor'], field: ['cli'] });

  const toggle = (key, id) => {
    setActive(a => {
      const cur = a[key] || [];
      const next = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id];
      return { ...a, [key]: next };
    });
  };

  const activeCount = Object.values(active).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 16, overflow: 'hidden' }}>
      {/* Page header */}
      <div style={{ padding: '20px 26px 16px', background: DSC.cardAlt, borderBottom: `1px solid ${DSC.rule}` }}>
        <DSEyebrow accent>Directory · 1,284 members</DSEyebrow>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 999, padding: '6px 10px 6px 18px' }}>
          <Icon name="search" size={16} color={DSC.muted} />
          <input value={query} onChange={e => setQuery(e.target.value)} style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: DSF.body, fontSize: 14.5, color: DSC.ink }} />
          <button onClick={() => setQuery('')} aria-label="Clear" style={{ background: 'none', border: 'none', cursor: 'pointer', color: DSC.muted, padding: '0 6px' }}>
            <Icon name="close" size={13} color="currentColor" />
          </button>
          <DSButton size="sm">Search</DSButton>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24, padding: '20px 26px 24px' }}>
        {/* Facets sidebar */}
        <aside>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <span style={{ fontFamily: DSF.display, fontSize: 14, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.01em' }}>Refine</span>
            {activeCount > 0 && <button onClick={() => setActive({})} style={{ background: 'none', border: 'none', color: DSC.accent, fontFamily: DSF.body, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', padding: 0 }}>Clear all</button>}
          </div>
          {[
            { key: 'open',   label: 'Open to' },
            { key: 'field',  label: 'Field' },
            { key: 'cohort', label: 'Cohort' },
            { key: 'city',   label: 'City' },
          ].map((g, gi) => (
            <FacetGroup key={g.key} group={g} items={FACET_DATA[g.key]} active={active[g.key] || []} onToggle={(id) => toggle(g.key, id)} last={gi === 3} />
          ))}
        </aside>

        {/* Main results column */}
        <div>
          {/* Meta header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontFamily: DSF.body, fontSize: 13.5, color: DSC.muted }}>
              Showing <strong style={{ color: DSC.ink, fontWeight: 700 }}>4</strong> of <strong style={{ color: DSC.ink, fontWeight: 700 }}>75</strong> members matching <strong style={{ color: DSC.ink, fontWeight: 700 }}>"{query}"</strong>{activeCount > 0 && <> · {activeCount} filter{activeCount !== 1 ? 's' : ''}</>}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, marginRight: 4 }}>Sort</span>
              <div style={{ display: 'inline-flex', gap: 2, background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: 999, padding: 2 }}>
                {[
                  { id: 'relevance', label: 'Match' },
                  { id: 'recent',    label: 'Recent' },
                  { id: 'name',      label: 'Name' },
                ].map(s => (
                  <button key={s.id} onClick={() => setSort(s.id)} style={{ padding: '5px 12px', background: sort === s.id ? DSC.ink : 'transparent', color: sort === s.id ? DSC.paper : DSC.muted, border: 'none', borderRadius: 999, fontFamily: DSF.body, fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>{s.label}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {activeCount > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16, padding: '10px 12px', background: dshex(DSC.accent, 0.06), border: `1px solid ${dshex(DSC.accent, 0.22)}`, borderRadius: 999 }}>
              <span style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.accent, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, marginRight: 4, alignSelf: 'center' }}>Active</span>
              {Object.entries(active).flatMap(([key, ids]) =>
                ids.map(id => {
                  const item = FACET_DATA[key]?.find(x => x.id === id);
                  if (!item) return null;
                  return (
                    <button key={`${key}-${id}`} onClick={() => toggle(key, id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 5px 3px 11px', background: DSC.card, border: `1px solid ${dshex(DSC.accent, 0.30)}`, borderRadius: 999, fontFamily: DSF.body, fontSize: 12, fontWeight: 600, color: DSC.ink, cursor: 'pointer' }}>
                      {item.label}
                      <span style={{ width: 16, height: 16, borderRadius: 999, background: dshex(DSC.accent, 0.18), color: DSC.accent, display: 'grid', placeItems: 'center' }}>
                        <Icon name="close" size={9} color="currentColor" strokeWidth={2.6} />
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Result rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {RESULT_ROWS.map((r, i) => <SearchResultRow key={r.id} r={r} query={query} rank={i + 1} />)}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
            <DSButton size="sm" variant="outline">Load 20 more →</DSButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function FacetGroup({ group, items, active, onToggle, last }) {
  const [expanded, setExpanded] = React.useState(true);
  return (
    <div style={{ paddingBottom: 14, marginBottom: 14, borderBottom: last ? 'none' : `1px solid ${DSC.ruleSoft}` }}>
      <button onClick={() => setExpanded(e => !e)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginBottom: 8 }}>
        <span style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>{group.label}{active.length > 0 && <span style={{ color: DSC.accent, marginLeft: 6 }}>· {active.length}</span>}</span>
        <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={11} color={DSC.muted} />
      </button>
      {expanded && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {items.map(it => {
            const on = active.includes(it.id);
            return (
              <li key={it.id}>
                <button onClick={() => onToggle(it.id)} style={{ width: '100%', display: 'grid', gridTemplateColumns: '14px 1fr auto', gap: 8, alignItems: 'center', padding: '5px 6px', background: 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: DSF.body, fontSize: 12.5, color: on ? DSC.ink : DSC.ink2, textAlign: 'left', fontWeight: on ? 600 : 500, transition: 'background 80ms ease' }}
                  onMouseEnter={e => e.currentTarget.style.background = dshex(DSC.ink, 0.04)}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span style={{ width: 13, height: 13, borderRadius: 3, background: on ? DSC.accent : DSC.card, border: `1.5px solid ${on ? DSC.accent : DSC.muted}`, display: 'grid', placeItems: 'center', justifySelf: 'center' }}>
                    {on && <Icon name="check" size={8} color="#fff" strokeWidth={3.4} />}
                  </span>
                  <span>{it.label}</span>
                  <span style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.mute2, letterSpacing: '0.04em' }}>{it.count}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// Highlight matched terms in a snippet
function Highlight({ text, terms }) {
  if (!terms || terms.length === 0) return <>{text}</>;
  const pattern = new RegExp(`(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(pattern);
  return <>{parts.map((p, i) => pattern.test(p) ? <mark key={i} style={{ background: dshex(DSC.accent, 0.20), color: DSC.ink, padding: '0 2px', borderRadius: 3, fontWeight: 600 }}>{p}</mark> : <span key={i}>{p}</span>)}</>;
}

function SearchResultRow({ r, query, rank }) {
  const terms = query.split(/\s+/).filter(t => t.length > 2);
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 12, padding: '14px 16px', display: 'grid', gridTemplateColumns: '44px 1fr auto', gap: 14, alignItems: 'flex-start', cursor: 'pointer', transition: 'border-color 100ms ease, transform 100ms ease', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = DSC.ink; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = DSC.rule; e.currentTarget.style.transform = 'translateY(0)'; }}>
      <DSAvatar name={r.name} initials={r.init} size={44} />
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: DSF.display, fontSize: 16, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.015em' }}>{r.name}</span>
          <span style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.accent, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>{r.cohort} · {r.city}</span>
          {r.tags.map(t => (
            <span key={t} style={{ background: dshex(DSC.accent, 0.13), color: DSC.accent, fontFamily: DSF.body, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, letterSpacing: '0.04em' }}>{t}</span>
          ))}
        </div>
        <div style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.muted, marginTop: 3 }}>{r.role} · {r.company}</div>
        <p style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.ink2, lineHeight: 1.55, margin: '8px 0 0' }}>
          <Highlight text={r.snippet} terms={terms} />
        </p>
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, alignSelf: 'center' }}>Matched on</span>
          {r.match.map(m => (
            <span key={m} style={{ fontFamily: DSF.body, fontSize: 11, fontWeight: 600, color: DSC.ink2, background: dshex(DSC.accent, 0.10), border: `1px solid ${dshex(DSC.accent, 0.22)}`, padding: '2px 9px', borderRadius: 999 }}>{m}</span>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
        <span style={{ fontFamily: DSF.mono, fontSize: 9, color: DSC.mute2, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>Rank · #{rank}</span>
        <DSButton size="sm">Reach out →</DSButton>
      </div>
    </div>
  );
}

function SearchAtoms() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
      <VariantCard label="Match-on chip" note="Shows which fields contributed to the result.">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['Climate', 'Underwriting', 'Brooklyn'].map(m => (
            <span key={m} style={{ fontFamily: DSF.body, fontSize: 11, fontWeight: 600, color: DSC.ink2, background: dshex(DSC.accent, 0.10), border: `1px solid ${dshex(DSC.accent, 0.22)}`, padding: '3px 10px', borderRadius: 999 }}>{m}</span>
          ))}
        </div>
      </VariantCard>

      <VariantCard label="Highlighted snippet" note="Matched terms wrapped in <mark> with accent fill.">
        <p style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.ink2, lineHeight: 1.55, margin: 0 }}>
          Five years <mark style={{ background: dshex(DSC.accent, 0.20), color: DSC.ink, padding: '0 2px', borderRadius: 3, fontWeight: 600 }}>underwriting</mark> <mark style={{ background: dshex(DSC.accent, 0.20), color: DSC.ink, padding: '0 2px', borderRadius: 3, fontWeight: 600 }}>climate</mark> infrastructure.
        </p>
      </VariantCard>

      <VariantCard label="Result count + filter chip" note="Always tell the user what's been narrowed.">
        <div style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.muted, marginBottom: 10 }}>
          Showing <strong style={{ color: DSC.ink, fontWeight: 700 }}>4</strong> of 1,284 · <strong style={{ color: DSC.ink, fontWeight: 700 }}>2 filters</strong>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['Open to mentor', 'Climate'].map(m => (
            <span key={m} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 5px 3px 11px', background: DSC.card, border: `1px solid ${dshex(DSC.accent, 0.30)}`, borderRadius: 999, fontFamily: DSF.body, fontSize: 11.5, fontWeight: 600, color: DSC.ink }}>
              {m}
              <span style={{ width: 15, height: 15, borderRadius: 999, background: dshex(DSC.accent, 0.18), color: DSC.accent, display: 'grid', placeItems: 'center' }}><Icon name="close" size={8} color="currentColor" strokeWidth={2.6} /></span>
            </span>
          ))}
        </div>
      </VariantCard>
    </div>
  );
}

window.SearchResultsSection = SearchResultsSection;
