/* eslint-disable */
// App shell — top nav (Civic style) and the routing context.

const NAV_ITEMS = [
{ id: 'home', label: 'Home', index: '01' },
{ id: 'people', label: 'People', index: '02' },
{ id: 'inbox', label: 'Inbox', index: '03', badge: 3 },
{ id: 'events', label: 'Events', index: '04' }];


const RouteCtx = React.createContext(null);

function useRoute() {return React.useContext(RouteCtx);}

function AppShell({ children }) {
  const t = React.useContext(ThemeCtx);
  const { route, goto } = useRoute();
  return (
    <div data-screen-label={`BridgeCircle · ${route}`} style={{
      minHeight: '100vh', background: t.palette.paper, color: t.palette.ink,
      fontFamily: t.font.body
    }}>
      <CivicHeader />
      <main>{children}</main>
      <CivicFooter />
    </div>);

}

function CivicHeader() {
  const t = React.useContext(ThemeCtx);
  const m = useCivicIsMobile();
  const { route, goto } = useRoute();
  return (
    <header style={{
      borderBottom: `1px solid ${t.palette.rule}`,
      background: t.palette.paper,
      position: 'sticky', top: 0, zIndex: 50
    }}>
      {/* Wordmark + nav */}
      {m ?
      <>
          <div style={{
          padding: '12px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12
        }}>
            <Wordmark onClick={() => goto('home')} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <SearchInline compact />
              <AvatarChip name={window.BC_DATA.VIEWER.name} initials={window.BC_DATA.VIEWER.initials} compact />
            </div>
          </div>
          <nav className="civic-hscroll" style={{
          display: 'flex', gap: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch',
          borderTop: `1px solid ${t.palette.ruleSoft}`
        }}>
            {NAV_ITEMS.map((item) => {
            const active = route === item.id;
            return (
              <button key={item.id} onClick={() => goto(item.id)}
              style={{
                position: 'relative',
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '11px 14px',
                color: active ? t.palette.ink : t.palette.muted,
                fontFamily: t.font.body,
                fontSize: 13, fontWeight: 500, letterSpacing: 0.1,
                display: 'inline-flex', gap: 6, alignItems: 'baseline',
                whiteSpace: 'nowrap', flexShrink: 0,
                borderBottom: active ? `2px solid ${t.palette.ink}` : '2px solid transparent'
              }}>
                  <span style={{ ...t.eyebrow, fontSize: 9.5, color: active ? t.palette.accent : t.palette.mute2 }}>{item.index}</span>
                  <span>{item.label}</span>
                  {item.badge ?
                <span style={{
                  fontFamily: t.font.mono, fontSize: 10, color: t.palette.accent,
                  border: `1px solid ${t.palette.accent}`, borderRadius: 2,
                  padding: '0 5px', lineHeight: '14px'
                }}>{item.badge}</span> :
                null}
                </button>);

          })}
          </nav>
        </> :

      <div style={{
        padding: '8px 32px',
        display: 'grid', gridTemplateColumns: '240px 1fr auto', alignItems: 'center', gap: 24
      }} data-comment-anchor="bff9b3f54c-div-106-9">
          <Wordmark onClick={() => goto('home')} />

          <nav style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
            {NAV_ITEMS.map((item) => {
            const active = route === item.id;
            return (
              <button key={item.id} onClick={() => goto(item.id)}
              style={{ ...{
                  position: 'relative',
                  background: active ? t.palette.ink : 'transparent',
                  border: `1px solid ${active ? t.palette.ink : 'transparent'}`,
                  borderRadius: 2,
                  cursor: 'pointer',
                  padding: '6px 14px',
                  color: active ? t.palette.paper : t.palette.muted,
                  fontFamily: t.font.body,
                  fontSize: 13, fontWeight: 500, letterSpacing: 0.1,
                  display: 'inline-flex', gap: 8, alignItems: 'baseline'
                }, color: "rgb(0, 0, 0)", background: "rgb(250, 250, 246)" }}>
                  <span style={{
                  ...t.eyebrow, fontSize: 9.5,
                  color: active ? t.palette.accent : t.palette.mute2
                }}>{item.index}</span>
                  <span>{item.label}</span>
                  {item.badge ?
                <span style={{
                  fontFamily: t.font.mono, fontSize: 10, color: active ? t.palette.accent : t.palette.accent,
                  border: `1px solid ${t.palette.accent}`, borderRadius: 2,
                  padding: '0 5px', lineHeight: '14px'
                }}>{item.badge}</span> :
                null}
                </button>);

          })}
          </nav>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifySelf: 'end' }}>
            <SearchInline />
            <AvatarChip name={window.BC_DATA.VIEWER.name} initials={window.BC_DATA.VIEWER.initials} />
          </div>
        </div>
      }
    </header>);

}

