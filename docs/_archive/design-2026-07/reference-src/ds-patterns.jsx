/* eslint-disable */
// HISTORICAL PROTOTYPE ONLY. Do not copy these Atrium patterns into production.
// Use ../components.md, ../tokens.md, and the live app primitives.
// Atrium Design System — Navigation, Card patterns, page layout, root component

// ─── NAV ALTERNATIVE COMPONENTS ───────────────────────────────────────────

function NavAmbientStatus() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <style>{`@keyframes ds-pulse-ring { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:.75;transform:scale(1.1)} }`}</style>
      {/* Main pill */}
      <div style={{ background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: '999px 999px 16px 16px', padding: '8px 12px 10px 18px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 18, boxShadow: '0 1px 0 rgba(255,255,255,.5) inset, 0 6px 20px rgba(42,34,26,.07)', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <svg width="32" height="24" viewBox="0 0 32 24"><circle cx="11" cy="12" r="9" fill={DSC.accent} fillOpacity=".85"/><circle cx="21" cy="12" r="9" fill={DSC.ok} fillOpacity=".85"/></svg>
            <div style={{ position: 'absolute', inset: -3, borderRadius: 999, border: `1.5px solid ${DSC.accent}`, opacity: .4, animation: 'ds-pulse-ring 2.4s ease-in-out infinite', pointerEvents: 'none' }}/>
          </div>
          <span style={{ fontFamily: DSF.display, fontSize: 18, letterSpacing: '-.02em', color: DSC.ink, fontWeight: 600 }}>BridgeCircle</span>
        </div>
        <nav style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
          {[{id:'home',label:'Home',active:true},{id:'people',label:'People'},{id:'inbox',label:'Inbox'},{id:'events',label:'Events'}].map(it => (
            <div key={it.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px 16px', color: it.active ? DSC.ink : DSC.muted, fontFamily: DSF.body, fontSize: 13.5, fontWeight: it.active ? 700 : 600, borderRadius: 999 }}>{it.label}</button>
              <div style={{ width: 4, height: 4, borderRadius: 999, background: it.active ? DSC.accent : 'transparent', marginTop: -4 }}/>
            </div>
          ))}
        </nav>
        <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '3px 12px 3px 3px', borderRadius: 999, background: DSC.paper, border: `1px solid ${DSC.rule}`, cursor: 'pointer' }}>
          <DSAvatar name="Maren Holt" initials="MH" size={28}/>
          <span style={{ fontSize: 13, fontWeight: 600, fontFamily: DSF.body, color: DSC.ink }}>Maren</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={DSC.muted} strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      </div>
      {/* Context strip */}
      <div style={{ background: DSC.ink, borderRadius: '0 0 16px 16px', padding: '7px 22px', display: 'flex', alignItems: 'center', marginTop: -4, boxShadow: '0 6px 16px rgba(42,34,26,.16)' }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
          {[
            { icon: '◉', text: '2 replies waiting', color: DSC.accent, bold: true },
            { icon: '◈', text: 'Spring Supper · Tue 7:30pm', color: 'rgba(240,229,208,.65)' },
            { icon: '◎', text: "Dev Patel joined '11", color: 'rgba(240,229,208,.50)' },
          ].map((item, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span style={{ color: 'rgba(240,229,208,.20)', margin: '0 8px', fontSize: 10 }}>·</span>}
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0 2px' }}>
                <span style={{ fontSize: 8, color: item.color }}>{item.icon}</span>
                <span style={{ fontFamily: DSF.mono, fontSize: 10, fontWeight: item.bold ? 700 : 500, color: item.color, letterSpacing: '.04em' }}>{item.text}</span>
              </button>
            </React.Fragment>
          ))}
        </div>
        <span style={{ fontFamily: DSF.mono, fontSize: 9, color: 'rgba(240,229,208,.30)', letterSpacing: '.06em', flexShrink: 0 }}>LIVE</span>
      </div>
    </div>
  );
}

