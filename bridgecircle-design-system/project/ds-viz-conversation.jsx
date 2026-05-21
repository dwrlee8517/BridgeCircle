/* eslint-disable */
// Atrium Design System — Creative additions: Data Viz, Conversation, Empty States
// Section 14: Visualization — Cohort histogram, Career timeline, Activity heatmap
// Section 15: Conversation — Chat bubbles, Reaction row, Inline status setter
// Section 16: Empty States — 3 variants with the circle motif

// ─── SECTION 14 — VISUALIZATION ────────────────────────────────────────────

function VizSection() {
  return (
    <DSSection id="viz" eyebrow="Components · 14" title="Data Visualization">

      <DSSub title="Cohort histogram — class-year distribution">
        <CohortHistogram />
      </DSSub>

      <DSSub title="Career timeline — vertical record on profile pages">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <CareerTimeline />
          <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 18, padding: '22px 26px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
            <DSEyebrow>Anatomy</DSEyebrow>
            <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                ['Year column', 'Mono · right-aligned · always visible for scan'],
                ['Vertical line', 'Accent gradient from top (recent) to muted (deep history)'],
                ['Node marker', 'Filled circle (current role) or ring (past). 10px diameter.'],
                ['Role title', 'Inter Tight 14/600, role at top of each entry'],
                ['Company line', 'Body 13/500, with a hairline link affordance'],
                ['Inline note', 'Optional 1-line memo — milestones, pivots, hiatuses'],
              ].map(([k, v], i) => (
                <li key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 12 }}>
                  <span style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.accent, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{k}</span>
                  <span style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.ink2, lineHeight: 1.55 }}>{v}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DSSub>

      <DSSub title="Activity heatmap — your presence in the circle">
        <ActivityHeatmap />
      </DSSub>

    </DSSection>
  );
}