function Wordmark({ onClick }) {
  const t = React.useContext(ThemeCtx);
  return (
    <button onClick={onClick} style={{
      background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 10
    }}>
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <circle cx="11" cy="14" r="9" fill="none" stroke={t.palette.ink} strokeWidth="1.4" />
        <circle cx="17" cy="14" r="9" fill="none" stroke={t.palette.accent} strokeWidth="1.4" />
      </svg>
      <span style={{
        ...t.display, fontSize: 18, letterSpacing: '-0.02em', color: t.palette.ink
      }}>BridgeCircle</span>
    </button>);

}

function SearchInline({ compact }) {
  const t = React.useContext(ThemeCtx);
  if (compact) {
    return (
      <button aria-label="Search" style={{
        width: 34, height: 34, display: 'grid', placeItems: 'center',
        border: `1px solid ${t.palette.rule}`, borderRadius: 2,
        background: t.palette.card, cursor: 'pointer'
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" fill="none" stroke={t.palette.muted} strokeWidth="2" />
          <line x1="16" y1="16" x2="21" y2="21" stroke={t.palette.muted} strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>);

  }
  const [v, setV] = React.useState('');
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      border: `1px solid ${t.palette.rule}`, borderRadius: 2, padding: '6px 10px',
      background: t.palette.card,
      minWidth: 200
    }}>
      <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="7" fill="none" stroke={t.palette.muted} strokeWidth="2" />
        <line x1="16" y1="16" x2="21" y2="21" stroke={t.palette.muted} strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input
        value={v} onChange={(e) => setV(e.target.value)}
        placeholder="Search the circle…"
        style={{
          border: 'none', outline: 'none', background: 'transparent',
          fontFamily: t.font.body, fontSize: 12.5, color: t.palette.ink,
          width: 160
        }} />
      
      <span style={{ fontFamily: t.font.mono, fontSize: 10, color: t.palette.mute2, padding: '1px 5px', border: `1px solid ${t.palette.ruleSoft}`, borderRadius: 2 }}>⌘K</span>
    </div>);

}

function AvatarChip({ name, initials, compact }) {
  const t = React.useContext(ThemeCtx);
  const [open, setOpen] = React.useState(false);
  const wrapperRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {if (e.key === 'Escape') setOpen(false);};
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: compact ? 3 : '3px 10px 3px 3px',
        border: `1px solid ${open ? t.palette.ink : t.palette.rule}`,
        borderRadius: 2, background: t.palette.card,
        cursor: 'pointer', transition: 'border-color 120ms ease'
      }} data-comment-anchor="e19714e6cd-button-241-7">
        <span style={{
          width: compact ? 28 : 26, height: compact ? 28 : 26, borderRadius: 2,
          background: t.palette.ink, color: t.palette.paper,
          display: 'grid', placeItems: 'center',
          fontFamily: t.font.display, fontSize: 11, fontWeight: 600
        }}>{initials}</span>
        {!compact && <><span style={{ fontSize: 12, fontWeight: 500 }}>{name.split(' ')[0]}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" aria-hidden="true"
          style={{ transform: open ? 'rotate(180deg)' : '', transition: 'transform 120ms ease' }}>
          <polyline points="6 9 12 15 18 9" fill="none" stroke={t.palette.muted} strokeWidth="2" />
        </svg></>}
      </button>
      {open ? <CivicAccountMenu onClose={() => setOpen(false)} /> : null}
    </div>);

}

