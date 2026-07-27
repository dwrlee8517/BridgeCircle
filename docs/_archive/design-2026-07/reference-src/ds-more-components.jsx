/* eslint-disable */
// Atrium Design System — Extended component showcases

// ─── DESK / INBOX CARDS SECTION ────────────────────────────────────────────

function DeskCardsSection() {
  const [skipped, setSkipped] = React.useState(null);

  const requests = [
    { id: 'r1', name: 'Jordan Reyes',   initials: 'JR', year: "'09", title: 'Founder, Calle Norte', sentAt: '6 days ago', warn: true,  body: 'Hi Maren — I\'m building a climate fintech startup and would love 30 mins on your go-to-market experience. Would you be open to a call next week?' },
    { id: 'r2', name: 'Priya Subramaniam', initials: 'PS', year: "'17", title: 'VP Engineering, Strata', sentAt: '2 days ago', warn: false, body: 'I\'m navigating my first leadership hire and heard you went through something similar at Common Capital. Would love a quick exchange if you have the space.' },
    { id: 'r3', name: 'Theo Harrington', initials: 'TH', year: "'20", title: 'Product, Waymark', sentAt: '1 day ago', warn: false, body: 'Big fan of your writing on product strategy. I\'m at an inflection point on my career and would love 20 mins of your time.' },
  ];

  return (
    <DSSection id="deskcards" eyebrow="Components · 07" title="Desk & Request Cards">
      <DSSub title="Mentor request card — interactive reply / skip">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
          {requests.map(req => (
            <DeskCard key={req.id} req={req} skipped={skipped === req.id} onSkip={() => setSkipped(req.id)} onUndo={() => setSkipped(null)} />
          ))}
        </div>
        <div style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.muted, lineHeight: 1.6, maxWidth: 600 }}>
          Cards are sorted by wait time. The orange <DSTag tone="warn" dot>warn</DSTag> tag appears after 4 days. Skip is reversible; reply opens the inbox thread view.
        </div>
      </DSSub>

      <DSSub title="Friend request card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, maxWidth: 800 }}>
          {[
            { name: 'Lena Vasquez',  initials: 'LV', title: 'Director, Watershed Fund',   year: "'13", sentAt: '3h ago' },
            { name: 'Ollie Kim',     initials: 'OK', title: 'Creative director, Studio NK', year: "'18", sentAt: '1d ago' },
          ].map(f => (
            <div key={f.name} style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 16, padding: 16, boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <DSAvatar name={f.name} initials={f.initials} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, fontFamily: DSF.body, color: DSC.ink }}>{f.name}</div>
                  <div style={{ fontSize: 12, color: DSC.muted, fontFamily: DSF.body, marginTop: 1 }}>{f.year} · {f.title}</div>
                </div>
                <span style={{ fontSize: 11.5, color: DSC.mute2, fontFamily: DSF.mono, flexShrink: 0 }}>{f.sentAt}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <DSButton size="sm" style={{ flex: 1, justifyContent: 'center' }}>Accept</DSButton>
                <DSButton size="sm" variant="outline">Ignore</DSButton>
              </div>
            </div>
          ))}
        </div>
      </DSSub>
    </DSSection>
  );
}

