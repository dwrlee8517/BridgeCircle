/* eslint-disable */
// Atrium Design System — Notification Center (Section 35)
// Persistent panel with history, filters, mark-all-read, and preferences.

function NotificationsSection() {
  return (
    <DSSection id="notifications" eyebrow="Components · 35" title="Notification Center">

      <DSSub title="Triggers — bell, count, and how it opens">
        <NotificationTriggers />
      </DSSub>

      <DSSub title="The panel — full notification history">
        <NotificationPanelDemo />
      </DSSub>

      <DSSub title="Notification row types — what each kind looks like">
        <NotificationRowTypes />
      </DSSub>

      <DSSub title="Preferences — fine-grained control inside the same panel">
        <NotificationPreferences />
      </DSSub>

    </DSSection>
  );
}

// ─── TRIGGERS ──────────────────────────────────────────────────────────────

function NotificationTriggers() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
      <VariantCard label="Nav bell · unread" note="Accent dot at corner. Count appears at 1+.">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0' }}>
          <button style={{ position: 'relative', width: 38, height: 38, borderRadius: 999, background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, cursor: 'pointer', display: 'grid', placeItems: 'center', color: DSC.ink }}>
            <Icon name="bell" size={17} color="currentColor" />
            <span style={{ position: 'absolute', top: 5, right: 5, width: 10, height: 10, borderRadius: 999, background: DSC.accent, border: `2px solid ${DSC.cardAlt}` }} />
          </button>
        </div>
      </VariantCard>

      <VariantCard label="Nav bell · 3 unread" note="Numeric chip past 1 unread.">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0' }}>
          <button style={{ position: 'relative', width: 38, height: 38, borderRadius: 999, background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, cursor: 'pointer', display: 'grid', placeItems: 'center', color: DSC.ink }}>
            <Icon name="bell" size={17} color="currentColor" />
            <span style={{ position: 'absolute', top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 999, background: DSC.accent, color: '#fff', fontFamily: DSF.body, fontSize: 11, fontWeight: 700, padding: '0 5px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${DSC.cardAlt}` }}>3</span>
          </button>
        </div>
      </VariantCard>

      <VariantCard label="Nav bell · muted" note="Helper mode off — bell with line through.">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0' }}>
          <button style={{ position: 'relative', width: 38, height: 38, borderRadius: 999, background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, cursor: 'pointer', display: 'grid', placeItems: 'center', color: DSC.muted }}>
            <Icon name="bell" size={17} color="currentColor" />
            <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
              <span style={{ width: 24, height: 1.5, background: DSC.muted, transform: 'rotate(-30deg)' }} />
            </span>
          </button>
        </div>
      </VariantCard>
    </div>
  );
}

// ─── PANEL ─────────────────────────────────────────────────────────────────

const NOTIFICATIONS = [
  { id: 1, kind: 'request', who: 'Jordan Reyes', init: 'JR', text: 'sent you a mentor request', sub: '"Hi Maren — I\u2019m building a climate fintech\u2026"', when: '6 days ago', unread: true,  cat: 'mine' },
  { id: 2, kind: 'reply',   who: 'Iris Okonkwo', init: 'IO', text: 'replied to your intro to Theo', sub: '"Happy to grab coffee Tue 4 pm in Brooklyn."', when: '2 hours ago', unread: true,  cat: 'mine' },
  { id: 3, kind: 'rsvp',    who: 'Dev Patel',    init: 'DP', text: 'RSVP\u2019d to Spring Supper',  sub: 'You\u2019re hosting · 14 of 20 confirmed',     when: '4 hours ago', unread: true,  cat: 'mine' },
  { id: 4, kind: 'mention', who: 'Sam Aldridge', init: 'SA', text: 'mentioned you in #climate-vc', sub: '"@maren has the underwriting deck — let me dig\u2026"', when: 'Yesterday',   unread: false, cat: 'mentions' },
  { id: 5, kind: 'join',    who: 'Rosa Ferrara', init: 'RF', text: 'joined the circle',            sub: "Class of '17 · CEO, Solaris Grid · Lagos",      when: 'Yesterday',   unread: false, cat: 'all' },
  { id: 6, kind: 'milestone', who: 'Hartwood',   init: 'HW', text: 'Your 5-year anniversary',      sub: 'You joined on 19 May 2021. Open your card \u2192', when: 'Today',       unread: true,  cat: 'mine' },
  { id: 7, kind: 'event',   who: 'Hartwood',     init: 'HW', text: 'Brooklyn Breakfast is starting in 30 min', sub: 'Hosted by Dev · 8 going',           when: '3 hours ago', unread: false, cat: 'all' },
  { id: 8, kind: 'reply',   who: 'Maren Holt',   init: 'MH', text: 'sent her edits on the supper deck', sub: '"Page 3 still feels too narrow\u2026"',     when: '2 days ago',  unread: false, cat: 'mine' },
];

