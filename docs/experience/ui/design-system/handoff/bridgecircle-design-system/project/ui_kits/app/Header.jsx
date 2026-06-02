// BridgeCircle UI Kit — Header.jsx
// MemberHeader: logo, desktop nav, search, bell, account menu
// Export: window.BCHeader

const NAV_LINKS = [
  { href: 'ask',    label: 'Ask',    icon: 'ask' },
  { href: 'help',   label: 'Help',   icon: 'help' },
  { href: 'people', label: 'People', icon: 'people' },
  { href: 'school', label: 'School', icon: 'school' },
  { href: 'inbox',  label: 'Inbox',  icon: 'inbox' },
];

const navIcons = {
  ask:    React.createElement('svg',{width:14,height:14,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},React.createElement('path',{d:'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'}),React.createElement('path',{d:'M9.5 9a2.5 2.5 0 0 1 4.9.6c0 1.7-2.4 2.4-2.4 2.4'}),React.createElement('path',{d:'M12 15h.01'})),
  help:   React.createElement('svg',{width:14,height:14,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},React.createElement('circle',{cx:12,cy:12,r:9}),React.createElement('circle',{cx:12,cy:12,r:4}),React.createElement('path',{d:'M4.93 4.93l4.24 4.24'}),React.createElement('path',{d:'M14.83 14.83l4.24 4.24'}),React.createElement('path',{d:'M14.83 9.17l4.24-4.24'}),React.createElement('path',{d:'M4.93 19.07l4.24-4.24'})),
  people: React.createElement('svg',{width:14,height:14,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},React.createElement('path',{d:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'}),React.createElement('circle',{cx:9,cy:7,r:4}),React.createElement('path',{d:'M22 21v-2a4 4 0 0 0-3-3.87'}),React.createElement('path',{d:'M16 3.13a4 4 0 0 1 0 7.75'})),
  school: React.createElement('svg',{width:14,height:14,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},React.createElement('path',{d:'M22 10v6M2 10l10-5 10 5-10 5z'}),React.createElement('path',{d:'M6 12v5c3 3 9 3 12 0v-5'})),
  inbox:  React.createElement('svg',{width:14,height:14,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},React.createElement('polyline',{points:'22 12 16 12 14 15 10 15 8 12 2 12'}),React.createElement('path',{d:'M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z'})),
  admin:  React.createElement('svg',{width:14,height:14,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},React.createElement('path',{d:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'})),
};

function BridgeLogo() {
  return React.createElement('svg', {
    width: 28, height: 28, viewBox: '0 0 28 28',
    fill: 'none', 'aria-hidden': true, style: { flexShrink: 0 },
  },
    React.createElement('circle', { cx: 11, cy: 14, r: 9, stroke: 'currentColor', strokeWidth: 1.4 }),
    React.createElement('circle', { cx: 17, cy: 14, r: 9, stroke: '#2563eb', strokeWidth: 1.4 })
  );
}

const NOTIFICATIONS = [
  { id:'n1', tone:'warn',  icon:'ask',  text:'Jordan Lee sent you a mentorship request.', stamp:'2h ago',  unread:true,  dest:'inbox' },
  { id:'n2', tone:'info',  icon:'conn', text:'Sofia Ramirez wants to connect with you.',  stamp:'5h ago',  unread:true,  dest:'inbox' },
  { id:'n3', tone:'open',  icon:'rsvp', text:'Maya Reyes accepted your RSVP for Founders Coffee.', stamp:'1d ago', unread:false, dest:'school' },
  { id:'n4', tone:'muted', icon:'ann',  text:'New announcement: 2026 Mentorship Awards — nominate by Jun 12.', stamp:'2d ago', unread:false, dest:'school' },
];
const notifIcons = {
  ask:  React.createElement('svg',{width:14,height:14,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('circle',{cx:12,cy:12,r:10}),React.createElement('path',{d:'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3'}),React.createElement('path',{d:'M12 17h.01'})),
  conn: React.createElement('svg',{width:14,height:14,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'}),React.createElement('circle',{cx:9,cy:7,r:4}),React.createElement('line',{x1:19,y1:8,x2:19,y2:14}),React.createElement('line',{x1:22,y1:11,x2:16,y2:11})),
  rsvp: React.createElement('svg',{width:14,height:14,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('rect',{x:3,y:4,width:18,height:18,rx:2,ry:2}),React.createElement('line',{x1:16,y1:2,x2:16,y2:6}),React.createElement('line',{x1:8,y1:2,x2:8,y2:6}),React.createElement('line',{x1:3,y1:10,x2:21,y2:10})),
  ann:  React.createElement('svg',{width:14,height:14,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},React.createElement('path',{d:'m3 11 19-9-9 19-2-8-8-2z'})),
};

function BCHeader({ activeScreen = 'ask', onNavigate = () => {}, isAdmin = false, unreadCount = 3 }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [accountOpen, setAccountOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState(NOTIFICATIONS);
  const unread = notifications.filter(n => n.unread).length;

  const links = isAdmin
    ? [...NAV_LINKS, { href: 'admin', label: 'Admin' }]
    : NAV_LINKS;

  return React.createElement(React.Fragment, null,
    React.createElement('header', {
    style: {
      position: 'sticky', top: 0, zIndex: 100,
      borderBottom: '1px solid #dcdcd6',
      background: '#ffffff', color: '#0c0c0b',
    },
  },
    React.createElement('div', {
      className: 'bc-header-inner',
      style: {
        margin: '0 auto', maxWidth: '1280px', padding: '0 32px',
        height: '72px', display: 'flex', alignItems: 'center', gap: '16px',
      },
    },
      // Logo + wordmark
      React.createElement('button', {
        onClick: () => onNavigate('ask'),
        style: {
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#0c0c0b', padding: 0, textDecoration: 'none',
        },
      },
        React.createElement(BridgeLogo),
        React.createElement('span', {
          className: 'bc-header-wordmark',
          style: {
            fontFamily: "'Inter Tight', sans-serif", fontSize: '18px',
            fontWeight: 700, letterSpacing: '-0.02em', color: '#0c0c0b',
            lineHeight: 1,
          },
        }, 'BridgeCircle')
      ),

      // Desktop nav
      React.createElement('nav', {
        className: 'bc-desktop-only',
        style: {
          display: 'flex', alignItems: 'stretch', gap: '28px',
          height: '100%', marginLeft: '8px',
        },
      },
        links.map(link => {
          const active = activeScreen === link.href;
          return React.createElement('button', {
            key: link.href,
            onClick: () => onNavigate(link.href),
            style: {
              position: 'relative', height: '100%',
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '14px', fontWeight: 500,
              fontFamily: "'Inter', sans-serif",
              color: active ? '#0c0c0b' : '#4d4d4a',
              padding: '0',
              transition: 'color 150ms ease-out',
              letterSpacing: '-0.01em',
            },
          },
            React.createElement('span', {
              style: {
                display: 'inline-flex', alignItems: 'center',
                color: active ? '#2563eb' : '#7a7a76',
                transition: 'color 150ms ease-out',
              },
            }, navIcons[link.icon || link.href]),
            link.label,
            active && React.createElement('div', {
              style: {
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: '2px', background: '#2563eb', borderRadius: '1px',
              },
            })
          );
        })
      ),

      // Right side
      React.createElement('div', {
        style: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' },
      },
        // Search bar (desktop only)
        React.createElement('div', {
          className: 'bc-desktop-only',
          style: {
            display: 'flex', alignItems: 'center', gap: '8px',
            height: '36px', padding: '0 12px',
            border: '1px solid #dcdcd6', borderRadius: '8px',
            background: '#fafaf9', width: '200px',
          },
        },
          React.createElement(SearchIcon, { size: 14 }),
          React.createElement('span', {
            style: { fontSize: '13px', color: 'rgba(77,77,74,0.5)' },
          }, 'Search the circle…')
        ),

        // Bell
        React.createElement('div', { style: { position: 'relative' } },
          React.createElement('button', {
            onClick: () => { setNotifOpen(o => !o); setAccountOpen(false); },
            style: {
              position: 'relative', width: '36px', height: '36px',
              borderRadius: '8px', border: 'none',
              background: notifOpen ? '#f4f3ee' : 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#0c0c0b', transition: 'background 150ms',
            },
          },
            React.createElement(BellIcon, { size: 18, dot: false }),
            unread > 0 && React.createElement('span', {
              style: {
                position: 'absolute', top: '6px', right: '6px',
                width: '8px', height: '8px', borderRadius: '50%',
                background: '#f59e0b', border: '1.5px solid #fff',
              },
            })
          ),
          notifOpen && React.createElement('div', {
            style: {
              position: 'absolute', top: '44px', right: 0, width: '340px',
              background: '#fff', border: '1px solid #dcdcd6',
              borderRadius: '12px', boxShadow: '0 8px 24px -4px rgba(12,12,11,0.12)',
              zIndex: 300, overflow: 'hidden',
            },
          },
            React.createElement('div', {
              style: { padding: '12px 14px 10px', borderBottom: '1px solid #ebebe5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
            },
              React.createElement('span', { style: { fontFamily: "'Inter Tight', sans-serif", fontSize: '14px', fontWeight: 600, color: '#0c0c0b' } }, 'Notifications'),
              unread > 0 && React.createElement('button', {
                onClick: e => { e.stopPropagation(); setNotifications(ns => ns.map(n => ({ ...n, unread: false }))); },
                style: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 500, color: '#2563eb', fontFamily: "'Inter', sans-serif" },
              }, 'Mark all read')
            ),
            React.createElement('ul', { style: { listStyle: 'none', maxHeight: '320px', overflowY: 'auto' } },
              notifications.map(n => {
                const accent = n.tone === 'warn' ? '#a16207' : n.tone === 'info' ? '#2563eb' : n.tone === 'open' ? '#15a05f' : '#4d4d4a';
                return React.createElement('li', {
                  key: n.id,
                  onClick: () => { setNotifOpen(false); setNotifications(ns => ns.map(x => x.id === n.id ? { ...x, unread: false } : x)); onNavigate(n.dest); },
                  style: { display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '11px 14px', borderBottom: '1px solid #ebebe5', background: n.unread ? 'rgba(37,99,235,0.04)' : '#fff', cursor: 'pointer', transition: 'background 150ms' },
                  onMouseEnter: e => { e.currentTarget.style.background = '#f4f3ee'; },
                  onMouseLeave: e => { e.currentTarget.style.background = n.unread ? 'rgba(37,99,235,0.04)' : '#fff'; },
                },
                  React.createElement('div', {
                    style: { width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, background: `rgba(0,0,0,0.04)`, border: `1px solid rgba(0,0,0,0.08)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent },
                  }, notifIcons[n.icon]),
                  React.createElement('div', { style: { flex: 1, minWidth: 0 } },
                    React.createElement('p', { style: { fontSize: '12.5px', color: '#0c0c0b', lineHeight: 1.4, fontWeight: n.unread ? 500 : 400 } }, n.text),
                    React.createElement('span', { style: { fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#4d4d4a', marginTop: '3px', display: 'block' } }, n.stamp)
                  ),
                  n.unread && React.createElement('span', { style: { width: '7px', height: '7px', borderRadius: '50%', background: '#2563eb', flexShrink: 0, marginTop: '4px' } })
                );
              })
            ),
            React.createElement('div', { style: { padding: '10px 14px', borderTop: '1px solid #ebebe5', textAlign: 'center' } },
              React.createElement('button', {
                onClick: () => { setNotifOpen(false); onNavigate('inbox'); },
                style: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 500, color: '#2563eb', fontFamily: "'Inter', sans-serif" },
              }, 'See all in Inbox →')
            )
          )
        ),

        // Avatar / account
        React.createElement('button', {
          onClick: () => setAccountOpen(o => !o),
          style: {
            width: '36px', height: '36px', borderRadius: '50%',
            border: '1px solid #dcdcd6', background: '#ebebe5',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', position: 'relative',
          },
        },
          React.createElement('span', {
            style: {
              fontFamily: "'Inter Tight', sans-serif",
              fontSize: '13px', fontWeight: 700, color: '#4d4d4a',
            },
          }, 'AW'),
          // Dropdown
          accountOpen && React.createElement('div', {
            style: {
              position: 'absolute', top: '44px', right: 0,
              background: '#fff', border: '1px solid #dcdcd6',
              borderRadius: '10px', boxShadow: '0 4px 12px -2px rgb(12 12 11/.06)',
              zIndex: 300, minWidth: '180px', padding: '6px',
            },
          },
            [
              { label: 'Your profile',         dest: 'profile' },
              { label: 'Mentorship settings',  dest: 'mentor_settings' },
              { label: 'Account settings',     dest: 'account_settings' },
              { label: '—' },
              { label: 'Sign out',             dest: 'signout' },
            ].map((item, i) =>
              item.label === '—'
                ? React.createElement('div', { key: i, style: { height: '1px', background: '#dcdcd6', margin: '4px 0' } })
                : React.createElement('button', {
                    key: item.label,
                    onClick: () => { setAccountOpen(false); onNavigate(item.dest); },
                    style: {
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '7px 10px', background: 'none', border: 'none',
                      cursor: 'pointer', borderRadius: '6px', fontSize: '13px',
                      fontFamily: "'Inter', sans-serif",
                      color: item.dest === 'signout' ? '#9b2c1f' : '#0c0c0b',
                    },
                    onMouseEnter: e => { e.currentTarget.style.background = '#f4f3ee'; },
                    onMouseLeave: e => { e.currentTarget.style.background = 'transparent'; },
                  }, item.label)
            )
          )
        )
      )
    )
  ),

  // ── Mobile bottom tab bar ─────────────────────────────────────────────
  React.createElement('nav', {
    className: 'bc-mobile-tabbar',
    'aria-label': 'Primary navigation',
  },
    links.map(link => {
      const active = activeScreen === link.href;
      const showBadge = link.href === 'inbox' && unread > 0;
      return React.createElement('button', {
        key: link.href,
        onClick: () => onNavigate(link.href),
        style: {
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '3px', background: 'none', border: 'none', cursor: 'pointer',
          padding: '4px 2px', position: 'relative',
          color: active ? '#2563eb' : '#7a7a76',
          fontFamily: "'Inter', sans-serif",
          fontSize: '10px', fontWeight: active ? 600 : 500,
          letterSpacing: '0.01em',
          minWidth: 0,
        },
      },
        React.createElement('span', {
          style: {
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '22px', height: '22px', position: 'relative',
          },
        },
          // Scale the 14px icons up a bit
          React.cloneElement(navIcons[link.icon || link.href], { width: 18, height: 18 }),
          showBadge && React.createElement('span', {
            style: {
              position: 'absolute', top: '-2px', right: '-4px',
              minWidth: '14px', height: '14px', padding: '0 3px', borderRadius: '8px',
              background: '#a16207', color: '#fff', fontSize: '9px', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'JetBrains Mono', monospace",
              border: '1.5px solid #fff',
            },
          }, unreadCount > 9 ? '9+' : unreadCount)
        ),
        React.createElement('span', null, link.label),
        active && React.createElement('span', {
          style: {
            position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)',
            width: '24px', height: '2px', borderRadius: '0 0 2px 2px',
            background: '#2563eb',
          },
        })
      );
    })
  )
  );
}

Object.assign(window, { BCHeader, BridgeLogo, NAV_LINKS });
