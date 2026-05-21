/* eslint-disable */
// Atrium admin — shell + sub-nav, route context, and the AdminApp root.
// Screens are split across admin-screens-*.jsx files; this file is just
// the wiring.

const ADMIN_NAV = [
  { id: 'overview',      label: 'Overview' },
  { id: 'approvals',     label: 'Approvals' },
  { id: 'members',       label: 'Members' },
  { id: 'invite',        label: 'Invite' },
  { id: 'events',        label: 'Events' },
  { id: 'announcements', label: 'Announcements' },
  { id: 'analytics',     label: 'Analytics' },
];

const AdminRouteCtx = React.createContext(null);
function useAdminRoute() { return React.useContext(AdminRouteCtx); }

function AdminApp() {
  const t = React.useContext(ThemeCtx);
  const [route, setRoute] = React.useState('overview');
  const [activeApproval, setActiveApproval] = React.useState('app-1041');
  const [activeMember,   setActiveMember]   = React.useState(null);

  const goto = (r) => { setRoute(r); window.scrollTo({ top: 0, behavior: 'instant' }); };

  React.useEffect(() => { document.body.style.background = t.palette.paper; }, [t.palette.paper]);

  return (
    <AdminRouteCtx.Provider value={{ route, goto, activeApproval, setActiveApproval, activeMember, setActiveMember }}>
      <div data-screen-label={`Admin · ${route}`} style={{
        minHeight: '100vh', background: t.palette.paper, color: t.palette.ink,
        fontFamily: t.font.body,
      }}>
        <AdminHeader />

        <main>
          {route === 'overview'      ? <AdminOverview />      : null}
          {route === 'approvals'     ? <AdminApprovals />     : null}
          {route === 'members'       ? <AdminMembers />       : null}
          {route === 'invite'        ? <AdminInvite />        : null}
          {route === 'events'        ? <AdminEvents />        : null}
          {route === 'announcements' ? <AdminAnnouncements /> : null}
          {route === 'analytics'     ? <AdminAnalytics />     : null}
        </main>
      </div>
    </AdminRouteCtx.Provider>
  );
}

// ---------------------------------------------------------------------------
// Header — wordmark + ADMIN tag + sub-nav
// ---------------------------------------------------------------------------

