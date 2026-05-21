/* eslint-disable */
// Atrium app shell — softer header (no filing-system strip), pill nav,
// rounded avatar/search controls, warm footer with circles motif.

const ATRIUM_NAV = [
  { id: 'home',   label: 'Home' },
  { id: 'people', label: 'People' },
  { id: 'inbox',  label: 'Inbox',  badge: 3 },
  { id: 'events', label: 'Events' },
];

const AtriumRouteCtx = React.createContext(null);
function useAtriumRoute() { return React.useContext(AtriumRouteCtx); }

function AtriumShell({ children }) {
  const t = React.useContext(ThemeCtx);
  const { route } = useAtriumRoute();
  return (
    <div data-screen-label={`BridgeCircle Atrium · ${route}`} style={{
      minHeight: '100vh', background: t.palette.paper, color: t.palette.ink,
      fontFamily: t.font.body,
    }}>
      <AtriumHeader />
      <main>{children}</main>
      <AtriumFooter />
    </div>
  );
}

function AtriumHeader() {
  const t = React.useContext(ThemeCtx);
  const { route, goto } = useAtriumRoute();
  const [menuOpen, setMenuOpen] = React.useState(false);

  // Close drawer whenever route changes (a tap on a nav item navigates).
  React.useEffect(() => { setMenuOpen(false); }, [route]);

  // Lock body scroll while the drawer is open.
  React.useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [menuOpen]);

  if (t.isMobile) {
    return (
      <>
        <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: t.palette.cardAlt,
          borderBottom: `1px solid ${t.palette.rule}`,
          boxShadow: '0 1px 0 rgba(255,255,255,.5) inset, 0 2px 8px rgba(42,34,26,0.05)',
        }}>
          <div style={{
            padding: '0 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
            height: 52,
          }}>
            <AtriumWordmark onClick={() => goto('home')} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <AtriumNotificationBell />
              <AtriumAvatarChip compact />
              <AtriumMenuButton open={menuOpen} onClick={() => setMenuOpen(v => !v)} />
            </div>
          </div>
        </header>
        {menuOpen ? <AtriumMobileDrawer onClose={() => setMenuOpen(false)} /> : null}
      </>
    );
  }

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: t.palette.cardAlt,
      borderBottom: `1px solid ${t.palette.rule}`,
      boxShadow: '0 1px 0 rgba(255,255,255,.5) inset, 0 2px 12px rgba(42,34,26,0.05)',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        padding: '0 24px',
        display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 24,
        height: 58,
      }}>
        <AtriumWordmark onClick={() => goto('home')} />

        <nav style={{ display: 'flex', gap: 2, paddingLeft: 4 }}>
          {ATRIUM_NAV.map(item => {
            const active = route === item.id;
            return (
              <button key={item.id} onClick={() => goto(item.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '10px 14px',
                  color: active ? t.palette.ink : t.palette.muted,
                  fontFamily: t.font.body, fontSize: 13.5,
                  fontWeight: active ? 700 : 500,
                  borderRadius: 12,
                  display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start',
                  position: 'relative',
                  transition: 'color 120ms ease',
                }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {item.label}
                  {item.badge ? (
                    <span style={{
                      background: hex(t.palette.accent, 0.15), color: t.palette.accent,
                      borderRadius: 999, padding: '0 6px', minWidth: 17, height: 17,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10.5, fontWeight: 700,
                    }}>{item.badge}</span>
                  ) : null}
                </span>
                {/* Accent underline — slides to active item */}
                <span style={{
                  position: 'absolute', bottom: 6, left: 14, right: 14,
                  height: 2, background: active ? t.palette.accent : 'transparent',
                  borderRadius: 999, transition: 'background 160ms ease',
                }} />
              </button>
            );
          })}
        </nav>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {t.mq.isTablet ? null : <AtriumSearchInline />}
          <AtriumNotificationBell />
          <AtriumAvatarChip />
        </div>
      </div>
    </header>
  );
}