function CohortHistogram() {
  // Mock distribution — years '08 through '24
  const years = ['08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24'];
  const counts = [22, 41, 58, 72, 84, 91, 105, 118, 124, 132, 138, 116, 94, 78, 61, 48, 32];
  const viewerYear = '14';
  const max = Math.max(...counts);
  const [hover, setHover] = React.useState(null);

  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 18, padding: '24px 28px 20px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
        <div>
          <DSEyebrow>Members by class · 1,284 total</DSEyebrow>
          <div style={{ fontFamily: DSF.display, fontSize: 22, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.02em', marginTop: 6 }}>
            Class of '18 is the largest — <span style={{ color: DSC.accent }}>138 members</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, fontFamily: DSF.mono, fontSize: 10, letterSpacing: '0.06em', color: DSC.muted, textTransform: 'uppercase' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, background: DSC.accent, borderRadius: 2 }} />Your year</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, background: dshex(DSC.ink, 0.30), borderRadius: 2 }} />Others</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, height: 180, alignItems: 'stretch', position: 'relative', borderBottom: `1px solid ${DSC.rule}`, paddingBottom: 4 }}>
        {/* Reference grid lines */}
        {[0.25, 0.5, 0.75, 1].map(p => (
          <div key={p} style={{ position: 'absolute', left: 0, right: 0, bottom: `${p * 100}%`, height: 1, background: dshex(DSC.rule, 0.6), pointerEvents: 'none' }} />
        ))}
        {years.map((y, i) => {
          const isViewer = y === viewerYear;
          const isHover  = hover === y;
          const h = counts[i] / max * 100;
          return (
            <div key={y} onMouseEnter={() => setHover(y)} onMouseLeave={() => setHover(null)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', position: 'relative', cursor: 'pointer' }}>
              {(isHover || isViewer) && (
                <div style={{ position: 'absolute', bottom: `${h}%`, marginBottom: 8, fontFamily: DSF.mono, fontSize: 10, fontWeight: 700, color: isViewer ? DSC.accent : DSC.ink, background: DSC.card, border: `1px solid ${isViewer ? DSC.accent : DSC.rule}`, padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap', zIndex: 2 }}>{counts[i]}</div>
              )}
              <div style={{ width: '100%', height: `${h}%`, background: isViewer ? DSC.accent : (isHover ? dshex(DSC.ink, 0.55) : dshex(DSC.ink, 0.30)), borderRadius: '4px 4px 0 0', transition: 'background 120ms ease, height 200ms cubic-bezier(0,0,0.2,1)' }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
        {years.map(y => (
          <div key={y} style={{ flex: 1, textAlign: 'center', fontFamily: DSF.mono, fontSize: 10, fontWeight: y === viewerYear ? 700 : 500, color: y === viewerYear ? DSC.accent : DSC.muted, letterSpacing: '0.04em' }}>'{y}</div>
        ))}
      </div>
    </div>
  );
}

function CareerTimeline() {
  const entries = [
    { year: '2022 — now',  role: 'Product Lead',    co: 'Common Capital', note: 'Climate fintech vertical', current: true },
    { year: '2019 — 2022', role: 'Senior PM',       co: 'Watershed',      note: 'Founding product team' },
    { year: '2016 — 2019', role: 'Product Manager', co: 'Slack',          note: 'Onboarding & growth' },
    { year: '2014 — 2016', role: 'Associate PM',    co: 'Asana',          note: 'First role out of school' },
  ];
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 18, padding: '24px 26px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
      <DSEyebrow accent>Career · Maren Holt</DSEyebrow>
      <div style={{ marginTop: 18, position: 'relative' }}>
        {/* Vertical line — gradient */}
        <div style={{ position: 'absolute', left: 73, top: 4, bottom: 4, width: 2, background: `linear-gradient(to bottom, ${DSC.accent} 0%, ${dshex(DSC.muted, 0.3)} 100%)` }} />
        {entries.map((e, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 28px 1fr', gap: 0, alignItems: 'flex-start', paddingBottom: i === entries.length - 1 ? 0 : 18 }}>
            <div style={{ fontFamily: DSF.mono, fontSize: 9.5, fontWeight: 600, color: DSC.mute2, letterSpacing: '0.04em', textTransform: 'uppercase', textAlign: 'right', paddingRight: 8, paddingTop: 3, lineHeight: 1.35 }}>{e.year}</div>
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 4 }}>
              {e.current
                ? <span style={{ width: 14, height: 14, borderRadius: 999, background: DSC.accent, border: `3px solid ${DSC.card}`, boxShadow: `0 0 0 1px ${DSC.accent}, 0 0 0 5px ${dshex(DSC.accent, 0.18)}` }} />
                : <span style={{ width: 12, height: 12, borderRadius: 999, background: DSC.card, border: `2px solid ${dshex(DSC.muted, 0.6)}` }} />}
            </div>
            <div style={{ paddingLeft: 6 }}>
              <div style={{ fontFamily: DSF.display, fontSize: 14, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 8 }}>
                {e.role}
                {e.current && <DSTag tone="accent" dot>Now</DSTag>}
              </div>
              <div style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.ink2, marginTop: 2, fontWeight: 500 }}>{e.co}</div>
              <div style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted, marginTop: 4, lineHeight: 1.5 }}>{e.note}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityHeatmap() {
  // 12 weeks × 7 days. Seeded pseudo-random activity 0..4.
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const grid = React.useMemo(() => {
    return Array.from({ length: 7 }, (_, d) =>
      Array.from({ length: 14 }, (_, w) => {
        const r = Math.abs(Math.sin((w + 1) * 7 + (d + 1) * 13)) * 5;
        if (d === 5 || d === 6) return Math.floor(r * 0.4); // lower weekends
        return Math.floor(Math.min(4, r));
      })
    );
  }, []);
  const colors = [
    dshex(DSC.ink, 0.06),
    dshex(DSC.accent, 0.25),
    dshex(DSC.accent, 0.50),
    dshex(DSC.accent, 0.78),
    DSC.accent,
  ];

  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 18, padding: '24px 28px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
        <div>
          <DSEyebrow>Your activity · last 14 weeks</DSEyebrow>
          <div style={{ fontFamily: DSF.display, fontSize: 22, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.02em', marginTop: 6 }}>
            <span style={{ color: DSC.accent }}>42 touch points</span> <span style={{ color: DSC.muted, fontWeight: 500 }}>· replies, RSVPs, intros sent</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: DSF.mono, fontSize: 10, letterSpacing: '0.06em', color: DSC.muted, textTransform: 'uppercase' }}>
          Less
          {colors.map((c, i) => <span key={i} style={{ width: 12, height: 12, background: c, borderRadius: 3 }} />)}
          More
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingTop: 2, paddingBottom: 2 }}>
          {days.map((d, i) => (
            <div key={i} style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, height: 16, display: 'flex', alignItems: 'center' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 4 }}>
          {Array.from({ length: 14 }).map((_, w) => (
            <div key={w} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {grid.map((row, d) => (
                <div key={`${w}-${d}`} title={`${row[w]} touch points`} style={{ height: 16, background: colors[row[w]], borderRadius: 3, transition: 'transform 120ms ease', cursor: 'default' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SECTION 15 — CONVERSATION & STATUS ────────────────────────────────────

function ConversationSection() {
  return (
    <DSSection id="conversation" eyebrow="Components · 15" title="Conversation & Status">

      <DSSub title="Chat bubbles — paired with reactions">
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, alignItems: 'start' }}>
          <ChatThread />
          <ReactionShowcase />
        </div>
      </DSSub>

      <DSSub title="Inline status setter — what are you up to?">
        <StatusSetter />
      </DSSub>

    </DSSection>
  );
}

function ChatThread() {
  const msgs = [
    { from: 'them', text: "Hey Maren — heard you'd be at Spring Supper. Saving you the seat next to Iris, yes?", time: '10:42' },
    { from: 'me',   text: "Yes please. Also: did you read Iris's piece on climate underwriting?", time: '10:48' },
    { from: 'them', text: "Just sent it to the whole partner list. I think she'd love a coffee with you before the supper.", time: '10:51' },
    { from: 'me',   text: "Game on. Set it up?", time: '10:52', reactions: ['wave', 'mutual'] },
  ];
  const them = { name: 'Sam Aldridge', initials: 'SA' };
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 18, padding: '20px 22px 22px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottom: `1px solid ${DSC.ruleSoft}` }}>
        <DSAvatar name={them.name} initials={them.initials} size={40} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: DSF.display, fontSize: 15, fontWeight: 600, color: DSC.ink }}>{them.name}</div>
          <div style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted, marginTop: 2 }}>Class of '11 · Active thread</div>
        </div>
        <DSTag tone="ok" dot>Active</DSTag>
      </div>

      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {msgs.map((m, i) => {
          const me = m.from === 'me';
          return (
            <div key={i} style={{ display: 'flex', justifyContent: me ? 'flex-end' : 'flex-start', gap: 8, alignItems: 'flex-end' }}>
              {!me && <DSAvatar name={them.name} initials={them.initials} size={24} />}
              <div style={{ maxWidth: '78%', position: 'relative' }}>
                <div style={{
                  background: me ? DSC.accent : dshex(DSC.ink, 0.05),
                  color: me ? '#fff' : DSC.ink2,
                  padding: '10px 14px',
                  borderRadius: me ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  fontFamily: DSF.body, fontSize: 13.5, lineHeight: 1.45,
                  boxShadow: me ? '0 1px 0 rgba(255,255,255,.18) inset' : 'none',
                  border: me ? 'none' : `1px solid ${DSC.ruleSoft}`,
                }}>
                  {m.text}
                </div>
                <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.mute2, marginTop: 4, textAlign: me ? 'right' : 'left', letterSpacing: '0.04em' }}>{m.time}</div>
                {m.reactions && (
                  <div style={{ marginTop: 6, display: 'flex', gap: 6, justifyContent: me ? 'flex-end' : 'flex-start' }}>
                    {m.reactions.map(r => <ReactionPill key={r} kind={r} mini />)}
                  </div>
                )}
              </div>
              {me && <DSAvatar name="You" initials="MH" size={24} />}
            </div>
          );
        })}
      </div>

      {/* Compose */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18, paddingTop: 14, borderTop: `1px solid ${DSC.ruleSoft}` }}>
        <input placeholder="Write a reply…" style={{ flex: 1, border: `1px solid ${DSC.rule}`, padding: '9px 14px', fontFamily: DSF.body, fontSize: 13, background: DSC.cardAlt, borderRadius: 999, color: DSC.ink, outline: 'none' }} />
        <DSButton size="sm">Send →</DSButton>
      </div>
    </div>
  );
}

function ReactionShowcase() {
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 18, padding: '20px 22px 22px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
      <DSEyebrow>Warm reactions — no emoji, just intent</DSEyebrow>
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[
          { kind: 'wave',    label: 'Wave back',  desc: 'Acknowledge without writing yet.' },
          { kind: 'read',    label: 'Mark read',  desc: 'No reply expected — read receipt.' },
          { kind: 'mutual',  label: 'Mutual',     desc: 'You\'re aligned. Move forward.' },
          { kind: 'thanks',  label: 'Appreciate', desc: 'Thanks the sender quietly.' },
          { kind: 'later',   label: 'Bookmark',   desc: 'Reply later — pin to your desk.' },
        ].map(r => (
          <div key={r.kind} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ReactionPill kind={r.kind} label={r.label} />
            <span style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.muted, lineHeight: 1.4, flex: 1 }}>{r.desc}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 18, padding: '12px 14px', background: DSC.cardAlt, borderRadius: 12, fontFamily: DSF.body, fontSize: 12, color: DSC.muted, lineHeight: 1.5 }}>
        Reactions don't ping. They settle next to a message and persist; the recipient sees them on next visit.
      </div>
    </div>
  );
}

function ReactionPill({ kind, label, mini }) {
  const icons = {
    wave:   <svg width={mini ? 11 : 13} height={mini ? 11 : 13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12V7a2 2 0 1 1 4 0v4M9 11V5a2 2 0 1 1 4 0v6M13 12V6a2 2 0 1 1 4 0v8M17 12V9a2 2 0 1 1 4 0v6a7 7 0 0 1-14 0" /></svg>,
    read:   <svg width={mini ? 11 : 13} height={mini ? 11 : 13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></svg>,
    mutual: <svg width={mini ? 11 : 13} height={mini ? 11 : 13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 11l3-3 5 5 4-4" /><path d="M14 8h5v5" /></svg>,
    thanks: <svg width={mini ? 11 : 13} height={mini ? 11 : 13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.5l8.8-9.1a5.5 5.5 0 0 0 0-7.8z" /></svg>,
    later:  <svg width={mini ? 11 : 13} height={mini ? 11 : 13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" /></svg>,
  };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: mini ? 4 : 6, padding: mini ? '3px 8px' : '5px 10px', borderRadius: 999, background: dshex(DSC.accent, 0.10), border: `1px solid ${dshex(DSC.accent, 0.24)}`, color: DSC.accent, fontFamily: DSF.body, fontSize: mini ? 10.5 : 11.5, fontWeight: 600, letterSpacing: 0.1 }}>
      {icons[kind]}
      {label || null}
    </span>
  );
}

function StatusSetter() {
  const [status, setStatus] = React.useState(null);
  const [draft, setDraft] = React.useState('');
  const presets = [
    'Open to coffee in Brooklyn',
    'Heads down on a launch',
    'Looking to advise climate founders',
    'Hiring on my product team',
    'Quiet until next week',
  ];
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 18, padding: '22px 24px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <DSAvatar name="Maren Holt" initials="MH" size={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: DSF.display, fontSize: 16, fontWeight: 600, color: DSC.ink }}>Maren Holt</div>
          <div style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.muted, marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {status ? (
              <>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: DSC.accent, display: 'inline-block' }} />
                <span style={{ color: DSC.ink2, fontWeight: 500 }}>{status}</span>
                <button onClick={() => setStatus(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: DSC.muted, fontSize: 14, padding: 0, marginLeft: 4 }}>×</button>
              </>
            ) : 'No status'}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <DSEyebrow>Set a status</DSEyebrow>
        <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {presets.map(p => {
            const active = status === p;
            return (
              <button key={p} onClick={() => setStatus(active ? null : p)} style={{ fontFamily: DSF.body, fontSize: 12.5, fontWeight: 600, color: active ? '#fff' : DSC.ink, background: active ? DSC.accent : DSC.cardAlt, border: `1px solid ${active ? DSC.accent : DSC.rule}`, padding: '6px 12px', borderRadius: 999, cursor: 'pointer', transition: 'all 120ms ease' }}>
                {p}
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
          <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && draft.trim()) { setStatus(draft); setDraft(''); } }} placeholder="…or write your own (Enter to set)" style={{ flex: 1, border: `1px solid ${DSC.rule}`, padding: '9px 16px', fontFamily: DSF.body, fontSize: 13, background: DSC.cardAlt, borderRadius: 999, color: DSC.ink, outline: 'none', boxSizing: 'border-box' }} />
          <DSButton size="sm" disabled={!draft.trim()} onClick={() => { if (draft.trim()) { setStatus(draft); setDraft(''); } }}>Set</DSButton>
        </div>
      </div>

      <p style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.muted, lineHeight: 1.55, marginTop: 16 }}>
        Status auto-expires after 14 days. Surfaces alongside your name in the directory and member cards — a gentle signal of what you're open to right now.
      </p>
    </div>
  );
}

