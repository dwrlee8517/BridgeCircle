// More calendar variations — master-detail, kanban, spotlight, year heatmap.

// ═══════════════════════════════════════════════════════════════════════
//  C5 — Master-detail (list left, detail right)
// ═══════════════════════════════════════════════════════════════════════
function CalendarC5() {
  const [selectedIdx, setSelectedIdx] = React.useState(0);
  const ev = EVENTS[selectedIdx];

  return (
    <div style={{ width: '100%', minHeight: '100%', background: '#fafaf9', padding: '36px 40px 48px' }}>
      <SectionHeader
        kicker="Upcoming · 4 events"
        title="On the calendar"
        action={<CategoryChips />}
      />

      <div style={{
        display: 'grid', gridTemplateColumns: '380px 1fr', gap: 0,
        background: '#fff', border: '1px solid #dcdcd6', borderRadius: 12, overflow: 'hidden',
        boxShadow: '0 1px 0 rgba(12,12,11,0.03)',
      }}>
        {/* ── List column ──────────────────────────────────────── */}
        <div style={{ borderRight: '1px solid #ebebe5', background: '#fafaf9' }}>
          <div style={{
            padding: '12px 18px', borderBottom: '1px solid #ebebe5',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span className="mono" style={{ fontSize: 10, color: '#4d4d4a', letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 700 }}>
              4 upcoming
            </span>
            <button className="btn btn-ghost btn-sm" style={{ height: 24, padding: '0 8px', fontSize: 11 }}>
              Sort ▾
            </button>
          </div>
          {EVENTS.map((e, i) => {
            const sel = i === selectedIdx;
            return (
              <button key={e.id}
                onClick={() => setSelectedIdx(i)}
                style={{
                  width: '100%', border: 'none', textAlign: 'left',
                  padding: '14px 18px 14px 15px',
                  background: sel ? '#fff' : 'transparent',
                  borderLeft: sel ? '3px solid #2563eb' : '3px solid transparent',
                  borderBottom: i < EVENTS.length - 1 ? '1px solid #ebebe5' : 'none',
                  display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 14, alignItems: 'center',
                  cursor: 'pointer', transition: 'background 150ms',
                }}>
                <DateBlock ev={e} size="sm" />
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <CategoryDot category={e.category} />
                    <span className="mono" style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: '#4d4d4a' }}>
                      {e.category}
                    </span>
                    <Countdown days={e.daysAway} />
                  </div>
                  <div className="display" style={{
                    fontSize: 13.5, fontWeight: sel ? 600 : 500, color: '#0c0c0b',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{e.title}</div>
                  <div style={{ fontSize: 11, color: '#4d4d4a', marginTop: 2 }}>
                    {e.dateText.split(' · ')[1] || ''} · {e.location.split(',')[0]}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Detail column ────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Cover band */}
          <div style={{
            background: `radial-gradient(circle at 20% 30%, ${ev.cover}55, transparent 55%),
                         radial-gradient(circle at 75% 75%, rgba(59,110,81,0.25), transparent 50%),
                         #081126`,
            color: '#fafaf9', padding: '28px 32px', position: 'relative', overflow: 'hidden',
          }}>
            <svg viewBox="0 0 200 80" style={{ position: 'absolute', right: -10, top: -10, width: 240, opacity: 0.18 }}>
              <g stroke="#93c5fd" strokeWidth="0.7" fill="none">
                <line x1="20" y1="20" x2="80" y2="40" /><line x1="80" y1="40" x2="160" y2="20" />
                <line x1="80" y1="40" x2="100" y2="70" /><line x1="160" y1="20" x2="180" y2="50" />
              </g>
              <circle cx="20" cy="20" r="3" fill="#93c5fd" /><circle cx="80" cy="40" r="3.5" fill="#93c5fd" />
              <circle cx="160" cy="20" r="3" fill="#93c5fd" /><circle cx="100" cy="70" r="3" fill="#93c5fd" />
              <circle cx="180" cy="50" r="3" fill="#93c5fd" />
            </svg>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <CategoryDot category={ev.category} />
                  <span className="mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: '#93c5fd' }}>
                    {ev.category} · {ev.host}
                  </span>
                  <Countdown days={ev.daysAway} />
                </div>
                <h3 className="display" style={{ fontSize: 26, fontWeight: 600, lineHeight: 1.2, color: '#fafaf9' }}>
                  {ev.title}
                </h3>
                <div style={{ fontSize: 13, color: 'rgba(250,250,249,0.78)', marginTop: 8 }}>
                  {ev.dateText} · {ev.location}
                </div>
              </div>
              <div style={{
                textAlign: 'center', padding: '12px 16px', borderRadius: 10,
                background: 'rgba(250,250,249,0.08)', border: '1px solid rgba(250,250,249,0.16)',
              }}>
                <div className="mono" style={{ fontSize: 10, color: '#93c5fd', fontWeight: 700, letterSpacing: 0.6 }}>
                  {ev.month}
                </div>
                <div className="display" style={{ fontSize: 32, fontWeight: 600, lineHeight: 1, marginTop: 2 }}>
                  {ev.day}
                </div>
                <div className="mono" style={{ fontSize: 9.5, color: 'rgba(250,250,249,0.65)', letterSpacing: 0.5, marginTop: 3 }}>
                  {ev.weekday}
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
            <p style={{ fontSize: 14, color: '#0c0c0b', lineHeight: 1.6, maxWidth: 580 }}>
              {ev.blurb || 'Open to all alumni — bring a plus-one. RSVP closes 48 hours before.'}
            </p>

            {/* Quick facts grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0,
              background: '#fafaf9', border: '1px solid #ebebe5', borderRadius: 10, overflow: 'hidden',
            }}>
              <FactCell label="When"  value={ev.dateText.split(' · ')[1] || 'All day'} sub={`${ev.weekday} · ${ev.month} ${ev.day}`} />
              <FactCell label="Where" value={ev.location.split(',')[0]} sub={ev.location.split(',').slice(1).join(',').trim() || 'In person'} />
              <FactCell label="Host"  value={ev.host} sub="View past events" />
            </div>

            {/* Social proof + capacity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{ display: 'flex' }}>
                {['MR', 'DL', 'JK', 'AW', 'SC'].map((i, idx) => (
                  <span key={i} style={{
                    width: 30, height: 30, borderRadius: '50%', background: '#ebebe5', color: '#4d4d4a',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Inter Tight', sans-serif", fontWeight: 700, fontSize: 10.5,
                    border: '2px solid #fff', marginLeft: idx === 0 ? 0 : -10,
                  }}>{i}</span>
                ))}
              </div>
              <div style={{ fontSize: 12.5, color: '#4d4d4a' }}>
                <strong style={{ color: '#0c0c0b' }}>Maya, David</strong> and {ev.going - 2} others going
              </div>
              <div style={{ flex: 1 }} />
              <CapacityBar going={ev.going} capacity={ev.capacity} w={140} />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8, borderTop: '1px solid #ebebe5' }}>
              <button className="btn btn-cta btn-md" style={{ flex: '0 0 auto' }}>RSVP — I'm going</button>
              <button className="btn btn-outline btn-md">Add to calendar</button>
              <button className="btn btn-ghost btn-md">Invite a friend</button>
              <div style={{ flex: 1 }} />
              <button className="btn btn-ghost btn-md">Full details →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FactCell({ label, value, sub }) {
  return (
    <div style={{ padding: '12px 14px', borderRight: '1px solid #ebebe5' }}>
      <div className="mono" style={{ fontSize: 9.5, color: '#4d4d4a', letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 700 }}>{label}</div>
      <div className="display" style={{ fontSize: 14, fontWeight: 600, color: '#0c0c0b', marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#4d4d4a', marginTop: 1 }}>{sub}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  C6 — Kanban by urgency
// ═══════════════════════════════════════════════════════════════════════
function CalendarC6() {
  // Group events into urgency buckets based on daysAway.
  const buckets = [
    { label: 'This week',   sub: 'Next 7 days',  filter: e => e.daysAway <= 7,                       accent: '#9b2c1f', tint: 'rgba(155,44,31,0.10)' },
    { label: 'This month',  sub: '8–30 days',    filter: e => e.daysAway > 7  && e.daysAway <= 30,   accent: '#a16207', tint: 'rgba(161,98,7,0.12)' },
    { label: 'Next month',  sub: '31–60 days',   filter: e => e.daysAway > 30 && e.daysAway <= 60,   accent: '#2563eb', tint: 'rgba(37,99,235,0.08)' },
    { label: 'Later',       sub: '61+ days',     filter: e => e.daysAway > 60,                       accent: '#4d4d4a', tint: '#f4f3ee' },
  ];

  return (
    <div style={{ width: '100%', minHeight: '100%', background: '#fafaf9', padding: '36px 40px 48px' }}>
      <SectionHeader
        kicker="Upcoming · 4 events"
        title="On the calendar"
        action={<CategoryChips />}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {buckets.map(b => {
          const items = EVENTS.filter(b.filter);
          return (
            <div key={b.label} style={{
              background: '#fff', border: '1px solid #dcdcd6', borderRadius: 12, overflow: 'hidden',
              boxShadow: '0 1px 0 rgba(12,12,11,0.03)',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{
                padding: '12px 14px', borderBottom: `2px solid ${b.accent}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: b.tint,
              }}>
                <div>
                  <div className="display" style={{ fontSize: 14, fontWeight: 600, color: '#0c0c0b' }}>
                    {b.label}
                  </div>
                  <div className="mono" style={{ fontSize: 9.5, color: '#4d4d4a', letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 2 }}>
                    {b.sub}
                  </div>
                </div>
                <span style={{
                  width: 24, height: 24, borderRadius: '50%', background: b.accent, color: '#fff',
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {items.length}
                </span>
              </div>
              <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                {items.length > 0
                  ? items.map(e => <KanbanCard key={e.id} ev={e} accent={b.accent} />)
                  : <div style={{
                      flex: 1, minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#dcdcd6', fontSize: 12, fontStyle: 'italic',
                    }}>Nothing scheduled</div>
                }
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div style={{
        marginTop: 14, padding: '10px 14px', background: '#fff', border: '1px dashed #dcdcd6', borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 11.5, color: '#4d4d4a',
      }}>
        <span>Drag cards between columns to reschedule — or click any card to see details.</span>
        <button className="btn btn-ghost btn-sm" style={{ height: 26, padding: '0 10px', fontSize: 11 }}>
          + Suggest an event
        </button>
      </div>
    </div>
  );
}

function KanbanCard({ ev, accent }) {
  return (
    <div style={{
      background: '#fafaf9', border: '1px solid #ebebe5', borderRadius: 8,
      padding: 12, display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer',
      borderTop: `2px solid ${accent}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="display" style={{ fontSize: 22, fontWeight: 600, lineHeight: 1, color: '#0c0c0b', letterSpacing: '-0.02em' }}>
          {ev.day}
        </div>
        <div>
          <div className="mono" style={{ fontSize: 9, fontWeight: 700, color: accent, letterSpacing: 0.5 }}>
            {ev.weekday} · {ev.month}
          </div>
          <div style={{ fontSize: 10, color: '#4d4d4a', marginTop: 1 }}>
            {ev.dateText.split(' · ')[1] || ''}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <CategoryDot category={ev.category} />
      </div>
      <div className="display" style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.25, color: '#0c0c0b' }}>
        {ev.title}
      </div>
      <div style={{ fontSize: 10.5, color: '#4d4d4a' }}>{ev.location.split(',')[0]}</div>
      <CapacityBar going={ev.going} capacity={ev.capacity} w={120} />
      <button className="btn btn-cta btn-sm" style={{ width: '100%', height: 28, fontSize: 11 }}>
        RSVP
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  C7 — Spotlight carousel
// ═══════════════════════════════════════════════════════════════════════
function CalendarC7() {
  const [activeIdx, setActiveIdx] = React.useState(0);
  const ev = EVENTS[activeIdx];

  return (
    <div style={{ width: '100%', minHeight: '100%', background: '#fafaf9', padding: '36px 40px 48px' }}>
      <SectionHeader
        kicker="Upcoming · 4 events"
        title="On the calendar"
        action={<CategoryChips />}
      />

      {/* Spotlight card */}
      <article style={{
        background: '#fff', border: '1px solid #dcdcd6', borderRadius: 14,
        overflow: 'hidden', marginBottom: 14, position: 'relative',
        boxShadow: '0 1px 0 rgba(12,12,11,0.03), 0 18px 36px -20px rgba(12,12,11,0.16)',
      }}>
        {/* Cover with day badge */}
        <div style={{
          background: `linear-gradient(135deg, ${ev.cover}, ${ev.cover}cc 50%, #081126 100%)`,
          color: '#fafaf9', padding: '40px 48px', position: 'relative', overflow: 'hidden',
          display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'center',
        }}>
          {/* Decorative network motif */}
          <svg viewBox="0 0 300 100" style={{ position: 'absolute', right: 0, top: 0, width: 360, height: 120, opacity: 0.2 }}>
            <g stroke="rgba(250,250,249,0.5)" strokeWidth="0.7" fill="none">
              <line x1="40" y1="30" x2="120" y2="20" /><line x1="120" y1="20" x2="180" y2="60" />
              <line x1="180" y1="60" x2="260" y2="40" /><line x1="120" y1="20" x2="80" y2="80" />
              <line x1="180" y1="60" x2="80" y2="80" />
            </g>
            <circle cx="40" cy="30" r="3" fill="rgba(250,250,249,0.6)" />
            <circle cx="120" cy="20" r="3.5" fill="rgba(250,250,249,0.7)" />
            <circle cx="180" cy="60" r="4" fill="rgba(250,250,249,0.8)" />
            <circle cx="260" cy="40" r="3" fill="rgba(250,250,249,0.6)" />
            <circle cx="80" cy="80" r="3" fill="rgba(250,250,249,0.5)" />
          </svg>

          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span className="mono" style={{
                fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase',
                color: '#fafaf9', padding: '3px 9px', borderRadius: 4,
                background: 'rgba(250,250,249,0.14)', border: '1px solid rgba(250,250,249,0.22)',
              }}>
                ◆ Spotlight · {activeIdx + 1} of {EVENTS.length}
              </span>
              <Countdown days={ev.daysAway} />
              <span className="mono" style={{ fontSize: 10.5, color: 'rgba(250,250,249,0.7)', letterSpacing: 0.5 }}>
                {ev.category} · {ev.host}
              </span>
            </div>
            <h3 className="display" style={{ fontSize: 38, fontWeight: 600, lineHeight: 1.1, letterSpacing: '-0.02em', maxWidth: 640 }}>
              {ev.title}
            </h3>
            <div style={{ fontSize: 14, color: 'rgba(250,250,249,0.85)', marginTop: 10 }}>
              {ev.dateText} · {ev.location}
            </div>
            <p style={{ fontSize: 13, color: 'rgba(250,250,249,0.7)', lineHeight: 1.6, marginTop: 14, maxWidth: 540 }}>
              {ev.blurb || 'Open to all alumni — connect with classmates over drinks and conversation.'}
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
              <button className="btn btn-cta btn-md">RSVP — I'm going</button>
              <button style={{
                background: 'rgba(250,250,249,0.08)', border: '1px solid rgba(250,250,249,0.22)',
                color: '#fafaf9', borderRadius: 8, padding: '0 16px', height: 38, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>Add to calendar</button>
            </div>
          </div>

          {/* Big date stamp */}
          <div style={{
            position: 'relative', textAlign: 'center', padding: '24px 32px',
            background: 'rgba(250,250,249,0.08)', border: '1px solid rgba(250,250,249,0.18)', borderRadius: 14,
          }}>
            <div className="mono" style={{ fontSize: 13, color: 'rgba(250,250,249,0.7)', fontWeight: 700, letterSpacing: 0.8 }}>
              {ev.month}
            </div>
            <div className="display" style={{ fontSize: 84, fontWeight: 600, lineHeight: 0.95, letterSpacing: '-0.06em', marginTop: 4 }}>
              {ev.day}
            </div>
            <div className="mono" style={{ fontSize: 11, color: 'rgba(250,250,249,0.7)', letterSpacing: 0.6, marginTop: 6 }}>
              {ev.weekday} · 2026
            </div>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(250,250,249,0.18)' }}>
              <CapacityBar going={ev.going} capacity={ev.capacity} w={120} />
            </div>
          </div>
        </div>
      </article>

      {/* Controls strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <button className="btn btn-outline btn-sm" style={{ height: 32, width: 32, padding: 0 }}
          onClick={() => setActiveIdx((activeIdx - 1 + EVENTS.length) % EVENTS.length)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {EVENTS.map((_, i) => (
            <button key={i} onClick={() => setActiveIdx(i)} style={{
              width: i === activeIdx ? 22 : 7, height: 7, borderRadius: 4,
              background: i === activeIdx ? '#0c0c0b' : '#dcdcd6', border: 'none',
              padding: 0, cursor: 'pointer', transition: 'all 200ms',
            }} />
          ))}
        </div>
        <button className="btn btn-outline btn-sm" style={{ height: 32, width: 32, padding: 0 }}
          onClick={() => setActiveIdx((activeIdx + 1) % EVENTS.length)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
        </button>
        <div style={{ flex: 1 }} />
        <span className="mono" style={{ fontSize: 10, color: '#4d4d4a', letterSpacing: 0.5, textTransform: 'uppercase' }}>
          ↓ all events
        </span>
      </div>

      {/* Thumbnail strip */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${EVENTS.length}, 1fr)`, gap: 10 }}>
        {EVENTS.map((e, i) => {
          const active = i === activeIdx;
          return (
            <button key={e.id} onClick={() => setActiveIdx(i)} style={{
              background: '#fff', border: `1px solid ${active ? '#0c0c0b' : '#dcdcd6'}`, borderRadius: 10,
              padding: 12, textAlign: 'left', cursor: 'pointer',
              boxShadow: active ? '0 0 0 3px rgba(12,12,11,0.06)' : 'none',
              transition: 'all 150ms', display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <DateBlock ev={e} size="sm" />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <CategoryDot category={e.category} />
                    <span className="mono" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: '#4d4d4a' }}>
                      {e.category}
                    </span>
                  </div>
                  <div className="display" style={{
                    fontSize: 12.5, fontWeight: 600, color: '#0c0c0b', marginTop: 3,
                    lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>{e.title}</div>
                </div>
              </div>
              <CapacityBar going={e.going} capacity={e.capacity} w={null} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  C8 — Year-at-a-glance heatmap
// ═══════════════════════════════════════════════════════════════════════
function CalendarC8() {
  // Mock event counts per month — light pattern with peaks in Jun and Oct.
  const MONTHS = [
    { m: 'JAN', count: 1 }, { m: 'FEB', count: 2 }, { m: 'MAR', count: 3 }, { m: 'APR', count: 1 },
    { m: 'MAY', count: 1, current: true }, { m: 'JUN', count: 4, active: true },
    { m: 'JUL', count: 2 }, { m: 'AUG', count: 1 }, { m: 'SEP', count: 3 }, { m: 'OCT', count: 5 },
    { m: 'NOV', count: 2 }, { m: 'DEC', count: 1 },
  ];

  const intensity = (c) => {
    if (c === 0) return { bg: '#fafaf9', text: '#dcdcd6' };
    if (c <= 1) return { bg: 'rgba(37,99,235,0.10)', text: '#0c0c0b' };
    if (c <= 2) return { bg: 'rgba(37,99,235,0.20)', text: '#0c0c0b' };
    if (c <= 3) return { bg: 'rgba(37,99,235,0.35)', text: '#0c0c0b' };
    if (c <= 4) return { bg: 'rgba(37,99,235,0.55)', text: '#fafaf9' };
    return { bg: 'rgba(37,99,235,0.80)', text: '#fafaf9' };
  };

  return (
    <div style={{ width: '100%', minHeight: '100%', background: '#fafaf9', padding: '36px 40px 48px' }}>
      <SectionHeader
        kicker="Year ahead · 26 events"
        title="On the calendar"
        action={<CategoryChips />}
      />

      {/* Year strip card */}
      <div style={{
        background: '#fff', border: '1px solid #dcdcd6', borderRadius: 12,
        padding: 20, boxShadow: '0 1px 0 rgba(12,12,11,0.03)', marginBottom: 14,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <div>
            <div className="display" style={{ fontSize: 17, fontWeight: 600 }}>2026</div>
            <div className="mono" style={{ fontSize: 10.5, color: '#4d4d4a', letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 2 }}>
              Click a month to focus
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="mono" style={{ fontSize: 10, color: '#4d4d4a', letterSpacing: 0.5, textTransform: 'uppercase' }}>
              Density
            </span>
            <div style={{ display: 'flex', gap: 2 }}>
              {[0, 1, 2, 3, 4, 5].map(c => (
                <span key={c} style={{ width: 12, height: 12, borderRadius: 3, background: intensity(c).bg, border: '1px solid #ebebe5' }} />
              ))}
            </div>
            <span className="mono" style={{ fontSize: 10, color: '#4d4d4a' }}>
              less → more
            </span>
          </div>
        </div>

        {/* 12 cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 6 }}>
          {MONTHS.map(month => {
            const cfg = intensity(month.count);
            return (
              <button key={month.m} style={{
                aspectRatio: '1', minHeight: 72, border: 'none', borderRadius: 8,
                background: cfg.bg, color: cfg.text, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                fontFamily: "'Inter Tight', sans-serif",
                position: 'relative',
                outline: month.active ? '2px solid #0c0c0b' : 'none',
                outlineOffset: 2,
                transition: 'all 150ms',
              }}>
                <span className="mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, opacity: 0.85 }}>
                  {month.m}
                </span>
                <span style={{ fontSize: 20, fontWeight: 600, lineHeight: 1 }}>{month.count}</span>
                <span style={{ fontSize: 9, opacity: 0.75 }}>
                  {month.count === 1 ? 'event' : 'events'}
                </span>
                {month.current && (
                  <span className="mono" style={{
                    position: 'absolute', top: 4, right: 4,
                    fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: '#9b2c1f',
                    padding: '1px 4px', borderRadius: 3, background: '#fff', border: '1px solid rgba(155,44,31,0.3)',
                  }}>NOW</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Focused month detail */}
      <div style={{
        background: '#fff', border: '1px solid #dcdcd6', borderRadius: 12, overflow: 'hidden',
        boxShadow: '0 1px 0 rgba(12,12,11,0.03)',
      }}>
        <div style={{
          padding: '14px 22px', background: 'rgba(37,99,235,0.04)', borderBottom: '1px solid #ebebe5',
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        }}>
          <div>
            <span className="display" style={{ fontSize: 17, fontWeight: 600 }}>June 2026</span>
            <span className="mono" style={{ fontSize: 11, color: '#4d4d4a', marginLeft: 10, letterSpacing: 0.5 }}>
              4 events · 219 alumni going
            </span>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ height: 26, padding: '0 10px', fontSize: 11 }}>
            See all months →
          </button>
        </div>
        {EVENTS.filter(e => e.monthIdx === 5).concat(EVENTS.filter(e => e.monthIdx === 5)).slice(0, 2).map((e, i) =>
          <CompactEventRow key={`${e.id}-${i}`} ev={e} divider={i > 0} />
        )}
        {EVENTS.filter(e => e.monthIdx !== 5).slice(0, 2).map((e, i) =>
          <CompactEventRow key={`${e.id}-r`} ev={e} divider />
        )}
      </div>
    </div>
  );
}

Object.assign(window, { CalendarC5, CalendarC6, CalendarC7, CalendarC8 });

// ═══════════════════════════════════════════════════════════════════════
//  C9 — Master-detail mechanics + spotlight cover band
//  Mashes C5's list/detail split with C7's bold cover treatment.
// ═══════════════════════════════════════════════════════════════════════
function CalendarC9() {
  const [selectedIdx, setSelectedIdx] = React.useState(0);
  const ev = EVENTS[selectedIdx];
  const categoryColor = { Networking: '#2563eb', Career: '#3b6e51', Founders: '#722f37', Reunion: '#a16207' }[ev.category];

  return (
    <div style={{ width: '100%', minHeight: '100%', background: '#fafaf9', padding: '36px 40px 48px' }}>
      <SectionHeader
        kicker="Upcoming · 4 events"
        title="On the calendar"
        action={<CategoryChips />}
      />

      <div style={{
        display: 'grid', gridTemplateColumns: '380px 1fr', gap: 0,
        background: '#fff', border: '1px solid #dcdcd6', borderRadius: 14, overflow: 'hidden',
        boxShadow: '0 1px 0 rgba(12,12,11,0.03), 0 18px 36px -22px rgba(12,12,11,0.14)',
      }}>
        {/* ── List column (from C5) ──────────────────────────── */}
        <div style={{ borderRight: '1px solid #ebebe5', background: '#fafaf9' }}>
          <div style={{
            padding: '12px 18px', borderBottom: '1px solid #ebebe5',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span className="mono" style={{ fontSize: 10, color: '#4d4d4a', letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 700 }}>
              4 upcoming
            </span>
            <button className="btn btn-ghost btn-sm" style={{ height: 24, padding: '0 8px', fontSize: 11 }}>
              Sort ▾
            </button>
          </div>
          {EVENTS.map((e, i) => {
            const sel = i === selectedIdx;
            const eColor = { Networking: '#2563eb', Career: '#3b6e51', Founders: '#722f37', Reunion: '#a16207' }[e.category];
            return (
              <button key={e.id}
                onClick={() => setSelectedIdx(i)}
                style={{
                  width: '100%', border: 'none', textAlign: 'left',
                  padding: '14px 18px 14px 15px',
                  background: sel ? '#fff' : 'transparent',
                  borderLeft: sel ? `3px solid ${eColor}` : '3px solid transparent',
                  borderBottom: i < EVENTS.length - 1 ? '1px solid #ebebe5' : 'none',
                  display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 14, alignItems: 'center',
                  cursor: 'pointer', transition: 'background 150ms',
                }}>
                <DateBlock ev={e} size="sm" />
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <CategoryDot category={e.category} />
                    <span className="mono" style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: '#4d4d4a' }}>
                      {e.category}
                    </span>
                    <Countdown days={e.daysAway} />
                  </div>
                  <div className="display" style={{
                    fontSize: 13.5, fontWeight: sel ? 600 : 500, color: '#0c0c0b',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{e.title}</div>
                  <div style={{ fontSize: 11, color: '#4d4d4a', marginTop: 2 }}>
                    {e.dateText.split(' · ')[1] || ''} · {e.location.split(',')[0]}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Detail column with spotlight cover band ───────── */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Cover band — full C7 treatment */}
          <div style={{
            background: `linear-gradient(135deg, ${categoryColor}, ${categoryColor}cc 50%, #081126 100%)`,
            color: '#fafaf9', padding: '36px 40px', position: 'relative', overflow: 'hidden',
            display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'center',
          }}>
            {/* Decorative network motif */}
            <svg viewBox="0 0 300 100" style={{ position: 'absolute', right: 0, top: 0, width: 360, height: 120, opacity: 0.22, pointerEvents: 'none' }}>
              <g stroke="rgba(250,250,249,0.5)" strokeWidth="0.7" fill="none">
                <line x1="40" y1="30" x2="120" y2="20" /><line x1="120" y1="20" x2="180" y2="60" />
                <line x1="180" y1="60" x2="260" y2="40" /><line x1="120" y1="20" x2="80" y2="80" />
                <line x1="180" y1="60" x2="80" y2="80" />
              </g>
              <circle cx="40" cy="30" r="3" fill="rgba(250,250,249,0.6)" />
              <circle cx="120" cy="20" r="3.5" fill="rgba(250,250,249,0.7)" />
              <circle cx="180" cy="60" r="4" fill="rgba(250,250,249,0.8)" />
              <circle cx="260" cy="40" r="3" fill="rgba(250,250,249,0.6)" />
              <circle cx="80" cy="80" r="3" fill="rgba(250,250,249,0.5)" />
            </svg>

            {/* Left: identity */}
            <div style={{ position: 'relative', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                <span className="mono" style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase',
                  color: '#fafaf9', padding: '3px 9px', borderRadius: 4,
                  background: 'rgba(250,250,249,0.14)', border: '1px solid rgba(250,250,249,0.22)',
                }}>
                  ◆ {ev.category}
                </span>
                <Countdown days={ev.daysAway} />
                <span className="mono" style={{ fontSize: 10.5, color: 'rgba(250,250,249,0.7)', letterSpacing: 0.5 }}>
                  Hosted by {ev.host}
                </span>
              </div>
              <h3 className="display" style={{ fontSize: 32, fontWeight: 600, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                {ev.title}
              </h3>
              <div style={{ fontSize: 13.5, color: 'rgba(250,250,249,0.85)', marginTop: 10 }}>
                {ev.dateText} · {ev.location}
              </div>
            </div>

            {/* Right: huge date stamp */}
            <div style={{
              position: 'relative', textAlign: 'center', padding: '20px 28px',
              background: 'rgba(250,250,249,0.08)', border: '1px solid rgba(250,250,249,0.18)', borderRadius: 14,
              flexShrink: 0,
            }}>
              <div className="mono" style={{ fontSize: 12, color: 'rgba(250,250,249,0.7)', fontWeight: 700, letterSpacing: 0.8 }}>
                {ev.month}
              </div>
              <div className="display" style={{ fontSize: 72, fontWeight: 600, lineHeight: 0.95, letterSpacing: '-0.06em', marginTop: 4 }}>
                {ev.day}
              </div>
              <div className="mono" style={{ fontSize: 10.5, color: 'rgba(250,250,249,0.7)', letterSpacing: 0.6, marginTop: 6 }}>
                {ev.weekday} · 2026
              </div>
            </div>
          </div>

          {/* Body — C5's facts grid + social proof + actions */}
          <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
            <p style={{ fontSize: 14, color: '#0c0c0b', lineHeight: 1.6, maxWidth: 580 }}>
              {ev.blurb || 'Open to all alumni — bring a plus-one. RSVP closes 48 hours before.'}
            </p>

            {/* Quick facts grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0,
              background: '#fafaf9', border: '1px solid #ebebe5', borderRadius: 10, overflow: 'hidden',
            }}>
              <FactCell label="When"  value={ev.dateText.split(' · ')[1] || 'All day'} sub={`${ev.weekday} · ${ev.month} ${ev.day}`} />
              <FactCell label="Where" value={ev.location.split(',')[0]} sub={ev.location.split(',').slice(1).join(',').trim() || 'In person'} />
              <FactCell label="Host"  value={ev.host} sub="View past events" />
            </div>

            {/* Social proof + capacity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{ display: 'flex' }}>
                {['MR', 'DL', 'JK', 'AW', 'SC'].map((i, idx) => (
                  <span key={i} style={{
                    width: 30, height: 30, borderRadius: '50%', background: '#ebebe5', color: '#4d4d4a',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Inter Tight', sans-serif", fontWeight: 700, fontSize: 10.5,
                    border: '2px solid #fff', marginLeft: idx === 0 ? 0 : -10,
                  }}>{i}</span>
                ))}
              </div>
              <div style={{ fontSize: 12.5, color: '#4d4d4a' }}>
                <strong style={{ color: '#0c0c0b' }}>Maya, David</strong> and {ev.going - 2} others going
              </div>
              <div style={{ flex: 1 }} />
              <CapacityBar going={ev.going} capacity={ev.capacity} w={140} />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8, borderTop: '1px solid #ebebe5' }}>
              <button className="btn btn-cta btn-md" style={{ flex: '0 0 auto' }}>RSVP — I'm going</button>
              <button className="btn btn-outline btn-md">Add to calendar</button>
              <button className="btn btn-ghost btn-md">Invite a friend</button>
              <div style={{ flex: 1 }} />
              <button className="btn btn-ghost btn-md">Full details →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.CalendarC9 = CalendarC9;
