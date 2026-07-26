/* eslint-disable */
// Atrium Design System — Component Cards · Tier 2 (Section 56)
// 12 composite components — what Tier 1 builds up to.

function ComponentCardsTier2Section() {
  return (
    <DSSection id="tier2" eyebrow="Code · 56" title="Component Reference · Tier 2">
      <p style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.muted, lineHeight: 1.6, maxWidth: 720, marginTop: -28, marginBottom: 28 }}>
        Composite components — what Tier 1 atoms build up to. Use these to build screens; reach for them before custom-rolling a layout.
      </p>

      <ComponentCard
        name="MemberCard" status="stable"
        summary="Default card for a member. Avatar · name · role · tags."
        renderFn={() => (
          <div style={{ maxWidth: 280 }}>
            <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: 16, boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontFamily: DSF.mono, fontSize: 10, letterSpacing: '0.14em', color: DSC.mute2, textTransform: 'uppercase', fontWeight: 600 }}>'11 · Brooklyn</span>
                <DSTag tone="accent" dot>Mentor</DSTag>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                <DSAvatar name="Iris Okonkwo" initials="IO" size={42} />
                <h3 style={{ fontFamily: DSF.display, fontSize: 18, fontWeight: 600, letterSpacing: '-0.015em', margin: 0, color: DSC.ink }}>Iris Okonkwo</h3>
              </div>
              <div style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.ink2 }}>VP Investments <span style={{ color: DSC.muted }}>at</span> Common Capital</div>
              <div style={{ display: 'flex', gap: 5, marginTop: 12, flexWrap: 'wrap' }}>
                <DSTag>Climate</DSTag><DSTag>VC</DSTag><DSTag>Fundraising</DSTag>
              </div>
            </div>
          </div>
        )}
        jsx={`<MemberCard member={iris} onSelect={open} />`}
        usage={`// Default
<MemberCard member={iris} onSelect={openProfile} />

// With AI match rationale (search results)
<MemberCard member={iris} rationale="Backed 12 climate startups" />

// Compact row variant
<MemberCard.Compact member={iris} />`}
        props={[
          { prop: 'member',    type: 'Member', req: true, default: '—', desc: '{ id, name, initials, year, city, role, employer, tags, open }' },
          { prop: 'onSelect',  type: '(member) => void', default: '—', desc: 'Fires on click' },
          { prop: 'rationale', type: 'string', default: '—', desc: 'Renders "Why this match?" footer (§10)' },
          { prop: 'variant',   type: '"default" | "compact" | "hero"', default: '"default"', desc: 'See §26 Member Library' },
        ]}
      />

      <ComponentCard
        name="EventCard" status="stable"
        summary="Two variants — Hero (dark gradient) and Mini (capacity)."
        renderFn={() => (
          <div style={{ maxWidth: 300 }}>
            <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ background: `linear-gradient(135deg, ${DSC.ink} 0%, ${DSC.accent} 160%)`, padding: '12px 16px', position: 'relative', overflow: 'hidden' }}>
                <DSEyebrow color="rgba(255,255,255,0.65)">Spring Supper · You're hosting</DSEyebrow>
                <div style={{ fontFamily: DSF.display, fontSize: 17, fontWeight: 600, color: '#fff', marginTop: 6 }}>Tuesday 27 May · 7:30</div>
                <div style={{ position: 'absolute', top: 12, right: 14, fontFamily: DSF.display, fontSize: 22, color: DSC.accent, filter: 'brightness(1.6)', fontWeight: 700 }}>T−7d</div>
              </div>
              <div style={{ padding: '12px 16px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 5 }}>
                  <span style={{ fontWeight: 600 }}>14 going</span>
                  <span style={{ color: DSC.muted }}>70% full</span>
                </div>
                <div style={{ background: DSC.rule, borderRadius: 999, height: 5 }}><div style={{ background: DSC.accent, height: '100%', width: '70%', borderRadius: 999 }} /></div>
              </div>
            </div>
          </div>
        )}
        jsx={`<EventCard event={supper} variant="hero" />`}
        usage={`<EventCard event={supper} variant="hero" />
<EventCard event={breakfast} variant="mini" />
<EventCard event={recap} variant="past" />        // see §24
<EventCard event={workshop} variant="workshop" />`}
        props={[
          { prop: 'event',    type: 'Event', req: true, default: '—', desc: '{ id, title, when, host, going, capacity, days }' },
          { prop: 'variant',  type: '"hero" | "mini" | "past" | "workshop" | "live"', default: '"mini"', desc: 'See §09 & §24' },
          { prop: 'onOpen',   type: '(event) => void', default: '—', desc: 'Click handler' },
        ]}
      />

      <ComponentCard
        name="PathCard" status="stable"
        summary="Numbered home-screen entry card · used in Pick-a-Path."
        renderFn={() => (
          <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: '18px 18px 14px', maxWidth: 280, boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <DSEyebrow>§ 04</DSEyebrow>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: DSF.display, fontSize: 22, fontWeight: 600, color: DSC.accent, letterSpacing: '-0.02em' }}>3</div>
                <div style={{ fontFamily: DSF.body, fontSize: 10, color: DSC.mute2, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>waiting on you</div>
              </div>
            </div>
            <div style={{ fontFamily: DSF.display, fontSize: 15, fontWeight: 600, color: DSC.ink, marginTop: 12 }}>Reply to waiting threads →</div>
            <div style={{ paddingTop: 8, marginTop: 10, borderTop: `1px solid ${DSC.ruleSoft}`, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 5, height: 5, borderRadius: 999, background: DSC.accent }} />
              <span style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.accent, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>Oldest: Jordan · 6d</span>
            </div>
          </div>
        )}
        jsx={`<PathCard
  idx="04" verb="Reply to waiting threads"
  count={3} countLabel="waiting on you"
  foot="Oldest: Jordan · 6 days"
  accent
  onClick={openInbox}
/>`}
        usage={`<PathGrid>
  <PathCard idx="01" verb="Find a mentor" count={347} countLabel="open to mentor" foot="Avg reply 4 days" onClick={…} />
  <PathCard idx="04" verb="Reply to threads" count={3} accent onClick={…} />
</PathGrid>`}
        props={[
          { prop: 'idx',        type: 'string', req: true, default: '—', desc: '"01"–"06" eyebrow index' },
          { prop: 'verb',       type: 'string', req: true, default: '—', desc: 'Action title' },
          { prop: 'count',      type: 'string | number', default: '—', desc: 'Top-right stat' },
          { prop: 'countLabel', type: 'string', default: '—', desc: 'Stat caption' },
          { prop: 'foot',       type: 'string', default: '—', desc: 'Mono footer line' },
          { prop: 'accent',     type: 'boolean', default: 'false', desc: 'Highlight with accent dot' },
          { prop: 'onClick',    type: '() => void', default: '—', desc: 'Click handler' },
        ]}
      />

      <ComponentCard
        name="Banner" status="stable"
        summary="Inline alert. Info · Success · Warn · Celebration."
        renderFn={() => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Banner tone="success" title="Your intro to Iris was sent." sub="Most members reply within 4 days." action="View thread" />
            <Banner tone="warn"    title="3 mentor requests have waited more than 5 days." action="Open inbox" />
          </div>
        )}
        jsx={`<Banner
  tone="celebration"
  title="Hartwood reached 1,300 members."
  sub="That's 27% growth this quarter."
  action="See breakdown"
/>`}
        usage={`<Banner tone="info"        title="Heads up · RSVPs close Friday." action="Open event" />
<Banner tone="success"     title="Your intro was sent." sub="…" action="View thread" />
<Banner tone="warn"        title="3 requests waiting · open inbox." />
<Banner tone="celebration" title="1,300 members." sub="↑ Anchored by you, Maren." />`}
        props={[
          { prop: 'tone',   type: '"info" | "success" | "warn" | "celebration"', req: true, default: '—', desc: 'Visual + icon' },
          { prop: 'title',  type: 'string', req: true, default: '—', desc: 'Body line' },
          { prop: 'sub',    type: 'string', default: '—', desc: 'Secondary line' },
          { prop: 'action', type: 'string', default: '—', desc: 'Right-side link label' },
          { prop: 'onAction', type: '() => void', default: '—', desc: 'Action click handler' },
        ]}
      />

      <ComponentCard
        name="DataTable" status="stable"
        summary="Sortable, selectable, density-toggleable. With bulk-action toolbar."
        renderFn={() => (
          <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 10, overflow: 'hidden', fontSize: 11.5 }}>
            <div style={{ padding: '8px 14px', background: DSC.cardAlt, borderBottom: `1px solid ${DSC.rule}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: DSF.body, color: DSC.muted }}><strong style={{ color: DSC.ink }}>4 members</strong> · sorted by name</span>
              <span style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted }}>density · comfortable</span>
            </div>
            {['Iris O.', 'Dev P.', 'Sam A.', 'Theo H.'].map((n, i) => (
              <div key={n} style={{ display: 'grid', gridTemplateColumns: '20px 1fr 50px', padding: '8px 14px', borderTop: i === 0 ? 'none' : `1px solid ${DSC.ruleSoft}`, alignItems: 'center', gap: 8 }}>
                <Checkbox checked={i === 0} onChange={() => {}} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DSAvatar name={n} initials={n.split(' ').map(s => s[0]).join('')} size={22} />
                  <span style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.ink, fontWeight: 600 }}>{n}</span>
                </div>
                <span style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted }}>{["'11", "'11", "'11", "'20"][i]}</span>
              </div>
            ))}
          </div>
        )}
        jsx={`<DataTable
  columns={cols}
  rows={members}
  sortable
  selectable
  density={density}
  bulkActions={[{ label: 'Send intro', onClick: …}]}
/>`}
        usage={`<DataTable
  rows={members}
  columns={[
    { key: 'name',   label: 'Member',  sortable: true },
    { key: 'cohort', label: 'Cohort',  width: 64 },
    { key: 'city',   label: 'City' },
    { key: 'open',   label: 'Open to', render: r => <Tag tone="accent" dot>{r.open}</Tag> },
  ]}
  density="comfortable"
  selectable
  onSelectionChange={setSelected}
/>`}
        props={[
          { prop: 'columns',   type: 'Column[]', req: true, default: '—', desc: '{ key, label, width, sortable, render }' },
          { prop: 'rows',      type: 'Row[]',    req: true, default: '—', desc: 'Source rows' },
          { prop: 'selectable',type: 'boolean',              default: 'false', desc: 'Adds checkboxes + bulk toolbar' },
          { prop: 'density',   type: '"compact" | "comfortable" | "roomy"', default: '"comfortable"', desc: 'Row height' },
          { prop: 'sortable',  type: 'boolean',              default: 'false', desc: 'Header click cycles asc/desc' },
        ]}
      />

      <ComponentCard
        name="NotificationRow" status="stable"
        summary="One line in the notification panel. 7 kinds."
        renderFn={() => (
          <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 10, padding: '12px 14px', display: 'grid', gridTemplateColumns: '8px 32px 1fr auto', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: DSC.accent, alignSelf: 'center', justifySelf: 'center' }} />
            <div style={{ position: 'relative' }}>
              <DSAvatar name="Iris Okonkwo" initials="IO" size={32} />
              <span style={{ position: 'absolute', right: -3, bottom: -3, width: 14, height: 14, borderRadius: 999, background: DSC.ok, color: '#fff', border: `2px solid ${DSC.card}`, display: 'grid', placeItems: 'center' }}>
                <Icon name="reply" size={8} color="currentColor" />
              </span>
            </div>
            <div>
              <div style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.ink2, lineHeight: 1.4 }}><strong style={{ color: DSC.ink, fontWeight: 700 }}>Iris Okonkwo</strong> replied to your intro</div>
              <div style={{ fontFamily: DSF.body, fontSize: 11, color: DSC.muted, fontStyle: 'italic', marginTop: 2 }}>"Happy to grab coffee Tue 4 pm in Brooklyn."</div>
            </div>
            <span style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.mute2 }}>2h</span>
          </div>
        )}
        jsx={`<NotificationRow notification={n} onMarkRead={mark} />`}
        usage={`<NotificationPanel notifications={list}>
  {n => <NotificationRow notification={n} onMarkRead={mark} />}
</NotificationPanel>

// 7 kinds — choose by n.kind
// request · reply · rsvp · mention · join · milestone · event`}
        props={[
          { prop: 'notification', type: 'Notification', req: true, default: '—', desc: '{ kind, who, init, text, sub, when, unread }' },
          { prop: 'onMarkRead',   type: '(id) => void', default: '—', desc: 'Mark this one read' },
          { prop: 'onSelect',     type: '(n) => void',  default: '—', desc: 'Click handler — usually navigates' },
        ]}
      />

      <ComponentCard
        name="CommandPalette · ⌘K" status="stable"
        summary="Universal launcher. Recents · groups · keyboard nav."
        renderFn={() => (
          <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 16px 36px rgba(42,34,26,0.16)', maxWidth: 380 }}>
            <div style={{ padding: '10px 12px', borderBottom: `1px solid ${DSC.ruleSoft}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="search" size={14} color={DSC.muted} />
              <span style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.muted }}>climate</span>
              <KbdKey>Esc</KbdKey>
            </div>
            <div style={{ padding: '4px 0' }}>
              {['Iris Okonkwo', 'Climate VC office hours', 'Send intro to climate founders'].map((t, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '24px 1fr', gap: 8, padding: '7px 12px', background: i === 0 ? dshex(DSC.accent, 0.10) : 'transparent' }}>
                  <Icon name={['profile','clock','send'][i]} size={13} color={i === 0 ? DSC.accent : DSC.muted} />
                  <span style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.ink }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        jsx={`<CommandPalette
  open={open} onClose={close}
  commands={commands}
  recents={recents}
  onSelect={run}
/>`}
        usage={`// Mount once at app root
<CommandPalette
  commands={[
    { id: 'home',  cat: 'Navigate', label: 'Go to Home',  kbd: ['⌘','1'] },
    { id: 'intro', cat: 'Actions',  label: 'Send intro' },
    ...members.map(m => ({ id: m.id, cat: 'Members', label: m.name })),
  ]}
  onSelect={cmd => router.push(cmd)}
/>

// Bind ⌘K
useHotkey('mod+k', () => setOpen(true));`}
        props={[
          { prop: 'open',     type: 'boolean', req: true, default: '—', desc: 'Visibility' },
          { prop: 'onClose',  type: '() => void', req: true, default: '—', desc: 'Esc / outside click' },
          { prop: 'commands', type: 'Command[]', req: true, default: '—', desc: '{ id, cat, label, icon, kbd, sub }' },
          { prop: 'recents',  type: 'Command[]', default: '[]', desc: 'Shown when query is empty' },
          { prop: 'onSelect', type: '(cmd) => void', req: true, default: '—', desc: 'Fires on Enter / click' },
        ]}
      />

      <ComponentCard
        name="DatePicker" status="beta"
        summary="Month grid. Today highlight · selected fill · disabled past."
        renderFn={() => (
          <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 12, padding: '12px 14px', maxWidth: 280 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Icon name="chevron-left" size={12} color={DSC.muted} />
              <span style={{ fontFamily: DSF.display, fontSize: 13, fontWeight: 600, color: DSC.ink }}>May <span style={{ color: DSC.muted }}>2026</span></span>
              <Icon name="chevron-right" size={12} color={DSC.muted} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
              {['M','T','W','T','F','S','S'].map((d, i) => <div key={i} style={{ textAlign: 'center', fontFamily: DSF.mono, fontSize: 8.5, color: DSC.mute2, fontWeight: 700, padding: '2px 0' }}>{d}</div>)}
              {Array.from({ length: 28 }).map((_, i) => {
                const d = i + 1;
                const today = d === 19, selected = d === 27, past = d < 19;
                return (
                  <div key={i} style={{ aspectRatio: '1/1', background: selected ? DSC.accent : (today ? dshex(DSC.accent, 0.12) : 'transparent'), color: selected ? '#fff' : (past ? DSC.mute2 : DSC.ink), border: today && !selected ? `1.5px solid ${DSC.accent}` : 'none', borderRadius: 5, display: 'grid', placeItems: 'center', fontFamily: DSF.body, fontSize: 10, fontWeight: today || selected ? 700 : 500 }}>{d}</div>
                );
              })}
            </div>
          </div>
        )}
        jsx={`<DatePicker value={date} onChange={setDate} minDate={today} />`}
        usage={`<DatePicker
  value={date}
  onChange={setDate}
  minDate={today}                  // disables past
  maxDate={addMonths(today, 3)}
  highlightDates={[supperDate]}    // accent dot on these
/>`}
        props={[
          { prop: 'value',    type: 'Date', req: true, default: '—', desc: 'Selected date' },
          { prop: 'onChange', type: '(date) => void', req: true, default: '—', desc: 'Fires on selection' },
          { prop: 'minDate',  type: 'Date',  default: '—', desc: 'Dates before are disabled' },
          { prop: 'maxDate',  type: 'Date',  default: '—', desc: 'Dates after are disabled' },
          { prop: 'highlightDates', type: 'Date[]', default: '[]', desc: 'Show small accent dot' },
        ]}
      />

      <ComponentCard
        name="TimePicker" status="beta"
        summary="15-min slot grid. Taken slots are dashed + muted."
        renderFn={() => (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5, maxWidth: 280 }}>
            {[['9:00',false],['9:15',true,'Theo'],['9:30',false],['9:45',false],['10:00',false,null,true],['10:15',true,'Rosa'],['10:30',false],['10:45',false]].map(([t, taken, by, picked], i) => (
              <div key={i} style={{ padding: '6px 4px', background: picked ? DSC.ink : (taken ? 'transparent' : DSC.cardAlt), color: picked ? DSC.paper : (taken ? DSC.mute2 : DSC.ink), border: `1px ${taken ? 'dashed' : 'solid'} ${picked ? DSC.ink : DSC.rule}`, borderRadius: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: DSF.mono, fontSize: 10, fontWeight: 700 }}>
                <span>{t}</span>
                {taken && <span style={{ fontFamily: DSF.body, fontSize: 8, fontWeight: 500, color: DSC.mute2 }}>{by}</span>}
              </div>
            ))}
          </div>
        )}
        jsx={`<TimePicker date={date} slots={slots} value={time} onChange={setTime} />`}
        usage={`<TimePicker
  date={tuesday}
  slots={[
    { time: '9:00',  taken: false },
    { time: '9:15',  taken: true, by: 'Theo' },
    …
  ]}
  value={picked}
  onChange={setPicked}
  duration={15}        // minutes per slot
/>`}
        props={[
          { prop: 'slots',    type: 'Slot[]', req: true, default: '—', desc: '{ time, taken, by }' },
          { prop: 'value',    type: 'string', default: '—', desc: 'Selected time HH:mm' },
          { prop: 'onChange', type: '(time) => void', req: true, default: '—', desc: 'Fires on tap' },
          { prop: 'duration', type: 'number (min)', default: '15', desc: 'Affects label only' },
        ]}
      />

      <ComponentCard
        name="WizardStepper" status="stable"
        summary="Multi-step form chrome · step rail + content + footer."
        renderFn={() => (
          <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: 14 }}>
              <div style={{ position: 'absolute', top: 12, left: '7%', right: '7%', height: 2, background: DSC.rule }} />
              <div style={{ position: 'absolute', top: 12, left: '7%', width: '57%', height: 2, background: DSC.accent }} />
              {['Welcome','Basics','Career','Profile'].map((l, i) => {
                const done = i < 2, current = i === 2;
                return (
                  <div key={l} style={{ position: 'relative', flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 999, background: done ? DSC.accent : DSC.card, border: `2px solid ${done || current ? DSC.accent : DSC.rule}`, boxShadow: current ? `0 0 0 4px ${dshex(DSC.accent, 0.15)}` : 'none', display: 'grid', placeItems: 'center', color: done ? '#fff' : (current ? DSC.accent : DSC.mute2), fontFamily: DSF.body, fontSize: 10, fontWeight: 700 }}>{done ? <Icon name="check" size={10} color="currentColor" strokeWidth={3.2} /> : i + 1}</div>
                    <div style={{ fontFamily: DSF.body, fontSize: 10.5, fontWeight: 600, color: done || current ? DSC.ink : DSC.mute2 }}>{l}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        jsx={`<WizardStepper
  steps={steps}
  current={current}
  onChange={setCurrent}
/>`}
        usage={`<WizardStepper
  steps={[
    { id: 'welcome',  label: 'Welcome' },
    { id: 'basics',   label: 'Basics' },
    { id: 'career',   label: 'Career' },
    { id: 'profile',  label: 'Profile' },
  ]}
  current={step}
  onChange={setStep}
  allowSkip                      // can click ahead
/>`}
        props={[
          { prop: 'steps',    type: 'Step[]', req: true, default: '—', desc: '{ id, label, sub }' },
          { prop: 'current',  type: 'number', req: true, default: '—', desc: 'Zero-based index' },
          { prop: 'onChange', type: '(idx) => void', req: true, default: '—', desc: 'Fires on click' },
          { prop: 'allowSkip', type: 'boolean', default: 'false', desc: 'Allow clicking future steps' },
        ]}
      />

      <ComponentCard
        name="SearchResults" status="stable"
        summary="Result row with highlighted matches + rationale chips."
        renderFn={() => (
          <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 12, padding: '14px 16px', display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 12 }}>
            <DSAvatar name="Iris Okonkwo" initials="IO" size={40} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: DSF.display, fontSize: 14, fontWeight: 600, color: DSC.ink }}>Iris Okonkwo</span>
                <span style={{ fontFamily: DSF.mono, fontSize: 9, color: DSC.accent, letterSpacing: '0.10em', fontWeight: 700 }}>'11 · BROOKLYN</span>
                <DSTag tone="accent">Mentor</DSTag>
              </div>
              <p style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.ink2, lineHeight: 1.5, margin: '6px 0' }}>Five years <mark style={{ background: dshex(DSC.accent, 0.20), color: DSC.ink, padding: '0 2px', borderRadius: 3, fontWeight: 600 }}>underwriting</mark> <mark style={{ background: dshex(DSC.accent, 0.20), color: DSC.ink, padding: '0 2px', borderRadius: 3, fontWeight: 600 }}>climate</mark> infrastructure.</p>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: DSF.body, fontSize: 10.5, fontWeight: 600, color: DSC.ink2, background: dshex(DSC.accent, 0.10), border: `1px solid ${dshex(DSC.accent, 0.22)}`, padding: '2px 8px', borderRadius: 999 }}>Climate</span>
                <span style={{ fontFamily: DSF.body, fontSize: 10.5, fontWeight: 600, color: DSC.ink2, background: dshex(DSC.accent, 0.10), border: `1px solid ${dshex(DSC.accent, 0.22)}`, padding: '2px 8px', borderRadius: 999 }}>Brooklyn</span>
              </div>
            </div>
            <DSButton size="sm">Open →</DSButton>
          </div>
        )}
        jsx={`<SearchResults
  query={q}
  results={hits}
  highlight={['climate','underwriting']}
/>`}
        usage={`<SearchResults
  query="climate underwriting"
  results={members}
  sort="match"
  onResultSelect={openProfile}
  highlight={extractTerms(query)}
  facets={[
    { key: 'cohort', items: facets.cohort },
    { key: 'city',   items: facets.city },
  ]}
/>`}
        props={[
          { prop: 'results',   type: 'Member[]', req: true, default: '—', desc: 'Source list' },
          { prop: 'query',     type: 'string', default: '""', desc: 'Currently-active query' },
          { prop: 'highlight', type: 'string[]', default: '[]', desc: 'Terms to <mark>' },
          { prop: 'sort',      type: '"match" | "recent" | "name"', default: '"match"', desc: 'Active sort' },
          { prop: 'facets',    type: 'Facet[]', default: '[]', desc: 'Sidebar refinement groups' },
        ]}
      />

      <ComponentCard
        name="Comment" status="stable"
        summary="Threaded discussion row. Avatar · author chip · body · reactions · reply."
        renderFn={() => (
          <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr', gap: 10 }}>
            <DSAvatar name="Iris Okonkwo" initials="IO" size={32} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: DSF.body, fontSize: 12.5, fontWeight: 700, color: DSC.ink }}>Iris Okonkwo</span>
                <span style={{ fontFamily: DSF.mono, fontSize: 9, color: DSC.accent, fontWeight: 700, letterSpacing: '0.10em' }}>'11</span>
                <span style={{ background: dshex(DSC.accent, 0.13), color: DSC.accent, fontFamily: DSF.body, fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 999, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Host</span>
                <span style={{ fontFamily: DSF.mono, fontSize: 9, color: DSC.mute2, marginLeft: 'auto' }}>1h</span>
              </div>
              <p style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.ink2, lineHeight: 1.5, margin: '6px 0' }}>One thread to pin — share the 2025 IPCC underwriting annex if you have it.</p>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, background: dshex(DSC.accent, 0.10), border: `1px solid ${dshex(DSC.accent, 0.24)}`, color: DSC.accent, fontFamily: DSF.body, fontSize: 10, fontWeight: 700 }}>↗ 4</span>
                <span style={{ fontFamily: DSF.body, fontSize: 10.5, fontWeight: 700, color: DSC.muted }}>Reply</span>
              </div>
            </div>
          </div>
        )}
        jsx={`<Comment
  author={iris}
  body="One thread to pin…"
  reactions={[{ kind: 'mutual', count: 4 }]}
  onReply={openComposer}
/>`}
        usage={`<CommentThread>
  <Comment author={iris} body="…" pinned reactions={…}>
    <Comment author={sam} body="…" />          // nested reply
    <Comment author={dev} body="…" />
  </Comment>
  <CommentComposer onPost={post} />
</CommentThread>`}
        props={[
          { prop: 'author',    type: 'Member', req: true, default: '—', desc: '{ name, init, cohort, role, verified }' },
          { prop: 'body',      type: 'ReactNode', req: true, default: '—', desc: 'Comment content' },
          { prop: 'reactions', type: 'Reaction[]', default: '[]', desc: '{ kind, count }' },
          { prop: 'pinned',    type: 'boolean', default: 'false', desc: 'Show pinned label' },
          { prop: 'onReply',   type: '() => void', default: '—', desc: 'Opens inline composer' },
          { prop: 'children',  type: 'ReactNode', default: '—', desc: 'Nested replies — recursive' },
        ]}
      />

    </DSSection>
  );
}

window.ComponentCardsTier2Section = ComponentCardsTier2Section;
