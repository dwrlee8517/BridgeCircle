/* eslint-disable */
// Atrium Design System — Data Display (Section 34)
// Sortable table · pagination · selection · density toggle · bulk actions.

function DataDisplaySection() {
  return (
    <DSSection id="datadisplay" eyebrow="Components · 34" title="Data Display">

      <DSSub title="Sortable, selectable table — directory admin view">
        <DirectoryTable />
      </DSSub>

      <DSSub title="Pagination — two patterns side by side">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          <VariantCard label="Numbered pagination" note="Use when total count is known and meaningful.">
            <NumberedPagination />
          </VariantCard>
          <VariantCard label="Load-more" note="Use when the list streams or count is unstable.">
            <LoadMorePagination />
          </VariantCard>
        </div>
      </DSSub>

      <DSSub title="Empty + loading states for tables">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          <VariantCard label="Loading state" note="Skeleton rows match the real row shape.">
            <TableLoadingState />
          </VariantCard>
          <VariantCard label="Empty state" note="Don't show empty headers — replace the whole table.">
            <TableEmptyState />
          </VariantCard>
        </div>
      </DSSub>

    </DSSection>
  );
}

// ─── DIRECTORY TABLE ───────────────────────────────────────────────────────

const TABLE_ROWS = [
  { id: 1, name: 'Iris Okonkwo',     init: 'IO', cohort: "'11", city: 'Brooklyn',    role: 'VP Investments',     company: 'Common Capital',  open: 'mentor',  active: '2h' },
  { id: 2, name: 'Dev Patel',        init: 'DP', cohort: "'11", city: 'San Francisco',role: 'Partner',           company: 'Greenleaf VC',     open: 'mentor',  active: '5h' },
  { id: 3, name: 'Maren Holt',       init: 'MH', cohort: "'14", city: 'Brooklyn',    role: 'Product lead',       company: 'Topfield',         open: 'advice',  active: '1d' },
  { id: 4, name: 'Rosa Ferrara',     init: 'RF', cohort: "'17", city: 'Lagos',       role: 'CEO',                company: 'Solaris Grid',     open: 'mentor',  active: '3d' },
  { id: 5, name: 'Sam Aldridge',     init: 'SA', cohort: "'11", city: 'Brooklyn',    role: 'Climate engineer',   company: 'Watershed',        open: 'advice',  active: '6h' },
  { id: 6, name: 'Theo Harrington',  init: 'TH', cohort: "'20", city: 'Brooklyn',    role: 'Product',            company: 'Waymark',          open: 'mentee',  active: '1d' },
  { id: 7, name: 'Juno Park',        init: 'JP', cohort: "'18", city: 'Seoul',       role: 'Design lead',        company: 'Studio NK',        open: 'mentor',  active: '4d' },
  { id: 8, name: 'Lena Vasquez',     init: 'LV', cohort: "'13", city: 'Mexico CDMX', role: 'Director',           company: 'Watershed Fund',   open: 'advice',  active: '8d' },
];