// ─── SECTION 16 — EMPTY STATES ─────────────────────────────────────────────

function EmptySection() {
  return (
    <DSSection id="empties" eyebrow="Components · 16" title="Empty States">

      <DSSub title="Inbox zero · No results · Profile incomplete">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          <EmptyInboxZero />
          <EmptyNoResults />
          <EmptyProfile />
        </div>
      </DSSub>

      <p style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.muted, lineHeight: 1.6, marginTop: 16, maxWidth: 640 }}>
        Empty states use the BridgeCircle <em>two-circles</em> motif as their primary graphic — never illustrations of people or scenes. The motif scales (60–200px), shifts in opacity, and accepts the accent color, so it stays on-brand across every empty state.
      </p>
    </DSSection>
  );
}

function CircleMotif({ size = 120, opacity = 0.85 }) {
  return (
    <svg width={size} height={size * 0.65} viewBox="0 0 200 130" aria-hidden="true">
      <circle cx="75"  cy="65" r="55" fill="none" stroke={DSC.accent} strokeOpacity={opacity} strokeWidth="1.8" />
      <circle cx="125" cy="65" r="55" fill="none" stroke={DSC.ok}     strokeOpacity={opacity} strokeWidth="1.8" />
    </svg>
  );
}

function EmptyInboxZero() {
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 18, padding: '32px 26px 26px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minHeight: 320 }}>
      <CircleMotif size={140} opacity={0.6} />
      <div style={{ fontFamily: DSF.display, fontSize: 20, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.02em', marginTop: 14 }}>All caught up.</div>
      <p style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.muted, marginTop: 8, lineHeight: 1.55, maxWidth: 240 }}>
        Your inbox is clear. A great time to send someone new an intro, or browse who joined this week.
      </p>
      <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 18 }}>
        <DSButton size="sm">Browse the network</DSButton>
        <DSButton size="sm" variant="outline">See who's new</DSButton>
      </div>
    </div>
  );
}

