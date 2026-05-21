/* eslint-disable */
// Atrium Design System — Screen Examples / Templates (§54)

function ScreenExamplesSection() {
  return (
    <DSSection id="screens" eyebrow="Templates · 54" title="Screen Examples">

      <DSSub title="Six full screens — assembled from the system, nothing else">
        <ScreenGallery />
      </DSSub>

    </DSSection>
  );
}

function ScreenGallery() {
  const screens = [
    { id: 'home',      title: 'Home',           sub: 'Greeting · KPI strip · 3 buckets', uses: ['Greeting card', 'KPI strip', 'Bucket header', 'Path cards', 'Event hero', 'Activity wire'] },
    { id: 'people',    title: 'People',         sub: 'Directory with AI search + facets', uses: ['AI search', 'Filter bar', 'Member card grid', 'Pagination'] },
    { id: 'profile',   title: 'Member profile', sub: 'Hero portrait · career timeline',   uses: ['Hero portrait card', 'Pin chips', 'Career timeline', 'Trust ring'] },
    { id: 'event',     title: 'Event detail',   sub: 'Spring Supper · hosting state',     uses: ['Event hero', 'Attendee stack', 'Workshop slots', 'Confirmation banner'] },
    { id: 'onboarding',title: 'Onboarding · step 2', sub: 'Basics — name · cohort · photo', uses: ['Progress strip', 'Field group', 'File upload', 'Stepper footer'] },
    { id: 'letter',    title: 'The Letter',     sub: 'Long-form editorial template',      uses: ['TOC', 'Drop cap', 'Pull quote', 'Footnotes', 'Figure caption'] },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
      {screens.map(s => (
        <div key={s.id} style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 4px 14px rgba(42,34,26,0.06)' }}>
          {/* Browser chrome */}
          <div style={{ padding: '10px 14px', background: DSC.cardAlt, borderBottom: `1px solid ${DSC.rule}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'flex', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: dshex(DSC.muted, 0.35) }} />
              <span style={{ width: 8, height: 8, borderRadius: 999, background: dshex(DSC.muted, 0.35) }} />
              <span style={{ width: 8, height: 8, borderRadius: 999, background: dshex(DSC.muted, 0.35) }} />
            </span>
            <span style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.06em', marginLeft: 8 }}>hartwood.org/{s.id}</span>
          </div>
          {/* Screen */}
          <div style={{ background: DSC.paper, height: 340, overflow: 'hidden', position: 'relative' }}>
            {s.id === 'home'      && <HomeScreenMock />}
            {s.id === 'people'    && <PeopleScreenMock />}
            {s.id === 'profile'   && <ProfileScreenMock />}
            {s.id === 'event'     && <EventScreenMock />}
            {s.id === 'onboarding'&& <OnboardingScreenMock />}
            {s.id === 'letter'    && <LetterScreenMock />}
          </div>
          {/* Caption */}
          <div style={{ padding: '14px 18px', borderTop: `1px solid ${DSC.ruleSoft}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: DSF.display, fontSize: 15, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.01em' }}>{s.title}</span>
              <span style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.06em' }}>/{s.id}</span>
            </div>
            <div style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted, marginTop: 4 }}>{s.sub}</div>
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${DSC.ruleSoft}` }}>
              <div style={{ fontFamily: DSF.mono, fontSize: 9, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>Uses</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {s.uses.map(u => <span key={u} style={{ fontFamily: DSF.body, fontSize: 10.5, color: DSC.accent, background: dshex(DSC.accent, 0.10), border: `1px solid ${dshex(DSC.accent, 0.22)}`, padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>{u}</span>)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniNav({ active = 'Home' }) {
  return (
    <div style={{ padding: '8px 12px 8px 14px', background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '8px 12px 0' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <svg width="20" height="14" viewBox="0 0 32 24"><circle cx="11" cy="12" r="9" fill={DSC.accent} fillOpacity="0.85" /><circle cx="21" cy="12" r="9" fill={DSC.ok} fillOpacity="0.85" /></svg>
        <span style={{ fontFamily: DSF.display, fontSize: 11, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.015em' }}>BridgeCircle</span>
      </div>
      <div style={{ display: 'flex', gap: 2 }}>
        {['Home', 'People', 'Inbox', 'Events'].map(n => (
          <span key={n} style={{ padding: '4px 10px', background: n === active ? DSC.ink : 'transparent', color: n === active ? DSC.paper : DSC.muted, borderRadius: 999, fontFamily: DSF.body, fontSize: 9.5, fontWeight: 600 }}>{n}</span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <span style={{ position: 'relative', width: 16, height: 16, borderRadius: 999, background: DSC.card, border: `1px solid ${DSC.rule}`, display: 'grid', placeItems: 'center', color: DSC.ink }}><Icon name="bell" size={8} color="currentColor" /><span style={{ position: 'absolute', top: -2, right: -2, width: 7, height: 7, borderRadius: 999, background: DSC.accent }} /></span>
        <span style={{ width: 18, height: 18, borderRadius: 999, background: `linear-gradient(135deg, ${DSC.accent}, ${DSC.ok})`, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: DSF.display, fontSize: 7, fontWeight: 700 }}>MH</span>
      </div>
    </div>
  );
}

function HomeScreenMock() {
  return (
    <div>
      <MiniNav active="Home" />
      <div style={{ padding: '12px 14px' }}>
        {/* Greeting */}
        <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 10, padding: '12px 14px', marginBottom: 8, position: 'relative', overflow: 'hidden' }}>
          <svg aria-hidden="true" width="160" height="60" viewBox="0 0 200 80" style={{ position: 'absolute', right: -20, top: -10, opacity: 0.20 }}>
            <circle cx="60" cy="50" r="34" fill="none" stroke={DSC.accent} strokeWidth="1.2" />
            <circle cx="110" cy="50" r="34" fill="none" stroke={DSC.ok} strokeWidth="1.2" />
          </svg>
          <div style={{ fontFamily: DSF.mono, fontSize: 8, color: DSC.accent, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, position: 'relative' }}>Good afternoon, Maren · '14</div>
          <div style={{ fontFamily: DSF.display, fontSize: 17, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.02em', marginTop: 3, position: 'relative' }}>Lead the way.</div>
        </div>
        {/* KPI strip */}
        <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 10, padding: '8px 12px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 10 }}>
          {[['1,284', 'members'], ['3', 'replies', DSC.accent], ['+8', 'new', DSC.ok], ['347', 'mentors']].map(([v, l, c], i) => (
            <div key={i}>
              <div style={{ fontFamily: DSF.display, fontSize: 13, fontWeight: 700, color: c || DSC.ink, lineHeight: 1 }}>{v}</div>
              <div style={{ fontFamily: DSF.mono, fontSize: 7, color: DSC.muted, letterSpacing: '0.10em', marginTop: 3, fontWeight: 700 }}>{l}</div>
            </div>
          ))}
        </div>
        {/* Bucket */}
        <div style={{ borderTop: `1.5px solid ${DSC.ink}`, paddingTop: 8, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: DSF.display, fontSize: 13, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.015em' }}>On your desk</span>
          <span style={{ background: dshex(DSC.accent, 0.13), color: DSC.accent, fontFamily: DSF.body, fontSize: 8.5, fontWeight: 700, padding: '2px 7px', borderRadius: 999 }}>3 replies</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 8, padding: 8 }}>
              <div style={{ width: 18, height: 18, borderRadius: 999, background: `linear-gradient(135deg, ${DSC.accent}, ${DSC.ok})` }} />
              <div style={{ fontFamily: DSF.body, fontSize: 9, color: DSC.ink, fontWeight: 700, marginTop: 6 }}>Jordan R.</div>
              <div style={{ height: 4, background: dshex(DSC.muted, 0.3), borderRadius: 2, marginTop: 4, width: '70%' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PeopleScreenMock() {
  return (
    <div>
      <MiniNav active="People" />
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontFamily: DSF.mono, fontSize: 8, color: DSC.accent, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>The directory · 1,284 members</div>
        <div style={{ fontFamily: DSF.display, fontSize: 18, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.025em', marginTop: 4 }}>Find your people.</div>
        {/* AI search bar */}
        <div style={{ background: dshex(DSC.accent, 0.08), border: `1px solid ${dshex(DSC.accent, 0.24)}`, borderRadius: 12, padding: 8, marginTop: 10 }}>
          <div style={{ fontFamily: DSF.mono, fontSize: 7.5, color: DSC.accent, letterSpacing: '0.08em', fontWeight: 700, marginBottom: 5 }}>★ Ask the directory</div>
          <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 999, padding: '5px 8px', fontFamily: DSF.body, fontSize: 9, color: DSC.muted }}>climate underwriting in Brooklyn…</div>
        </div>
        {/* Pills */}
        <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
          {['Mentor', 'Near me', "'11", '+ More'].map((p, i) => (
            <span key={p} style={{ fontFamily: DSF.body, fontSize: 8, fontWeight: 600, padding: '3px 8px', background: i === 0 ? DSC.ink : DSC.cardAlt, color: i === 0 ? DSC.paper : DSC.ink, border: `1px solid ${DSC.rule}`, borderRadius: 999 }}>{p}</span>
          ))}
        </div>
        {/* Member grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 10 }}>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 8, padding: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: DSF.mono, fontSize: 6.5, color: DSC.muted, fontWeight: 700, letterSpacing: '0.10em' }}>'1{i + 1}</span>
                <span style={{ background: dshex(DSC.accent, 0.13), color: DSC.accent, fontFamily: DSF.body, fontSize: 6.5, fontWeight: 700, padding: '1px 5px', borderRadius: 999 }}>M</span>
              </div>
              <div style={{ width: 20, height: 20, borderRadius: 999, background: `linear-gradient(135deg, ${DSC.accent}, ${DSC.ok})`, marginTop: 4 }} />
              <div style={{ height: 5, background: dshex(DSC.ink, 0.3), borderRadius: 2, marginTop: 4, width: '85%' }} />
              <div style={{ height: 4, background: dshex(DSC.muted, 0.3), borderRadius: 2, marginTop: 3, width: '60%' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileScreenMock() {
  return (
    <div>
      <MiniNav active="People" />
      <div style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: '0.85fr 1.15fr', gap: 10 }}>
        {/* Portrait */}
        <div>
          <div style={{ aspectRatio: '1 / 1', background: `repeating-linear-gradient(135deg, ${DSC.panel} 0 6px, ${dshex(DSC.muted, 0.18)} 6px 7px)`, borderRadius: 8, position: 'relative' }}>
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 40, height: 40, borderRadius: 999, background: `linear-gradient(135deg, ${DSC.accent}, ${DSC.ok})`, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: DSF.display, fontSize: 13, fontWeight: 700 }}>IO</div>
          </div>
          {/* Trust ring */}
          <div style={{ marginTop: 8, background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 8, padding: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="34" height="34">
              <circle cx="17" cy="17" r="14" fill="none" stroke={DSC.rule} strokeWidth="3" />
              <circle cx="17" cy="17" r="14" fill="none" stroke={DSC.accent} strokeWidth="3" strokeDasharray="88" strokeDashoffset="22" strokeLinecap="round" transform="rotate(-90 17 17)" />
            </svg>
            <div>
              <div style={{ fontFamily: DSF.mono, fontSize: 7, color: DSC.muted, letterSpacing: '0.10em', fontWeight: 700 }}>VERIFIED</div>
              <div style={{ fontFamily: DSF.display, fontSize: 11, fontWeight: 700, color: DSC.ink }}>75%</div>
            </div>
          </div>
        </div>
        {/* Body */}
        <div>
          <div style={{ fontFamily: DSF.mono, fontSize: 7.5, color: DSC.accent, letterSpacing: '0.10em', fontWeight: 700 }}>'11 · BROOKLYN</div>
          <div style={{ fontFamily: DSF.display, fontSize: 16, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.02em', marginTop: 2 }}>Iris Okonkwo</div>
          <div style={{ fontFamily: DSF.body, fontSize: 9, color: DSC.muted, marginTop: 2 }}>VP Investments · Common Capital</div>
          {/* Pin chips */}
          <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
            {[DSC.accent, DSC.ok, '#3f5680'].map((c, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 6px', background: dshex(c, 0.10), border: `1px solid ${dshex(c, 0.28)}`, borderRadius: 999, fontFamily: DSF.body, fontSize: 7, color: c, fontWeight: 700 }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.5), ${c} 70%)` }} />
                {['Founder', 'Mentor', 'Host'][i]}
              </span>
            ))}
          </div>
          {/* Career timeline */}
          <div style={{ marginTop: 10, fontFamily: DSF.mono, fontSize: 7, color: DSC.muted, letterSpacing: '0.10em', fontWeight: 700 }}>CAREER</div>
          <div style={{ position: 'relative', marginTop: 6, paddingLeft: 18 }}>
            <div style={{ position: 'absolute', left: 4, top: 4, bottom: 4, width: 1.5, background: `linear-gradient(to bottom, ${DSC.accent}, ${dshex(DSC.muted, 0.4)})` }} />
            {[
              { y: '2022 — now', t: 'VP Investments · Common Capital', current: true },
              { y: '2019 — 2022', t: 'Senior PM · Watershed' },
              { y: '2016 — 2019', t: 'PM · Slack' },
            ].map((e, i) => (
              <div key={i} style={{ position: 'relative', marginBottom: 5 }}>
                <span style={{ position: 'absolute', left: -16, top: 3, width: 7, height: 7, borderRadius: 999, background: e.current ? DSC.accent : 'transparent', border: `1.5px solid ${e.current ? DSC.accent : DSC.muted}` }} />
                <div style={{ fontFamily: DSF.mono, fontSize: 6.5, color: DSC.mute2, letterSpacing: '0.04em', fontWeight: 700 }}>{e.y}</div>
                <div style={{ fontFamily: DSF.body, fontSize: 9, color: DSC.ink, fontWeight: 600 }}>{e.t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EventScreenMock() {
  return (
    <div>
      <MiniNav active="Events" />
      <div style={{ padding: '12px 14px' }}>
        {/* Hero event */}
        <div style={{ background: `linear-gradient(135deg, ${DSC.ink} 0%, ${DSC.accent} 160%)`, borderRadius: 8, padding: '10px 12px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ fontFamily: DSF.display, fontSize: 38, color: 'rgba(255,255,255,0.10)', fontWeight: 600, position: 'absolute', right: 6, bottom: -6, letterSpacing: '-0.04em' }}>7D</div>
          <div style={{ fontFamily: DSF.mono, fontSize: 8, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.10em', fontWeight: 700, textTransform: 'uppercase' }}>Spring Supper · You're hosting</div>
          <div style={{ fontFamily: DSF.display, fontSize: 14, fontWeight: 600, color: '#fff', marginTop: 4 }}>Tuesday 27 May · 7:30 pm</div>
          <div style={{ position: 'absolute', top: 8, right: 12, fontFamily: DSF.display, fontSize: 14, fontWeight: 700, color: DSC.accent, filter: 'brightness(1.6)' }}>T−7d</div>
        </div>
        {/* Capacity */}
        <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 8, padding: '8px 10px', marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: DSF.body, fontSize: 8, marginBottom: 4 }}>
            <span style={{ fontWeight: 700, color: DSC.ink2 }}>14 going</span>
            <span style={{ color: DSC.muted }}>70% full</span>
          </div>
          <div style={{ background: DSC.rule, height: 4, borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ background: DSC.accent, height: '100%', width: '70%', borderRadius: 999 }} />
          </div>
        </div>
        {/* Attendee stack */}
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex' }}>
            {[DSC.accent, DSC.ok, '#3f5680', DSC.warn, '#7a3a5e'].map((c, i) => (
              <div key={i} style={{ width: 18, height: 18, borderRadius: 999, background: `linear-gradient(135deg, ${c}, ${DSC.ink})`, border: `2px solid ${DSC.paper}`, marginLeft: i === 0 ? 0 : -6 }} />
            ))}
            <div style={{ marginLeft: -6, width: 18, height: 18, borderRadius: 999, background: dshex(DSC.ink, 0.08), border: `2px solid ${DSC.paper}`, display: 'grid', placeItems: 'center', fontFamily: DSF.body, fontSize: 6.5, fontWeight: 700, color: DSC.ink2 }}>+9</div>
          </div>
          <span style={{ fontFamily: DSF.body, fontSize: 9, color: DSC.muted }}>14 going · 6 invited</span>
        </div>
        {/* Confirmation */}
        <div style={{ marginTop: 8, padding: '7px 10px', background: dshex(DSC.ok, 0.10), border: `1px solid ${dshex(DSC.ok, 0.28)}`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 14, height: 14, borderRadius: 999, background: DSC.ok, display: 'grid', placeItems: 'center', color: '#fff' }}><Icon name="check" size={9} color="currentColor" strokeWidth={3.2} /></span>
          <div style={{ fontFamily: DSF.body, fontSize: 9, color: DSC.ink2 }}><strong style={{ color: DSC.ink }}>You\u2019re going.</strong> Seated next to Sam.</div>
        </div>
        {/* CTA */}
        <div style={{ marginTop: 8, padding: '8px 12px', background: DSC.accent, color: '#fff', borderRadius: 999, textAlign: 'center', fontFamily: DSF.body, fontSize: 10, fontWeight: 700 }}>Open event →</div>
      </div>
    </div>
  );
}

function OnboardingScreenMock() {
  return (
    <div>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${DSC.rule}`, padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <svg width="20" height="14" viewBox="0 0 32 24"><circle cx="11" cy="12" r="9" fill={DSC.accent} fillOpacity="0.85" /><circle cx="21" cy="12" r="9" fill={DSC.ok} fillOpacity="0.85" /></svg>
          <span style={{ fontFamily: DSF.display, fontSize: 10, fontWeight: 600, color: DSC.ink }}>BridgeCircle</span>
        </div>
        <span style={{ fontFamily: DSF.body, fontSize: 9, color: DSC.muted }}>Sign out</span>
      </div>
      {/* Progress strip */}
      <div style={{ padding: '8px 14px', background: DSC.cardAlt, borderBottom: `1px solid ${DSC.ruleSoft}`, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {[true, true, false, false, false, false, false].map((on, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ height: 2, background: on || i === 2 ? DSC.accent : DSC.rule, borderRadius: 999 }} />
            <div style={{ fontFamily: DSF.mono, fontSize: 6.5, color: i === 2 ? DSC.ink : DSC.mute2, letterSpacing: '0.10em', fontWeight: 700 }}>0{i + 1}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontFamily: DSF.mono, fontSize: 8, color: DSC.accent, letterSpacing: '0.10em', fontWeight: 700 }}>STEP 02 · BASICS</div>
        <div style={{ fontFamily: DSF.display, fontSize: 16, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.025em', marginTop: 4 }}>Start with the basics.</div>
        {/* Upload + fields */}
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '50px 1fr', gap: 8, alignItems: 'flex-start' }}>
          <div style={{ width: 50, height: 50, borderRadius: 999, background: `repeating-linear-gradient(135deg, ${DSC.panel} 0 4px, ${dshex(DSC.muted, 0.18)} 4px 5px)`, border: `1.5px dashed ${DSC.muted}` }} />
          <div>
            <div style={{ fontFamily: DSF.mono, fontSize: 7.5, color: DSC.muted, letterSpacing: '0.10em', fontWeight: 700 }}>FULL NAME</div>
            <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 6, padding: '4px 8px', fontFamily: DSF.body, fontSize: 9, color: DSC.ink, marginTop: 3 }}>Maren Holt</div>
            <div style={{ fontFamily: DSF.mono, fontSize: 7.5, color: DSC.muted, letterSpacing: '0.10em', fontWeight: 700, marginTop: 8 }}>COHORT YEAR</div>
            <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 6, padding: '4px 8px', fontFamily: DSF.body, fontSize: 9, color: DSC.ink, marginTop: 3 }}>2014</div>
          </div>
        </div>
        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <span style={{ fontFamily: DSF.body, fontSize: 9, color: DSC.muted, fontWeight: 600 }}>← Back</span>
          <span style={{ padding: '5px 12px', background: DSC.accent, color: '#fff', borderRadius: 999, fontFamily: DSF.body, fontSize: 9, fontWeight: 700 }}>Continue →</span>
        </div>
      </div>
    </div>
  );
}

function LetterScreenMock() {
  return (
    <div>
      <div style={{ padding: '8px 14px', background: DSC.cardAlt, borderBottom: `1px solid ${DSC.rule}`, display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: DSF.mono, fontSize: 8, color: DSC.accent, letterSpacing: '0.14em', fontWeight: 700, textTransform: 'uppercase' }}>The Hartwood Letter · 142</span>
        <span style={{ fontFamily: DSF.mono, fontSize: 8, color: DSC.muted, letterSpacing: '0.06em' }}>~ 8 min</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr 60px', gap: 10, padding: '14px 14px' }}>
        {/* TOC */}
        <div>
          <div style={{ fontFamily: DSF.mono, fontSize: 6.5, color: DSC.muted, letterSpacing: '0.10em', fontWeight: 700, marginBottom: 6 }}>IN THIS LETTER</div>
          {['A door, opened', 'The next cohort', 'What we keep'].map((t, i) => (
            <div key={i} style={{ borderLeft: `2px solid ${i === 1 ? DSC.accent : 'transparent'}`, paddingLeft: 4, padding: '3px 0 3px 6px', marginLeft: -6 }}>
              <div style={{ fontFamily: DSF.body, fontSize: 7.5, color: i === 1 ? DSC.ink : DSC.muted, fontWeight: i === 1 ? 700 : 500, lineHeight: 1.3 }}>{t}</div>
            </div>
          ))}
        </div>
        {/* Body */}
        <div>
          <div style={{ fontFamily: DSF.display, fontSize: 16, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.025em', lineHeight: 1.1 }}>What we owe the next cohort.</div>
          <div style={{ fontFamily: DSF.display, fontStyle: 'italic', fontSize: 10, color: DSC.muted, marginTop: 4, lineHeight: 1.5 }}>Five years in, Hartwood is no longer an experiment in how members find each other.</div>
          <div style={{ marginTop: 8 }}>
            <span style={{ fontFamily: DSF.display, fontSize: 24, fontWeight: 600, color: DSC.accent, float: 'left', lineHeight: 0.8, padding: '3px 5px 0 0', letterSpacing: '-0.05em' }}>F</span>
            <div style={{ fontFamily: DSF.body, fontSize: 9, color: DSC.ink2, lineHeight: 1.6 }}>ive years after the first supper, we have a problem worth having: more people want in than the room can hold.<sup style={{ color: DSC.accent, fontFamily: DSF.mono, fontSize: 7, fontWeight: 700 }}>1</sup></div>
          </div>
          {/* Pull quote */}
          <div style={{ borderLeft: `2px solid ${DSC.accent}`, paddingLeft: 8, marginTop: 8, fontFamily: DSF.display, fontStyle: 'italic', fontSize: 10, color: DSC.ink, lineHeight: 1.4 }}>"The places that last remember what they're for."</div>
        </div>
        {/* Aside */}
        <div>
          <div style={{ fontFamily: DSF.mono, fontSize: 6.5, color: DSC.muted, letterSpacing: '0.10em', fontWeight: 700, marginBottom: 4 }}>PULL ASIDE</div>
          <div style={{ background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: 6, padding: 6 }}>
            <div style={{ fontFamily: DSF.display, fontSize: 18, fontWeight: 600, color: DSC.accent, letterSpacing: '-0.03em', lineHeight: 1 }}>14</div>
            <div style={{ fontFamily: DSF.body, fontSize: 7, color: DSC.muted, marginTop: 2 }}>strangers</div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.ScreenExamplesSection = ScreenExamplesSection;
