/* eslint-disable */
// Atrium admin — Invite, Events, Announcements, Analytics screens.

// ---------------------------------------------------------------------------
// Invite — single + bulk + invites log
// ---------------------------------------------------------------------------

function AdminInvite() {
  const t = React.useContext(ThemeCtx);
  const { INVITES } = window.BC_ADMIN;
  const [mode, setMode] = React.useState('single'); // 'single' | 'bulk'
  const [email, setEmail] = React.useState('');
  const [cohort, setCohort] = React.useState('');
  const [note, setNote] = React.useState('');
  const [csvFile, setCsvFile] = React.useState(null);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px 64px' }}>
      <div style={{ marginBottom: 22 }}>
        <AtriumEyebrow accent>Invitations · {INVITES.length} in the last 7 days</AtriumEyebrow>
        <h1 style={{ ...t.display, fontSize: 40, margin: '12px 0 0' }}>Invite members</h1>
        <p style={{ fontSize: 14.5, color: t.palette.muted, marginTop: 8, maxWidth: 620, lineHeight: 1.55 }}>
          Send a single invitation, or upload a CSV with one row per invitee. Each invite expires after 14 days.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 22, marginBottom: 28 }}>
        <div style={t.cardSurface({ padding: 22 })}>
          {/* Mode switcher */}
          <div style={{ display: 'inline-flex', gap: 0, background: t.palette.cardAlt, border: `1px solid ${t.palette.rule}`, borderRadius: 999, padding: 3, marginBottom: 18 }}>
            {[
              { id: 'single', l: 'Single invite' },
              { id: 'bulk',   l: 'Bulk CSV upload' },
            ].map(m => {
              const active = mode === m.id;
              return (
                <button key={m.id} onClick={() => setMode(m.id)} style={{
                  background: active ? t.palette.ink : 'transparent',
                  color: active ? t.palette.paper : t.palette.muted,
                  border: 'none', cursor: 'pointer',
                  padding: '7px 14px', borderRadius: 999,
                  fontFamily: t.font.body, fontSize: 12.5, fontWeight: 600,
                }}>{m.l}</button>
              );
            })}
          </div>

          {mode === 'single' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <AdminField label="Email address">
                <AdminInput value={email} onChange={setEmail} placeholder="hannah.j@example.org" type="email" />
              </AdminField>
              <AdminField label="Cohort year" hint="The year they graduated from Hartwood.">
                <AdminInput value={cohort} onChange={setCohort} placeholder="2018" />
              </AdminField>
              <AdminField label="A short note" hint="Optional — shown in the invitation email. Plain and warm beats formal.">
                <AdminTextArea value={note} onChange={setNote} rows={4}
                  placeholder="Hi Hannah — Maren here. We launched a member-first alumni network and I thought of you. Click below to set up your profile." />
              </AdminField>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <AtriumButton size="lg">Send invitation</AtriumButton>
                <AtriumButton size="lg" variant="ghost">Preview email</AtriumButton>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 13.5, color: t.palette.muted, lineHeight: 1.55, margin: 0 }}>
                Upload a CSV with columns: <strong style={{ color: t.palette.ink2, fontWeight: 600 }}>email, full_name, cohort_year</strong>. We’ll preview each row and skip duplicates of existing members.
              </p>

              <label style={{
                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                gap: 8,
                border: `1.5px dashed ${t.palette.rule}`,
                background: t.palette.card,
                borderRadius: t.radius - 4,
                padding: '28px 20px', cursor: 'pointer',
              }}>
                <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} />
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={t.palette.muted} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3v13M7 8l5-5 5 5" />
                  <path d="M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
                </svg>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.palette.ink }}>
                  {csvFile ? csvFile.name : <>Drop a CSV here, or <span style={{ color: t.palette.accent }}>browse</span></>}
                </div>
                <div style={{ fontSize: 12, color: t.palette.mute2 }}>UTF-8 · up to 500 rows per upload</div>
              </label>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
                <AtriumButton size="lg" style={{ opacity: csvFile ? 1 : 0.5, pointerEvents: csvFile ? 'auto' : 'none' }}>Validate & preview →</AtriumButton>
                <a style={{ fontSize: 12.5, color: t.palette.accent, fontWeight: 600, cursor: 'pointer' }}>Download template.csv</a>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — guidance */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={t.cardSurface({ padding: 18 })}>
            <AtriumEyebrow accent>The verification path</AtriumEyebrow>
            <ol style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { n: '01', t: 'Send invitation',     d: 'Recipient receives an email with a single-use link.' },
                { n: '02', t: 'Self-onboard',        d: 'They complete the 7-step profile flow (resume upload, interests, hobbies).' },
                { n: '03', t: 'Auto-match',          d: 'We cross-check their answers against the alumni records you provided.' },
                { n: '04', t: 'You review & approve',d: 'Auto-matched applicants are 1-click approve; partial matches surface here.' },
              ].map(b => (
                <li key={b.n} style={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: 10, alignItems: 'baseline', fontSize: 13, lineHeight: 1.55 }}>
                  <span style={{ fontFamily: t.font.mono, fontSize: 10.5, color: t.palette.accent, letterSpacing: '0.14em', fontWeight: 700 }}>{b.n}</span>
                  <span>
                    <strong style={{ fontWeight: 600, color: t.palette.ink }}>{b.t}.</strong>
                    <span style={{ color: t.palette.muted }}> {b.d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>

      {/* Sent invites log */}
      <AdminSection title="Recent invitations" eyebrow={`${INVITES.length} sent`}>
        <div style={t.cardSurface({ padding: 0, overflow: 'hidden' })}>
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 0.6fr 1fr 1fr 0.8fr',
            padding: '12px 20px', background: t.palette.cardAlt, borderBottom: `1px solid ${t.palette.rule}`, gap: 12,
            fontFamily: t.font.mono, fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase',
            color: t.palette.muted, fontWeight: 600,
          }}>
            <div>Email</div><div>Cohort</div><div>Sent by</div><div>Sent</div><div>Status</div>
          </div>
          {INVITES.map((iv, i) => (
            <div key={iv.id} style={{
              display: 'grid', gridTemplateColumns: '2fr 0.6fr 1fr 1fr 0.8fr',
              padding: '14px 20px',
              borderBottom: i === INVITES.length - 1 ? 'none' : `1px solid ${t.palette.ruleSoft}`,
              gap: 12, alignItems: 'center', fontSize: 13.5,
            }}>
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>{iv.email}</div>
              <div style={{ color: t.palette.muted, fontFamily: t.font.mono }}>’{String(iv.cohort).slice(-2)}</div>
              <div style={{ color: t.palette.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{iv.sentBy}</div>
              <div style={{ color: t.palette.muted, fontFamily: t.font.mono, fontSize: 12 }}>{iv.sentAt}</div>
              <div>
                <AdminBadge tone={iv.status === 'accepted' ? 'ok' : iv.status === 'expired' ? 'muted' : 'warn'}>{iv.status}</AdminBadge>
              </div>
            </div>
          ))}
        </div>
      </AdminSection>
    </div>
  );
}