function AtriumMenuButton({ open, onClick }) {
  const t = React.useContext(ThemeCtx);
  return (
    <button onClick={onClick} aria-expanded={open} aria-label="Menu" style={{
      width: 38, height: 38, borderRadius: 999,
      background: open ? t.palette.ink : t.palette.paper,
      color: open ? t.palette.paper : t.palette.ink,
      border: `1px solid ${open ? t.palette.ink : t.palette.rule}`,
      cursor: 'pointer', display: 'grid', placeItems: 'center',
      transition: 'background 120ms ease',
      flexShrink: 0,
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
        {open ? (
          <>
            <path d="M6 6l12 12" />
            <path d="M18 6l-12 12" />
          </>
        ) : (
          <>
            <path d="M4 7h16" />
            <path d="M4 12h16" />
            <path d="M4 17h16" />
          </>
        )}
      </svg>
    </button>
  );
}

function AtriumMobileDrawer({ onClose }) {
  const t = React.useContext(ThemeCtx);
  const { route, goto } = useAtriumRoute();
  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 49,
        background: 'rgba(42,34,26,0.40)',
        backdropFilter: 'blur(2px)',
      }} />
      {/* Sheet */}
      <div style={{
        position: 'fixed', left: 12, right: 12, top: 64, zIndex: 51,
        background: t.palette.card,
        border: `1px solid ${t.palette.rule}`,
        borderRadius: t.radius,
        boxShadow: '0 24px 60px rgba(42,34,26,0.22)',
        padding: 14,
        maxHeight: 'calc(100vh - 80px)', overflowY: 'auto',
      }}>
        <AtriumSearchInline mobile />

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 14 }}>
          {ATRIUM_NAV.map(item => {
            const active = route === item.id;
            return (
              <button key={item.id} onClick={() => goto(item.id)}
                style={{
                  background: active ? t.palette.ink : 'transparent',
                  border: 'none', cursor: 'pointer',
                  padding: '14px 18px',
                  color: active ? t.palette.paper : t.palette.ink,
                  fontFamily: t.font.body, fontSize: 16, fontWeight: 600,
                  borderRadius: t.radius - 4, textAlign: 'left',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                }}>
                <span>{item.label}</span>
                {item.badge ? (
                  <span style={{
                    fontFamily: t.font.body, fontSize: 11, fontWeight: 700,
                    color: '#fff', background: t.palette.accent,
                    borderRadius: 999, padding: '0 7px', minWidth: 20, height: 20,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}>{item.badge}</span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}

function AtriumWordmark({ onClick }) {
  const t = React.useContext(ThemeCtx);
  const { VIEWER } = window.BC_DATA;
  const cohort = VIEWER?.cohortShort ? `'${String(VIEWER.cohortShort).slice(-2)}` : "'14";
  return (
    <button onClick={onClick} style={{
      background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 11,
      borderRight: `1px solid ${t.palette.ruleSoft}`, paddingRight: 20,
    }}>
      <svg width="34" height="26" viewBox="0 0 32 24" aria-hidden="true">
        <circle cx="11" cy="12" r="9" fill={t.palette.accent} fillOpacity="0.88" />
        <circle cx="21" cy="12" r="9" fill={t.palette.ok}     fillOpacity="0.88" />
      </svg>
      <div>
        <div style={{ fontFamily: t.font.display, fontSize: 17, letterSpacing: '-0.025em', color: t.palette.ink, fontWeight: 700, lineHeight: 1.1 }}>BridgeCircle</div>
        <div style={{ fontFamily: t.font.mono, fontSize: 9, color: t.palette.muted, letterSpacing: '.08em', marginTop: 2 }}>HARTWOOD {cohort}</div>
      </div>
    </button>
  );
}

function AtriumSearchInline({ mobile }) {
  const t = React.useContext(ThemeCtx);
  const [v, setV] = React.useState('');
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      borderRadius: 999, padding: mobile ? '10px 16px' : '7px 14px',
      background: 'rgba(42,34,26,0.05)',
      border: '1px solid rgba(42,34,26,0.08)',
      minWidth: mobile ? 0 : 210,
      boxSizing: 'border-box',
    }}>
      <svg width={mobile ? 16 : 14} height={mobile ? 16 : 14} viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
        <circle cx="11" cy="11" r="7" fill="none" stroke={t.palette.muted} strokeWidth="2" />
        <line x1="16" y1="16" x2="21" y2="21" stroke={t.palette.muted} strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder="Find someone…" style={{
        border: 'none', outline: 'none', background: 'transparent',
        fontFamily: t.font.body, fontSize: mobile ? 15 : 13, color: t.palette.ink,
        width: mobile ? '100%' : 150,
        minWidth: 0,
      }} />
    </div>
  );
}

function AtriumAvatarChip({ compact }) {
  const t = React.useContext(ThemeCtx);
  const { VIEWER } = window.BC_DATA;
  const [open, setOpen] = React.useState(false);
  const wrapperRef = React.useRef(null);

  // Close on outside click. Listener lives only while the menu is open so we
  // don't pay for it on every render.
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    return () => {
      window.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} aria-expanded={open} style={{
        display: 'inline-flex', alignItems: 'center', gap: compact ? 0 : 8,
        padding: compact ? 3 : '5px 14px 5px 4px',
        borderRadius: compact ? 999 : 12, background: 'rgba(42,34,26,0.05)',
        border: `1px solid ${open ? t.palette.ink : 'rgba(42,34,26,0.09)'}`,
        cursor: 'pointer', transition: 'border-color 120ms ease',
      }}>
        <AtriumAvatar name={VIEWER.name} initials={VIEWER.initials} size={compact ? 30 : 30} />
        {compact ? null : (
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontFamily: t.font.body, fontSize: 13, fontWeight: 600, color: t.palette.ink, lineHeight: 1.2 }}>{VIEWER.name}</div>
            <div style={{ fontFamily: t.font.mono, fontSize: 9, color: t.palette.muted, letterSpacing: '.06em' }}>CLASS OF '{String(VIEWER.cohortShort).slice(-2)}</div>
          </div>
        )}
      </button>

      {open ? <AtriumAccountMenu onClose={() => setOpen(false)} /> : null}
    </div>
  );
}