// Tiny SVG glyphs — same shapes as Atrium, no external dep.
function MenuGlyph({ kind, color }) {
  const c = color;
  const p = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: c, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  switch (kind) {
    case 'user':return <svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></svg>;
    case 'edit':return <svg {...p}><path d="M14 4l6 6L8 22H2v-6L14 4z" /></svg>;
    case 'lock':return <svg {...p}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>;
    case 'bell':return <svg {...p}><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>;
    case 'check':return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M8 12.5l3 3 5-6" /></svg>;
    case 'invite':return <svg {...p}><circle cx="9" cy="9" r="4" /><path d="M2 21c0-4 3.5-6 7-6s7 2 7 6" /><path d="M19 8v6M16 11h6" /></svg>;
    case 'help':return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-.8.6-1.5 1-1.5 2" /><circle cx="12" cy="17" r="0.8" fill={c} stroke="none" /></svg>;
    case 'logout':return <svg {...p}><path d="M10 17l-5-5 5-5M5 12h12" /><path d="M14 4h5v16h-5" /></svg>;
    default:return <svg {...p}><circle cx="12" cy="12" r="3" /></svg>;
  }
}

function CivicAccountMenu({ onClose }) {
  const t = React.useContext(ThemeCtx);
  const { VIEWER } = window.BC_DATA;
  const { goto, setActiveProfile } = useRoute();
  const [helperOn, setHelperOn] = React.useState(true);

  const sections = [
  {
    header:
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: `1px solid ${t.palette.ruleSoft}` }}>
          <div style={{ width: 40, height: 40, borderRadius: 2, background: t.palette.ink, color: t.palette.paper, display: 'grid', placeItems: 'center', fontFamily: t.font.display, fontSize: 15, fontWeight: 600, flexShrink: 0 }}>
            {VIEWER.initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: t.palette.ink }}>{VIEWER.name}</div>
            <div style={{ fontSize: 11.5, color: t.palette.muted, marginTop: 1 }}>Class of {VIEWER.cohortShort} · {VIEWER.title}</div>
          </div>
        </div>

  },
  {
    items: [
    { label: 'View your profile', sub: 'How others see you', icon: 'user', onClick: () => {setActiveProfile(VIEWER.id);goto('profile');onClose();} },
    { label: 'Edit profile', sub: 'Update career, interests', icon: 'edit', onClick: () => {setActiveProfile(VIEWER.id);goto('profile');onClose();} },
    { label: 'Account & privacy', sub: 'Email, password, visibility', icon: 'lock' }]

  },
  {
    header:
    <div style={{ margin: '4px 6px', padding: '10px 12px', background: t.palette.panel, border: `1px solid ${t.palette.ruleSoft}`, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: t.palette.ink }}>Helper mode</div>
            <div style={{ fontSize: 11.5, color: t.palette.muted, marginTop: 1 }}>{helperOn ? 'On — accepting mentor requests' : 'Paused — no new requests'}</div>
          </div>
          <button onClick={() => setHelperOn((v) => !v)} aria-pressed={helperOn} style={{
        width: 34, height: 20, padding: 0, border: 'none', cursor: 'pointer',
        borderRadius: 999, background: helperOn ? t.palette.accent : t.palette.rule,
        position: 'relative', flexShrink: 0, transition: 'background 120ms ease'
      }}>
            <span style={{
          position: 'absolute', top: 2, left: helperOn ? 16 : 2,
          width: 16, height: 16, borderRadius: 999, background: '#fff',
          transition: 'left 140ms cubic-bezier(.2,.8,.2,1)',
          boxShadow: '0 1px 2px rgba(14,14,13,0.2)'
        }} />
          </button>
        </div>

  },
  {
    items: [
    { label: 'Notifications', icon: 'bell' },
    { label: 'Verification', sub: 'Verified by Dev & Sam', icon: 'check' },
    { label: 'Invite a member', sub: 'Send a key to a fellow alum', icon: 'invite' }]

  },
  {
    items: [
    { label: 'Help & guidelines', icon: 'help', shortcut: '?' },
    { label: 'Sign out', danger: true, icon: 'logout' }]

  }];


  return (
    <div role="menu" style={{
      position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 60,
      width: 284,
      background: t.palette.card,
      border: `1px solid ${t.palette.rule}`,
      borderRadius: 2,
      boxShadow: '0 16px 40px rgba(14,14,13,0.12)',
      overflow: 'hidden'
    }}>
      {sections.map((s, si) =>
      <div key={si} style={{ borderTop: si > 0 ? `1px solid ${t.palette.ruleSoft}` : 'none', padding: s.items ? '4px' : 0 }}>
          {s.header || null}
          {(s.items || []).map((it, i) =>
        <button key={i} role="menuitem" onClick={() => {it.onClick?.();}}
        style={{
          width: '100%', textAlign: 'left',
          background: 'transparent', border: 'none', cursor: 'pointer',
          padding: '8px 10px', borderRadius: 2,
          display: 'grid', gridTemplateColumns: '18px 1fr auto', gap: 10, alignItems: 'center',
          color: it.danger ? t.palette.bad : t.palette.ink,
          fontFamily: t.font.body, fontSize: 13, fontWeight: 500
        }}
        onMouseEnter={(e) => {e.currentTarget.style.background = t.palette.panel;}}
        onMouseLeave={(e) => {e.currentTarget.style.background = 'transparent';}}>
              <MenuGlyph kind={it.icon} color={it.danger ? t.palette.bad : t.palette.muted} />
              <div style={{ minWidth: 0 }}>
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.label}</div>
                {it.sub ? <div style={{ fontSize: 11.5, color: t.palette.muted, fontWeight: 400, marginTop: 1 }}>{it.sub}</div> : null}
              </div>
              {it.shortcut ? <span style={{ fontFamily: t.font.mono, fontSize: 10, color: t.palette.mute2 }}>{it.shortcut}</span> : null}
            </button>
        )}
        </div>
      )}
    </div>);

}