// Small form atoms used across admin screens.
function AdminField({ label, hint, children }) {
  const t = React.useContext(ThemeCtx);
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: t.palette.ink }}>{label}</span>
      {children}
      {hint ? <span style={{ fontSize: 11.5, color: t.palette.muted }}>{hint}</span> : null}
    </label>
  );
}

function AdminInput({ value, onChange, placeholder, type = 'text' }) {
  const t = React.useContext(ThemeCtx);
  return (
    <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      style={{
        boxSizing: 'border-box', width: '100%',
        background: t.palette.card, color: t.palette.ink,
        border: `1px solid ${t.palette.rule}`, borderRadius: t.radius - 4,
        padding: '10px 14px', fontFamily: t.font.body, fontSize: 13.5,
        outline: 'none', transition: 'border-color 120ms ease',
      }}
      onFocus={(e) => { e.target.style.borderColor = t.palette.ink; }}
      onBlur={(e)  => { e.target.style.borderColor = t.palette.rule; }} />
  );
}

function AdminTextArea({ value, onChange, placeholder, rows = 3 }) {
  const t = React.useContext(ThemeCtx);
  return (
    <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{
        boxSizing: 'border-box', width: '100%', resize: 'vertical',
        background: t.palette.card, color: t.palette.ink,
        border: `1px solid ${t.palette.rule}`, borderRadius: t.radius - 4,
        padding: '10px 14px', fontFamily: t.font.body, fontSize: 13.5, lineHeight: 1.55,
        outline: 'none', transition: 'border-color 120ms ease',
      }}
      onFocus={(e) => { e.target.style.borderColor = t.palette.ink; }}
      onBlur={(e)  => { e.target.style.borderColor = t.palette.rule; }} />
  );
}