function DirectoryTable() {
  const [sort, setSort] = React.useState({ key: 'name', dir: 'asc' });
  const [selected, setSelected] = React.useState(new Set());
  const [density, setDensity] = React.useState('comfortable'); // compact | comfortable | roomy

  const rows = React.useMemo(() => {
    const out = [...TABLE_ROWS].sort((a, b) => {
      const va = String(a[sort.key]).toLowerCase();
      const vb = String(b[sort.key]).toLowerCase();
      return sort.dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return out;
  }, [sort]);

  const toggleRow = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    setSelected(prev => prev.size === rows.length ? new Set() : new Set(rows.map(r => r.id)));
  };
  const sortBy = (key) => {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  };

  const rowPadY = density === 'compact' ? 8 : density === 'roomy' ? 18 : 12;
  const allSelected = selected.size > 0 && selected.size === rows.length;

  const COLS = [
    { key: 'name',    label: 'Member',     w: '1.4fr', sortable: true },
    { key: 'cohort',  label: 'Cohort',     w: '64px',  sortable: true },
    { key: 'city',    label: 'City',       w: '1fr',   sortable: true },
    { key: 'role',    label: 'Role',       w: '1.6fr', sortable: true },
    { key: 'open',    label: 'Open to',    w: '120px', sortable: true },
    { key: 'active',  label: 'Active',     w: '70px',  sortable: true },
  ];
  const gridTemplate = `28px ${COLS.map(c => c.w).join(' ')}`;
  const openColor = { mentor: DSC.accent, advice: DSC.ok, mentee: DSC.muted };

  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>

      {/* Toolbar */}
      {selected.size > 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: DSC.ink, color: DSC.paper, gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: DSF.body, fontSize: 12.5, fontWeight: 600 }}>{selected.size} selected</span>
            <button onClick={() => setSelected(new Set())} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontFamily: DSF.body, fontSize: 12, cursor: 'pointer', padding: 0 }}>Clear</button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <DSButton size="sm" variant="primary" leadIcon={<Icon name="send" size={12} color="currentColor" />}>Send intro</DSButton>
            <DSButton size="sm" variant="outline" leadIcon={<Icon name="bookmark" size={12} color="currentColor" />} style={{ background: 'transparent', color: DSC.paper, borderColor: 'rgba(255,255,255,0.25)' }}>Save</DSButton>
            <DSButton size="sm" variant="ghost" style={{ color: 'rgba(255,255,255,0.7)' }} leadIcon={<Icon name="close" size={12} color="currentColor" />}>Hide</DSButton>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: DSC.cardAlt, borderBottom: `1px solid ${DSC.rule}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: DSF.body, fontSize: 12.5, color: DSC.muted }}>
            <strong style={{ color: DSC.ink, fontWeight: 700 }}>{rows.length}</strong> members · sorted by <strong style={{ color: DSC.ink, fontWeight: 600 }}>{sort.key}</strong> ({sort.dir})
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>Density</span>
            <div style={{ display: 'inline-flex', gap: 2, background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 999, padding: 2 }}>
              {['compact', 'comfortable', 'roomy'].map(d => (
                <button key={d} onClick={() => setDensity(d)} style={{ padding: '3px 10px', background: density === d ? DSC.ink : 'transparent', color: density === d ? DSC.paper : DSC.muted, border: 'none', borderRadius: 999, fontFamily: DSF.body, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  {d[0].toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: gridTemplate, gap: 10, padding: `8px 16px`, background: DSC.panel, borderBottom: `1px solid ${DSC.rule}`, fontFamily: DSF.mono, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: DSC.muted, fontWeight: 700, alignItems: 'center' }}>
        <Checkbox checked={allSelected} indeterminate={selected.size > 0 && !allSelected} onChange={toggleAll} />
        {COLS.map(c => (
          <button key={c.key} onClick={() => c.sortable && sortBy(c.key)} style={{ background: 'none', border: 'none', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 4, padding: 0, cursor: c.sortable ? 'pointer' : 'default', fontFamily: DSF.mono, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: sort.key === c.key ? DSC.ink : DSC.muted, fontWeight: 700 }}>
            {c.label}
            {sort.key === c.key && (
              <span style={{ display: 'inline-flex' }}>
                <Icon name={sort.dir === 'asc' ? 'chevron-up' : 'chevron-down'} size={10} color="currentColor" />
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Rows */}
      {rows.map((r, i) => {
        const isSel = selected.has(r.id);
        return (
          <div key={r.id} style={{ display: 'grid', gridTemplateColumns: gridTemplate, gap: 10, padding: `${rowPadY}px 16px`, borderTop: i === 0 ? 'none' : `1px solid ${DSC.ruleSoft}`, alignItems: 'center', background: isSel ? dshex(DSC.accent, 0.06) : 'transparent', cursor: 'pointer', transition: 'background 80ms ease' }}
            onClick={(e) => { if (e.target.tagName !== 'INPUT') toggleRow(r.id); }}>
            <Checkbox checked={isSel} onChange={() => toggleRow(r.id)} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <DSAvatar name={r.name} initials={r.init} size={density === 'compact' ? 24 : 28} />
              <span style={{ fontFamily: DSF.body, fontSize: 13, fontWeight: 600, color: DSC.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
            </div>
            <span style={{ fontFamily: DSF.mono, fontSize: 11, color: DSC.accent, letterSpacing: '0.06em', fontWeight: 700 }}>{r.cohort}</span>
            <span style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.ink2 }}>{r.city}</span>
            <span style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.role} · <span style={{ color: DSC.ink2 }}>{r.company}</span></span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: DSF.body, fontSize: 11.5, fontWeight: 600, color: openColor[r.open] }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor' }} />
              {r.open}
            </span>
            <span style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.mute2, letterSpacing: '0.04em' }}>{r.active}</span>
          </div>
        );
      })}

      {/* Footer / pagination */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: `1px solid ${DSC.rule}`, background: DSC.cardAlt }}>
        <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted }}>
          Showing <strong style={{ color: DSC.ink, fontWeight: 600 }}>1–{rows.length}</strong> of 1,284 members
        </div>
        <NumberedPagination compact />
      </div>
    </div>
  );
}

function Checkbox({ checked, indeterminate, onChange }) {
  return (
    <button onClick={onChange} role="checkbox" aria-checked={checked} style={{ width: 18, height: 18, borderRadius: 5, background: checked || indeterminate ? DSC.accent : DSC.card, border: `1.5px solid ${checked || indeterminate ? DSC.accent : DSC.muted}`, cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 0, transition: 'background 100ms, border-color 100ms' }}>
      {checked && <Icon name="check" size={11} color="#fff" strokeWidth={3.2} />}
      {indeterminate && !checked && <span style={{ width: 8, height: 2, background: '#fff', borderRadius: 2 }} />}
    </button>
  );
}

// ─── PAGINATION ────────────────────────────────────────────────────────────

function NumberedPagination({ compact }) {
  const [page, setPage] = React.useState(1);
  const pages = compact ? [1, 2, 3] : [1, 2, 3, 4, 5];
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      <PageButton disabled={page === 1} onClick={() => setPage(p => p - 1)} aria-label="Previous">
        <Icon name="chevron-left" size={11} color="currentColor" />
      </PageButton>
      {pages.map(p => (
        <PageButton key={p} active={p === page} onClick={() => setPage(p)}>{p}</PageButton>
      ))}
      {!compact && (
        <>
          <span style={{ color: DSC.mute2, fontFamily: DSF.mono, fontSize: 11, padding: '0 4px' }}>…</span>
          <PageButton onClick={() => setPage(86)}>86</PageButton>
        </>
      )}
      <PageButton onClick={() => setPage(p => p + 1)} aria-label="Next">
        <Icon name="chevron-right" size={11} color="currentColor" />
      </PageButton>
    </div>
  );
}

function PageButton({ active, disabled, onClick, children, ...rest }) {
  return (
    <button onClick={onClick} disabled={disabled} {...rest} style={{ minWidth: 28, height: 28, padding: '0 8px', background: active ? DSC.ink : 'transparent', color: active ? DSC.paper : (disabled ? DSC.mute2 : DSC.ink), border: active ? `1px solid ${DSC.ink}` : `1px solid ${DSC.rule}`, borderRadius: 7, fontFamily: DSF.body, fontSize: 12, fontWeight: 600, cursor: disabled ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.4 : 1, transition: 'background 100ms, color 100ms' }}>
      {children}
    </button>
  );
}

function LoadMorePagination() {
  const [count, setCount] = React.useState(20);
  const [loading, setLoading] = React.useState(false);
  const load = () => {
    setLoading(true);
    setTimeout(() => { setCount(c => c + 20); setLoading(false); }, 900);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '20px 0 4px' }}>
      <div style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.muted }}>
        Showing <strong style={{ color: DSC.ink, fontWeight: 600 }}>{count}</strong> of <strong style={{ color: DSC.ink, fontWeight: 600 }}>1,284</strong>
      </div>
      <DSButton size="sm" variant="outline" onClick={load} disabled={loading} leadIcon={loading ? <Spinner color={DSC.muted} size={12} /> : null}>
        {loading ? 'Loading…' : `Load 20 more`}
      </DSButton>
      <div style={{ width: '100%', maxWidth: 240, height: 3, background: DSC.rule, borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(count / 1284) * 100}%`, background: DSC.accent, borderRadius: 999, transition: 'width 320ms ease' }} />
      </div>
    </div>
  );
}