function NotificationPanelDemo() {
  const [filter, setFilter] = React.useState('all');
  const [items, setItems]   = React.useState(NOTIFICATIONS);
  const filtered = items.filter(n => filter === 'all' || n.cat === filter || (filter === 'unread' && n.unread));
  const unreadCount = items.filter(n => n.unread).length;
  const markAllRead = () => setItems(prev => prev.map(n => ({ ...n, unread: false })));
  const markOne = (id) => setItems(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14, alignItems: 'flex-start' }}>
      {/* The opening trigger — visual context for the panel */}
      <div style={{ background: dshex(DSC.ink, 0.04), border: `1px dashed ${DSC.rule}`, borderRadius: 18, padding: '24px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>Panel opens from →</div>
        <button style={{ position: 'relative', width: 44, height: 44, borderRadius: 999, background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, cursor: 'pointer', display: 'grid', placeItems: 'center', color: DSC.ink, boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
          <Icon name="bell" size={19} color="currentColor" />
          <span style={{ position: 'absolute', top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 999, background: DSC.accent, color: '#fff', fontFamily: DSF.body, fontSize: 11, fontWeight: 700, padding: '0 5px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${DSC.cardAlt}` }}>{unreadCount}</span>
        </button>
        <div style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted, textAlign: 'center', maxWidth: 200, lineHeight: 1.5 }}>
          Anchored top-right in the app header. Clicking opens the panel as a slide-down sheet on desktop, full-screen drawer on mobile.
        </div>
      </div>

      {/* The panel */}
      <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 16px 36px rgba(42,34,26,0.16), 0 1px 0 rgba(255,255,255,.6) inset' }}>
        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${DSC.ruleSoft}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: DSF.display, fontSize: 16, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.015em' }}>Notifications</span>
            {unreadCount > 0 && (
              <span style={{ background: DSC.accent, color: '#fff', fontFamily: DSF.body, fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999, letterSpacing: '0.04em' }}>{unreadCount} new</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={markAllRead} disabled={unreadCount === 0} style={{ background: 'none', border: 'none', color: unreadCount === 0 ? DSC.mute2 : DSC.accent, fontFamily: DSF.body, fontSize: 12, fontWeight: 600, cursor: unreadCount === 0 ? 'default' : 'pointer', padding: '4px 8px' }}>Mark all read</button>
            <button aria-label="Preferences" style={{ width: 26, height: 26, borderRadius: 999, background: 'transparent', border: 'none', cursor: 'pointer', color: DSC.muted, display: 'grid', placeItems: 'center' }}>
              <Icon name="settings" size={14} color="currentColor" />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ padding: '8px 16px', borderBottom: `1px solid ${DSC.ruleSoft}`, display: 'flex', gap: 6 }}>
          {[
            { id: 'all',      label: 'All',      n: items.length },
            { id: 'unread',   label: 'Unread',   n: unreadCount },
            { id: 'mine',     label: 'About me', n: items.filter(i => i.cat === 'mine').length },
            { id: 'mentions', label: 'Mentions', n: items.filter(i => i.cat === 'mentions').length },
          ].map(t => {
            const active = filter === t.id;
            return (
              <button key={t.id} onClick={() => setFilter(t.id)} style={{ background: active ? DSC.ink : 'transparent', color: active ? DSC.paper : DSC.muted, border: 'none', padding: '5px 12px', borderRadius: 999, fontFamily: DSF.body, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {t.label}
                <span style={{ fontSize: 10, color: active ? DSC.paper : DSC.muted, opacity: 0.7 }}>{t.n}</span>
              </button>
            );
          })}
        </div>

        {/* List */}
        <div style={{ maxHeight: 420, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: DSF.body, fontSize: 13, color: DSC.muted }}>
              No {filter === 'unread' ? 'unread' : filter === 'mentions' ? 'mentions' : 'notifications'} here. <br />
              <span style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.mute2 }}>All caught up.</span>
            </div>
          ) : (
            filtered.map((n, i) => (
              <NotificationRow key={n.id} n={n} onMark={() => markOne(n.id)} first={i === 0} />
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 16px', borderTop: `1px solid ${DSC.ruleSoft}`, background: DSC.cardAlt, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.04em' }}>Showing {filtered.length} of {items.length}</span>
          <a style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.accent, fontWeight: 600, cursor: 'pointer' }}>See archive →</a>
        </div>
      </div>
    </div>
  );
}