// ---------------------------------------------------------------------------
// Events (admin) — table
// ---------------------------------------------------------------------------

function AdminEvents() {
  const t = React.useContext(ThemeCtx);
  const { EVENTS } = window.BC_DATA;
  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px 64px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <AtriumEyebrow accent>{EVENTS.length} upcoming · 4 hosted in the last 30 days</AtriumEyebrow>
          <h1 style={{ ...t.display, fontSize: 40, margin: '12px 0 0' }}>Org events</h1>
        </div>
        <AtriumButton size="md">+ Create event</AtriumButton>
      </div>

      <div style={t.cardSurface({ padding: 0, overflow: 'hidden' })}>
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 0.8fr 0.8fr auto',
          padding: '12px 20px', background: t.palette.cardAlt, borderBottom: `1px solid ${t.palette.rule}`, gap: 12,
          fontFamily: t.font.mono, fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: t.palette.muted, fontWeight: 600,
        }}>
          <div>Event</div><div>When</div><div>Host</div><div>Capacity</div><div>Status</div><div />
        </div>
        {EVENTS.map((e, i) => {
          const pct = Math.round((e.going / e.capacity) * 100);
          return (
            <div key={e.id} style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 0.8fr 0.8fr auto',
              padding: '14px 20px',
              borderBottom: i === EVENTS.length - 1 ? 'none' : `1px solid ${t.palette.ruleSoft}`,
              gap: 12, alignItems: 'center', fontSize: 13.5,
            }}>
              <div>
                <div style={{ fontWeight: 600 }}>{e.title}</div>
                <div style={{ fontSize: 11.5, color: t.palette.muted, marginTop: 2 }}>{e.where}</div>
              </div>
              <div style={{ color: t.palette.muted, fontFamily: t.font.mono, fontSize: 12 }}>T-{e.days}D · {e.when.split(' · ')[0]}</div>
              <div style={{ color: t.palette.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.host}</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 60, height: 3, background: t.palette.ruleSoft, borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: t.palette.accent }} />
                  </div>
                  <span style={{ fontSize: 12, color: t.palette.muted, fontFamily: t.font.mono }}>{e.going}/{e.capacity}</span>
                </div>
              </div>
              <div>
                <AdminBadge tone={pct >= 90 ? 'warn' : 'ok'}>{pct >= 90 ? 'Filling fast' : 'Open'}</AdminBadge>
              </div>
              <div>
                <RowMenu />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

function AdminAnnouncements() {
  const t = React.useContext(ThemeCtx);
  const { ANNOUNCEMENTS } = window.BC_ADMIN;
  const [selectedId, setSelectedId] = React.useState(ANNOUNCEMENTS[0].id);
  const sel = ANNOUNCEMENTS.find(a => a.id === selectedId);
  const [composer, setComposer] = React.useState(false);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px 64px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <AtriumEyebrow accent>{ANNOUNCEMENTS.filter(a => a.status === 'published').length} published · {ANNOUNCEMENTS.filter(a => a.status === 'draft').length} draft</AtriumEyebrow>
          <h1 style={{ ...t.display, fontSize: 40, margin: '12px 0 0' }}>Announcements</h1>
        </div>
        <AtriumButton size="md" onClick={() => setComposer(true)}>+ New announcement</AtriumButton>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 22 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ANNOUNCEMENTS.map(a => {
            const active = a.id === selectedId;
            return (
              <button key={a.id} onClick={() => { setSelectedId(a.id); setComposer(false); }} style={{
                ...t.cardSurface({ padding: 14, textAlign: 'left', cursor: 'pointer',
                  borderColor: active ? t.palette.ink : t.palette.rule,
                  background: active ? t.palette.cardAlt : t.palette.card,
                }),
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
                  <AdminBadge tone={a.status === 'published' ? 'ok' : 'muted'}>{a.status}</AdminBadge>
                </div>
                <div style={{ fontSize: 12, color: t.palette.muted, marginTop: 6, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {a.body}
                </div>
                <div style={{ fontSize: 11, color: t.palette.mute2, marginTop: 8, fontFamily: t.font.mono, letterSpacing: '0.14em' }}>
                  {a.status === 'published' ? `Published ${a.publishedAt} · ${a.reach}` : 'Draft · not published'}
                </div>
              </button>
            );
          })}
        </div>

        <div>
          {composer ? (
            <AnnouncementComposer onClose={() => setComposer(false)} />
          ) : (
            <AnnouncementDetail a={sel} />
          )}
        </div>
      </div>
    </div>
  );
}

function AnnouncementDetail({ a }) {
  const t = React.useContext(ThemeCtx);
  return (
    <div style={t.cardSurface({ padding: 28 })}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 18, borderBottom: `1px solid ${t.palette.rule}` }}>
        <div>
          <AtriumEyebrow accent>Announcement · {a.id}</AtriumEyebrow>
          <h2 style={{ ...t.display, fontSize: 28, margin: '6px 0 4px', fontWeight: 600 }}>{a.title}</h2>
          <div style={{ fontSize: 12.5, color: t.palette.muted }}>By {a.by} · {a.publishedAt}</div>
        </div>
        <AdminBadge tone={a.status === 'published' ? 'ok' : 'muted'}>{a.status}</AdminBadge>
      </div>

      <p style={{ fontSize: 15, color: t.palette.ink, marginTop: 18, lineHeight: 1.6 }}>{a.body}</p>

      <div style={{ marginTop: 22, padding: 14, background: t.palette.cardAlt, border: `1px solid ${t.palette.rule}`, borderRadius: t.radius - 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11.5, color: t.palette.muted, fontFamily: t.font.mono, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>Reach</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{a.reach}</div>
          </div>
          {a.status === 'published' ? (
            <>
              <div>
                <div style={{ fontSize: 11.5, color: t.palette.muted, fontFamily: t.font.mono, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>Opens</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>112 · 76%</div>
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: t.palette.muted, fontFamily: t.font.mono, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>Clicks</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>38</div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
        {a.status === 'published' ? (
          <>
            <AtriumButton size="md" variant="outline">Resend to non-openers</AtriumButton>
            <AtriumButton size="md" variant="ghost">Edit</AtriumButton>
            <AtriumButton size="md" variant="ghost">Unpublish</AtriumButton>
          </>
        ) : (
          <>
            <AtriumButton size="md">Publish to members</AtriumButton>
            <AtriumButton size="md" variant="outline">Edit</AtriumButton>
            <AtriumButton size="md" variant="ghost">Delete draft</AtriumButton>
          </>
        )}
      </div>
    </div>
  );
}

function AnnouncementComposer({ onClose }) {
  const t = React.useContext(ThemeCtx);
  const [title, setTitle] = React.useState('');
  const [body,  setBody]  = React.useState('');
  const [audience, setAudience] = React.useState('all');
  return (
    <div style={t.cardSurface({ padding: 28 })}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 18, borderBottom: `1px solid ${t.palette.rule}`, marginBottom: 18 }}>
        <div>
          <AtriumEyebrow accent>New announcement</AtriumEyebrow>
          <h2 style={{ ...t.display, fontSize: 24, margin: '6px 0 0', fontWeight: 600 }}>Write to the circle</h2>
        </div>
        <AtriumButton size="sm" variant="ghost" onClick={onClose}>Cancel</AtriumButton>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <AdminField label="Title">
          <AdminInput value={title} onChange={setTitle} placeholder="Spring Supper RSVPs open" />
        </AdminField>
        <AdminField label="Body" hint="Plain prose. Markdown for links is supported.">
          <AdminTextArea value={body} onChange={setBody} rows={6}
            placeholder="RSVPs for the May 20 supper are now open. 60 seats, plus-one OK." />
        </AdminField>

        <AdminField label="Audience">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { k: 'all',     l: 'All active members · 148' },
              { k: 'admins',  l: 'Admins only · 2' },
              { k: 'cohort',  l: 'Specific cohort…' },
              { k: 'city',    l: 'Specific city…' },
            ].map(a => {
              const active = audience === a.k;
              return (
                <button key={a.k} onClick={() => setAudience(a.k)} style={{
                  background: active ? t.palette.ink : 'transparent',
                  color: active ? t.palette.paper : t.palette.muted,
                  border: `1px solid ${active ? t.palette.ink : t.palette.rule}`,
                  padding: '7px 12px', borderRadius: 999,
                  fontFamily: t.font.body, fontSize: 12.5, fontWeight: 600,
                  cursor: 'pointer',
                }}>{a.l}</button>
              );
            })}
          </div>
        </AdminField>

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <AtriumButton size="md">Publish</AtriumButton>
          <AtriumButton size="md" variant="outline">Save draft</AtriumButton>
          <AtriumButton size="md" variant="ghost">Preview email</AtriumButton>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

function AdminAnalytics() {
  const t = React.useContext(ThemeCtx);
  const { ANALYTICS } = window.BC_ADMIN;

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px 64px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <AtriumEyebrow accent>Last 12 weeks · the network at a glance</AtriumEyebrow>
          <h1 style={{ ...t.display, fontSize: 40, margin: '12px 0 0' }}>Analytics</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <AtriumButton size="md" variant="outline">Export CSV</AtriumButton>
          <AtriumButton size="md" variant="ghost">Share with board</AtriumButton>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <AdminStatTile value={ANALYTICS.totals.activeMembers} label="Active members" trend="+8%" sub="vs. last quarter" />
        <AdminStatTile value={ANALYTICS.totals.newThisMonth}  label="New this month" trend="+3"  sub="3 from auto-match, 9 admin-approved" />
        <AdminStatTile value={ANALYTICS.totals.askVolume30d}  label="Asks · last 30d" trend="+12%" sub="Mentor + advice combined" />
        <AdminStatTile value={ANALYTICS.totals.eventsHosted30d} label="Events · last 30d" sub="2 in person, 2 online" />
      </div>

      {/* Two-row chart layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        <SparkCard title="New members per week" series={ANALYTICS.newMembersByWeek} unit="members" />
        <SparkCard title="Ask volume per week"   series={ANALYTICS.askVolumeByWeek}  unit="asks" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18, marginBottom: 18 }}>
        <CohortMixCard data={ANALYTICS.cohortMix} />
        <HelperRatioCard data={ANALYTICS.helperRatio} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <TopCitiesCard data={ANALYTICS.topCities} />
        <ReportsCard data={ANALYTICS.recentReports} />
      </div>
    </div>
  );
}

// ─── Analytics sub-cards ──────────────────────────────────────────────────

function SparkCard({ title, series, unit }) {
  const t = React.useContext(ThemeCtx);
  const max = Math.max(...series);
  const total = series.reduce((a, b) => a + b, 0);
  const avg = (total / series.length).toFixed(1);
  const BAR_HEIGHT = 120;
  return (
    <div style={t.cardSurface({ padding: 22 })}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <AtriumEyebrow accent>{title}</AtriumEyebrow>
        <span style={{ fontSize: 11.5, color: t.palette.muted, fontFamily: t.font.mono, letterSpacing: '0.14em', fontWeight: 600 }}>
          AVG {avg}/wk · TOTAL {total}
        </span>
      </div>
      {/* Bars — each bar uses an explicit pixel height so the percentage
          actually resolves against the chart area. */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: BAR_HEIGHT, marginTop: 16 }}>
        {series.map((v, i) => {
          const isLatest = i === series.length - 1;
          const opacity = isLatest ? 1 : Math.max(0.45, 0.85 - (series.length - 1 - i) * 0.04);
          return (
            <div key={i} style={{
              flex: 1,
              height: Math.max(3, Math.round((v / max) * BAR_HEIGHT)),
              background: isLatest ? t.palette.accent : t.palette.ink,
              opacity,
              borderRadius: 2,
            }} title={`${v} ${unit}`} />
          );
        })}
      </div>
      {/* X labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: t.font.mono, fontSize: 10, color: t.palette.mute2, letterSpacing: '0.14em' }}>
        <span>12W AGO</span>
        <span>THIS WEEK</span>
      </div>
    </div>
  );
}

function CohortMixCard({ data }) {
  const t = React.useContext(ThemeCtx);
  const total = data.reduce((a, b) => a + b.count, 0);
  return (
    <div style={t.cardSurface({ padding: 22 })}>
      <AtriumEyebrow accent>Cohort mix</AtriumEyebrow>
      <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data.map((c, i) => {
          const pct = (c.count / total) * 100;
          return (
            <li key={c.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{c.label}</span>
                <span style={{ fontSize: 12, color: t.palette.muted, fontFamily: t.font.mono, letterSpacing: '0.1em' }}>{c.count} · {pct.toFixed(0)}%</span>
              </div>
              <div style={{ height: 6, background: t.palette.ruleSoft, borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: t.palette.accent, opacity: 0.6 + i * 0.08 }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function HelperRatioCard({ data }) {
  const t = React.useContext(ThemeCtx);
  const ringSize = 160;
  // Doughnut — show openToMentor share against the total 148. Hardcoded labels.
  const fields = [
    { k: 'openToMentor', l: 'Open to mentor', color: t.palette.accent },
    { k: 'openToAdvice', l: 'Open to advice', color: t.palette.ok },
    { k: 'openToIntros', l: 'Open to intros', color: t.palette.ink },
  ];
  return (
    <div style={t.cardSurface({ padding: 22 })}>
      <AtriumEyebrow accent>Helper ratios</AtriumEyebrow>
      <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginTop: 14 }}>
        {/* Ring */}
        <svg width={ringSize} height={ringSize} viewBox="0 0 64 64" aria-hidden="true" style={{ flexShrink: 0 }}>
          {(() => {
            let cumulative = 0;
            const total = data.openToMentor + data.openToAdvice + data.openToIntros + data.notNow;
            return fields.concat([{ k: 'notNow', l: 'Not now', color: t.palette.rule }]).map(f => {
              const v = data[f.k];
              const angle = (v / total) * 360;
              const startAngle = (cumulative / total) * 360;
              cumulative += v;
              const r = 26, cx = 32, cy = 32;
              const start = startAngle * Math.PI / 180;
              const end = (startAngle + angle) * Math.PI / 180;
              const x1 = cx + r * Math.sin(start);
              const y1 = cy - r * Math.cos(start);
              const x2 = cx + r * Math.sin(end);
              const y2 = cy - r * Math.cos(end);
              const large = angle > 180 ? 1 : 0;
              return (
                <path key={f.k}
                  d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
                  fill={f.color} />
              );
            });
          })()}
          <circle cx="32" cy="32" r="14" fill={t.palette.card} />
          <text x="32" y="29" textAnchor="middle" fontFamily="Inter Tight, sans-serif" fontWeight="600" fontSize="9" fill={t.palette.ink}>148</text>
          <text x="32" y="38" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="3.5" letterSpacing="0.14em" fill={t.palette.muted}>MEMBERS</text>
        </svg>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {fields.concat([{ k: 'notNow', l: 'Not now', color: t.palette.rule }]).map(f => (
            <li key={f.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: f.color }} />
                {f.l}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, fontFamily: t.font.mono }}>{data[f.k]}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function TopCitiesCard({ data }) {
  const t = React.useContext(ThemeCtx);
  const max = Math.max(...data.map(c => c.count));
  return (
    <div style={t.cardSurface({ padding: 22 })}>
      <AtriumEyebrow accent>Top cities</AtriumEyebrow>
      <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.map(c => (
          <li key={c.city} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 36px', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 13.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.city}</span>
            <div style={{ height: 4, background: t.palette.ruleSoft, borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${(c.count / max) * 100}%`, height: '100%', background: t.palette.accent }} />
            </div>
            <span style={{ fontSize: 12, color: t.palette.muted, fontFamily: t.font.mono, textAlign: 'right' }}>{c.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReportsCard({ data }) {
  const t = React.useContext(ThemeCtx);
  return (
    <div style={t.cardSurface({ padding: 22 })}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <AtriumEyebrow accent>Open reports</AtriumEyebrow>
        <span style={{ fontSize: 12, color: t.palette.muted }}>Moderation queue</span>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0' }}>
        {data.map((r, i) => (
          <li key={r.id} style={{
            padding: '10px 0',
            borderTop: i === 0 ? 'none' : `1px solid ${t.palette.ruleSoft}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10,
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{r.who}</div>
              <div style={{ fontSize: 12, color: t.palette.muted, marginTop: 2 }}>{r.what} · {r.when}</div>
            </div>
            <AdminBadge tone={r.status === 'open' ? 'warn' : 'muted'}>{r.status}</AdminBadge>
          </li>
        ))}
      </ul>
    </div>
  );
}

window.AdminInvite        = AdminInvite;
window.AdminEvents        = AdminEvents;
window.AdminAnnouncements = AdminAnnouncements;
window.AdminAnalytics     = AdminAnalytics;