function EmptyNoResults() {
  const suggestions = ['climate founders', 'engineers in Lagos', 'people open to advising'];
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 18, padding: '32px 26px 26px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minHeight: 320, position: 'relative', overflow: 'hidden' }}>
      {/* Decorative offset circles — implying "off-center" */}
      <svg width="140" height="90" viewBox="0 0 200 130" aria-hidden="true">
        <circle cx="75"  cy="65" r="55" fill="none" stroke={DSC.accent} strokeOpacity="0.6" strokeWidth="1.8" />
        <circle cx="155" cy="65" r="55" fill="none" stroke={DSC.ok}     strokeOpacity="0.4" strokeWidth="1.8" strokeDasharray="4 4" />
      </svg>
      <div style={{ fontFamily: DSF.display, fontSize: 19, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.02em', marginTop: 14, lineHeight: 1.2 }}>No matches in your circle for "climate engineers in Lagos."</div>
      <p style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.muted, marginTop: 8, lineHeight: 1.55 }}>Try a broader wording, or browse the full directory.</p>
      <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
        {suggestions.map(s => (
          <span key={s} style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.accent, background: dshex(DSC.accent, 0.10), border: `1px solid ${dshex(DSC.accent, 0.24)}`, padding: '4px 11px', borderRadius: 999, cursor: 'pointer', fontWeight: 500 }}>"{s}"</span>
        ))}
      </div>
      <DSButton size="sm" variant="outline" style={{ marginTop: 'auto' }}>Clear search</DSButton>
    </div>
  );
}