function DeskCard({ req, skipped, onSkip, onUndo }) {
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 10, boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)', opacity: skipped ? 0.45 : 1, transition: 'opacity 200ms ease' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <DSAvatar name={req.name} initials={req.initials} size={32} />
        <DSTag tone={req.warn ? 'warn' : 'muted'} dot>{req.sentAt}</DSTag>
      </div>
      <div>
        <div style={{ fontFamily: DSF.display, fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em', color: DSC.ink }}>{req.name}</div>
        <div style={{ fontFamily: DSF.body, fontSize: 11.5, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, color: DSC.muted, marginTop: 3 }}>{req.year} · {req.title}</div>
      </div>
      <p style={{ fontSize: 13, color: DSC.ink2, margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>"{req.body}"</p>
      <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 4 }}>
        {skipped
          ? <button onClick={onUndo} style={{ flex: 1, background: 'none', border: `1px solid ${DSC.rule}`, borderRadius: 999, padding: '8px 14px', fontFamily: DSF.body, fontSize: 12.5, fontWeight: 600, color: DSC.muted, cursor: 'pointer' }}>Undo skip</button>
          : <>
              <DSButton size="sm" style={{ flex: 1, justifyContent: 'center' }}>Reply</DSButton>
              <DSButton size="sm" variant="ghost" onClick={onSkip}>Skip</DSButton>
            </>
        }
      </div>
    </div>
  );
}

// ─── PATH CARDS SECTION ────────────────────────────────────────────────────

function PathCardsSection() {
  const paths = [
    { idx: '01', verb: 'Find a mentor',           count: '347', countLabel: 'open to mentor', foot: 'Avg reply 4 days · 78% accept', tone: DSC.ink,   accent: false },
    { idx: '02', verb: 'Browse the network',      count: '1,284',countLabel: 'members',       foot: '53 cities · 17 cohorts',       tone: DSC.ink,   accent: false },
    { idx: '03', verb: 'Look at upcoming events', count: '8',    countLabel: 'on the calendar',foot: "Next: Spring Supper · in 7d",  tone: DSC.ink,   accent: false },
    { idx: '04', verb: 'Reply to waiting threads',count: '3',    countLabel: 'waiting on you', foot: 'Oldest: Jordan · 6 days ago',  tone: DSC.accent,accent: true  },
    { idx: '05', verb: "See who's new",           count: '12',   countLabel: 'recently joined',foot: 'Last 14 days · all cohorts',   tone: DSC.ok,    accent: false },
    { idx: '06', verb: 'Update your profile',     count: '64%',  countLabel: 'complete',       foot: 'Missing: mentor capacity',     tone: DSC.muted, accent: false },
  ];

  return (
    <DSSection id="pathcards" eyebrow="Components · 08" title="Path Cards">
      <DSSub title="Where would you like to go? — 6-card home screen grid">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {paths.map(p => <PathCard key={p.idx} path={p} />)}
        </div>
        <div style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.muted, lineHeight: 1.6, maxWidth: 600 }}>
          Path cards use an eyebrow index (§ 01–06), a large action verb, a stat readout, and a mono footer. The accent-highlighted card (§ 04) signals urgency.
        </div>
      </DSSub>
    </DSSection>
  );
}

function PathCard({ path: p }) {
  const [hov, setHov] = React.useState(false);
  return (
    <button onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 16, padding: '20px 20px 18px', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 180, transition: 'transform 120ms ease, box-shadow 120ms ease', transform: hov ? 'translateY(-2px)' : '', boxShadow: hov ? '0 1px 0 rgba(255,255,255,.6) inset, 0 8px 24px rgba(42,34,26,0.10)' : '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <DSEyebrow>§ {p.idx}</DSEyebrow>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: DSF.display, fontSize: 26, fontWeight: 600, color: p.tone, letterSpacing: '-0.02em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{p.count}</div>
          <div style={{ fontFamily: DSF.body, fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600, color: DSC.mute2, marginTop: 2 }}>{p.countLabel}</div>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: DSF.display, fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em', color: DSC.ink, lineHeight: 1.15 }}>{p.verb} →</div>
      </div>
      <div style={{ paddingTop: 10, borderTop: `1px solid ${DSC.ruleSoft}`, display: 'flex', alignItems: 'center', gap: 6 }}>
        {p.accent && <span style={{ width: 6, height: 6, borderRadius: 999, background: p.tone, display: 'inline-block', flexShrink: 0 }} />}
        <span style={{ fontFamily: DSF.mono, fontSize: 10, letterSpacing: '0.10em', color: p.accent ? p.tone : DSC.mute2, textTransform: 'uppercase' }}>{p.foot}</span>
      </div>
    </button>
  );
}