function NotificationRow({ n, onMark, first }) {
  const kindIcon = { request: 'wave', reply: 'reply', rsvp: 'event', mention: 'message', join: 'people', milestone: 'sparkle', event: 'clock' };
  const kindColor = { request: DSC.accent, reply: DSC.ok, rsvp: DSC.accent, mention: '#3f5680', join: DSC.ok, milestone: DSC.accent, event: '#b88033' };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '8px 36px 1fr auto', gap: 12, padding: '12px 16px', borderTop: first ? 'none' : `1px solid ${DSC.ruleSoft}`, alignItems: 'flex-start', position: 'relative', cursor: 'pointer', transition: 'background 100ms ease' }}
      onMouseEnter={e => { e.currentTarget.style.background = DSC.cardAlt; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: n.unread ? DSC.accent : 'transparent', alignSelf: 'center', justifySelf: 'center' }} />
      <div style={{ position: 'relative' }}>
        <DSAvatar name={n.who} initials={n.init} size={36} />
        <span style={{ position: 'absolute', right: -3, bottom: -3, width: 16, height: 16, borderRadius: 999, background: kindColor[n.kind], color: '#fff', border: `2px solid ${DSC.card}`, display: 'grid', placeItems: 'center' }}>
          <Icon name={kindIcon[n.kind]} size={9} color="currentColor" />
        </span>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.ink2, lineHeight: 1.4 }}>
          <strong style={{ color: DSC.ink, fontWeight: 700 }}>{n.who}</strong> {n.text}
        </div>
        {n.sub && (
          <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, marginTop: 3, lineHeight: 1.45, fontStyle: n.kind === 'reply' || n.kind === 'request' || n.kind === 'mention' ? 'italic' : 'normal', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.sub}</div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        <span style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.mute2, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{n.when}</span>
        {n.unread && (
          <button onClick={(e) => { e.stopPropagation(); onMark(); }} style={{ fontFamily: DSF.body, fontSize: 10.5, color: DSC.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}>Mark read</button>
        )}
      </div>
    </div>
  );
}

// ─── ROW TYPES SHOWCASE ────────────────────────────────────────────────────

function NotificationRowTypes() {
  const examples = [
    { kind: 'request',   who: 'Jordan Reyes',  init: 'JR', text: 'sent you a mentor request', sub: 'Climate fintech \u2014 wants 30 min', when: '6d', unread: true,  cat: 'mine' },
    { kind: 'reply',     who: 'Iris Okonkwo',  init: 'IO', text: 'replied to your intro',     sub: '"Tue at 4 pm works."',           when: '2h', unread: true,  cat: 'mine' },
    { kind: 'rsvp',      who: 'Dev Patel',     init: 'DP', text: 'RSVP\u2019d to Spring Supper',sub: '14 of 20 going',                 when: '4h', unread: false, cat: 'mine' },
    { kind: 'mention',   who: 'Sam Aldridge',  init: 'SA', text: 'mentioned you in #climate-vc', sub: '"@maren has the deck\u2026"', when: '1d', unread: false, cat: 'mentions' },
    { kind: 'join',      who: 'Rosa Ferrara',  init: 'RF', text: 'joined the circle',          sub: "Class of '17 \u00b7 Lagos",       when: '1d', unread: false, cat: 'all' },
    { kind: 'milestone', who: 'Hartwood',      init: 'HW', text: 'Your 5-year anniversary',    sub: 'You joined 19 May 2021',         when: 'now', unread: true,  cat: 'mine' },
    { kind: 'event',     who: 'Hartwood',      init: 'HW', text: 'Brooklyn Breakfast starting in 30 min', sub: 'Hosted by Dev',     when: '3h', unread: false, cat: 'all' },
  ];
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, overflow: 'hidden' }}>
      {examples.map((n, i) => (
        <NotificationRow key={i} n={n} onMark={() => {}} first={i === 0} />
      ))}
    </div>
  );
}