function AtriumAccountMenu({ onClose }) {
  const t = React.useContext(ThemeCtx);
  const { VIEWER } = window.BC_DATA;
  const { goto, setActiveProfile } = useAtriumRoute();
  const [helperOn, setHelperOn] = React.useState(true);

  const item = (label, opts = {}) => ({
    label,
    sub: opts.sub,
    danger: opts.danger,
    onClick: opts.onClick,
    shortcut: opts.shortcut,
    icon: opts.icon,
  });

  const sections = [
    {
      header: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px 14px', borderBottom: `1px solid ${t.palette.ruleSoft}` }}>
          <AtriumAvatar name={VIEWER.name} initials={VIEWER.initials} size={40} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{VIEWER.name}</div>
            <div style={{ fontSize: 12, color: t.palette.muted }}>Class of {VIEWER.cohortShort} · {VIEWER.title}</div>
          </div>
        </div>
      ),
    },
    {
      items: [
        item('View your profile', { sub: 'How others see you', icon: 'user', onClick: () => { setActiveProfile(VIEWER.id); goto('profile'); onClose(); } }),
        item('Edit profile',      { sub: 'Update career, interests, hobbies', icon: 'edit', onClick: () => { setActiveProfile(VIEWER.id); goto('profile'); onClose(); } }),
        item('Account & privacy', { sub: 'Email, password, visibility', icon: 'lock' }),
      ],
    },
    {
      header: (
        <div style={{
          margin: '4px 8px 6px',
          padding: '10px 12px',
          background: t.palette.cardAlt,
          border: `1px solid ${t.palette.ruleSoft}`,
          borderRadius: t.radius - 4,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>Helper mode</div>
            <div style={{ fontSize: 11.5, color: t.palette.muted, marginTop: 2 }}>
              {helperOn ? 'On — accepting mentor requests' : 'Paused — no new requests'}
            </div>
          </div>
          <button onClick={() => setHelperOn(v => !v)} aria-pressed={helperOn} style={{
            width: 34, height: 20, padding: 0, border: 'none', cursor: 'pointer',
            borderRadius: 999,
            background: helperOn ? t.palette.accent : t.palette.rule,
            position: 'relative', flexShrink: 0,
            transition: 'background 120ms ease',
          }}>
            <span style={{
              position: 'absolute', top: 2, left: helperOn ? 16 : 2,
              width: 16, height: 16, borderRadius: 999, background: '#fff',
              transition: 'left 140ms cubic-bezier(.2,.8,.2,1)',
              boxShadow: '0 1px 2px rgba(42,34,26,0.20)',
            }} />
          </button>
        </div>
      ),
    },
    {
      items: [
        item('Notifications',     { icon: 'bell' }),
        item('Verification',      { sub: 'Verified by Dev & Sam', icon: 'check' }),
        item('Invite a member',   { sub: 'Send a key to a fellow alum', icon: 'invite' }),
      ],
    },
    {
      items: [
        item('Help & guidelines', { icon: 'help', shortcut: '?' }),
        item('Switch organization', { sub: 'Hartwood · 1 of 1', icon: 'switch' }),
        item('Sign out', { danger: true, icon: 'logout' }),
      ],
    },
  ];

  return (
    <div role="menu" style={{
      position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 60,
      width: t.isMobile ? 'min(300px, calc(100vw - 24px))' : 300,
      background: t.palette.card,
      border: `1px solid ${t.palette.rule}`,
      borderRadius: t.radius,
      boxShadow: '0 16px 40px rgba(42,34,26,0.16), 0 1px 0 rgba(255,255,255,.6) inset',
      overflow: 'hidden',
    }}>
      {sections.map((s, si) => (
        <div key={si} style={{
          borderTop: si > 0 && (s.items || s.header) ? `1px solid ${t.palette.ruleSoft}` : 'none',
          padding: s.items ? '6px 6px' : 0,
        }}>
          {s.header}
          {s.items?.map((it, i) => (
            <button key={i} role="menuitem" onClick={() => { it.onClick?.(); }} style={{
              width: '100%', textAlign: 'left',
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '8px 12px', borderRadius: t.radius - 6,
              display: 'grid', gridTemplateColumns: '22px 1fr auto', gap: 10, alignItems: 'center',
              color: it.danger ? t.palette.bad : t.palette.ink,
              fontFamily: t.font.body, fontSize: 13, fontWeight: 500,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = t.palette.paper; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
              <MenuGlyph kind={it.icon} color={it.danger ? t.palette.bad : t.palette.muted} />
              <div style={{ minWidth: 0 }}>
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.label}</div>
                {it.sub ? <div style={{ fontSize: 11.5, color: t.palette.muted, fontWeight: 400, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.sub}</div> : null}
              </div>
              {it.shortcut ? (
                <span style={{ fontFamily: t.font.mono, fontSize: 10, color: t.palette.mute2, letterSpacing: 0.4 }}>{it.shortcut}</span>
              ) : null}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

// Tiny inline glyphs — no external icon dep, no emoji. Each is a 16px square.
function MenuGlyph({ kind, color }) {
  const c = color;
  const props = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: c, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  switch (kind) {
    case 'user':   return <svg {...props}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></svg>;
    case 'edit':   return <svg {...props}><path d="M14 4l6 6L8 22H2v-6L14 4z" /></svg>;
    case 'lock':   return <svg {...props}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>;
    case 'bell':   return <svg {...props}><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>;
    case 'check':  return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M8 12.5l3 3 5-6" /></svg>;
    case 'invite': return <svg {...props}><circle cx="9" cy="9" r="4" /><path d="M2 21c0-4 3.5-6 7-6s7 2 7 6" /><path d="M19 8v6M16 11h6" /></svg>;
    case 'help':   return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-.8.6-1.5 1-1.5 2" /><circle cx="12" cy="17" r="0.8" fill={c} stroke="none" /></svg>;
    case 'switch': return <svg {...props}><path d="M3 7h14l-3-3M21 17H7l3 3" /></svg>;
    case 'logout': return <svg {...props}><path d="M10 17l-5-5 5-5M5 12h12" /><path d="M14 4h5v16h-5" /></svg>;
    default:       return <svg {...props}><circle cx="12" cy="12" r="3" /></svg>;
  }
}

// ─── Notification bell ────────────────────────────────────────────────────
function AtriumNotificationBell() {
  const t = React.useContext(ThemeCtx);
  const { NOTIFICATIONS } = window.BC_DATA;
  const [open, setOpen] = React.useState(false);
  const [markedRead, setMarkedRead] = React.useState(false);
  const wrapRef = React.useRef(null);

  const unread = markedRead ? 0 : NOTIFICATIONS.filter(n => !n.read).length;

  React.useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={wrapRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Notifications"
        style={{
          width: 38, height: 38, borderRadius: 999,
          background: open ? t.palette.ink : 'rgba(42,34,26,0.05)',
          color: open ? t.palette.paper : t.palette.ink,
          border: `1px solid ${open ? t.palette.ink : 'rgba(42,34,26,0.09)'}`,
          cursor: 'pointer', display: 'grid', placeItems: 'center',
          position: 'relative', transition: 'background 120ms ease, border-color 120ms ease',
        }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2z" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 6, right: 6,
            width: 8, height: 8, borderRadius: 999,
            background: t.palette.accent,
            border: `1.5px solid ${t.palette.cardAlt}`,
            pointerEvents: 'none',
          }} />
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 60,
          width: t.isMobile ? 'min(320px, calc(100vw - 24px))' : 320,
          background: t.palette.card,
          border: `1px solid ${t.palette.rule}`,
          borderRadius: t.radius,
          boxShadow: '0 16px 40px rgba(42,34,26,0.16), 0 1px 0 rgba(255,255,255,.6) inset',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '13px 16px 11px',
            borderBottom: `1px solid ${t.palette.ruleSoft}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: t.font.body, fontSize: 14, fontWeight: 700, color: t.palette.ink }}>Notifications</span>
              {unread > 0 && (
                <span style={{
                  fontFamily: t.font.body, fontSize: 11, fontWeight: 700,
                  color: t.palette.paper, background: t.palette.accent,
                  borderRadius: 999, padding: '1px 7px', minWidth: 18,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>{unread}</span>
              )}
            </div>
            <button
              onClick={() => setMarkedRead(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.palette.accent, fontFamily: t.font.body, fontSize: 12.5, fontWeight: 600, padding: 0 }}>
              Mark all read
            </button>
          </div>

          {/* Items */}
          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {NOTIFICATIONS.map((n, i) => {
              const isRead = markedRead || n.read;
              const typeColors = { inbox: t.palette.accent, event: t.palette.ok, thread: t.palette.accent, member: t.palette.muted };
              const typeColor = typeColors[n.type] || t.palette.muted;
              return (
                <div key={n.id} style={{
                  padding: '12px 16px',
                  borderBottom: i < NOTIFICATIONS.length - 1 ? `1px solid ${t.palette.ruleSoft}` : 'none',
                  background: isRead ? 'transparent' : hex(t.palette.accent, 0.04),
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                }}>
                  {/* Unread dot */}
                  <span style={{
                    width: 7, height: 7, borderRadius: 999, flexShrink: 0, marginTop: 5,
                    background: isRead ? 'transparent' : typeColor,
                    border: isRead ? `1px solid ${t.palette.rule}` : 'none',
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: t.font.body, fontSize: 13, color: t.palette.ink,
                      lineHeight: 1.45, fontWeight: isRead ? 400 : 600,
                    }}>{n.text}</div>
                    <div style={{ fontFamily: t.font.mono, fontSize: 9.5, color: t.palette.muted, marginTop: 3, letterSpacing: '0.07em' }}>{n.when}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{ padding: '10px 16px', borderTop: `1px solid ${t.palette.ruleSoft}`, textAlign: 'center' }}>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.palette.accent, fontFamily: t.font.body, fontSize: 13, fontWeight: 600, padding: 0 }}>
              View inbox →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AtriumFooter() {
  const t = React.useContext(ThemeCtx);
  const compact = t.isMobile;
  return (
    <footer style={{
      borderTop: `1px solid ${t.palette.rule}`,
      marginTop: compact ? 56 : 80, position: 'relative', overflow: 'hidden',
      padding: compact ? '36px 20px 44px' : '52px 32px 60px',
      color: t.palette.muted,
      fontSize: 13,
    }}>
      {/* Decorative circles, soft */}
      <svg aria-hidden="true" width="500" height="400" viewBox="0 0 500 400"
           style={{ position: 'absolute', right: compact ? -180 : -120, top: compact ? -120 : -60, opacity: 0.45, pointerEvents: 'none' }}>
        <circle cx="180" cy="220" r="160" fill="none" stroke={t.palette.accent} strokeOpacity="0.30" strokeWidth="1.4" />
        <circle cx="300" cy="220" r="160" fill="none" stroke={t.palette.ok}     strokeOpacity="0.30" strokeWidth="1.4" />
      </svg>

      <div style={{
        maxWidth: 1280, margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: compact ? '1fr' : (t.mq.isTablet ? '1fr 1fr' : '1.4fr 1fr 1fr 1fr'),
        gap: compact ? 28 : 36,
        position: 'relative',
      }}>
        <div>
          <AtriumWordmark />
          <p style={{ fontSize: 14, color: t.palette.muted, marginTop: 14, lineHeight: 1.55, maxWidth: 360 }}>
            A verified, member-first network for the Hartwood Society. Made warmly in Brooklyn & Lagos.
          </p>
        </div>
        {[
          ['For members', ['Code of conduct', 'Verification', 'Help & moderation', 'Privacy']],
          ['The society', ['About Hartwood', 'Founding members', 'Annual report', 'Press']],
          ['Stay in touch', ['Newsletter', 'Slack', 'Suggest a feature', 'Contact']],
        ].map(([title, items]) => (
          <div key={title}>
            <AtriumEyebrow>{title}</AtriumEyebrow>
            <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {items.map(x => <li key={x}>{x}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}

window.AtriumShell = AtriumShell;
window.AtriumRouteCtx = AtriumRouteCtx;
window.useAtriumRoute = useAtriumRoute;