// ─── EVENT CARDS SECTION ───────────────────────────────────────────────────

function EventCardsSection() {
  return (
    <DSSection id="eventcards" eyebrow="Components · 09" title="Event Cards">
      <DSSub title="Hero event card — hosting state">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14, maxWidth: 900 }}>
          <EventHeroCard />
          <EventMiniCard title="Brooklyn Breakfast" days={14} going={8}  cap={12} host="Dev Patel" when="Thu 29 May · 8am" />
          <EventMiniCard title="Office Hours"       days={21} going={22} cap={30} host="Rosa Ferrara" when="Fri 6 Jun · 2pm" />
        </div>
      </DSSub>

      <DSSub title="Anatomy notes">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {[
            { label: 'Hero card', notes: ['Dark gradient header — ink → accent', 'Oversized T−Nd countdown in corner', 'Progress bar for capacity', 'Eyebrow shows hosting state', 'CTA always full-width'] },
            { label: 'Mini card',  notes: ['Tag shows T−Nd + status', 'Title in Inter Tight 16/600', 'Host line below date', 'Going/capacity in footer', 'RSVP as outline button'] },
            { label: 'Shared',    notes: ['Cards use cardSurface()', 'radius from shape token', 'Font: Inter Tight for titles', 'Capacity bar: 6px pill', 'Always stretch to grid height'] },
          ].map(n => (
            <div key={n.label} style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset' }}>
              <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>{n.label}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {n.notes.map((note, i) => (
                  <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ width: 4, height: 4, borderRadius: 999, background: DSC.accent, marginTop: 5, flexShrink: 0 }} />
                    <span style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.ink2, lineHeight: 1.45 }}>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DSSub>
    </DSSection>
  );
}

