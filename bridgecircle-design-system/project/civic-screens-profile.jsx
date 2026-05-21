/* eslint-disable */
// Rich profile screen — Civic style.
// Includes career/education timelines, interests, hobbies, languages.
// Exported as window.ProfileScreen, overriding the basic version in
// civic-screens-rest.jsx (this file loads after it in the HTML).

function ProfileScreen() {
  const t = React.useContext(ThemeCtx);
  const isM = useCivicIsMobile();
  const { activeProfile, goto, setActiveThread } = useRoute();
  const { MEMBERS } = window.BC_DATA;
  const m = MEMBERS.find(x => x.id === activeProfile) || MEMBERS[0];

  return (
    <section style={{ padding: isM ? '20px 14px 40px' : '32px 32px 56px', maxWidth: 1280, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <button onClick={() => goto('people')} style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: t.palette.muted, fontFamily: t.font.mono, fontSize: 10.5,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        padding: '0 0 20px', display: 'inline-flex', alignItems: 'center', gap: 6,
      }}>← People</button>

      {/* Hero card */}
      <div style={t.cardSurface({ padding: isM ? '22px 18px' : '32px 36px', marginBottom: isM ? 14 : 22 })}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: isM ? 14 : 18 }}>
          <CivicChip tone="ok">✓ Verified &apos;{String(m.year).slice(-2)}</CivicChip>
          <CivicChip tone="accent">{m.open === 'mentor' ? 'Open to mentor' : 'Open to advice'}</CivicChip>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: isM ? 14 : 24, flexWrap: 'wrap' }}>
          <CivicAvatar name={m.name} initials={m.initials} size={isM ? 56 : 88} />
          <h1 style={{ ...t.display, fontSize: isM ? 34 : 56, margin: 0, fontWeight: 600 }}>{m.name}</h1>
        </div>
        <div style={{ fontSize: isM ? 14 : 16, color: t.palette.muted, marginTop: isM ? 10 : 12 }}>
          {m.title} at <strong style={{ color: t.palette.ink2, fontWeight: 600 }}>{m.employer}</strong> · {m.city}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: isM ? 16 : 22, flexWrap: 'wrap' }}>
          <CivicButton size={isM ? 'md' : 'lg'} style={{ flex: isM ? '1 1 100%' : 'initial', justifyContent: 'center' }} onClick={() => {
            const thread = window.BC_DATA.THREADS.find(th => th.withMember === m.id) || window.BC_DATA.THREADS[0];
            if (setActiveThread) setActiveThread(thread.id);
            goto('thread');
          }}>Send a note</CivicButton>
          <CivicButton size={isM ? 'md' : 'lg'} variant="outline" style={{ flex: isM ? 1 : 'initial', justifyContent: 'center' }}>Ask for advice</CivicButton>
          <CivicButton size={isM ? 'md' : 'lg'} variant="ghost" style={{ flex: isM ? 1 : 'initial', justifyContent: 'center' }}>Save to friends</CivicButton>
        </div>
      </div>

      {/* Body — two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: isM ? '1fr' : '1fr 336px', gap: isM ? 14 : 22 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: isM ? 14 : 20 }}>

          {/* Bio */}
          <div style={t.cardSurface({ padding: isM ? 18 : 28 })}>
            <Eyebrow color={t.palette.muted}>In their own words</Eyebrow>
            <p style={{ ...t.display, fontSize: isM ? 18 : 22, fontWeight: 500, color: t.palette.ink, marginTop: 14, lineHeight: 1.4, letterSpacing: '-0.01em' }}>
              &ldquo;{m.bio}&rdquo;
            </p>
          </div>

          {/* Career timeline */}
          {m.career?.length ? (
            <div style={t.cardSurface({ padding: isM ? 18 : 28 })}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 22, gap: 8, flexWrap: 'wrap' }}>
                <Eyebrow color={t.palette.accent}>Career · {m.career.length} roles</Eyebrow>
                {!isM && <span style={{ fontFamily: t.font.mono, fontSize: 10, color: t.palette.mute2, letterSpacing: '0.14em' }}>CHRONOLOGICAL</span>}
              </div>
              <CivicTimeline items={m.career} kind="career" />
            </div>
          ) : null}

          {/* Education timeline */}
          {m.education?.length ? (
            <div style={t.cardSurface({ padding: isM ? 18 : 28 })}>
              <Eyebrow color={t.palette.accent}>Education</Eyebrow>
              <div style={{ marginTop: 22 }}>
                <CivicTimeline items={m.education} kind="education" />
              </div>
            </div>
          ) : null}

          {/* Open to */}
          <div style={t.cardSurface({ padding: isM ? 18 : 28 })}>
            <Eyebrow color={t.palette.muted}>Open to</Eyebrow>
            <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: isM ? '1fr' : 'repeat(2, 1fr)', gap: 12 }}>
              <ProfileOpenRow label="Mentorship" value={m.open === 'mentor' ? 'Yes — async or 30-min calls' : 'No'} on={m.open === 'mentor'} />
              <ProfileOpenRow label="Advice"     value="Yes — any Hartwood member"       on />
              <ProfileOpenRow label="Intros"     value="Yes — investors & designers"     on />
              <ProfileOpenRow label="Hiring"     value="Not actively · check back Q3"    on={false} />
            </div>
          </div>

          {/* Interests + Hobbies */}
          {(m.interests?.length || m.hobbies?.length) ? (
            <div style={{ display: 'grid', gridTemplateColumns: isM ? '1fr' : '1fr 1fr', gap: isM ? 14 : 20 }}>
              {m.interests?.length ? (
                <div style={t.cardSurface({ padding: isM ? 18 : 24 })}>
                  <Eyebrow color={t.palette.muted}>Currently interested in</Eyebrow>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {m.interests.map((it, i) => (
                      <li key={i} style={{ display: 'grid', gridTemplateColumns: '22px 1fr', gap: 8, alignItems: 'baseline', fontSize: 13.5, color: t.palette.ink2 }}>
                        <span style={{ fontFamily: t.font.mono, fontSize: 10, color: t.palette.accent, letterSpacing: '0.14em' }}>0{i + 1}</span>
                        <span style={{ lineHeight: 1.45 }}>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {m.hobbies?.length ? (
                <div style={t.cardSurface({ padding: isM ? 18 : 24 })}>
                  <Eyebrow color={t.palette.muted}>Outside work</Eyebrow>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
                    {m.hobbies.map(h => <CivicChip key={h} tone="muted">{h}</CivicChip>)}
                  </div>
                  {m.languages?.length ? (
                    <div style={{ marginTop: 18, borderTop: `1px solid ${t.palette.ruleSoft}`, paddingTop: 14 }}>
                      <Eyebrow color={t.palette.muted}>Languages</Eyebrow>
                      <div style={{ fontSize: 13.5, color: t.palette.ink2, marginTop: 8, lineHeight: 1.55 }}>
                        {m.languages.join(' · ')}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Skills */}
          <div style={t.cardSurface({ padding: isM ? 18 : 28 })}>
            <Eyebrow color={t.palette.muted}>What they help with</Eyebrow>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 14 }}>
              {[...m.tags, 'Pitch decks', 'Cold intros', 'Career switches'].map(tag => (
                <span key={tag} style={{
                  fontFamily: t.font.mono, fontSize: 10.5, color: t.palette.ink2,
                  border: `1px solid ${t.palette.rule}`, padding: '5px 10px', borderRadius: 2,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                }}>{tag}</span>
              ))}
            </div>
          </div>

        </div>

        {/* Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: isM ? 14 : 16 }}>
          {/* Verification */}
          <div style={t.cardSurface({ padding: 22 })}>
            <Eyebrow color={t.palette.muted}>Verification</Eyebrow>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0 4px' }}>
              <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
                <circle cx="16" cy="16" r="14" fill="none" stroke={t.palette.accent} strokeWidth="1.5" />
                <path d="M10 16.5 L14.5 21 L23 12" fill="none" stroke={t.palette.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div>
                <div style={{ ...t.display, fontSize: 17, color: t.palette.ink }}>Verified &apos;{String(m.year).slice(-2)}</div>
                <div style={{ fontSize: 12, color: t.palette.muted }}>By two anchor members</div>
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <NumberedField n={1} label="Anchor"   value="Dev Ramachandran" />
              <NumberedField n={2} label="Anchor"   value="Sam Aldridge" />
              <NumberedField n={3} label="Joined"   value="May 2025" />
              <NumberedField n={4} label="Activity" value="Last seen 2h ago" />
            </div>
          </div>

          {/* You share */}
          <div style={t.cardSurface({ padding: 22 })}>
            <Eyebrow color={t.palette.muted}>You share</Eyebrow>
            <div style={{ marginTop: 14 }}>
              <NumberedField n={1} label="Mutuals"     value="4" sub="Dev, Priya, Sam, Matty" />
              <NumberedField n={2} label="Same city"   value="Yes · Brooklyn" />
              <NumberedField n={3} label="Past events" value="2 attended together" />
            </div>
            <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {window.BC_DATA.MEMBERS.slice(1, 5).map(mm => (
                <CivicAvatar key={mm.id} name={mm.name} initials={mm.initials} size={30} />
              ))}
            </div>
          </div>

          {/* Tags used */}
          <div style={t.cardSurface({ padding: 22 })}>
            <Eyebrow color={t.palette.muted}>Tags</Eyebrow>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
              {m.tags.map(tag => (
                <span key={tag} style={{
                  fontFamily: t.font.mono, fontSize: 10, color: t.palette.muted,
                  border: `1px solid ${t.palette.rule}`, padding: '3px 7px', borderRadius: 2,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                }}>{tag}</span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

// ── Timeline ──────────────────────────────────────────────────────────────

function CivicTimeline({ items, kind }) {
  const t = React.useContext(ThemeCtx);
  const isM = useCivicIsMobile();
  return (
    <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <li key={i} style={{ display: 'grid', gridTemplateColumns: isM ? '62px 14px 1fr' : '88px 18px 1fr', gap: isM ? 10 : 14, paddingBottom: last ? 0 : (isM ? 20 : 26) }}>
            {/* Date */}
            <div style={{ fontFamily: t.font.mono, fontSize: isM ? 10.5 : 11, letterSpacing: '0.12em', color: t.palette.muted, fontWeight: 600, paddingTop: 4 }}>
              {it.to === null ? `${it.from} —` : `${it.from}–${String(it.to).slice(-2)}`}
            </div>
            {/* Rail */}
            <div style={{ position: 'relative', paddingTop: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: t.palette.accent, display: 'block' }} />
              {!last && <span style={{ position: 'absolute', left: 3, width: 1, top: 19, bottom: isM ? -20 : -26, background: t.palette.ruleSoft }} />}
            </div>
            {/* Body */}
            <div style={{ minWidth: 0, paddingTop: 2 }}>
              <h4 style={{ ...t.display, fontSize: isM ? 16 : 18, margin: '0 0 4px', fontWeight: 600, color: t.palette.ink, lineHeight: 1.2 }}>
                {kind === 'career' ? it.role : it.degree}
              </h4>
              <div style={{ fontSize: 13.5, color: t.palette.muted, lineHeight: 1.5 }}>
                <strong style={{ color: t.palette.ink2, fontWeight: 600 }}>{kind === 'career' ? it.org : it.school}</strong>
                {it.city ? <span> · {it.city}</span> : null}
                {kind === 'education' && it.honors ? <span> · {it.honors}</span> : null}
              </div>
              {kind === 'career' && it.summary ? (
                <p style={{ fontSize: 13.5, color: t.palette.ink2, margin: '8px 0 0', lineHeight: 1.6 }}>{it.summary}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// ── Open-to row ───────────────────────────────────────────────────────────

function ProfileOpenRow({ label, value, on }) {
  const t = React.useContext(ThemeCtx);
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 2,
      border: `1px solid ${on ? t.palette.rule : t.palette.ruleSoft}`,
      background: on ? t.palette.card : t.palette.panel,
      opacity: on ? 1 : 0.7,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ width: 7, height: 7, borderRadius: 999, background: on ? t.palette.ok : t.palette.mute2, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: t.palette.ink }}>{label}</span>
      </div>
      <div style={{ fontSize: 12.5, color: t.palette.muted, lineHeight: 1.4 }}>{value}</div>
    </div>
  );
}

window.ProfileScreen = ProfileScreen;
window.CivicTimeline = CivicTimeline;