function AdminHeader() {
  const t = React.useContext(ThemeCtx);
  const { route, goto } = useAdminRoute();
  const { PENDING_APPROVALS, ADMIN_VIEWER } = window.BC_ADMIN;
  const pendingCount = PENDING_APPROVALS.length;

  return (
    <header style={{
      background: t.palette.paper, borderBottom: `1px solid ${t.palette.rule}`,
      position: 'sticky', top: 0, zIndex: 40,
    }}>
      {/* Top row — wordmark + role + viewer */}
      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: '16px 24px',
        display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 18,
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
          <button style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <svg width="32" height="24" viewBox="0 0 32 24" aria-hidden="true">
              <circle cx="11" cy="12" r="9" fill={t.palette.accent} fillOpacity="0.85" />
              <circle cx="21" cy="12" r="9" fill={t.palette.ok}     fillOpacity="0.85" />
            </svg>
            <span style={{ ...t.display, fontSize: 18, color: t.palette.ink, fontWeight: 600, letterSpacing: '-0.02em' }}>BridgeCircle</span>
          </button>
          <span style={{
            fontFamily: t.font.mono, fontSize: 10.5, letterSpacing: '0.18em',
            color: t.palette.paper, background: t.palette.ink,
            padding: '3px 8px', borderRadius: 2, fontWeight: 700,
          }}>ADMIN</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontFamily: t.font.mono, fontSize: 10.5, letterSpacing: '0.14em',
            color: t.palette.muted, fontWeight: 600,
          }}>{window.BC_DATA.ORG.name}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AdminViewerChip viewer={ADMIN_VIEWER} />
        </div>
      </div>

      {/* Sub-nav */}
      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: '0 24px',
        display: 'flex', gap: 4, overflowX: 'auto',
      }}>
        {ADMIN_NAV.map(item => {
          const active = route === item.id;
          const badge = item.id === 'approvals' && pendingCount > 0 ? pendingCount : null;
          return (
            <button key={item.id} onClick={() => goto(item.id)} style={{
              position: 'relative',
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '12px 14px',
              fontFamily: t.font.body, fontSize: 13, fontWeight: 600,
              color: active ? t.palette.ink : t.palette.muted,
              borderBottom: active ? `2px solid ${t.palette.accent}` : `2px solid transparent`,
              marginBottom: -1,
              whiteSpace: 'nowrap',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              <span>{item.label}</span>
              {badge ? (
                <span style={{
                  fontFamily: t.font.mono, fontSize: 10, color: t.palette.paper,
                  background: t.palette.accent, borderRadius: 999,
                  padding: '1px 6px', fontWeight: 700,
                }}>{badge}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </header>
  );
}

function AdminViewerChip({ viewer }) {
  const t = React.useContext(ThemeCtx);
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'inline-flex', alignItems: 'center', gap: 10, padding: '4px 12px 4px 4px',
        background: t.palette.card, border: `1px solid ${t.palette.rule}`, borderRadius: 999,
        cursor: 'pointer',
      }}>
        <AtriumAvatar name={viewer.name} initials={viewer.initials} size={28} />
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 12.5, fontWeight: 600 }}>{viewer.firstName}</div>
          <div style={{ fontSize: 10.5, color: t.palette.muted, letterSpacing: '0.08em', fontFamily: t.font.mono }}>
            {viewer.role.toUpperCase()}
          </div>
        </div>
        <svg width="10" height="10" viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 9 12 15 18 9" fill="none" stroke={t.palette.muted} strokeWidth="2" /></svg>
      </button>
      {open ? (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 6px)',
          background: t.palette.card, border: `1px solid ${t.palette.rule}`, borderRadius: t.radius,
          boxShadow: '0 16px 32px rgba(42,34,26,0.12)',
          padding: 6, minWidth: 200,
        }}>
          {['Switch to member view', 'Account settings', 'Sign out'].map(x => (
            <button key={x} onClick={() => setOpen(false)} style={{
              width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '8px 10px', borderRadius: t.radius - 6,
              fontFamily: t.font.body, fontSize: 13, color: t.palette.ink, fontWeight: 500,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = t.palette.paper; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>{x}</button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared atoms for admin screens
// ---------------------------------------------------------------------------

function AdminSection({ children, title, eyebrow, action, padding }) {
  const t = React.useContext(ThemeCtx);
  return (
    <section style={{ marginBottom: 28 }}>
      {(title || action) ? (
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14, gap: 12 }}>
          <div>
            {eyebrow ? <AtriumEyebrow accent>{eyebrow}</AtriumEyebrow> : null}
            {title ? <h2 style={{ ...t.display, fontSize: 24, margin: '4px 0 0', fontWeight: 600 }}>{title}</h2> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

function AdminStatTile({ value, label, sub, trend, accent }) {
  const t = React.useContext(ThemeCtx);
  const accentBg = accent ? hex(t.palette.accent, 0.10) : null;
  return (
    <div style={t.cardSurface({ padding: 20, background: accentBg || undefined })}>
      <AtriumEyebrow>{label}</AtriumEyebrow>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 10 }}>
        <span style={{ ...t.display, fontSize: 38, color: t.palette.ink, fontWeight: 600, letterSpacing: '-0.02em' }}>{value}</span>
        {trend ? (
          <span style={{
            fontFamily: t.font.mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
            color: trend.startsWith('-') ? t.palette.bad : t.palette.ok,
          }}>{trend}</span>
        ) : null}
      </div>
      {sub ? <div style={{ fontSize: 12, color: t.palette.muted, marginTop: 6 }}>{sub}</div> : null}
    </div>
  );
}

function AdminBadge({ tone = 'muted', children }) {
  const t = React.useContext(ThemeCtx);
  const map = {
    muted:    { bg: t.palette.paper,             fg: t.palette.muted,   border: t.palette.rule },
    ok:       { bg: hex(t.palette.ok, 0.14),     fg: t.palette.ok,      border: 'transparent' },
    warn:     { bg: hex(t.palette.warn, 0.16),   fg: t.palette.warn,    border: 'transparent' },
    bad:      { bg: hex(t.palette.bad, 0.14),    fg: t.palette.bad,     border: 'transparent' },
    accent:   { bg: hex(t.palette.accent, 0.14), fg: t.palette.accent,  border: 'transparent' },
    solid:    { bg: t.palette.ink,               fg: t.palette.paper,   border: 'transparent' },
  };
  const s = map[tone] || map.muted;
  return (
    <span style={{
      background: s.bg, color: s.fg, border: `1px solid ${s.border}`,
      fontFamily: t.font.body, fontSize: 11, fontWeight: 600,
      padding: '3px 8px', borderRadius: 999,
      display: 'inline-flex', alignItems: 'center', gap: 4,
      whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

window.AdminApp = AdminApp;
window.AdminRouteCtx = AdminRouteCtx;
window.useAdminRoute = useAdminRoute;
window.AdminSection = AdminSection;
window.AdminStatTile = AdminStatTile;
window.AdminBadge = AdminBadge;