// ─── EMPTY / LOADING STATES ────────────────────────────────────────────────

function TableLoadingState() {
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ background: DSC.panel, padding: '8px 16px', height: 30 }} />
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '32px 1.5fr 60px 1fr 80px', gap: 10, padding: '14px 16px', borderTop: i === 0 ? 'none' : `1px solid ${DSC.ruleSoft}`, alignItems: 'center' }}>
          <div style={{ width: 24, height: 24, borderRadius: 999, background: dshex(DSC.rule, 0.6), animation: `ds-shimmer 1.6s ease-in-out infinite`, animationDelay: `${i * 120}ms` }} />
          <div style={{ height: 12, background: dshex(DSC.rule, 0.6), borderRadius: 4, width: '70%', animation: `ds-shimmer 1.6s ease-in-out infinite`, animationDelay: `${i * 120}ms` }} />
          <div style={{ height: 10, background: dshex(DSC.rule, 0.6), borderRadius: 4, animation: `ds-shimmer 1.6s ease-in-out infinite`, animationDelay: `${i * 120}ms` }} />
          <div style={{ height: 10, background: dshex(DSC.rule, 0.6), borderRadius: 4, width: '85%', animation: `ds-shimmer 1.6s ease-in-out infinite`, animationDelay: `${i * 120}ms` }} />
          <div style={{ height: 18, background: dshex(DSC.rule, 0.6), borderRadius: 999, animation: `ds-shimmer 1.6s ease-in-out infinite`, animationDelay: `${i * 120}ms` }} />
        </div>
      ))}
    </div>
  );
}

function TableEmptyState() {
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 12, padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10 }}>
      <svg aria-hidden="true" width="80" height="56" viewBox="0 0 200 130">
        <circle cx="75" cy="65" r="44" fill="none" stroke={DSC.accent} strokeOpacity="0.55" strokeWidth="1.5" />
        <circle cx="125" cy="65" r="44" fill="none" stroke={DSC.ok}     strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="4 4" />
      </svg>
      <div style={{ fontFamily: DSF.display, fontSize: 17, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.015em', marginTop: 4 }}>No members match your filters.</div>
      <div style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.muted, lineHeight: 1.5, maxWidth: 280 }}>Try removing a filter, or broaden the cohort range.</div>
      <DSButton size="sm" variant="outline" style={{ marginTop: 4 }}>Clear all filters</DSButton>
    </div>
  );
}

window.DataDisplaySection = DataDisplaySection;