function EventHeroCard() {
  const pct = 70;
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
      <div style={{ background: `linear-gradient(135deg, ${DSC.ink} 0%, ${DSC.accent} 160%)`, padding: '14px 18px', position: 'relative', overflow: 'hidden' }}>
        <span style={{ fontFamily: DSF.display, fontSize: 72, lineHeight: 1, color: 'rgba(255,255,255,0.08)', position: 'absolute', right: 8, bottom: -10, letterSpacing: '-0.04em', pointerEvents: 'none' }}>7D</span>
        <DSEyebrow color="rgba(255,255,255,0.65)">Spring Supper · You're hosting</DSEyebrow>
        <div style={{ fontFamily: DSF.display, fontSize: 20, fontWeight: 600, margin: '6px 0 0', color: '#fff', lineHeight: 1.15, position: 'relative' }}>Tuesday 15 May · 7:30 pm</div>
        <div style={{ fontFamily: DSF.display, fontSize: 28, fontWeight: 600, color: DSC.accent, letterSpacing: '-0.03em', lineHeight: 1, position: 'absolute', top: 14, right: 18, filter: 'brightness(1.6)' }}>T−7d</div>
      </div>
      <div style={{ padding: '14px 18px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6, fontFamily: DSF.body }}>
            <span style={{ fontWeight: 600, color: DSC.ink2 }}>14 going</span>
            <span style={{ color: DSC.muted }}>{pct}% full</span>
          </div>
          <div style={{ background: DSC.rule, borderRadius: 999, height: 6, overflow: 'hidden' }}>
            <div style={{ background: DSC.accent, height: '100%', width: `${pct}%`, borderRadius: 999 }} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[['Open question', "Confirm Iris's plus-one"], ['Co-host', 'Sam Aldridge · \'11']].map(([k, v]) => (
            <div key={k} style={{ fontSize: 12.5, color: DSC.ink2, display: 'flex', justifyContent: 'space-between', gap: 10, fontFamily: DSF.body }}>
              <span style={{ color: DSC.muted }}>{k}</span>
              <span style={{ fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>
        <DSButton style={{ marginTop: 'auto', justifyContent: 'center', width: '100%' }}>Open event</DSButton>
      </div>
    </div>
  );
}

function EventMiniCard({ title, days, going, cap, host, when }) {
  const pct = Math.round(going / cap * 100);
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
      <DSTag tone="muted">T−{days}d · Upcoming</DSTag>
      <div style={{ fontFamily: DSF.display, fontSize: 16, fontWeight: 600, margin: '10px 0 4px', letterSpacing: '-0.01em', lineHeight: 1.2, color: DSC.ink }}>{title}</div>
      <div style={{ fontSize: 12.5, color: DSC.muted, marginBottom: 4, fontFamily: DSF.body }}>{when}</div>
      <div style={{ fontSize: 12, color: DSC.muted, fontFamily: DSF.body }}>Host · {host}</div>
      <div style={{ marginTop: 'auto', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: DSC.muted, fontFamily: DSF.body }}>{going}/{cap} going</span>
        <DSButton size="sm" variant="outline">RSVP</DSButton>
      </div>
    </div>
  );
}

// ─── AI SEARCH SECTION ─────────────────────────────────────────────────────

function AISearchSection() {
  const [stage, setStage] = React.useState('idle'); // idle | loading | results
  const [query, setQuery] = React.useState('');
  const [draft, setDraft] = React.useState('');
  const stages = ['reading your query', 'scanning the directory', 'ranking by fit'];
  const [stageIdx, setStageIdx] = React.useState(0);

  const run = () => {
    if (!draft.trim()) return;
    setQuery(draft); setStage('loading'); setStageIdx(0);
    const t1 = setTimeout(() => setStageIdx(1), 700);
    const t2 = setTimeout(() => setStageIdx(2), 1400);
    const t3 = setTimeout(() => setStage('results'), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  };
  const clear = () => { setStage('idle'); setQuery(''); setDraft(''); };

  const examples = ['climate founders open to advising', 'engineers in Lagos or Accra', 'people who went from IC to founder'];
  const mockResults = [
    { name: 'Iris Okonkwo', initials: 'IO', title: 'VP Investments, Common Capital', why: 'Backed 12 climate startups; explicitly open to advising first-timers on fundraising.' },
    { name: 'Dev Patel',    initials: 'DP', title: 'Partner, Greenleaf Ventures',    why: 'Focuses on climate infrastructure; led 3 rounds in the last 18 months.' },
    { name: 'Rosa Ferrara', initials: 'RF', title: 'CEO, Solaris Grid',              why: 'Operator-turned-VC; advises 4 early-stage climate companies currently.' },
  ];

  return (
    <DSSection id="aisearch" eyebrow="Components · 10" title="AI Directory Search">
      <DSSub title="Full AI search widget — interactive">
        <div style={{ background: dshex(DSC.accent, 0.08), border: `1px solid ${dshex(DSC.accent, 0.28)}`, borderRadius: 20, padding: 24, marginBottom: 16 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1.5L9.3 6.7L14.5 8L9.3 9.3L8 14.5L6.7 9.3L1.5 8L6.7 6.7Z" fill={DSC.accent} /></svg>
            <span style={{ fontFamily: DSF.body, fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', color: DSC.accent, textTransform: 'uppercase' }}>Ask the directory</span>
            <span style={{ fontSize: 12.5, color: DSC.muted, fontWeight: 500 }}>· reads career, schools, skills</span>
          </div>
          {/* Input row */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 999, padding: '4px 6px 4px 18px' }}>
              <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') run(); }} placeholder="What kind of alum are you looking for?" disabled={stage === 'loading'}
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: DSF.body, fontSize: 15, color: DSC.ink, padding: '10px 0' }} />
              {draft && <button onClick={clear} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: DSC.muted, fontSize: 18, lineHeight: 1, padding: '0 6px' }}>×</button>}
              <DSButton onClick={run} disabled={stage === 'loading' || !draft.trim()}>{stage === 'loading' ? 'Searching…' : 'Search'}</DSButton>
            </div>
          </div>
          {/* State: idle examples */}
          {stage === 'idle' && (
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <DSEyebrow>Try</DSEyebrow>
              {examples.map(ex => (
                <button key={ex} onClick={() => { setDraft(ex); }} style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.ink2, background: DSC.card, border: `1px solid ${DSC.rule}`, padding: '5px 12px', borderRadius: 999, cursor: 'pointer', fontWeight: 500 }}>"{ex}"</button>
              ))}
            </div>
          )}
          {/* State: loading */}
          {stage === 'loading' && (
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: DSC.accent, display: 'inline-block', animation: 'ds-ai-pulse 1.2s ease-in-out infinite' }} />
              <span style={{ fontSize: 13.5, color: DSC.ink2, fontWeight: 500, fontFamily: DSF.body }}>{stages[stageIdx]}…</span>
            </div>
          )}
          {/* State: results hint */}
          {stage === 'results' && (
            <div style={{ marginTop: 14, fontSize: 13.5, color: DSC.muted, fontFamily: DSF.body, lineHeight: 1.55 }}>
              Showing <strong style={{ color: DSC.ink, fontWeight: 600 }}>3 AI matches</strong> for "{query}" — each card shows why it's a match. <button onClick={clear} style={{ background: 'none', border: 'none', color: DSC.accent, fontFamily: DSF.body, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', padding: 0 }}>Clear search</button>
            </div>
          )}
        </div>

        {/* Mock results */}
        {stage === 'results' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {mockResults.map((m, i) => (
              <div key={m.name} style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)', animation: `ds-fade-up 200ms cubic-bezier(0,0,0.2,1) ${i * 60}ms both` }}>
                <div style={{ padding: '16px 18px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <DSAvatar name={m.name} initials={m.initials} size={38} />
                    <div>
                      <div style={{ fontFamily: DSF.display, fontSize: 16, fontWeight: 600, color: DSC.ink }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: DSC.muted, fontFamily: DSF.body, marginTop: 1 }}>{m.title}</div>
                    </div>
                  </div>
                </div>
                <div style={{ borderTop: `1px solid ${dshex(DSC.accent, 0.22)}`, background: dshex(DSC.accent, 0.07), padding: '10px 18px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 1.5L9.3 6.7L14.5 8L9.3 9.3L8 14.5L6.7 9.3L1.5 8L6.7 6.7Z" fill={DSC.accent} /></svg>
                    <span style={{ fontFamily: DSF.body, fontSize: 10.5, fontWeight: 700, color: DSC.accent, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Why this match?</span>
                  </div>
                  <p style={{ fontSize: 12.5, lineHeight: 1.5, color: DSC.ink2, margin: 0, fontFamily: DSF.body }}>{m.why}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </DSSub>
    </DSSection>
  );
}

// ─── FILTER CHIPS SECTION ──────────────────────────────────────────────────

function FiltersSection() {
  const [pills, setPills] = React.useState({ mentor: false, nearMe: false, know: false });
  const [open, setOpen] = React.useState(false);
  const [city, setCity] = React.useState('');
  const [topic, setTopic] = React.useState('');
  const toggle = k => setPills(p => ({ ...p, [k]: !p[k] }));

  const activeChips = [
    ...(pills.mentor  ? [{ key: 'mentor',  label: 'Open to mentor' }] : []),
    ...(pills.nearMe  ? [{ key: 'nearMe',  label: 'Near me' }]        : []),
    ...(pills.know    ? [{ key: 'know',    label: 'People I know' }]  : []),
    ...(city.trim()   ? [{ key: 'city',    label: `City: ${city}` }]  : []),
    ...(topic.trim()  ? [{ key: 'topic',   label: `Topic: ${topic}` }]: []),
  ];

  const clearOne = k => {
    if (k === 'city')  { setCity(''); return; }
    if (k === 'topic') { setTopic(''); return; }
    setPills(p => ({ ...p, [k]: false }));
  };
  const clearAll = () => { setPills({ mentor: false, nearMe: false, know: false }); setCity(''); setTopic(''); };

  return (
    <DSSection id="filters" eyebrow="Components · 11" title="Filters & Refinement">
      <DSSub title="Directory refine bar — interactive">
        {/* Toggle pills strip */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <DSEyebrow>Refine</DSEyebrow>
          <DSTogglePill active={pills.mentor} onClick={() => toggle('mentor')}>Open to mentor</DSTogglePill>
          <DSTogglePill active={pills.nearMe} onClick={() => toggle('nearMe')}>Near me</DSTogglePill>
          <DSTogglePill active={pills.know}   onClick={() => toggle('know')}>People I know</DSTogglePill>
          <button onClick={() => setOpen(v => !v)} style={{ background: DSC.cardAlt, color: DSC.ink, border: `1px solid ${DSC.rule}`, padding: '8px 14px', borderRadius: 999, fontFamily: DSF.body, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {open ? '− Hide filters' : `+ More filters${activeChips.filter(c => c.key === 'city' || c.key === 'topic').length ? ` · ${activeChips.filter(c => c.key === 'city' || c.key === 'topic').length}` : ''}`}
          </button>
        </div>

        {/* Expanded filter panel */}
        {open && (
          <div style={{ background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: 18, padding: 20, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 12 }}>
            {[{ label: 'City', value: city, set: setCity, ph: 'Brooklyn' }, { label: 'Mentor topic', value: topic, set: setTopic, ph: 'Fundraising' }].map(f => (
              <div key={f.label}>
                <div style={{ fontFamily: DSF.body, fontSize: 11.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: DSC.muted, marginBottom: 6 }}>{f.label}</div>
                <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${DSC.rule}`, padding: '9px 14px', fontFamily: DSF.body, fontSize: 13, background: DSC.card, borderRadius: 999, color: DSC.ink, outline: 'none' }} onFocus={e => { e.target.style.borderColor = DSC.accent; }} onBlur={e => { e.target.style.borderColor = DSC.rule; }} />
              </div>
            ))}
          </div>
        )}

        {/* Active filter chips */}
        {activeChips.length > 0 && (
          <div style={{ padding: '10px 14px', background: dshex(DSC.accent, 0.09), border: `1px solid ${dshex(DSC.accent, 0.28)}`, borderRadius: 999, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <DSEyebrow accent>Active</DSEyebrow>
            {activeChips.map(chip => (
              <button key={chip.key} onClick={() => clearOne(chip.key)} style={{ fontFamily: DSF.body, fontSize: 12.5, fontWeight: 600, color: DSC.ink, background: DSC.card, border: `1px solid ${dshex(DSC.accent, 0.30)}`, padding: '5px 12px', borderRadius: 999, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {chip.label}
                <span style={{ color: DSC.muted, fontSize: 15, lineHeight: 1 }}>×</span>
              </button>
            ))}
            <button onClick={clearAll} style={{ background: 'transparent', border: 'none', color: DSC.accent, fontFamily: DSF.body, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', padding: '5px 6px' }}>Clear all</button>
          </div>
        )}

        <div style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.muted, marginTop: 16, lineHeight: 1.6 }}>
          Toggle the pills and expand the filter panel above. Active filters appear as removable chips in the accent-tinted bar.
        </div>
      </DSSub>
    </DSSection>
  );
}

window.DeskCardsSection  = DeskCardsSection;
window.PathCardsSection  = PathCardsSection;
window.EventCardsSection = EventCardsSection;
window.AISearchSection   = AISearchSection;
window.FiltersSection    = FiltersSection;
