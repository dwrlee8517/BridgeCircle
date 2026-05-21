/* eslint-disable */
// Inbox, Events, and Profile screens for the Civic prototype.

function InboxScreen() {
  const t = React.useContext(ThemeCtx);
  const m = useCivicIsMobile();
  const { PENDING_REQUESTS, FRIEND_REQUESTS, MEMBERS, THREADS } = window.BC_DATA;
  const { goto, setActiveThread } = useRoute();
  const [tab, setTab] = React.useState('mentor');
  const [selected, setSelected] = React.useState(PENDING_REQUESTS[0].id);
  // On mobile we toggle list/detail — desktop shows both columns.
  const [showDetail, setShowDetail] = React.useState(false);

  const items = tab === 'mentor' ? PENDING_REQUESTS : tab === 'friend' ? FRIEND_REQUESTS : [];
  const sel = items.find(i => i.id === selected) || items[0];

  return (
    <section style={{ padding: m ? '28px 14px' : '56px 32px', maxWidth: 1280, margin: '0 auto' }}>
      <div>
        <Eyebrow color={t.palette.muted}>Requests for your time</Eyebrow>
        <h1 style={{ ...t.display, fontSize: m ? 28 : 48, margin: m ? '8px 0 0' : '12px 0 0' }}>
          {PENDING_REQUESTS.length + FRIEND_REQUESTS.length} waiting<span style={{ color: t.palette.muted }}> on your reply.</span>
        </h1>
      </div>

      {/* Tabs */}
      <div className="civic-hscroll" style={{ marginTop: m ? 28 : 44, display: 'flex', gap: 0, borderTop: `2px solid ${t.palette.ink}`, overflowX: m ? 'auto' : 'visible', WebkitOverflowScrolling: 'touch' }}>
        {[
          { id: 'mentor',  label: 'Mentorship', count: PENDING_REQUESTS.length },
          { id: 'friend',  label: 'Friend requests', count: FRIEND_REQUESTS.length },
          { id: 'message', label: 'Messages', count: 0 },
        ].map(tabItem => {
          const active = tab === tabItem.id;
          return (
            <button key={tabItem.id} onClick={() => { setTab(tabItem.id); setSelected((tabItem.id === 'mentor' ? PENDING_REQUESTS : FRIEND_REQUESTS)[0]?.id); setShowDetail(false); }} style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: m ? '12px 14px 12px 0' : '14px 22px 14px 0',
              marginRight: m ? 14 : 22,
              fontFamily: t.font.body, fontSize: 13, fontWeight: 500,
              color: active ? t.palette.ink : t.palette.muted,
              borderBottom: active ? `2px solid ${t.palette.ink}` : `2px solid transparent`,
              marginBottom: -1,
              display: 'inline-flex', alignItems: 'baseline', gap: 8, whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              <span>{tabItem.label}</span>
              <span style={{ fontFamily: t.font.mono, fontSize: 10.5, color: active ? t.palette.accent : t.palette.mute2, letterSpacing: '0.14em' }}>
                {String(tabItem.count).padStart(2, '0')}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '380px 1fr', gap: m ? 14 : 36, marginTop: 18 }}>
        {/* List — on mobile, hide once detail is open */}
        {(!m || !showDetail) && (
          <div style={{ borderTop: `1px solid ${t.palette.rule}` }}>
            {tab === 'mentor' && PENDING_REQUESTS.map(req => (
              <button key={req.id} onClick={() => { setSelected(req.id); setShowDetail(true); }} style={{
                background: (!m && selected === req.id) ? t.palette.panel : 'transparent',
                border: 'none', borderBottom: `1px solid ${t.palette.ruleSoft}`,
                padding: '16px 14px', cursor: 'pointer', width: '100%', textAlign: 'left',
                display: 'block',
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{req.from.name}</div>
                <div style={{ fontFamily: t.font.mono, fontSize: 10, color: t.palette.mute2, letterSpacing: '0.14em' }}>{req.sentAt}</div>
              </div>
              <div style={{ fontSize: 12.5, color: t.palette.muted, marginTop: 4, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {req.body}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <CivicChip tone="warn">Pending</CivicChip>
                <CivicChip tone="muted">’{String(req.from.year).slice(-2)}</CivicChip>
              </div>
            </button>
          ))}

          {tab === 'friend' && FRIEND_REQUESTS.map((req, idx) => (
            <button key={req.id} onClick={() => { setSelected(req.id); setShowDetail(true); }} style={{
              background: (!m && selected === req.id) ? t.palette.panel : 'transparent',
              border: 'none', borderBottom: `1px solid ${t.palette.ruleSoft}`,
              padding: '16px 14px', cursor: 'pointer', width: '100%', textAlign: 'left',
              display: 'block',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{req.from.name}</div>
                <div style={{ fontFamily: t.font.mono, fontSize: 10, color: t.palette.mute2, letterSpacing: '0.14em' }}>{req.sentAt}</div>
              </div>
              <div style={{ fontSize: 12.5, color: t.palette.muted, marginTop: 4 }}>
                {req.from.title} at {req.from.employer}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                {idx === 0 && <CivicChip tone="ok">Long-time friend</CivicChip>}
                <CivicChip tone="muted">&apos;{String(req.from.year).slice(-2)}</CivicChip>
              </div>
            </button>
          ))}

          {tab === 'message' && THREADS.length === 0 && (
            <div style={{ padding: '36px 14px', color: t.palette.muted, fontSize: 13, lineHeight: 1.55 }}>
              No messages right now. Direct notes land here, grouped by thread.
            </div>
          )}
          {tab === 'message' && THREADS.map(thread => {
            const other = MEMBERS.find(mm => mm.id === thread.withMember);
            const lastMsg = thread.messages[thread.messages.length - 1];
            if (!other) return null;
            return (
              <button key={thread.id} onClick={() => { setActiveThread(thread.id); goto('thread'); }} style={{
                background: 'transparent', border: 'none', borderBottom: `1px solid ${t.palette.ruleSoft}`,
                padding: '16px 14px', cursor: 'pointer', width: '100%', textAlign: 'left', display: 'block',
              }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <CivicAvatar name={other.name} initials={other.initials} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: t.palette.ink }}>{other.name}</span>
                      <span style={{ fontFamily: t.font.mono, fontSize: 10, color: t.palette.mute2, letterSpacing: '0.14em' }}>{thread.startedAt}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: t.palette.ink2, marginBottom: 2 }}>{thread.title}</div>
                    <div style={{ fontSize: 12.5, color: t.palette.muted, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                      {lastMsg ? lastMsg.body : ''}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
          </div>
        )}

        {/* Detail — on mobile, only show after a list item is tapped */}
        {(!m || showDetail) && (
        <div>
          {m && showDetail && (
            <button onClick={() => setShowDetail(false)} style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: t.palette.muted, fontFamily: t.font.mono, fontSize: 10.5,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              padding: '0 0 14px', display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>← Back to list</button>
          )}
          {tab === 'mentor' && sel ? <MentorRequestDetail req={sel} /> : null}
          {tab === 'friend' && sel ? <FriendRequestDetail req={sel} /> : null}
          {tab === 'message' && (
            <div style={t.cardSurface({ padding: 28, color: t.palette.muted, fontSize: 14 })}>
              Select a thread on the left to open it.
            </div>
          )}
        </div>
        )}
      </div>
    </section>
  );
}

function MentorRequestDetail({ req }) {
  const t = React.useContext(ThemeCtx);
  const m = useCivicIsMobile();
  const { goto, setActiveProfile, setActiveThread } = useRoute();
  return (
    <div style={t.cardSurface({ padding: m ? 18 : 32 })}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: m ? 'flex-start' : 'baseline', flexDirection: m ? 'column' : 'row', gap: m ? 8 : 0, borderBottom: `1px solid ${t.palette.rule}`, paddingBottom: 18 }}>
        <div>
          <Eyebrow>Mentorship request · {req.id}</Eyebrow>
          <h2 style={{ ...t.display, fontSize: m ? 24 : 32, margin: '8px 0 0' }}>{req.from.name}</h2>
          <div style={{ fontSize: 13, color: t.palette.muted, marginTop: 4 }}>
            {req.from.title} at <strong style={{ fontWeight: 600, color: t.palette.ink2 }}>{req.from.employer}</strong> · ’{String(req.from.year).slice(-2)} · {req.from.city}
          </div>
        </div>
        <CivicChip tone="warn">Sent {req.sentAt}</CivicChip>
      </div>

      <div style={{ padding: m ? '18px 0 22px' : '22px 0 28px' }}>
        <Eyebrow>What they wrote</Eyebrow>
        <p style={{ fontSize: m ? 15 : 16, lineHeight: 1.55, color: t.palette.ink, marginTop: 12 }}>
          “{req.body}”
        </p>
      </div>

      <div style={{ borderTop: `1px solid ${t.palette.rule}`, paddingTop: 14 }}>
        <Eyebrow>Context</Eyebrow>
        <NumberedField n={1} label="Cohort overlap"  value="None · 5 years apart" />
        <NumberedField n={2} label="Mutual members"  value="4 · including Dev Ramachandran" />
        <NumberedField n={3} label="Recent activity" value="Posted 2 asks · attended 1 event" />
        <NumberedField n={4} label="Verification"    value="Hartwood, verified ’19" />
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
        <CivicButton size={m ? 'md' : 'lg'} style={{ flex: m ? '1 1 100%' : 'initial', justifyContent: 'center' }} onClick={() => { setActiveThread && setActiveThread('thr-iris-maren'); goto('thread'); }}>Accept · open thread</CivicButton>
        <CivicButton size={m ? 'md' : 'lg'} variant="outline" style={{ flex: m ? 1 : 'initial', justifyContent: 'center' }} onClick={() => { setActiveProfile(req.from.id); goto('profile'); }}>View profile</CivicButton>
        <CivicButton size={m ? 'md' : 'lg'} variant="ghost" style={{ flex: m ? 1 : 'initial', justifyContent: 'center' }}>Decline politely</CivicButton>
      </div>
    </div>
  );
}

function FriendRequestDetail({ req }) {
  const t = React.useContext(ThemeCtx);
  const m = useCivicIsMobile();
  return (
    <div style={t.cardSurface({ padding: m ? 18 : 32 })}>
      <Eyebrow>Friend request · {req.id}</Eyebrow>
      <h2 style={{ ...t.display, fontSize: m ? 24 : 32, margin: '8px 0 0' }}>{req.from.name}</h2>
      <div style={{ fontSize: 13, color: t.palette.muted, marginTop: 4 }}>
        {req.from.title} at <strong style={{ fontWeight: 600, color: t.palette.ink2 }}>{req.from.employer}</strong> · ’{String(req.from.year).slice(-2)} · {req.from.city}
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.55, color: t.palette.muted, marginTop: 18 }}>
        Adding {req.from.name.split(' ')[0]} as a friend lets you see when they’re hiring, posting asks, or attending the same events.
      </p>
      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <CivicButton size="md" style={{ flex: m ? 1 : 'initial', justifyContent: 'center' }}>Accept</CivicButton>
        <CivicButton size="md" variant="outline" style={{ flex: m ? 1 : 'initial', justifyContent: 'center' }}>Decline</CivicButton>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

function EventsScreen() {
  const t = React.useContext(ThemeCtx);
  const m = useCivicIsMobile();
  const { EVENTS } = window.BC_DATA;
  return (
    <section style={{ padding: m ? '28px 14px' : '56px 32px', maxWidth: 1280, margin: '0 auto' }}>
      <div>
        <Eyebrow color={t.palette.muted}>Gatherings</Eyebrow>
        <h1 style={{ ...t.display, fontSize: m ? 28 : 48, margin: m ? '8px 0 0' : '12px 0 0' }}>
          Three events <span style={{ color: t.palette.muted }}>this spring.</span>
        </h1>
      </div>

      <div style={{ marginTop: m ? 28 : 44, borderTop: `2px solid ${t.palette.ink}`, paddingTop: m ? 22 : 36 }}>
        <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : 'repeat(3, 1fr)', gap: m ? 14 : 20 }}>
          {EVENTS.map((e, i) => <EventCard key={e.id} e={e} i={i + 1} />)}
        </div>
      </div>
    </section>
  );
}

function EventCard({ e, i }) {
  const t = React.useContext(ThemeCtx);
  const m = useCivicIsMobile();
  const { goto, setActiveEvent } = useRoute();
  const fullPct = Math.round(e.going / e.capacity * 100);
  return (
    <div style={t.cardSurface({ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' })}>
      {/* Header band */}
      <div style={{ padding: m ? '18px 18px 16px' : '24px 24px 20px', background: t.palette.panel, borderBottom: `1px solid ${t.palette.rule}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontFamily: t.font.mono, fontSize: 10, color: t.palette.mute2, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            EVT · 0{i}
          </span>
          <span style={{ fontFamily: t.font.mono, fontSize: 10, color: t.palette.accent, letterSpacing: '0.14em', border: `1px solid ${t.palette.accent}`, padding: '2px 8px', borderRadius: 2 }}>
            T-{e.days}D
          </span>
        </div>
        <h3 style={{ ...t.display, fontSize: m ? 22 : 26, margin: '0 0 10px' }}>{e.title}</h3>
        <p style={{ fontSize: 13.5, lineHeight: 1.55, color: t.palette.muted, margin: 0 }}>{e.blurb}</p>
      </div>
      {/* Body */}
      <div style={{ padding: m ? '14px 18px 18px' : '18px 24px 22px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <NumberedField n={1} label="When"  value={e.when} />
        <NumberedField n={2} label="Where" value={e.where} />
        <NumberedField n={3} label="Host"  value={e.host} />
        {/* Capacity */}
        <div style={{ paddingTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontFamily: t.font.mono, fontSize: 10, letterSpacing: '0.14em', color: t.palette.muted, textTransform: 'uppercase' }}>Capacity</span>
            <span style={{ fontFamily: t.font.mono, fontSize: 10, letterSpacing: '0.14em', color: t.palette.muted }}>{e.going} / {e.capacity} · {fullPct}%</span>
          </div>
          <div style={{ height: 3, background: t.palette.ruleSoft, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${fullPct}%`, background: t.palette.ink }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <CivicButton size="md" style={{ flex: 1 }}>RSVP</CivicButton>
          <CivicButton size="md" variant="outline" onClick={() => { setActiveEvent && setActiveEvent(e.id); goto('event-detail'); }}>Details</CivicButton>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

function ProfileScreen() {
  const t = React.useContext(ThemeCtx);
  const { activeProfile, goto } = useRoute();
  const { MEMBERS } = window.BC_DATA;
  const m = MEMBERS.find(x => x.id === activeProfile) || MEMBERS[0];

  return (
    <section style={{ padding: '56px 32px', maxWidth: 1280, margin: '0 auto' }}>
      {/* breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: t.font.mono, fontSize: 10.5, letterSpacing: '0.16em', color: t.palette.muted, marginBottom: 18 }}>
        <button onClick={() => goto('people')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: t.palette.muted, fontFamily: t.font.mono, fontSize: 10.5, letterSpacing: '0.16em', padding: 0 }}>
          PEOPLE
        </button>
        <span>/</span>
        <span style={{ color: t.palette.ink }}>{m.name.toUpperCase()}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 56 }}>
        <div>
          <Eyebrow>Member № 048 · Class of ’{String(m.year).slice(-2)}</Eyebrow>
          <h1 style={{ ...t.display, fontSize: 76, margin: '14px 0 6px' }}>{m.name}</h1>
          <div style={{ fontSize: 17, color: t.palette.muted, marginTop: 6 }}>
            {m.title} at <strong style={{ color: t.palette.ink2, fontWeight: 600 }}>{m.employer}</strong> · {m.city}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
            <CivicButton size="lg">Send a note</CivicButton>
            <CivicButton size="lg" variant="outline">Ask for advice</CivicButton>
            <CivicButton size="lg" variant="ghost">Save to friends</CivicButton>
          </div>

          <div style={{ marginTop: 48 }}>
            <SectionTitle index="01" title="In their own words" />
            <p style={{ fontSize: 18, lineHeight: 1.6, color: t.palette.ink, maxWidth: 720, fontFamily: t.font.display, letterSpacing: '-0.01em', fontWeight: 400 }}>
              “{m.bio}”
            </p>
          </div>

          <div style={{ marginTop: 56 }}>
            <SectionTitle index="02" title="Open to" />
            <HairlineTable
              cols="120px 1fr auto"
              rows={[
                [<Eyebrow key="1">01 · Mentorship</Eyebrow>, <span>{m.open === 'mentor' ? 'Yes — short-form, async or 30-min calls' : 'No'}</span>, <span style={{ color: m.open === 'mentor' ? t.palette.accent : t.palette.mute2 }}>●</span>],
                [<Eyebrow key="2">02 · Advice</Eyebrow>,     <span>Yes — for any Hartwood member</span>, <span style={{ color: t.palette.ok }}>●</span>],
                [<Eyebrow key="3">03 · Intros</Eyebrow>,     <span>Yes — particularly to investors and designers</span>, <span style={{ color: t.palette.ok }}>●</span>],
                [<Eyebrow key="4">04 · Hiring</Eyebrow>,     <span>Not actively · check back in Q3</span>, <span style={{ color: t.palette.mute2 }}>●</span>],
              ]}
            />
          </div>

          <div style={{ marginTop: 56 }}>
            <SectionTitle index="03" title="What they help with" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[...m.tags, 'Pitch decks', 'Cold intros', 'Career switches'].map(tag => (
                <span key={tag} style={{
                  fontFamily: t.font.mono, fontSize: 11, color: t.palette.ink2,
                  border: `1px solid ${t.palette.rule}`, padding: '6px 10px', borderRadius: 2,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar — verification + meta */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div style={t.cardSurface({ padding: 22 })}>
            <Eyebrow>Verification</Eyebrow>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 14 }}>
              <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
                <circle cx="16" cy="16" r="14" fill="none" stroke={t.palette.accent} strokeWidth="1.5" />
                <path d="M10 16.5 L14.5 21 L23 12" fill="none" stroke={t.palette.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div>
                <div style={{ ...t.display, fontSize: 18, color: t.palette.ink }}>Verified ’{String(m.year).slice(-2)}</div>
                <div style={{ fontSize: 12, color: t.palette.muted }}>By two anchor members</div>
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <NumberedField n={1} label="Anchor"   value="Dev Ramachandran" />
              <NumberedField n={2} label="Anchor"   value="Sam Aldridge" />
              <NumberedField n={3} label="Joined"   value="May 2025" />
              <NumberedField n={4} label="Activity" value="Last seen 2h ago" />
            </div>
          </div>

          <div style={t.cardSurface({ padding: 22 })}>
            <Eyebrow>You share</Eyebrow>
            <div style={{ marginTop: 14 }}>
              <NumberedField n={1} label="Mutuals"      value="4" sub="Dev, Priya, Sam, Matty" />
              <NumberedField n={2} label="Same city"    value="Yes · Brooklyn" />
              <NumberedField n={3} label="Past events"  value="2 attended together" />
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

window.InboxScreen = InboxScreen;
window.EventsScreen = EventsScreen;
window.ProfileScreen = ProfileScreen;
