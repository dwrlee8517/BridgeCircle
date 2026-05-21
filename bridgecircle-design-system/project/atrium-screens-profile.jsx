/* eslint-disable */
// Atrium — Profile screen (redesigned)
// Bio lives in the hero. Verification removed (everyone is org-verified).
// New: inline stats, "Working with" section, "You and X" + "Ways to connect"
// sidebar. Fixes: mob variable, context-aware back, dynamic Open To.

function AtriumProfile() {
  const t = React.useContext(ThemeCtx);
  const { activeProfile, goto, setActiveThread } = useAtriumRoute();
  const { MEMBERS, THREADS } = window.BC_DATA;
  const m = MEMBERS.find(x => x.id === activeProfile) || MEMBERS[0];
  const orientation = (t.tweaks && t.tweaks.timelineOrientation) || 'vertical';
  const mob = t.isMobile;

  return (
    <section style={{ padding: mob ? '18px 16px 48px' : '32px 32px 64px', maxWidth: 1280, margin: '0 auto' }}>

      {/* Back */}
      <button onClick={() => goto('people')} style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: t.palette.muted, fontFamily: t.font.body, fontSize: 13, fontWeight: 500,
        padding: '4px 0 18px', display: 'inline-flex', alignItems: 'center', gap: 6,
      }}>← Back to people</button>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        ...t.cardSurface({ padding: mob ? '22px 22px 24px' : '36px 40px 32px' }),
        background: `linear-gradient(180deg, ${t.palette.cardAlt} 0%, ${t.palette.card} 100%)`,
      }}>
        {/* Circles motif */}
        <svg aria-hidden="true" width="480" height="360" viewBox="0 0 480 360"
             style={{ position: 'absolute', right: mob ? -200 : -100, top: mob ? -100 : -50, opacity: 0.32, pointerEvents: 'none' }}>
          <circle cx="180" cy="200" r="145" fill="none" stroke={t.palette.accent} strokeOpacity="0.30" strokeWidth="1.4" />
          <circle cx="278" cy="200" r="145" fill="none" stroke={t.palette.ok}     strokeOpacity="0.30" strokeWidth="1.4" />
        </svg>

        <div style={{ position: 'relative' }}>

          {/* Identity */}
          <div style={{ display: 'flex', flexDirection: mob ? 'column' : 'row', gap: mob ? 16 : 28, alignItems: 'flex-start' }}>
            <AtriumAvatar name={m.name} initials={m.initials} size={mob ? 68 : 96} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 10 }}>
                <AtriumTag tone="ok" dot>Hartwood '{String(m.year).slice(-2)}</AtriumTag>
                <AtriumTag tone="accent" dot>
                  {m.open === 'mentor' ? 'Open to mentor' : m.open === 'advice' ? 'Open to advice' : 'Seeking mentor'}
                </AtriumTag>
              </div>
              <h1 style={{ ...t.display, fontSize: mob ? 30 : 50, margin: '0 0 6px', fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.0 }}>
                {m.name}
              </h1>
              <div style={{ fontFamily: t.font.body, fontSize: mob ? 14 : 15.5, color: t.palette.muted, lineHeight: 1.5 }}>
                {m.title}
                <span style={{ color: t.palette.rule }}> · </span>
                <strong style={{ color: t.palette.ink2, fontWeight: 600 }}>{m.employer}</strong>
                <span style={{ color: t.palette.rule }}> · </span>
                {m.city}
              </div>

              {/* Inline stats */}
              <div style={{ display: 'flex', gap: 16, marginTop: 13, flexWrap: 'wrap' }}>
                {['14 members helped', '~2 day response', 'Active today'].map((label, i) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 5, height: 5, borderRadius: 999, background: t.palette.ok, flexShrink: 0 }} />
                    <span style={{ fontFamily: t.font.mono, fontSize: 10, color: t.palette.muted, letterSpacing: '0.05em' }}>{label}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Bio — italic quote in the hero, no card wrapper */}
          {m.bio && (
            <div style={{ marginTop: 22, paddingTop: 20, borderTop: `1px solid ${t.palette.ruleSoft}` }}>
              <p style={{
                ...t.display, fontStyle: 'italic',
                fontSize: mob ? 17 : 20, fontWeight: 500,
                color: t.palette.ink2, margin: 0,
                lineHeight: 1.5, letterSpacing: '-0.01em', maxWidth: 780,
              }}>"{m.bio}"</p>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
            <AtriumButton size={mob ? 'md' : 'lg'} onClick={() => {
              const thread = THREADS.find(th => th.withMember === m.id) || THREADS[0];
              if (setActiveThread) setActiveThread(thread.id);
              goto('thread');
            }}>Send a note</AtriumButton>
            <AtriumButton size={mob ? 'md' : 'lg'} variant="outline">Ask for advice</AtriumButton>
            <AtriumButton size={mob ? 'md' : 'lg'} variant="ghost">Connect</AtriumButton>
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────── */}
      <div style={{
        marginTop: mob ? 20 : 28,
        display: 'grid',
        gridTemplateColumns: mob ? '1fr' : '1fr 320px',
        gap: mob ? 16 : 28,
      }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: mob ? 14 : 20 }}>

          {/* Career */}
          {m.career?.length ? (
            <div style={t.cardSurface({ padding: mob ? 20 : 28 })}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
                <AtriumEyebrow accent>Career · {m.career.length} roles</AtriumEyebrow>
                <span style={{ fontFamily: t.font.mono, fontSize: 10, color: t.palette.mute2, letterSpacing: '0.12em' }}>
                  {(mob ? 'VERTICAL' : orientation.toUpperCase())}
                </span>
              </div>
              <Timeline items={m.career} orientation={mob ? 'vertical' : orientation} kind="career" />
            </div>
          ) : null}

          {/* Education */}
          {m.education?.length ? (
            <div style={t.cardSurface({ padding: mob ? 20 : 28 })}>
              <AtriumEyebrow accent>Education</AtriumEyebrow>
              <div style={{ marginTop: 18 }}>
                <Timeline items={m.education} orientation={mob ? 'vertical' : orientation} kind="education" />
              </div>
            </div>
          ) : null}

          {/* Working with them */}
          <div style={t.cardSurface({ padding: mob ? 20 : 28 })}>
            <AtriumEyebrow>Working with {m.name.split(' ')[0]}</AtriumEyebrow>

            {/* Topics */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontFamily: t.font.mono, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: t.palette.muted, marginBottom: 9 }}>
                Topics
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {m.tags.map(tag => <AtriumTag key={tag} tone="muted">{tag}</AtriumTag>)}
              </div>
            </div>

            {/* Format / Capacity / Response chips */}
            <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: mob ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { label: 'Format',   value: 'Async + 30-min calls' },
                { label: 'Capacity', value: '2–3 / month' },
                { label: 'Response', value: 'Within 2 days' },
              ].map(chip => (
                <div key={chip.label} style={{
                  padding: '11px 14px',
                  background: t.palette.panel,
                  border: `1px solid ${t.palette.ruleSoft}`,
                  borderRadius: t.radius - 2,
                }}>
                  <div style={{ fontFamily: t.font.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: t.palette.muted, marginBottom: 5 }}>
                    {chip.label}
                  </div>
                  <div style={{ fontFamily: t.font.body, fontSize: 13, color: t.palette.ink, fontWeight: 600, lineHeight: 1.3 }}>
                    {chip.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interests + Outside work */}
          {(m.interests?.length || m.hobbies?.length) ? (
            <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: mob ? 14 : 20 }}>

              {m.interests?.length ? (
                <div style={t.cardSurface({ padding: mob ? 18 : 24 })}>
                  <AtriumEyebrow>Currently interested in</AtriumEyebrow>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0', display: 'flex', flexDirection: 'column', gap: 9 }}>
                    {m.interests.map((it, i) => (
                      <li key={i} style={{ display: 'grid', gridTemplateColumns: '22px 1fr', gap: 8, alignItems: 'baseline' }}>
                        <span style={{ fontFamily: t.font.mono, fontSize: 10, color: t.palette.accent, letterSpacing: '0.14em', fontWeight: 600 }}>
                          0{i + 1}
                        </span>
                        <span style={{ fontSize: 13.5, color: t.palette.ink2, lineHeight: 1.45 }}>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {m.hobbies?.length ? (
                <div style={t.cardSurface({ padding: mob ? 18 : 24 })}>
                  <AtriumEyebrow>Outside work</AtriumEyebrow>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
                    {m.hobbies.map(h => <AtriumTag key={h} tone="muted">{h}</AtriumTag>)}
                  </div>
                  {m.languages?.length ? (
                    <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${t.palette.ruleSoft}` }}>
                      <div style={{ fontFamily: t.font.mono, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: t.palette.muted, marginBottom: 6 }}>
                        Languages
                      </div>
                      <div style={{ fontSize: 13.5, color: t.palette.ink2, lineHeight: 1.55 }}>
                        {m.languages.join(' · ')}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

            </div>
          ) : null}
        </div>

        {/* ── Sidebar ──────────────────────────────────────────── */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: mob ? 14 : 18, position: mob ? 'static' : 'sticky', top: 80 }}>

          {/* You and [name] */}
          <div style={t.cardSurface({ padding: mob ? 18 : 22 })}>
            <AtriumEyebrow accent>You and {m.name.split(' ')[0]}</AtriumEyebrow>

            {/* Mutual member stack */}
            <div style={{ marginTop: 16, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                {MEMBERS.slice(1, 5).map((mm, i) => (
                  <div key={mm.id} style={{ marginLeft: i > 0 ? -8 : 0, borderRadius: 999, boxShadow: `0 0 0 2px ${t.palette.card}` }}>
                    <AtriumAvatar name={mm.name} initials={mm.initials} size={28} />
                  </div>
                ))}
                <span style={{ fontFamily: t.font.body, fontSize: 13, color: t.palette.ink, fontWeight: 600, marginLeft: 10 }}>
                  4 mutual members
                </span>
              </div>
              <div style={{ fontFamily: t.font.body, fontSize: 12, color: t.palette.muted, paddingLeft: 2 }}>
                Dev, Sam, Priya + 1 more
              </div>
            </div>

            <div style={{ height: 1, background: t.palette.ruleSoft, marginBottom: 12 }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { label: 'Same city',     value: m.city.split(',')[0] },
                { label: 'Past events',   value: '2 gatherings together' },
                { label: 'Shared topics', value: 'Fundraising · Storytelling' },
                { label: 'Their record',  value: '3 events · 8 mentorships' },
              ].map((row, i) => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                  gap: 10, padding: '7px 0',
                  borderBottom: i < 3 ? `1px solid ${t.palette.ruleSoft}` : 'none',
                }}>
                  <span style={{ fontFamily: t.font.body, fontSize: 12.5, color: t.palette.muted }}>{row.label}</span>
                  <span style={{ fontFamily: t.font.body, fontSize: 12.5, color: t.palette.ink, fontWeight: 600, textAlign: 'right' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ways to connect */}
          <div style={t.cardSurface({ padding: mob ? 18 : 22 })}>
            <AtriumEyebrow>Ways to connect</AtriumEyebrow>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{
                padding: '12px 14px',
                background: hex(t.palette.accent, 0.06),
                border: `1px solid ${hex(t.palette.accent, 0.18)}`,
                borderRadius: t.radius - 2,
              }}>
                <div style={{ fontFamily: t.font.body, fontSize: 13, fontWeight: 700, color: t.palette.ink, marginBottom: 4 }}>
                  Start with a quick question
                </div>
                <div style={{ fontFamily: t.font.body, fontSize: 12.5, color: t.palette.muted, lineHeight: 1.45 }}>
                  {m.name.split(' ')[0]} answers advice requests in chat — no scheduling needed.
                </div>
              </div>
              <div style={{
                padding: '12px 14px',
                background: t.palette.panel,
                border: `1px solid ${t.palette.ruleSoft}`,
                borderRadius: t.radius - 2,
              }}>
                <div style={{ fontFamily: t.font.body, fontSize: 13, fontWeight: 700, color: t.palette.ink, marginBottom: 4 }}>
                  Request a 30-min session
                </div>
                <div style={{ fontFamily: t.font.body, fontSize: 12.5, color: t.palette.muted, lineHeight: 1.45 }}>
                  For bigger conversations — career pivots, deck reviews, warm intros.
                </div>
              </div>
            </div>
            <AtriumButton variant="outline" size="md" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}>
              Ask for advice →
            </AtriumButton>
          </div>

        </aside>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Timeline — vertical (default) and horizontal orientation
// ---------------------------------------------------------------------------
function Timeline({ items, orientation, kind }) {
  if (orientation === 'horizontal') return <TimelineH items={items} kind={kind} />;
  return <TimelineV items={items} kind={kind} />;
}

function fmtYear(from, to) {
  if (to === null || to === undefined) return `${from} —`;
  return `${from} – ${String(to).slice(-2)}`;
}

function TimelineV({ items, kind }) {
  const t = React.useContext(ThemeCtx);
  return (
    <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <li key={i} style={{
            display: 'grid', gridTemplateColumns: '22px 1fr', gap: 18,
            paddingBottom: last ? 0 : 26, position: 'relative',
          }}>
            <div style={{ position: 'relative', paddingTop: 7 }}>
              <span aria-hidden style={{ width: 9, height: 9, borderRadius: 999, background: t.palette.accent, display: 'block' }} />
              {!last ? (
                <span aria-hidden style={{
                  position: 'absolute', left: 4, width: 1,
                  top: 22, bottom: -26, background: t.palette.ruleSoft,
                }} />
              ) : null}
            </div>
            <div style={{ minWidth: 0, paddingTop: 2 }}>
              <div style={{ fontFamily: t.font.mono, fontSize: 11, letterSpacing: '0.14em', color: t.palette.muted, fontWeight: 600, marginBottom: 4 }}>
                {fmtYear(it.from, it.to)}
              </div>
              <h4 style={{ ...t.display, fontSize: 18, margin: 0, fontWeight: 600, lineHeight: 1.25, color: t.palette.ink }}>
                {kind === 'career' ? it.role : it.degree}
              </h4>
              <div style={{ fontSize: 13.5, color: t.palette.muted, marginTop: 4, lineHeight: 1.5 }}>
                <strong style={{ color: t.palette.ink2, fontWeight: 600 }}>{kind === 'career' ? it.org : it.school}</strong>
                {it.city ? <span> · {it.city}</span> : null}
                {kind === 'education' && it.honors ? <span> · {it.honors}</span> : null}
              </div>
              {kind === 'career' && it.summary ? (
                <p style={{ fontSize: 13.5, color: t.palette.ink2, margin: '10px 0 0', lineHeight: 1.6 }}>{it.summary}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function TimelineH({ items, kind }) {
  const t = React.useContext(ThemeCtx);
  return (
    <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, minmax(220px, 1fr))`, gap: 16 }}>
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <div key={i} style={{ minWidth: 0, position: 'relative' }}>
              <div style={{ position: 'relative', height: 16, marginBottom: 16 }}>
                <span aria-hidden style={{ position: 'absolute', left: 0, top: 4, width: 9, height: 9, borderRadius: 999, background: t.palette.accent }} />
                {!last ? (
                  <span aria-hidden style={{ position: 'absolute', left: 13, right: -16, top: 8, height: 1, background: t.palette.ruleSoft }} />
                ) : null}
              </div>
              <div style={{ fontFamily: t.font.mono, fontSize: 11, letterSpacing: '0.14em', color: t.palette.muted, fontWeight: 600 }}>
                {fmtYear(it.from, it.to)}
              </div>
              <h4 style={{ ...t.display, fontSize: 17, margin: '6px 0 4px', fontWeight: 600, lineHeight: 1.25 }}>
                {kind === 'career' ? it.role : it.degree}
              </h4>
              <div style={{ fontSize: 13, color: t.palette.muted, lineHeight: 1.5 }}>
                <strong style={{ color: t.palette.ink2, fontWeight: 600 }}>{kind === 'career' ? it.org : it.school}</strong>
                {it.city ? <span> · {it.city}</span> : null}
              </div>
              {kind === 'career' && it.summary ? (
                <p style={{ fontSize: 12.5, color: t.palette.ink2, margin: '10px 0 0', lineHeight: 1.55 }}>{it.summary}</p>
              ) : null}
              {kind === 'education' && it.honors ? (
                <p style={{ fontSize: 12.5, color: t.palette.muted, margin: '8px 0 0', fontStyle: 'italic' }}>{it.honors}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.AtriumProfile = AtriumProfile;
window.Timeline = Timeline;