function CivicFooter() {
  const t = React.useContext(ThemeCtx);
  const m = useCivicIsMobile();
  return (
    <footer style={{
      borderTop: `1px solid ${t.palette.rule}`,
      marginTop: m ? 48 : 80,
      padding: m ? '28px 14px 40px' : '36px 32px 60px',
      color: t.palette.muted,
      fontSize: 12,
      display: 'grid',
      gridTemplateColumns: m ? '1fr 1fr' : 'repeat(4, 1fr)',
      gap: m ? 20 : 28
    }}>
      <div>
        <Eyebrow>Colophon</Eyebrow>
        <div style={{ marginTop: 8, lineHeight: 1.55 }}>
          BridgeCircle is a verified, member-first network. Set in Inter Tight & Inter. Built for the Class of {window.BC_DATA.VIEWER.cohortShort}.
        </div>
      </div>
      <div>
        <Eyebrow>Members</Eyebrow>
        <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {['Code of conduct', 'Verification', 'Help & moderation'].map((x) => <li key={x}>{x}</li>)}
        </ul>
      </div>
      <div>
        <Eyebrow>Society</Eyebrow>
        <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {['About Hartwood', 'Founding members', 'Annual report'].map((x) => <li key={x}>{x}</li>)}
        </ul>
      </div>
      <div style={{ textAlign: m ? 'left' : 'right' }}>
        <Eyebrow>This issue</Eyebrow>
        <div style={{ marginTop: 8, fontFamily: t.font.mono, fontSize: 11, color: t.palette.mute2, letterSpacing: 0.4 }}>
          № 12.03 · 14.05.2026<br />
          Edition: members
        </div>
      </div>
    </footer>);

}

window.AppShell = AppShell;
window.RouteCtx = RouteCtx;
window.useRoute = useRoute;
window.NAV_ITEMS = NAV_ITEMS;