function EmptyProfile() {
  const pct = 64;
  const r = 28, c = 2 * Math.PI * r;
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 18, padding: '32px 26px 26px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minHeight: 320 }}>
      <div style={{ position: 'relative', width: 80, height: 80 }}>
        <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="40" cy="40" r={r} fill="none" stroke={DSC.rule} strokeWidth="6" />
          <circle cx="40" cy="40" r={r} fill="none" stroke={DSC.accent} strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: DSF.display, fontSize: 19, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>{pct}%</div>
      </div>
      <div style={{ fontFamily: DSF.display, fontSize: 19, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.02em', marginTop: 14 }}>Help us match you.</div>
      <p style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.muted, marginTop: 8, lineHeight: 1.55, maxWidth: 240 }}>
        Add your current focus and mentor capacity so the right people surface to you — and you to them.
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0', display: 'flex', flexDirection: 'column', gap: 6, width: '100%', textAlign: 'left' }}>
        {[['Current focus', false], ['Mentor capacity', false], ['Hometown city', true]].map(([k, done], i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: DSF.body, fontSize: 12, color: done ? DSC.muted : DSC.ink2, textDecoration: done ? 'line-through' : 'none' }}>
            <span style={{ width: 14, height: 14, borderRadius: 999, background: done ? DSC.ok : DSC.cardAlt, border: `1.5px solid ${done ? DSC.ok : DSC.rule}`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              {done && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4 4 10-10" /></svg>}
            </span>
            {k}
          </li>
        ))}
      </ul>
      <DSButton size="sm" style={{ marginTop: 'auto' }}>Complete profile</DSButton>
    </div>
  );
}

window.VizSection          = VizSection;
window.ConversationSection = ConversationSection;
window.EmptySection        = EmptySection;