function NavEditorialBar() {
  const [active, setActive] = React.useState('home');
  return (
    <div style={{ background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: 20, padding: '10px 14px 10px 20px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 24, boxShadow: '0 1px 0 rgba(255,255,255,.5) inset, 0 8px 28px rgba(42,34,26,.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, borderRight: `1px solid ${DSC.ruleSoft}`, paddingRight: 20 }}>
        <svg width="36" height="27" viewBox="0 0 32 24"><circle cx="11" cy="12" r="9" fill={DSC.accent} fillOpacity=".88"/><circle cx="21" cy="12" r="9" fill={DSC.ok} fillOpacity=".88"/></svg>
        <div>
          <div style={{ fontFamily: DSF.display, fontSize: 17, letterSpacing: '-.025em', color: DSC.ink, fontWeight: 700, lineHeight: 1.1 }}>BridgeCircle</div>
          <div style={{ fontFamily: DSF.mono, fontSize: 9, color: DSC.muted, letterSpacing: '.08em', marginTop: 2 }}>HARTWOOD '14</div>
        </div>
      </div>
      <nav style={{ display: 'flex', gap: 2, paddingLeft: 4 }}>
        {[{id:'home',label:'Home'},{id:'people',label:'People'},{id:'inbox',label:'Inbox',badge:3},{id:'events',label:'Events'}].map(it => {
          const on = it.id === active;
          return (
            <button key={it.id} onClick={() => setActive(it.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '10px 14px', color: on ? DSC.ink : DSC.muted, fontFamily: DSF.body, fontSize: 13.5, fontWeight: on ? 700 : 500, borderRadius: 12, display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', position: 'relative', transition: 'color 120ms ease' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {it.label}
                {it.badge && !on ? <span style={{ background: dshex(DSC.accent, 0.15), color: DSC.accent, borderRadius: 999, padding: '0 6px', minWidth: 17, height: 17, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 700 }}>{it.badge}</span> : null}
              </span>
              <span style={{ position: 'absolute', bottom: 6, left: 14, right: 14, height: 2, background: on ? DSC.accent : 'transparent', borderRadius: 999, transition: 'background 160ms ease' }}/>
            </button>
          );
        })}
      </nav>
      <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px 5px 5px', borderRadius: 12, background: DSC.paper, border: `1px solid ${DSC.rule}`, cursor: 'pointer' }}>
        <DSAvatar name="Maren Holt" initials="MH" size={30}/>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 600, fontFamily: DSF.body, color: DSC.ink, lineHeight: 1.2 }}>Maren Holt</div>
          <div style={{ fontSize: 10, fontFamily: DSF.mono, color: DSC.muted, letterSpacing: '.06em' }}>CLASS OF '14</div>
        </div>
      </button>
    </div>
  );
}

// ─── NAVIGATION SECTION ────────────────────────────────────────────────────

function NavSection() {
  const [activeTab, setActiveTab] = React.useState('mentor');

  return (
    <DSSection id="nav" eyebrow="Components · 05" title="Navigation">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Floating pill nav bar */}
        <ShowCard title="Floating nav bar — desktop">
          <div style={{
            background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: 999,
            padding: '8px 12px 8px 18px',
            display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 18,
            boxShadow: '0 1px 0 rgba(255,255,255,.5) inset, 0 8px 28px rgba(42,34,26,0.06)',
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <svg width="32" height="24" viewBox="0 0 32 24">
                <circle cx="11" cy="12" r="9" fill={DSC.accent} fillOpacity="0.85" />
                <circle cx="21" cy="12" r="9" fill={DSC.ok}     fillOpacity="0.85" />
              </svg>
              <span style={{ fontFamily: DSF.display, fontSize: 18, letterSpacing: '-0.02em', color: DSC.ink, fontWeight: 600 }}>BridgeCircle</span>
            </div>
            <nav style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
              {[{ id: 'home', label: 'Home', active: true }, { id: 'people', label: 'People' }, { id: 'inbox', label: 'Inbox', badge: 3 }, { id: 'events', label: 'Events' }].map(item => (
                <button key={item.id} style={{ background: item.active ? DSC.ink : 'transparent', border: 'none', cursor: 'pointer', padding: '9px 16px', color: item.active ? DSC.paper : DSC.muted, fontFamily: DSF.body, fontSize: 13.5, fontWeight: 600, borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span>{item.label}</span>
                  {item.badge ? <span style={{ fontFamily: DSF.body, fontSize: 11, fontWeight: 700, color: '#fff', background: DSC.accent, borderRadius: 999, padding: '0 6px', minWidth: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{item.badge}</span> : null}
                </button>
              ))}
            </nav>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '3px 12px 3px 3px', borderRadius: 999, background: DSC.paper, border: `1px solid ${DSC.rule}`, cursor: 'pointer' }}>
              <DSAvatar name="Maren Holt" initials="MH" size={28} />
              <span style={{ fontSize: 13, fontWeight: 600, fontFamily: DSF.body, color: DSC.ink }}>Maren</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={DSC.muted} strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
            </button>
          </div>
        </ShowCard>

        <ShowCard title="Option A — Ambient status strip · nav becomes live context">
          <NavAmbientStatus/>
          <p style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.mute2, lineHeight: 1.6, marginTop: 10 }}>A warm-dark context strip below the pill shows live personal state — replies owed, upcoming events, new joiners. Active state uses a 4px accent dot instead of a filled background. Logo circles pulse when activity exists. The nav stops being silent chrome.</p>
        </ShowCard>

        <ShowCard title="Option B — Editorial identity · asymmetric, cohort-forward · click the tabs">
          <NavEditorialBar/>
          <p style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.mute2, lineHeight: 1.6, marginTop: 10 }}>Asymmetric layout — logo gets more room with cohort year underneath (HARTWOOD '14). Nav items are left-aligned with a sliding accent underline instead of a filled pill. Avatar chip shows full name + class year. Feels like a publication masthead.</p>
        </ShowCard>

        {/* Pill tabs */}
        <ShowCard title="Pill tabs — interactive">
          <div style={{ display: 'flex', gap: 8, padding: 4, background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: 999, width: 'fit-content', marginBottom: 20 }}>
            {[{ id: 'mentor', label: 'Mentorship', count: 2 }, { id: 'friend', label: 'Friend requests', count: 1 }, { id: 'threads', label: 'Active threads', count: 4 }].map(tab => {
              const active = tab.id === activeTab;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background: active ? DSC.ink : 'transparent', color: active ? DSC.paper : DSC.muted, border: 'none', cursor: 'pointer', padding: '9px 16px', borderRadius: 999, fontFamily: DSF.body, fontSize: 13.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', transition: 'background 100ms ease' }}>
                  <span>{tab.label}</span>
                  <span style={{ background: active ? dshex(DSC.paper, 0.18) : DSC.paper, color: active ? DSC.paper : DSC.muted, fontSize: 11, padding: '0 7px', minWidth: 18, height: 18, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{tab.count}</span>
                </button>
              );
            })}
          </div>
          <div style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.muted, letterSpacing: '0.04em' }}>Active: <strong style={{ color: DSC.ink }}>{activeTab}</strong></div>
        </ShowCard>

        {/* Account menu */}
        <ShowCard title="Account dropdown — sample menu item anatomy">
          <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 16px 40px rgba(42,34,26,0.14), 0 1px 0 rgba(255,255,255,.6) inset', maxWidth: 300 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px 14px', borderBottom: `1px solid ${DSC.ruleSoft}` }}>
              <DSAvatar name="Maren Holt" initials="MH" size={40} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, fontFamily: DSF.body, color: DSC.ink }}>Maren Holt</div>
                <div style={{ fontSize: 12, color: DSC.muted, fontFamily: DSF.body }}>Class of '14 · Product lead</div>
              </div>
            </div>
            {/* Menu items */}
            <div style={{ padding: '6px 6px' }}>
              {[
                { label: 'View your profile', sub: 'How others see you' },
                { label: 'Edit profile',      sub: 'Update career, interests' },
                { label: 'Account & privacy', sub: 'Email, password, visibility' },
              ].map((it, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '22px 1fr', gap: 10, padding: '8px 12px', borderRadius: 10, alignItems: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={DSC.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></svg>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, fontFamily: DSF.body, color: DSC.ink }}>{it.label}</div>
                    <div style={{ fontSize: 11.5, color: DSC.muted, marginTop: 1 }}>{it.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ borderTop: `1px solid ${DSC.ruleSoft}`, padding: '6px 6px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '22px 1fr', gap: 10, padding: '8px 12px', borderRadius: 10, alignItems: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={DSC.bad} strokeWidth="1.8" strokeLinecap="round"><path d="M10 17l-5-5 5-5M5 12h12" /><path d="M14 4h5v16h-5" /></svg>
                <div style={{ fontSize: 13, fontWeight: 500, fontFamily: DSF.body, color: DSC.bad }}>Sign out</div>
              </div>
            </div>
          </div>
        </ShowCard>
      </div>
    </DSSection>
  );
}

// ─── CARDS & PATTERNS SECTION ──────────────────────────────────────────────

function CardsSection() {
  return (
    <DSSection id="cards" eyebrow="Components · 06" title="Cards & Patterns">

      {/* Three core card types */}
      <DSSub title="Core card types">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>

          {/* Member card */}
          <div>
            <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Member card</div>
            <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 16, boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)', overflow: 'hidden', cursor: 'pointer' }}>
              <div style={{ padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontFamily: DSF.mono, fontSize: 10, letterSpacing: '0.14em', color: DSC.mute2, textTransform: 'uppercase', fontWeight: 600 }}>'11 · Brooklyn</span>
                  <DSTag tone="accent" dot>Open to mentor</DSTag>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <DSAvatar name="Iris Okonkwo" initials="IO" size={44} />
                  <h3 style={{ fontFamily: DSF.display, fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', margin: 0, color: DSC.ink, lineHeight: 1.1 }}>Iris Okonkwo</h3>
                </div>
                <div style={{ fontSize: 13, color: DSC.ink2, fontWeight: 500, lineHeight: 1.4 }}>VP of Investments <span style={{ color: DSC.muted, fontWeight: 400 }}>at</span> Common Capital</div>
                <p style={{ fontSize: 13, lineHeight: 1.5, color: DSC.muted, margin: '10px 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>Climate tech and infrastructure. Advising founders on early-stage fundraising.</p>
                <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
                  <DSTag>Climate tech</DSTag>
                  <DSTag>VC</DSTag>
                  <DSTag>Fundraising</DSTag>
                </div>
              </div>
              {/* Relationship layer */}
              <div style={{ borderTop: `1px solid ${DSC.ruleSoft}`, background: DSC.panel, padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex' }}>
                    {[['Rosa Ferrara','RF'],['Sam Aldridge','SA']].map(([n,i], idx) => (
                      <div key={n} style={{ marginLeft: idx > 0 ? -8 : 0, borderRadius: 999, border: `2px solid ${DSC.panel}` }}><DSAvatar name={n} initials={i} size={22}/></div>
                    ))}
                  </div>
                  <span style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.ink2, fontWeight: 500 }}>
                    <strong style={{ fontWeight: 700 }}>2 mutual members</strong>
                    <span style={{ color: DSC.muted }}> · Rosa + 1</span>
                  </span>
                </div>
                <span style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '.06em' }}>MET AT SPRING SUPPER</span>
              </div>
            </div>
          </div>

          {/* Event mini card */}
          <div>
            <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Event mini card</div>
            <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 16, boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)', padding: 16, display: 'flex', flexDirection: 'column' }}>
              <DSTag tone="muted">T−7d · Upcoming</DSTag>
              <div style={{ fontFamily: DSF.display, fontSize: 17, fontWeight: 600, margin: '10px 0 4px', letterSpacing: '-0.01em', lineHeight: 1.2, color: DSC.ink }}>Spring Supper — Hartwood</div>
              <div style={{ fontSize: 12.5, color: DSC.muted, marginBottom: 4 }}>Tue 15 May · 7:30 pm</div>
              <div style={{ fontSize: 12, color: DSC.muted }}>Host · Iris Okonkwo</div>
              <div style={{ marginTop: 'auto', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: DSC.muted }}>14/20 going</span>
                <DSButton size="sm" variant="outline">RSVP</DSButton>
              </div>
            </div>
          </div>

          {/* Activity feed */}
          <div>
            <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Activity feed</div>
            <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 16, boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)', padding: 16 }}>
              <DSEyebrow>Recent activity · 7 days</DSEyebrow>
              {/* Cluster: Spring Supper */}
              <div style={{ margin: '14px -2px 0', background: dshex(DSC.accent, 0.06), border: `1px solid ${dshex(DSC.accent, 0.18)}`, borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '9px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${dshex(DSC.accent, 0.12)}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex' }}>
                      {[['Iris Okonkwo','IO'],['Maren Holt','MH']].map(([n,i], idx) => (
                        <div key={n} style={{ marginLeft: idx > 0 ? -6 : 0 }}><DSAvatar name={n} initials={i} size={20}/></div>
                      ))}
                    </div>
                    <span style={{ fontFamily: DSF.body, fontSize: 12.5, fontWeight: 600, color: DSC.ink }}>Around Spring Supper</span>
                  </div>
                  <span style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '.06em' }}>2d</span>
                </div>
                <div style={{ padding: '8px 14px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {[{wi:'IO',name:'Iris',what:"RSVP'd · going"},{wi:'MH',name:'Maren',what:"RSVP'd · going"}].map((a,i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                      <DSAvatar name={a.name} initials={a.wi} size={18}/>
                      <span style={{ color: DSC.ink2 }}><strong style={{ fontWeight: 600 }}>{a.name}</strong> <span style={{ color: DSC.muted }}>{a.what}</span></span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Ungrouped items */}
              <div style={{ display: 'flex', flexDirection: 'column', marginTop: 4 }}>
                {[
                  { name: 'Dev Patel',    wi: 'DP', what: 'joined the network',    when: '2h' },
                  { name: 'Sam Aldridge', wi: 'SA', what: 'updated their profile', when: '4h' },
                ].map((a, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 10, padding: '8px 0', borderTop: `1px solid ${DSC.ruleSoft}`, alignItems: 'center' }}>
                    <DSAvatar name={a.name} initials={a.wi} size={24}/>
                    <span style={{ fontSize: 12.5, color: DSC.ink, minWidth: 0 }}>
                      <strong style={{ fontWeight: 600 }}>{a.name.split(' ')[0]}</strong>{' '}
                      <span style={{ color: DSC.muted }}>{a.what}</span>
                    </span>
                    <span style={{ fontSize: 11, color: DSC.mute2, whiteSpace: 'nowrap', fontFamily: DSF.mono }}>{a.when}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DSSub>

      {/* Section header pattern */}
      <DSSub title="Section header — bucket title pattern">
        <ShowCard title="Bucket header with count pill + CTA">
          <div style={{ borderTop: `2px solid ${DSC.ink}`, paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <h2 style={{ fontFamily: DSF.display, fontSize: 26, fontWeight: 600, margin: 0, letterSpacing: '-0.025em', color: DSC.ink }}>On your desk</h2>
                <span style={{ fontFamily: DSF.body, fontSize: 12, fontWeight: 600, color: DSC.accent, background: dshex(DSC.accent, 0.12), padding: '4px 12px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor' }} />3 replies you owe
                </span>
              </div>
              <p style={{ fontSize: 13.5, color: DSC.muted, margin: '6px 0 0', lineHeight: 1.55, fontFamily: DSF.body }}>People who have asked for your time, sorted by wait.</p>
            </div>
            <DSButton>Open inbox →</DSButton>
          </div>
        </ShowCard>
      </DSSub>

      {/* KPI strip */}
      <DSSub title="KPI strip — stat bar">
        <ShowCard title="">
          <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
            {/* Urgent — full bleed inverse */}
            <div style={{ background: DSC.ink, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div>
                <div style={{ fontFamily: DSF.mono, fontSize: 10, fontWeight: 700, letterSpacing: '.10em', color: 'rgba(240,229,208,.50)', textTransform: 'uppercase', marginBottom: 4 }}>Your desk right now</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontFamily: DSF.display, fontSize: 44, fontWeight: 700, color: DSC.accent, letterSpacing: '-.03em', lineHeight: 1 }}>2</span>
                  <span style={{ fontFamily: DSF.body, fontSize: 15, color: 'rgba(240,229,208,.82)', fontWeight: 400 }}>people waiting on your reply</span>
                </div>
              </div>
              <button style={{ marginLeft: 'auto', background: DSC.accent, color: '#fff', border: 'none', borderRadius: 999, padding: '9px 18px', fontFamily: DSF.body, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 1px 0 rgba(255,255,255,.2) inset' }}>Open inbox →</button>
            </div>
            {/* Secondary — narrative stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', padding: '16px 24px', gap: 0 }}>
              {[
                { value: '1,284', line1: 'members in your circle', line2: '94 in your Hartwood cohort', color: DSC.ink },
                { value: '+8',    line1: 'joined this week',        line2: '3 are in your industry',    color: DSC.ok  },
                { value: '347',   line1: 'open to mentor right now', line2: '12 match your background', color: DSC.ink2 },
              ].map((it, i) => (
                <div key={i} style={{ paddingLeft: i === 0 ? 0 : 20, paddingRight: i === 2 ? 0 : 20, borderRight: i === 2 ? 'none' : `1px solid ${DSC.ruleSoft}` }}>
                  <span style={{ fontFamily: DSF.display, fontSize: 30, fontWeight: 700, color: it.color, letterSpacing: '-.025em', lineHeight: 1, display: 'block' }}>{it.value}</span>
                  <div style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.ink2, marginTop: 5, lineHeight: 1.4, fontWeight: 500 }}>{it.line1}</div>
                  <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, marginTop: 2, lineHeight: 1.4 }}>{it.line2}</div>
                </div>
              ))}
            </div>
          </div>
        </ShowCard>
      </DSSub>

      {/* Greeting card + progress bar */}
      <DSSub title="Greeting card + progress bar">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
          <ShowCard title="Greeting strip">
            <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 16, padding: '24px 28px', position: 'relative', overflow: 'hidden', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
              <svg aria-hidden="true" width="260" height="160" viewBox="0 0 260 160" style={{ position: 'absolute', right: -30, top: -20, opacity: 0.20, pointerEvents: 'none' }}>
                <circle cx="100" cy="90" r="70" fill="none" stroke={DSC.accent} strokeWidth="1.4" />
                <circle cx="170" cy="90" r="70" fill="none" stroke={DSC.ok} strokeWidth="1.4" />
              </svg>
              <DSEyebrow accent>Good afternoon, Maren · Class of '14</DSEyebrow>
              <h1 style={{ fontFamily: DSF.display, fontSize: 32, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.08, margin: '10px 0 8px', color: DSC.ink, position: 'relative' }}>
                Lead the way. <span style={{ color: DSC.muted }}>What brings you in?</span>
              </h1>
              <p style={{ fontSize: 13.5, color: DSC.muted, margin: 0, lineHeight: 1.55, position: 'relative' }}>The Hartwood circle has grown by 8 since your last visit.</p>
            </div>
          </ShowCard>
          <ShowCard title="Progress bars">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[{ label: 'Event capacity', pct: 70, color: DSC.accent }, { label: 'Profile complete', pct: 64, color: DSC.ok }, { label: 'Waitlist filled', pct: 92, color: DSC.warn }].map(p => (
                <div key={p.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, color: DSC.ink2, fontFamily: DSF.body }}>{p.label}</span>
                    <span style={{ color: DSC.muted, fontFamily: DSF.body }}>{p.pct}%</span>
                  </div>
                  <div style={{ background: DSC.rule, borderRadius: 999, height: 6, overflow: 'hidden' }}>
                    <div style={{ background: p.color, height: '100%', width: `${p.pct}%`, borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>
          </ShowCard>
        </div>
      </DSSub>

    </DSSection>
  );
}

// ─── PAGE LAYOUT ───────────────────────────────────────────────────────────

const DS_NAV = [
  { id: 'overview',   label: 'Overview',          group: null },
  { id: 'manifesto',  label: 'Manifesto',         group: 'The System' },
  { id: 'status',     label: 'Component status',  group: 'The System' },
  { id: 'changelog',  label: 'Changelog',         group: 'The System' },
  { id: 'roadmap',    label: 'Roadmap',           group: 'The System' },
  { id: 'color',      label: 'Color',              group: 'Foundation' },
  { id: 'type',       label: 'Typography',         group: 'Foundation' },
  { id: 'space',      label: 'Space & Shape',      group: 'Foundation' },
  { id: 'motion',     label: 'Motion',             group: 'Foundation' },
  { id: 'buttons',    label: 'Buttons',            group: 'Components' },
  { id: 'tags',       label: 'Tags & Badges',      group: 'Components' },
  { id: 'avatars',    label: 'Avatars',            group: 'Components' },
  { id: 'inputs',     label: 'Inputs',             group: 'Components' },
  { id: 'nav',        label: 'Navigation',         group: 'Components' },
  { id: 'cards',      label: 'Cards & Patterns',   group: 'Components' },
  { id: 'deskcards',  label: 'Desk & Request',     group: 'Components' },
  { id: 'pathcards',  label: 'Path Cards',         group: 'Components' },
  { id: 'eventcards', label: 'Event Cards',        group: 'Components' },
  { id: 'aisearch',   label: 'AI Search',          group: 'Components' },
  { id: 'filters',    label: 'Filters',            group: 'Components' },
  { id: 'feedback',   label: 'Feedback & Status',  group: 'Components' },
  { id: 'trust',      label: 'Trust & Community',  group: 'Components' },
  { id: 'viz',        label: 'Data Viz',           group: 'Components' },
  { id: 'conversation', label: 'Conversation',     group: 'Components' },
  { id: 'empties',    label: 'Empty States',       group: 'Components' },
  { id: 'editorial',  label: 'Editorial & Hero',   group: 'Components' },
  { id: 'achievements', label: 'Achievements',     group: 'Components' },
  { id: 'atmosphere', label: 'Atmosphere',         group: 'Components' },
  { id: 'character',  label: 'Character Variants', group: 'Components' },
  { id: 'motionplus', label: 'Motion Behaviors',   group: 'Components' },
  { id: 'extracontrols', label: 'Extended Controls', group: 'Components' },
  { id: 'extracards', label: 'Extended Cards & Motion', group: 'Components' },
  { id: 'diversecards',   label: 'Diversified Cards',    group: 'Components' },
  { id: 'diverserequests', label: 'Diversified Requests', group: 'Components' },
  { id: 'memberlib',  label: 'Member Card Library', group: 'Components' },
  { id: 'advmotion',  label: 'Advanced Animations', group: 'Components' },
  { id: 'icons',      label: 'Iconography',         group: 'Components' },
  { id: 'lamplight',  label: 'Dark / Lamplight',    group: 'Components' },
  { id: 'cmdk',       label: 'Command Palette',     group: 'Components' },
  { id: 'forms',      label: 'Forms',               group: 'Components' },
  { id: 'syspages',   label: 'System Pages',        group: 'Components' },
  { id: 'voice',      label: 'Voice & Microcopy',   group: 'Components' },
  { id: 'datadisplay',label: 'Data Display',        group: 'Components' },
  { id: 'notifications', label: 'Notifications',    group: 'Components' },
  { id: 'photography', label: 'Photography',        group: 'Components' },
  { id: 'longform',   label: 'Long-form Content',   group: 'Components' },
  { id: 'mobile',     label: 'Mobile Patterns',     group: 'Components' },
  { id: 'layout',     label: 'Layout Primitives',   group: 'Components' },
  { id: 'a11y',       label: 'Accessibility',       group: 'Components' },
  { id: 'charts',     label: 'Charts',              group: 'Components' },
  { id: 'emails',     label: 'Email Templates',     group: 'Components' },
  { id: 'search',     label: 'Search Results',      group: 'Components' },
  { id: 'coachmarks', label: 'Coach Marks & Tour',  group: 'Components' },
  { id: 'tooltips',   label: 'Tooltips & Popovers', group: 'Components' },
  { id: 'comments',   label: 'Comments & Threads',  group: 'Components' },
  { id: 'print',      label: 'Print Styles',        group: 'Components' },
  { id: 'brand',      label: 'Brand Assets',        group: 'Components' },
  { id: 'transitions',label: 'Page Transitions',    group: 'Components' },
  { id: 'loading',    label: 'Loading Pages',       group: 'Components' },
  { id: 'errors',     label: 'Error Boundary',      group: 'Components' },
  { id: 'density',    label: 'Density & Breakpoints', group: 'Components' },
  { id: 'tokens',     label: 'Token Export',        group: 'Code' },
  { id: 'tier1',      label: 'Reference · Tier 1', group: 'Code' },
  { id: 'tier2',      label: 'Reference · Tier 2', group: 'Code' },
  { id: 'screens',    label: 'Screen Examples',     group: 'Templates' },
];

function DSSidebar() {
  return (
    <aside style={{ position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', padding: '36px 0 40px', flexShrink: 0 }}>
      <div style={{ paddingRight: 20 }}>
        <a href="#overview" style={{ display: 'block', padding: '8px 12px', marginBottom: 4, fontFamily: DSF.body, fontSize: 13, fontWeight: 600, color: DSC.ink, borderRadius: 999 }}>Overview</a>
        {['The System', 'Foundation', 'Components', 'Code', 'Templates'].map(g => (
          <div key={g} style={{ marginTop: 22 }}>
            <div style={{ fontFamily: DSF.body, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: DSC.mute2, padding: '0 12px', marginBottom: 4 }}>{g}</div>
            {DS_NAV.filter(n => n.group === g).map(n => (
              <a key={n.id} href={`#${n.id}`}
                style={{ display: 'block', padding: '7px 12px', fontFamily: DSF.body, fontSize: 13, fontWeight: 500, color: DSC.muted, borderRadius: 999, transition: 'background 80ms, color 80ms' }}
                onMouseEnter={e => { e.currentTarget.style.background = dshex(DSC.ink, 0.06); e.currentTarget.style.color = DSC.ink; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = DSC.muted; }}>
                {n.label}
              </a>
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
}

function DSTopHeader() {
  return (
    <div style={{ borderBottom: `1px solid ${DSC.rule}`, padding: '20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <svg width="36" height="26" viewBox="0 0 32 24">
          <circle cx="11" cy="12" r="9" fill={DSC.accent} fillOpacity="0.85" />
          <circle cx="21" cy="12" r="9" fill={DSC.ok}     fillOpacity="0.85" />
        </svg>
        <div>
          <div style={{ fontFamily: DSF.display, fontSize: 20, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.02em', lineHeight: 1 }}>BridgeCircle</div>
          <div style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted, marginTop: 2 }}>Atrium Design System</div>
        </div>
      </div>
      <div style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.mute2, letterSpacing: '0.08em', textAlign: 'right' }}>
        <div>VERSION 1.0</div>
        <div style={{ marginTop: 2, color: DSC.muted }}>MAY 2026</div>
      </div>
    </div>
  );
}

function OverviewSection() {
  const facts = [
    { label: 'Font Families', value: '3',  sub: 'Inter Tight · Inter · JetBrains Mono' },
    { label: 'Accent Options', value: '3', sub: 'Terracotta · Olive · Plum' },
    { label: 'Surface Tones',  value: '4', sub: 'Warm · Soft · Neutral · Bone' },
    { label: 'Density Steps',  value: '3', sub: 'Compact · Comfortable · Roomy' },
  ];
  return (
    <section id="overview" style={{ paddingTop: 60, paddingBottom: 56 }}>
      {/* Hero card */}
      <div style={{ background: `linear-gradient(140deg, ${DSC.ink} 0%, #3d1f0e 100%)`, borderRadius: 24, padding: '52px 52px 56px', position: 'relative', overflow: 'hidden', marginBottom: 20 }}>
        <svg aria-hidden="true" width="560" height="340" viewBox="0 0 560 340" style={{ position: 'absolute', right: -100, top: -60, opacity: 0.18, pointerEvents: 'none' }}>
          <circle cx="200" cy="200" r="160" fill="none" stroke={DSC.accent} strokeWidth="1.5" />
          <circle cx="340" cy="200" r="160" fill="none" stroke={DSC.ok}     strokeWidth="1.5" />
          <circle cx="270" cy="80"  r="80"  fill="none" stroke={DSC.accent} strokeWidth="1" strokeOpacity="0.5" />
        </svg>
        <div style={{ position: 'relative' }}>
          <div style={{ fontFamily: DSF.body, fontSize: 11.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: DSC.accent, display: 'inline-block' }} />
            Design System · Atrium Theme
          </div>
          <h1 style={{ fontFamily: DSF.display, fontSize: 60, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.02, color: '#fff', margin: '0 0 20px' }}>
            Warm.<br />Rooted.<br />Member-first.
          </h1>
          <p style={{ fontFamily: DSF.body, fontSize: 16, color: 'rgba(255,255,255,0.68)', maxWidth: 480, lineHeight: 1.62, margin: 0 }}>
            The Atrium theme is BridgeCircle's warm-community skin. Oat surfaces, terracotta accent, Inter Tight display type — built for a verified, human-scale network where trust is the product.
          </p>
        </div>
      </div>

      {/* Fact grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {facts.map(f => (
          <div key={f.label} style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 16, padding: '20px 18px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
            <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>{f.label}</div>
            <div style={{ fontFamily: DSF.display, fontSize: 38, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.025em', lineHeight: 1 }}>{f.value}</div>
            <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, marginTop: 8, lineHeight: 1.45 }}>{f.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── ROOT ──────────────────────────────────────────────────────────────────

function DesignSystem() {
  const [narrow, setNarrow] = React.useState(window.innerWidth < 960);
  React.useEffect(() => {
    const fn = () => setNarrow(window.innerWidth < 960);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  return (
    <div style={{ background: DSC.paper, minHeight: '100vh', color: DSC.ink }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 36px' }}>
        <DSTopHeader />
        <div style={{ display: narrow ? 'block' : 'grid', gridTemplateColumns: narrow ? undefined : '196px 1fr', gap: narrow ? 0 : 52, alignItems: 'flex-start' }}>
          {!narrow && <DSSidebar />}
          <main style={{ minWidth: 0 }}>
            <OverviewSection />
            <ManifestoSection />
            <ComponentStatusSection />
            <ChangelogSection />
            <RoadmapSection />
            <ColorSection />
            <TypeSection />
            <SpaceSection />
            <MotionSection />
            <ButtonsSection />
            <TagsSection />
            <AvatarsSection />
            <InputsSection />
            <NavSection />
            <CardsSection />
            <DeskCardsSection />
            <PathCardsSection />
            <EventCardsSection />
            <AISearchSection />
            <FiltersSection />
            <FeedbackSection />
            <TrustSection />
            <VizSection />
            <ConversationSection />
            <EmptySection />
            <EditorialSection />
            <AchievementsSection />
            <AtmosphereSection />
            <CharacterSection />
            <MotionPlusSection />
            <ExtendedControlsSection />
            <ExtendedNarrativeSection />
            <DiverseCardsSection />
            <DiverseRequestsSection />
            <MemberLibrarySection />
            <AdvancedMotionSection />
            <IconographySection />
            <LamplightSection />
            <CommandPaletteSection />
            <FormsSection />
            <SystemPagesSection />
            <VoiceSection />
            <DataDisplaySection />
            <NotificationsSection />
            <PhotographySection />
            <LongformSection />
            <MobilePatternsSection />
            <LayoutPrimitivesSection />
            <AccessibilitySection />
            <ChartsSection />
            <EmailTemplatesSection />
            <SearchResultsSection />
            <CoachMarksSection />
            <TooltipsPopoversSection />
            <CommentsSection />
            <PrintStylesSection />
            <BrandAssetsSection />
            <PageTransitionsSection />
            <LoadingPagesSection />
            <ErrorBoundarySection />
            <DensityBreakpointsSection />
            <TokenExportSection />
            <ComponentCardsTier1Section />
            <ComponentCardsTier2Section />
            <ScreenExamplesSection />
            <HomeBlocksSection />
            <div style={{ borderTop: `1px solid ${DSC.rule}`, padding: '36px 0 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <svg width="28" height="20" viewBox="0 0 32 24"><circle cx="11" cy="12" r="9" fill={DSC.accent} fillOpacity="0.85" /><circle cx="21" cy="12" r="9" fill={DSC.ok} fillOpacity="0.85" /></svg>
                <span style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.muted }}>BridgeCircle · Atrium Design System v1.0</span>
              </div>
              <span style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.mute2, letterSpacing: '0.06em' }}>MAY 2026</span>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

window.DesignSystem = DesignSystem;
