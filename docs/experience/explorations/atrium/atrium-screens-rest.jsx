/* eslint-disable */
// Atrium — Inbox, Events, Profile screens.

function AtriumInbox() {
  const t = React.useContext(ThemeCtx);
  const { PENDING_REQUESTS, FRIEND_REQUESTS, THREADS, MEMBERS } = window.BC_DATA;
  const { goto, setActiveThread } = useAtriumRoute();
  const [tab, setTab] = React.useState('mentor');
  const [selected, setSelected] = React.useState(PENDING_REQUESTS[0].id);
  // Mobile drill-down: 'list' shows the list; tapping an item enters 'detail'.
  const [mobileView, setMobileView] = React.useState('list');
  const items =
    tab === 'mentor'  ? PENDING_REQUESTS :
    tab === 'friend'  ? FRIEND_REQUESTS :
    tab === 'threads' ? THREADS : [];
  const sel = items.find(i => i.id === selected) || items[0];
  const m = t.isMobile;

  return (
    <section style={{ padding: m ? '20px 16px' : '40px 24px', maxWidth: 1280, margin: '0 auto' }}>
      {m && mobileView === 'detail' ? (
        <button onClick={() => setMobileView('list')} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: t.palette.muted, fontFamily: t.font.body, fontSize: 13, fontWeight: 500,
          padding: '4px 0 12px', display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          <span>←</span> Back to Inbox
        </button>
      ) : (
        <>
          <AtriumEyebrow accent>Inbox · {PENDING_REQUESTS.length + FRIEND_REQUESTS.length} waiting · {THREADS.length} active</AtriumEyebrow>
          <h1 style={{ ...t.display, fontSize: m ? 32 : 56, margin: m ? '10px 0 0' : '14px 0 0' }}>
            Two replies due. <span style={{ color: t.palette.accent, fontStyle: 'italic' }}>One a long-time friend.</span>
          </h1>
        </>
      )}

      {/* Soft tabs — horizontal scroll on mobile so all three pills fit */}
      {!(m && mobileView === 'detail') ? (
      <div className="atrium-hscroll" style={{
        marginTop: m ? 20 : 32,
        display: 'flex', gap: 8, padding: 4,
        background: t.palette.cardAlt, border: `1px solid ${t.palette.rule}`,
        borderRadius: 999,
        width: m ? '100%' : 'fit-content',
        maxWidth: '100%',
        overflowX: 'auto',
        boxSizing: 'border-box',
      }}>
        {[
          { id: 'mentor',  label: 'Mentorship',      count: PENDING_REQUESTS.length },
          { id: 'friend',  label: 'Friend requests', count: FRIEND_REQUESTS.length },
          { id: 'threads', label: 'Active threads',  count: THREADS.length },
        ].map(tabItem => {
          const active = tab === tabItem.id;
          const firstId =
            tabItem.id === 'mentor'  ? PENDING_REQUESTS[0]?.id :
            tabItem.id === 'friend'  ? FRIEND_REQUESTS[0]?.id :
            THREADS[0]?.id;
          return (
            <button key={tabItem.id} onClick={() => { setTab(tabItem.id); setSelected(firstId); setMobileView('list'); }}
              style={{
                background: active ? t.palette.ink : 'transparent',
                color: active ? t.palette.paper : t.palette.muted,
                border: 'none', cursor: 'pointer',
                padding: '9px 16px', borderRadius: 999,
                fontFamily: t.font.body, fontSize: 13.5, fontWeight: 600,
                display: 'inline-flex', alignItems: 'center', gap: 8,
                whiteSpace: 'nowrap', flexShrink: 0,
              }}>
              <span>{tabItem.label}</span>
              <span style={{
                background: active ? hex(t.palette.paper, 0.18) : t.palette.paper,
                color: active ? t.palette.paper : t.palette.muted,
                fontSize: 11, padding: '0 7px', minWidth: 18, height: 18,
                borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
              }}>{tabItem.count}</span>
            </button>
          );
        })}
      </div>
      ) : null}

      <div style={{
        display: 'grid',
        gridTemplateColumns: m ? '1fr' : '380px 1fr',
        gap: m ? 14 : 24,
        marginTop: m ? 20 : 28,
      }}>
        {/* List — hidden on mobile when in detail view */}
        {!(m && mobileView === 'detail') ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tab === 'mentor' && PENDING_REQUESTS.map(req => (
            <button key={req.id} onClick={() => { setSelected(req.id); setMobileView('detail'); }} style={{
              ...t.cardSurface({ padding: 16, textAlign: 'left', cursor: 'pointer',
                borderColor: selected === req.id && !m ? t.palette.ink : t.palette.rule,
                background: selected === req.id && !m ? t.palette.cardAlt : t.palette.card }),
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AtriumAvatar name={req.from.name} initials={req.from.initials} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{req.from.name}</div>
                  <div style={{ fontSize: 12, color: t.palette.muted }}>’{String(req.from.year).slice(-2)} · {req.from.title}</div>
                </div>
                <span style={{ fontSize: 11.5, color: t.palette.mute2 }}>{req.sentAt}</span>
              </div>
              <p style={{ fontSize: 13, color: t.palette.muted, margin: '10px 0 8px', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {req.body}
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                <AtriumTag tone="warn" dot>Waiting</AtriumTag>
              </div>
            </button>
          ))}

          {tab === 'friend' && FRIEND_REQUESTS.map(req => (
            <button key={req.id} onClick={() => { setSelected(req.id); setMobileView('detail'); }} style={{
              ...t.cardSurface({ padding: 16, textAlign: 'left', cursor: 'pointer',
                borderColor: selected === req.id && !m ? t.palette.ink : t.palette.rule,
                background: selected === req.id && !m ? t.palette.cardAlt : t.palette.card }),
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AtriumAvatar name={req.from.name} initials={req.from.initials} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{req.from.name}</div>
                  <div style={{ fontSize: 12, color: t.palette.muted }}>{req.from.title} at {req.from.employer}</div>
                </div>
                <span style={{ fontSize: 11.5, color: t.palette.mute2 }}>{req.sentAt}</span>
              </div>
            </button>
          ))}

          {tab === 'threads' && THREADS.map(th => {
            const other = MEMBERS.find(mm => mm.id === th.withMember);
            const lastMsg = th.messages[th.messages.length - 1];
            return (
              <button key={th.id} onClick={() => { setSelected(th.id); setMobileView('detail'); }} style={{
                ...t.cardSurface({ padding: 16, textAlign: 'left', cursor: 'pointer',
                  borderColor: selected === th.id && !m ? t.palette.ink : t.palette.rule,
                  background: selected === th.id && !m ? t.palette.cardAlt : t.palette.card }),
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AtriumAvatar name={other.name} initials={other.initials} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{other.name}</div>
                    <div style={{ fontSize: 12, color: t.palette.muted }}>{th.title}</div>
                  </div>
                  <AtriumTag tone="ok" dot>Active</AtriumTag>
                </div>
                <p style={{ fontSize: 13, color: t.palette.muted, margin: '10px 0 0', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  <strong style={{ color: t.palette.ink2, fontWeight: 600 }}>{lastMsg.from === window.BC_DATA.VIEWER.id ? 'You' : other.name.split(' ')[0]}:</strong> {lastMsg.body.replace(/^Attached:\s*/, '📎 ')}
                </p>
              </button>
            );
          })}
        </div>
        ) : null}

        {/* Detail — hidden on mobile when in list view */}
        {!(m && mobileView === 'list') ? (
        <div>
          {tab === 'mentor' && sel ? <AtriumMentorDetail req={sel} /> : null}
          {tab === 'friend' && sel ? <AtriumFriendDetail req={sel} /> : null}
          {tab === 'threads' && sel ? (
            <AtriumThreadPreview thread={sel} onOpen={() => { setActiveThread(sel.id); goto('thread'); }} />
          ) : null}
        </div>
        ) : null}
      </div>
    </section>
  );
}

function AtriumThreadPreview({ thread, onOpen }) {
  const t = React.useContext(ThemeCtx);
  const { MEMBERS } = window.BC_DATA;
  const other = MEMBERS.find(mm => mm.id === thread.withMember);
  const recent = thread.messages.slice(-3);
  const m = t.isMobile;
  return (
    <div style={t.cardSurface({ padding: m ? 18 : 28 })}>
      <div style={{
        display: 'flex',
        flexDirection: m ? 'column' : 'row',
        alignItems: m ? 'flex-start' : 'center',
        gap: 14, paddingBottom: 18, borderBottom: `1px solid ${t.palette.rule}`,
      }}>
        <AtriumAvatar name={other.name} initials={other.initials} size={m ? 48 : 56} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <AtriumEyebrow accent>Active thread · started {thread.startedAt}</AtriumEyebrow>
          <h2 style={{ ...t.display, fontSize: m ? 20 : 26, margin: '6px 0 4px', fontWeight: 600 }}>{thread.title}</h2>
          <div style={{ fontSize: 13, color: t.palette.muted }}>
            With <strong style={{ color: t.palette.ink2, fontWeight: 600 }}>{other.name}</strong> · {other.title} at {other.employer}
          </div>
        </div>
        <AtriumButton size="md" onClick={onOpen}>Open thread</AtriumButton>
      </div>

      <div style={{ padding: '22px 0 8px' }}>
        <AtriumEyebrow>Where we are</AtriumEyebrow>
        <p style={{ fontSize: 14.5, color: t.palette.ink2, marginTop: 10, lineHeight: 1.55 }}>{thread.summary}</p>
      </div>

      {thread.next ? (
        <div style={{ marginTop: 8, padding: 16, background: t.palette.cardAlt, borderRadius: t.radius, border: `1px solid ${t.palette.rule}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <AtriumEyebrow>Next</AtriumEyebrow>
            <div style={{ fontSize: 14.5, fontWeight: 600, marginTop: 4 }}>{thread.next.when}</div>
            <div style={{ fontSize: 12.5, color: t.palette.muted }}>{thread.next.kind}</div>
          </div>
          <AtriumButton size="sm" variant="outline">Join</AtriumButton>
        </div>
      ) : null}

      <div style={{ marginTop: 18 }}>
        <AtriumEyebrow>Last few messages</AtriumEyebrow>
        <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {recent.map((msg, i) => {
            const mine = msg.from === window.BC_DATA.VIEWER.id;
            const sender = mine ? window.BC_DATA.VIEWER : other;
            return (
              <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <AtriumAvatar name={sender.name} initials={sender.initials} size={24} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>{mine ? 'You' : sender.name.split(' ')[0]}</span>
                    <span style={{ fontFamily: t.font.mono, fontSize: 10, color: t.palette.mute2, letterSpacing: '0.14em' }}>{msg.at}</span>
                  </div>
                  <div style={{ fontSize: 13.5, color: t.palette.ink2, marginTop: 2, lineHeight: 1.5 }}>
                    {msg.kind === 'file' ? <em style={{ color: t.palette.muted }}>📎 {msg.body.replace(/^Attached:\s*/, '')}</em> : msg.body}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function AtriumMentorDetail({ req }) {
  const t = React.useContext(ThemeCtx);
  const { goto, setActiveProfile } = useAtriumRoute();
  const m = t.isMobile;
  return (
    <div style={t.cardSurface({ padding: m ? 18 : 28 })}>
      <div style={{
        display: 'flex',
        flexDirection: m ? 'column' : 'row',
        alignItems: m ? 'flex-start' : 'center',
        gap: 14, paddingBottom: 18, borderBottom: `1px solid ${t.palette.rule}`,
      }}>
        <AtriumAvatar name={req.from.name} initials={req.from.initials} size={m ? 48 : 56} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ ...t.display, fontSize: m ? 22 : 28, margin: 0, fontWeight: 600 }}>{req.from.name}</h2>
          <div style={{ fontSize: 13, color: t.palette.muted, marginTop: 4 }}>
            {req.from.title} at <strong style={{ color: t.palette.ink2, fontWeight: 600 }}>{req.from.employer}</strong> · ’{String(req.from.year).slice(-2)} · {req.from.city}
          </div>
        </div>
        <AtriumTag tone="warn" dot>Sent {req.sentAt}</AtriumTag>
      </div>

      <div style={{ padding: '22px 0 8px' }}>
        <AtriumEyebrow>What they wrote</AtriumEyebrow>
        <p style={{ fontSize: m ? 15 : 16, lineHeight: 1.6, color: t.palette.ink, marginTop: 10 }}>
          “{req.body}”
        </p>
      </div>

      <div style={{ marginTop: 18, padding: m ? 14 : 18, background: t.palette.cardAlt, borderRadius: t.radius, border: `1px solid ${t.palette.rule}` }}>
        <AtriumEyebrow>You two share</AtriumEyebrow>
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          <ContextRow label="Mutual members" value="4" sub="Dev, Priya, Sam, Matty" />
          <ContextRow label="Recent activity" value="2 asks · 1 event" />
          <ContextRow label="Verification"   value="Hartwood ’19" />
          <ContextRow label="Same city"      value="Yes · Brooklyn" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
        <AtriumButton size={m ? 'md' : 'lg'}>Accept — open a thread</AtriumButton>
        <AtriumButton size={m ? 'md' : 'lg'} variant="outline" onClick={() => { setActiveProfile(req.from.id); goto('profile'); }}>View profile</AtriumButton>
        <AtriumButton size={m ? 'md' : 'lg'} variant="ghost">Decline politely</AtriumButton>
      </div>
    </div>
  );
}

function ContextRow({ label, value, sub }) {
  const t = React.useContext(ThemeCtx);
  return (
    <div>
      <div style={{ fontSize: 12, color: t.palette.muted }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: t.palette.ink, marginTop: 2 }}>{value}</div>
      {sub ? <div style={{ fontSize: 12, color: t.palette.mute2, marginTop: 2 }}>{sub}</div> : null}
    </div>
  );
}

function AtriumFriendDetail({ req }) {
  const t = React.useContext(ThemeCtx);
  const m = t.isMobile;
  return (
    <div style={t.cardSurface({ padding: m ? 18 : 28 })}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <AtriumAvatar name={req.from.name} initials={req.from.initials} size={m ? 48 : 56} />
        <div style={{ minWidth: 0 }}>
          <h2 style={{ ...t.display, fontSize: m ? 22 : 28, margin: 0, fontWeight: 600 }}>{req.from.name}</h2>
          <div style={{ fontSize: 13, color: t.palette.muted, marginTop: 4 }}>
            {req.from.title} at <strong style={{ color: t.palette.ink2, fontWeight: 600 }}>{req.from.employer}</strong> · ’{String(req.from.year).slice(-2)} · {req.from.city}
          </div>
        </div>
      </div>
      <p style={{ fontSize: 14.5, lineHeight: 1.55, color: t.palette.muted, marginTop: 18 }}>
        Adding {req.from.name.split(' ')[0]} as a friend lets you see when they’re hiring, posting asks, or attending the same events.
      </p>
      <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
        <AtriumButton size="md">Accept</AtriumButton>
        <AtriumButton size="md" variant="outline">Decline</AtriumButton>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

function AtriumEvents() {
  const t = React.useContext(ThemeCtx);
  const { EVENTS } = window.BC_DATA;
  const mob = t.isMobile;
  const { goto, setActiveEvent } = useAtriumRoute();

  const upcoming = EVENTS.filter(e => e.days >= 0);
  const past     = EVENTS.filter(e => e.days < 0);

  const [tab, setTab] = React.useState('upcoming');
  const items = tab === 'upcoming' ? upcoming : past;

  const headlines = {
    upcoming: <>Show up for someone <span style={{ color: t.palette.accent, fontStyle: 'italic' }}>this spring.</span></>,
    past: <>A record of <span style={{ color: t.palette.muted, fontStyle: 'italic' }}>where we've gathered.</span></>,
  };

  return (
    <section style={{ padding: mob ? '20px 16px' : '40px 24px', maxWidth: 1280, margin: '0 auto' }}>
      <AtriumEyebrow accent>Gatherings · {upcoming.length} upcoming · {past.length} past</AtriumEyebrow>
      <h1 style={{ ...t.display, fontSize: mob ? 32 : 56, margin: mob ? '10px 0 0' : '14px 0 0' }}>
        {headlines[tab]}
      </h1>

      {/* Tabs */}
      <div style={{ marginTop: mob ? 20 : 28 }}>
        <div className="atrium-hscroll" style={{
          display: 'inline-flex', gap: 3, padding: 3,
          background: t.palette.cardAlt, border: `1px solid ${t.palette.rule}`,
          borderRadius: 999, maxWidth: '100%', overflowX: 'auto',
        }}>
          {[
            { id: 'upcoming', label: 'Upcoming', count: upcoming.length },
            { id: 'past',     label: 'Past',     count: past.length     },
          ].map(tb => {
            const active = tab === tb.id;
            return (
              <button key={tb.id} onClick={() => setTab(tb.id)} style={{
                background: active ? t.palette.ink : 'transparent',
                color: active ? t.palette.paper : t.palette.muted,
                border: 'none', cursor: 'pointer',
                padding: '8px 18px', borderRadius: 999,
                fontFamily: t.font.body, fontSize: 13.5, fontWeight: 600,
                display: 'inline-flex', alignItems: 'center', gap: 8,
                whiteSpace: 'nowrap', transition: 'background 120ms ease, color 120ms ease',
              }}>
                {tb.label}
                <span style={{
                  background: active ? hex(t.palette.paper, 0.18) : t.palette.paper,
                  color: active ? t.palette.paper : t.palette.muted,
                  fontSize: 11, padding: '1px 7px', minWidth: 18, height: 18,
                  borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                }}>{tb.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{
        marginTop: mob ? 16 : 22,
        display: 'grid',
        gridTemplateColumns: mob ? '1fr' : 'repeat(2, 1fr)',
        gap: mob ? 14 : 18,
      }}>
        {items.map(e => <AtriumEventCard key={e.id} e={e} />)}
        {tab === 'upcoming' && items.length % 2 === 1 && !mob ? <AtriumEventStarter /> : null}
      </div>
    </section>
  );
}

function AtriumEventCard({ e }) {
  const t = React.useContext(ThemeCtx);
  const { goto, setActiveEvent } = useAtriumRoute();
  const isPast = e.days < 0;
  const fullPct = Math.round(e.going / e.capacity * 100);
  const openDetail = () => { setActiveEvent(e.id); goto('event-detail'); };
  const stop = (fn) => (ev) => { ev.stopPropagation(); fn?.(ev); };
  const mob = t.isMobile;

  return (
    <div
      role="button" tabIndex="0"
      onClick={openDetail}
      onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openDetail(); } }}
      style={{
        ...t.cardSurface({ overflow: 'hidden', cursor: 'pointer' }),
        transition: 'transform 120ms ease, box-shadow 120ms ease',
        opacity: isPast ? 0.88 : 1,
      }}
      onMouseEnter={(ev) => { ev.currentTarget.style.transform = 'translateY(-2px)'; ev.currentTarget.style.boxShadow = '0 1px 0 rgba(255,255,255,.6) inset, 0 10px 28px rgba(42,34,26,0.10)'; }}
      onMouseLeave={(ev) => { ev.currentTarget.style.transform = ''; ev.currentTarget.style.boxShadow = '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)'; }}>

      {/* Header — dark gradient for upcoming, soft archival for past */}
      {isPast ? (
        <div style={{
          background: t.palette.panel,
          borderBottom: `1px solid ${t.palette.rule}`,
          padding: mob ? '18px 18px' : '20px 24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
            <AtriumEyebrow>{e.where.includes('Online') ? 'Online' : 'In person'}</AtriumEyebrow>
            <span style={{ fontFamily: t.font.mono, fontSize: 10.5, letterSpacing: '0.12em', color: t.palette.muted, fontWeight: 600 }}>
              {Math.abs(e.days)} DAYS AGO
            </span>
          </div>
          <h3 style={{ ...t.display, fontSize: mob ? 19 : 22, color: t.palette.ink, margin: '8px 0 0', fontWeight: 600, lineHeight: 1.15 }}>{e.title}</h3>
        </div>
      ) : (
        <div style={{
          position: 'relative',
          background: `linear-gradient(135deg, ${t.palette.ink} 0%, ${t.palette.accent} 160%)`,
          color: '#fff', padding: mob ? '18px 18px' : '22px 24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
            <AtriumEyebrow color="rgba(255,255,255,0.7)">{e.where.includes('Online') ? 'Online' : 'In person'}</AtriumEyebrow>
            <span style={{ fontFamily: t.font.mono, fontSize: 11, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>T-{e.days} DAYS</span>
          </div>
          <h3 style={{ ...t.display, fontSize: mob ? 20 : 24, color: '#fff', margin: '8px 0 0', fontWeight: 600, lineHeight: 1.15 }}>{e.title}</h3>
        </div>
      )}

      <div style={{ padding: mob ? '16px 18px 18px' : '20px 24px 22px' }}>
        <div style={{ fontSize: 14.5, fontWeight: 600 }}>{e.when}</div>
        <div style={{ fontSize: 13, color: t.palette.muted, marginTop: 4 }}>{e.where} · {isPast ? 'hosted by ' : 'hosted by '}{e.host}</div>

        <p style={{ fontSize: 14, lineHeight: 1.55, color: t.palette.ink2, margin: '14px 0 0' }}>{e.blurb}</p>

        {/* Attendance row */}
        <div style={{ marginTop: 16, padding: 14, background: t.palette.cardAlt, borderRadius: t.radius - 4, border: `1px solid ${t.palette.rule}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex' }}>
            {window.BC_DATA.MEMBERS.slice(0, 4).map((mm, i) => (
              <div key={mm.id} style={{ marginLeft: i === 0 ? 0 : -10, position: 'relative', zIndex: 4 - i, boxShadow: `0 0 0 2px ${t.palette.cardAlt}`, borderRadius: 999 }}>
                <AtriumAvatar name={mm.name} initials={mm.initials} size={26} />
              </div>
            ))}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {isPast ? `${e.going} attended` : `${e.going} going`}
            </div>
            <div style={{ fontSize: 12, color: t.palette.muted }}>
              {isPast
                ? `${Math.round(e.going / e.capacity * 100)}% of ${e.capacity} capacity`
                : `${e.capacity - e.going} spots open · ${fullPct}% full`}
            </div>
          </div>
          {isPast && <AtriumTag tone="muted" dot>Past</AtriumTag>}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          {isPast ? (
            <AtriumButton size="md" variant="outline" style={{ flex: 1, justifyContent: 'center' }} onClick={stop(openDetail)}>
              View recap →
            </AtriumButton>
          ) : (
            <>
              <AtriumButton size="md" style={{ flex: mob ? '1 1 100%' : 1 }} onClick={stop()}>RSVP</AtriumButton>
              {mob ? null : <AtriumButton size="md" variant="outline" onClick={stop()}>Bring a guest</AtriumButton>}
              <AtriumButton size="md" variant="ghost" onClick={stop(openDetail)}>Details →</AtriumButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AtriumEventStarter() {
  const t = React.useContext(ThemeCtx);
  return (
    <div style={{
      ...t.cardSurface({ padding: 28, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'transparent', borderStyle: 'dashed' }),
    }}>
      <AtriumEyebrow>Host something</AtriumEyebrow>
      <h3 style={{ ...t.display, fontSize: 22, margin: '10px 0 8px', fontWeight: 600 }}>Start a small gathering</h3>
      <p style={{ fontSize: 13.5, color: t.palette.muted, margin: 0, maxWidth: 320, lineHeight: 1.55 }}>
        A long-table supper. A walking meeting. A book club for three. The circle is friendlier when more of us host.
      </p>
      <div style={{ marginTop: 14 }}>
        <AtriumButton size="md" variant="ink">Create an event</AtriumButton>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Profile lives in atrium-screens-profile.jsx now.
// ---------------------------------------------------------------------------

window.AtriumInbox = AtriumInbox;
window.AtriumEvents = AtriumEvents;