// ─── PREFERENCES ───────────────────────────────────────────────────────────

function NotificationPreferences() {
  const [prefs, setPrefs] = React.useState({
    request: { inApp: true,  email: true,  push: false },
    reply:   { inApp: true,  email: true,  push: true  },
    rsvp:    { inApp: true,  email: false, push: false },
    mention: { inApp: true,  email: false, push: true  },
    join:    { inApp: true,  email: false, push: false },
    milestone:{ inApp: true,  email: true,  push: false },
    event:   { inApp: true,  email: false, push: true  },
  });
  const rows = [
    { key: 'request', label: 'New mentor or coffee request', desc: 'Someone asks for your time' },
    { key: 'reply',   label: 'Replies on your threads',      desc: 'A conversation moves forward' },
    { key: 'rsvp',    label: 'RSVPs on events you host',     desc: 'You\u2019re hosting and someone confirms' },
    { key: 'mention', label: 'Mentions',                     desc: 'You\u2019re named in a thread' },
    { key: 'join',    label: 'New members in your cohort',   desc: 'A class-mate signs up' },
    { key: 'milestone',label:'Milestones',                   desc: 'Anniversaries, streaks, your name on the wire' },
    { key: 'event',   label: 'Event reminders',              desc: 'T\u22121h pings for events you\u2019re going to' },
  ];
  const toggle = (key, channel) => setPrefs(p => ({ ...p, [key]: { ...p[key], [channel]: !p[key][channel] } }));

  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 70px 70px', padding: '10px 18px', background: DSC.panel, borderBottom: `1px solid ${DSC.rule}`, fontFamily: DSF.mono, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: DSC.muted, fontWeight: 700 }}>
        <span>Notify me about</span>
        <span style={{ textAlign: 'center' }}>In app</span>
        <span style={{ textAlign: 'center' }}>Email</span>
        <span style={{ textAlign: 'center' }}>Push</span>
      </div>
      {rows.map((r, i) => (
        <div key={r.key} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 70px 70px', padding: '12px 18px', borderTop: i === 0 ? 'none' : `1px solid ${DSC.ruleSoft}`, alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: DSF.body, fontSize: 13, fontWeight: 600, color: DSC.ink }}>{r.label}</div>
            <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, marginTop: 2, lineHeight: 1.4 }}>{r.desc}</div>
          </div>
          {['inApp', 'email', 'push'].map(ch => (
            <div key={ch} style={{ display: 'grid', placeItems: 'center' }}>
              <NotifToggle on={prefs[r.key][ch]} onClick={() => toggle(r.key, ch)} />
            </div>
          ))}
        </div>
      ))}
      <div style={{ padding: '12px 18px', borderTop: `1px solid ${DSC.rule}`, background: DSC.cardAlt, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted }}>
          <strong style={{ color: DSC.ink, fontWeight: 700 }}>Quiet hours · 10 pm – 7 am</strong> · email summary instead of push
        </div>
        <DSButton size="sm" variant="outline">Adjust →</DSButton>
      </div>
    </div>
  );
}

function NotifToggle({ on, onClick }) {
  return (
    <button onClick={onClick} aria-pressed={on} style={{ width: 30, height: 18, padding: 0, border: 'none', cursor: 'pointer', borderRadius: 999, background: on ? DSC.accent : DSC.rule, position: 'relative', transition: 'background 120ms ease', flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: 2, left: on ? 14 : 2, width: 14, height: 14, borderRadius: 999, background: '#fff', transition: 'left 140ms cubic-bezier(.2,.8,.2,1)', boxShadow: '0 1px 2px rgba(42,34,26,0.20)' }} />
    </button>
  );
}

window.NotificationsSection = NotificationsSection;
