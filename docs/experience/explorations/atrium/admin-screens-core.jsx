/* eslint-disable */
// Atrium admin — Overview, Approvals, Members screens.

function AdminOverview() {
  const t = React.useContext(ThemeCtx);
  const { goto } = useAdminRoute();
  const { PENDING_APPROVALS, ADMIN_MEMBERS, ANALYTICS, ADMIN_ACTIVITY, ADMIN_VIEWER } = window.BC_ADMIN;

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px 64px' }}>
      {/* Hero */}
      <div style={{ marginBottom: 28 }}>
        <AtriumEyebrow accent>Good afternoon, {ADMIN_VIEWER.firstName} · admin overview</AtriumEyebrow>
        <h1 style={{ ...t.display, fontSize: 44, margin: '12px 0 0', maxWidth: 760 }}>
          {PENDING_APPROVALS.length} waiting on review. <span style={{ color: t.palette.muted }}>148 members in the circle.</span>
        </h1>
      </div>

      {/* KPI tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
        <AdminStatTile value={ANALYTICS.totals.activeMembers} label="Active members" trend="+8%" sub="vs. last quarter" />
        <AdminStatTile value={PENDING_APPROVALS.length} label="Pending approvals" sub="Avg. wait: 2 days" accent />
        <AdminStatTile value={ANALYTICS.totals.newThisMonth} label="New this month" trend="+3" sub="vs. last month" />
        <AdminStatTile value={ANALYTICS.totals.askVolume30d} label="Asks · last 30d" trend="+12%" sub="Mentor + advice combined" />
      </div>

      {/* Two-column body */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* Pending approvals preview */}
          <div style={t.cardSurface({ padding: 0, overflow: 'hidden' })}>
            <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${t.palette.ruleSoft}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <AtriumEyebrow accent>Waiting on you</AtriumEyebrow>
                <div style={{ ...t.display, fontSize: 20, fontWeight: 600, marginTop: 4 }}>Pending approvals</div>
              </div>
              <AtriumButton size="sm" variant="outline" onClick={() => goto('approvals')}>Review all →</AtriumButton>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {PENDING_APPROVALS.slice(0, 3).map((a, i) => (
                <li key={a.id} style={{
                  padding: '14px 20px',
                  borderBottom: i === 2 ? 'none' : `1px solid ${t.palette.ruleSoft}`,
                  display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 14, alignItems: 'center',
                }}>
                  <AtriumAvatar name={a.name} initials={a.initials} size={40} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{a.name}</span>
                      <span style={{ fontSize: 12, color: t.palette.muted }}>’{String(a.cohort).slice(-2)} · {a.city}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                      {a.verification.status === 'matched'   ? <AdminBadge tone="ok">● Auto-matched</AdminBadge> : null}
                      {a.verification.status === 'partial'   ? <AdminBadge tone="warn">● Partial match</AdminBadge> : null}
                      {a.verification.status === 'unmatched' ? <AdminBadge tone="bad">● No match</AdminBadge> : null}
                      {a.flag ? <AdminBadge tone="bad">Flag: {a.flag}</AdminBadge> : null}
                      <span style={{ fontFamily: t.font.mono, fontSize: 10.5, color: t.palette.mute2, letterSpacing: '0.14em', alignSelf: 'center' }}>{a.appliedAt}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <AtriumButton size="sm">Approve</AtriumButton>
                    <AtriumButton size="sm" variant="outline">Open</AtriumButton>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Recent admin activity */}
          <div style={t.cardSurface({ padding: 20 })}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
              <AtriumEyebrow accent>Admin activity · last 7 days</AtriumEyebrow>
              <span style={{ fontSize: 12, color: t.palette.muted }}>Audit log</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {ADMIN_ACTIVITY.map((a, i) => (
                <li key={i} style={{
                  display: 'grid', gridTemplateColumns: '22px 1fr auto', gap: 10,
                  padding: '10px 0',
                  borderTop: i === 0 ? 'none' : `1px solid ${t.palette.ruleSoft}`,
                  alignItems: 'center',
                }}>
                  <span style={{
                    fontFamily: t.font.mono, fontSize: 10, color: t.palette.accent,
                    border: `1px solid ${t.palette.accent}`, borderRadius: 2,
                    width: 18, height: 18, display: 'grid', placeItems: 'center', fontWeight: 700,
                  }}>{a.type[0].toUpperCase()}</span>
                  <span style={{ fontSize: 13, color: t.palette.ink2 }}>
                    <strong style={{ color: t.palette.ink, fontWeight: 600 }}>{a.who}</strong>
                    <span style={{ color: t.palette.muted }}> {a.what}</span>
                  </span>
                  <span style={{ fontFamily: t.font.mono, fontSize: 11, color: t.palette.mute2, letterSpacing: '0.14em' }}>{a.when}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right column — quick actions + reports */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={t.cardSurface({ padding: 20 })}>
            <AtriumEyebrow accent>Quick actions</AtriumEyebrow>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              <AtriumButton size="md" onClick={() => goto('invite')}>+ Send invites</AtriumButton>
              <AtriumButton size="md" variant="outline" onClick={() => goto('events')}>+ Create event</AtriumButton>
              <AtriumButton size="md" variant="outline" onClick={() => goto('announcements')}>+ Write announcement</AtriumButton>
              <AtriumButton size="md" variant="ghost" onClick={() => goto('analytics')}>Open analytics →</AtriumButton>
            </div>
          </div>

          <div style={t.cardSurface({ padding: 20 })}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
              <AtriumEyebrow accent>Open reports · {ANALYTICS.recentReports.length}</AtriumEyebrow>
              <span style={{ fontSize: 12, color: t.palette.muted }}>Moderation</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {ANALYTICS.recentReports.map((r, i) => (
                <li key={r.id} style={{
                  padding: '10px 0',
                  borderTop: i === 0 ? 'none' : `1px solid ${t.palette.ruleSoft}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10,
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{r.who}</div>
                    <div style={{ fontSize: 12, color: t.palette.muted, marginTop: 2, lineHeight: 1.45 }}>{r.what}</div>
                  </div>
                  <AdminBadge tone={r.status === 'open' ? 'warn' : 'muted'}>{r.status}</AdminBadge>
                </li>
              ))}
            </ul>
            <button style={{
              marginTop: 10, background: 'transparent', border: 'none', cursor: 'pointer',
              color: t.palette.accent, fontFamily: t.font.body, fontSize: 12.5, fontWeight: 600, padding: 0,
            }}>Open moderation queue →</button>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Approvals — list + detail
// ---------------------------------------------------------------------------

function AdminApprovals() {
  const t = React.useContext(ThemeCtx);
  const { PENDING_APPROVALS } = window.BC_ADMIN;
  const { activeApproval, setActiveApproval } = useAdminRoute();
  const [filter, setFilter] = React.useState('all'); // 'all' | 'matched' | 'partial' | 'unmatched' | 'flagged'

  const filtered = React.useMemo(() => {
    if (filter === 'all') return PENDING_APPROVALS;
    if (filter === 'flagged') return PENDING_APPROVALS.filter(a => a.flag);
    return PENDING_APPROVALS.filter(a => a.verification.status === filter);
  }, [filter]);

  const sel = filtered.find(a => a.id === activeApproval) || filtered[0] || PENDING_APPROVALS[0];

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px 64px' }}>
      <div style={{ marginBottom: 22 }}>
        <AtriumEyebrow accent>{PENDING_APPROVALS.length} waiting · 2 day avg wait</AtriumEyebrow>
        <h1 style={{ ...t.display, fontSize: 40, margin: '12px 0 0' }}>Member approvals</h1>
        <p style={{ fontSize: 14.5, color: t.palette.muted, marginTop: 8, maxWidth: 620, lineHeight: 1.55 }}>
          Auto-matched applicants are pre-verified against the org’s alumni records. Review and approve, or open a partial-match for manual verification.
        </p>
      </div>

      {/* Filter strip */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
        {[
          { id: 'all',       label: `All · ${PENDING_APPROVALS.length}` },
          { id: 'matched',   label: `Auto-matched · ${PENDING_APPROVALS.filter(a => a.verification.status === 'matched').length}` },
          { id: 'partial',   label: `Partial · ${PENDING_APPROVALS.filter(a => a.verification.status === 'partial').length}` },
          { id: 'unmatched', label: `Unmatched · ${PENDING_APPROVALS.filter(a => a.verification.status === 'unmatched').length}` },
          { id: 'flagged',   label: `Flagged · ${PENDING_APPROVALS.filter(a => a.flag).length}` },
        ].map(f => {
          const active = filter === f.id;
          return (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              background: active ? t.palette.ink : 'transparent',
              color: active ? t.palette.paper : t.palette.muted,
              border: `1px solid ${active ? t.palette.ink : t.palette.rule}`,
              padding: '7px 12px', borderRadius: 999,
              fontFamily: t.font.body, fontSize: 12.5, fontWeight: 600,
              cursor: 'pointer',
            }}>{f.label}</button>
          );
        })}
      </div>

      {/* List + Detail */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 22 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(a => {
            const selected = sel?.id === a.id;
            return (
              <button key={a.id} onClick={() => setActiveApproval(a.id)} style={{
                ...t.cardSurface({ padding: 14, textAlign: 'left', cursor: 'pointer',
                  borderColor: selected ? t.palette.ink : t.palette.rule,
                  background: selected ? t.palette.cardAlt : t.palette.card,
                }),
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AtriumAvatar name={a.name} initials={a.initials} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{a.name}</div>
                    <div style={{ fontSize: 12, color: t.palette.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      ’{String(a.cohort).slice(-2)} · {a.city}
                    </div>
                  </div>
                  <span style={{ fontSize: 11.5, color: t.palette.mute2, fontFamily: t.font.mono, letterSpacing: '0.14em' }}>{a.appliedAt}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  {a.verification.status === 'matched'   ? <AdminBadge tone="ok">Auto-matched</AdminBadge> : null}
                  {a.verification.status === 'partial'   ? <AdminBadge tone="warn">Partial</AdminBadge> : null}
                  {a.verification.status === 'unmatched' ? <AdminBadge tone="bad">No match</AdminBadge> : null}
                  {a.flag ? <AdminBadge tone="bad">{a.flag}</AdminBadge> : null}
                </div>
              </button>
            );
          })}
        </div>

        {sel ? <ApprovalDetail a={sel} /> : (
          <div style={t.cardSurface({ padding: 28, color: t.palette.muted })}>No matching applicants in this filter.</div>
        )}
      </div>
    </div>
  );
}

function ApprovalDetail({ a }) {
  const t = React.useContext(ThemeCtx);
  return (
    <div style={t.cardSurface({ padding: 28 })}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 18, borderBottom: `1px solid ${t.palette.rule}` }}>
        <AtriumAvatar name={a.name} initials={a.initials} size={64} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <AtriumEyebrow accent>Application · {a.id}</AtriumEyebrow>
          <h2 style={{ ...t.display, fontSize: 28, margin: '6px 0 4px', fontWeight: 600 }}>{a.name}</h2>
          <div style={{ fontSize: 13.5, color: t.palette.muted }}>
            {a.title} at <strong style={{ color: t.palette.ink2, fontWeight: 600 }}>{a.employer}</strong> · ’{String(a.cohort).slice(-2)} · {a.city}
          </div>
        </div>
        <span style={{ fontFamily: t.font.mono, fontSize: 11, color: t.palette.mute2, letterSpacing: '0.14em' }}>Applied {a.appliedAt}</span>
      </div>

      {/* Verification block */}
      <div style={{ padding: '22px 0', borderBottom: `1px solid ${t.palette.ruleSoft}` }}>
        <AtriumEyebrow>Verification</AtriumEyebrow>
        <div style={{
          marginTop: 12, padding: 14,
          background: a.verification.status === 'matched' ? hex(t.palette.ok, 0.10)
                   : a.verification.status === 'partial' ? hex(t.palette.warn, 0.10)
                   : hex(t.palette.bad, 0.10),
          border: `1px solid ${a.verification.status === 'matched' ? hex(t.palette.ok, 0.35)
                              : a.verification.status === 'partial' ? hex(t.palette.warn, 0.35)
                              : hex(t.palette.bad, 0.35)}`,
          borderRadius: t.radius - 4,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{
            width: 10, height: 10, borderRadius: 999,
            background: a.verification.status === 'matched' ? t.palette.ok
                     : a.verification.status === 'partial' ? t.palette.warn
                     : t.palette.bad,
            flexShrink: 0,
          }} />
          <div style={{ minWidth: 0, fontSize: 13.5 }}>
            <div style={{ fontWeight: 600, color: t.palette.ink }}>
              {a.verification.status === 'matched'   ? 'Auto-matched against alumni records' : null}
              {a.verification.status === 'partial'   ? 'Partial match — manual review needed' : null}
              {a.verification.status === 'unmatched' ? 'No matching alumni record' : null}
            </div>
            <div style={{ color: t.palette.muted, marginTop: 2 }}>{a.verification.match}</div>
          </div>
        </div>
        {a.flag ? (
          <div style={{ marginTop: 10, fontSize: 12.5, color: t.palette.bad, fontWeight: 600 }}>
            ⚠ Flag: {a.flag} — please confirm before approving.
          </div>
        ) : null}
      </div>

      {/* Applicant note */}
      {a.submittedNotes ? (
        <div style={{ padding: '22px 0', borderBottom: `1px solid ${t.palette.ruleSoft}` }}>
          <AtriumEyebrow>What they wrote</AtriumEyebrow>
          <p style={{ fontSize: 14.5, color: t.palette.ink2, marginTop: 10, lineHeight: 1.6 }}>
            “{a.submittedNotes}”
          </p>
        </div>
      ) : null}

      {/* Admin actions */}
      <div style={{ paddingTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <AtriumButton size="lg">Approve & welcome</AtriumButton>
        <AtriumButton size="lg" variant="outline">Request more info</AtriumButton>
        <AtriumButton size="lg" variant="ghost">Decline politely</AtriumButton>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: t.palette.muted }}>
          Decisions are logged to the audit trail.
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Members — table
// ---------------------------------------------------------------------------

function AdminMembers() {
  const t = React.useContext(ThemeCtx);
  const { ADMIN_MEMBERS } = window.BC_ADMIN;
  const [query, setQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all'); // 'all' | 'active' | 'paused' | 'suspended'
  const [roleFilter, setRoleFilter] = React.useState('all');     // 'all' | 'admin' | 'member'

  const rows = React.useMemo(() => {
    return ADMIN_MEMBERS.filter(m => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (roleFilter !== 'all' && m.role !== roleFilter) return false;
      if (query && !(m.name + m.city).toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [statusFilter, roleFilter, query]);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px 64px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 22, flexWrap: 'wrap' }}>
        <div>
          <AtriumEyebrow accent>{ADMIN_MEMBERS.length} members · 2 admins</AtriumEyebrow>
          <h1 style={{ ...t.display, fontSize: 40, margin: '12px 0 0' }}>Members</h1>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or city…"
            style={{
              border: `1px solid ${t.palette.rule}`, background: t.palette.card,
              padding: '9px 14px', borderRadius: 999, fontFamily: t.font.body, fontSize: 13, color: t.palette.ink,
              minWidth: 220,
            }} />
          <AtriumButton size="md" variant="outline">Export CSV</AtriumButton>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { k: 'all',       l: `All · ${ADMIN_MEMBERS.length}` },
          { k: 'active',    l: `Active · ${ADMIN_MEMBERS.filter(m => m.status === 'active').length}` },
          { k: 'paused',    l: `Paused · ${ADMIN_MEMBERS.filter(m => m.status === 'paused').length}` },
          { k: 'suspended', l: `Suspended · ${ADMIN_MEMBERS.filter(m => m.status === 'suspended').length}` },
        ].map(f => {
          const active = statusFilter === f.k;
          return (
            <button key={f.k} onClick={() => setStatusFilter(f.k)} style={{
              background: active ? t.palette.ink : 'transparent',
              color: active ? t.palette.paper : t.palette.muted,
              border: `1px solid ${active ? t.palette.ink : t.palette.rule}`,
              padding: '6px 12px', borderRadius: 999,
              fontFamily: t.font.body, fontSize: 12, fontWeight: 600,
              cursor: 'pointer',
            }}>{f.l}</button>
          );
        })}

        <span style={{ width: 1, background: t.palette.rule, margin: '0 6px' }} />

        {[
          { k: 'all',    l: 'All roles' },
          { k: 'admin',  l: 'Admins' },
          { k: 'member', l: 'Members' },
        ].map(f => {
          const active = roleFilter === f.k;
          return (
            <button key={f.k} onClick={() => setRoleFilter(f.k)} style={{
              background: active ? t.palette.ink : 'transparent',
              color: active ? t.palette.paper : t.palette.muted,
              border: `1px solid ${active ? t.palette.ink : t.palette.rule}`,
              padding: '6px 12px', borderRadius: 999,
              fontFamily: t.font.body, fontSize: 12, fontWeight: 600,
              cursor: 'pointer',
            }}>{f.l}</button>
          );
        })}
      </div>

      <div style={t.cardSurface({ padding: 0, overflow: 'hidden' })}>
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1fr 1.4fr 1fr 1fr 0.6fr auto',
          padding: '12px 20px', borderBottom: `1px solid ${t.palette.rule}`,
          background: t.palette.cardAlt, gap: 12,
          fontFamily: t.font.mono, fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: t.palette.muted, fontWeight: 600,
        }}>
          <div>Member</div>
          <div>Cohort</div>
          <div>City</div>
          <div>Last seen</div>
          <div>Status</div>
          <div>Reports</div>
          <div />
        </div>
        {rows.map((m, i) => (
          <div key={m.id} style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 1.4fr 1fr 1fr 0.6fr auto',
            padding: '14px 20px',
            borderBottom: i === rows.length - 1 ? 'none' : `1px solid ${t.palette.ruleSoft}`,
            alignItems: 'center', gap: 12,
            fontSize: 13.5,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <AtriumAvatar name={m.name} initials={m.initials} size={30} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                <div style={{ fontSize: 11.5, color: t.palette.muted, marginTop: 1 }}>
                  {m.role === 'admin' ? <AdminBadge tone="accent">Admin</AdminBadge> : null}
                </div>
              </div>
            </div>
            <div style={{ color: t.palette.muted, fontFamily: t.font.mono }}>’{String(m.cohort).slice(-2)}</div>
            <div style={{ color: t.palette.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.city}</div>
            <div style={{ color: t.palette.muted, fontFamily: t.font.mono, fontSize: 12 }}>{m.lastSeen}</div>
            <div>
              <AdminBadge tone={m.status === 'active' ? 'ok' : m.status === 'paused' ? 'warn' : 'bad'}>{m.status}</AdminBadge>
            </div>
            <div style={{ color: m.reports > 0 ? t.palette.bad : t.palette.mute2, fontWeight: m.reports > 0 ? 700 : 500 }}>
              {m.reports}
            </div>
            <div>
              <RowMenu />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RowMenu() {
  const t = React.useContext(ThemeCtx);
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} aria-label="Row actions" style={{
        width: 28, height: 28, padding: 0, cursor: 'pointer',
        background: 'transparent', border: `1px solid ${t.palette.rule}`, borderRadius: 999,
        color: t.palette.muted, fontSize: 16, lineHeight: 1,
      }}>…</button>
      {open ? (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 5,
          background: t.palette.card, border: `1px solid ${t.palette.rule}`, borderRadius: t.radius,
          boxShadow: '0 12px 32px rgba(42,34,26,0.12)', minWidth: 200, padding: 6,
        }}>
          {[
            { l: 'View profile' },
            { l: 'Promote to admin' },
            { l: 'Pause helper mode' },
            { l: 'Suspend member', danger: true },
          ].map(x => (
            <button key={x.l} onClick={() => setOpen(false)} style={{
              width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '8px 10px', borderRadius: t.radius - 6,
              fontFamily: t.font.body, fontSize: 13, fontWeight: 500,
              color: x.danger ? t.palette.bad : t.palette.ink,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = t.palette.paper; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>{x.l}</button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

window.AdminOverview  = AdminOverview;
window.AdminApprovals = AdminApprovals;
window.AdminMembers   = AdminMembers;
