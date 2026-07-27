// Calendar variations — four ways to make the events section more interesting.

const EVENTS = [
  { id:'e1', title:'NYC Alumni Mixer — Spring 2026',  dateText:'Sat Jun 7 · 6:30 PM',  weekday:'SAT', month:'JUN', day:'07', monthLong:'June',     monthIdx: 5,
    location:'Brooklyn, NY', host:'Office of Alumni Affairs', category:'Networking', going:34, capacity:60,  cover:'#2563eb', daysAway: 12, featured: true,
    blurb:"Drinks, food, and your '19 classmates. Open to all NYC-area alumni — bring a plus-one."
  },
  { id:'e2', title:'Cornell Tech Career Panel',       dateText:'Wed May 28 · 12:00 PM',weekday:'WED', month:'MAY', day:'28', monthLong:'May',      monthIdx: 4,
    location:'Virtual', host:'Career Services',            category:'Career',     going:87, capacity:200, cover:'#3b6e51', daysAway: 1 },
  { id:'e3', title:'Founders Roundtable',             dateText:'Tue Jun 17 · 5:30 PM', weekday:'TUE', month:'JUN', day:'17', monthLong:'June',     monthIdx: 5,
    location:'San Francisco, CA', host:'Cornell Founders Club', category:'Founders', going:18, capacity:30, cover:'#722f37', daysAway: 22 },
  { id:'e4', title:'Class of 2016 Reunion Weekend',   dateText:'Fri Jul 11 · all day', weekday:'FRI', month:'JUL', day:'11', monthLong:'July',     monthIdx: 6,
    location:'Ithaca, NY', host:'Class Council',           category:'Reunion',    going:142, capacity:300, cover:'#a16207', daysAway: 46 },
];

// ─── Shared atoms ────────────────────────────────────────────────────────
function Kicker({ children, style }) {
  return <div className="kicker" style={style}>{children}</div>;
}
function SectionHeader({ kicker, title, action }) {
  return (
    <div style={{
      borderTop: '1px solid #dcdcd6', paddingTop: 20, marginBottom: 16,
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap',
    }}>
      <div>
        <div className="kicker" style={{ marginBottom: 8 }}>{kicker}</div>
        <h2 className="display" style={{ fontSize: 22, fontWeight: 600, color: '#0c0c0b' }}>{title}</h2>
      </div>
      {action}
    </div>
  );
}
function CategoryChips({ active = 'All' }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {['All', 'Networking', 'Career', 'Founders', 'Reunion'].map(label => (
        <button key={label} style={{
          fontSize: 11.5, fontWeight: 500, padding: '5px 12px', borderRadius: 999, border: '1px solid',
          background: active === label ? 'rgba(37,99,235,0.08)' : '#fff',
          color: active === label ? '#2563eb' : '#4d4d4a',
          borderColor: active === label ? 'rgba(37,99,235,0.25)' : '#dcdcd6',
        }}>{label}</button>
      ))}
    </div>
  );
}
function CategoryDot({ category }) {
  const map = { Networking: '#2563eb', Career: '#3b6e51', Founders: '#722f37', Reunion: '#a16207' };
  return <span style={{ width: 7, height: 7, borderRadius: '50%', background: map[category] || '#4d4d4a' }} />;
}
function CapacityBar({ going, capacity, w = 120, urgent = false }) {
  const pct = Math.min(100, Math.round((going / capacity) * 100));
  const color = pct >= 85 ? '#9b2c1f' : pct >= 70 ? '#a16207' : '#3b6e51';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ width: w, height: 4, background: '#ebebe5', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color }} />
      </div>
      <span className="mono" style={{ fontSize: 10, color: urgent ? color : '#4d4d4a', fontWeight: urgent ? 700 : 400 }}>
        {going}/{capacity} {pct >= 85 ? '· almost full' : ''}
      </span>
    </div>
  );
}
function Countdown({ days }) {
  if (days === 0) return <Badge color="#9b2c1f" bg="rgba(155,44,31,0.10)">Today</Badge>;
  if (days === 1) return <Badge color="#a16207" bg="rgba(161,98,7,0.12)">Tomorrow</Badge>;
  if (days <= 7) return <Badge color="#a16207" bg="rgba(161,98,7,0.12)">In {days}d</Badge>;
  if (days <= 30) return <Badge color="#2563eb" bg="rgba(37,99,235,0.08)">In {days}d</Badge>;
  return <Badge color="#4d4d4a" bg="#ebebe5">In {days}d</Badge>;
}
function Badge({ color, bg, children }) {
  return (
    <span className="mono" style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 8px', borderRadius: 4,
      fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase',
      color, background: bg, border: `1px solid ${color}33`,
    }}>{children}</span>
  );
}
function DateBlock({ ev, size = 'md' }) {
  const sizes = {
    sm: { w: 48, monthSize: 9, daySize: 18, pad: '6px 6px' },
    md: { w: 56, monthSize: 10, daySize: 22, pad: '8px 6px' },
    lg: { w: 72, monthSize: 11, daySize: 30, pad: '10px 8px' },
  };
  const s = sizes[size];
  return (
    <div style={{
      width: s.w, padding: s.pad, borderRadius: 8,
      background: '#fafaf9', border: '1px solid #dcdcd6', textAlign: 'center', flexShrink: 0,
    }}>
      <div className="mono" style={{ fontSize: s.monthSize, fontWeight: 700, color: '#2563eb', letterSpacing: 0.6 }}>
        {ev.month}
      </div>
      <div className="display" style={{ fontSize: s.daySize, fontWeight: 600, color: '#0c0c0b', lineHeight: 1, marginTop: 2 }}>
        {ev.day}
      </div>
      <div className="mono" style={{ fontSize: 9, color: '#4d4d4a', letterSpacing: 0.5, marginTop: 3 }}>
        {ev.weekday}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  C1 — Hero featured + list
// ═══════════════════════════════════════════════════════════════════════
function CalendarC1() {
  const featured = EVENTS[0];
  const rest = EVENTS.slice(1);
  return (
    <div style={{ width: '100%', minHeight: '100%', background: '#fafaf9', padding: '36px 40px 48px' }}>
      <SectionHeader
        kicker="Upcoming · 4 events"
        title="On the calendar"
        action={<CategoryChips />}
      />

      {/* Featured hero card */}
      <article style={{
        background: '#fff', border: '1px solid #dcdcd6', borderRadius: 14,
        overflow: 'hidden', marginBottom: 14,
        boxShadow: '0 1px 0 rgba(12,12,11,0.03), 0 14px 30px -18px rgba(37,99,235,0.18)',
        display: 'grid', gridTemplateColumns: '300px 1fr',
      }}>
        {/* Cover area — placeholder gradient with motif */}
        <div style={{
          background: `radial-gradient(circle at 30% 20%, rgba(37,99,235,0.32), transparent 55%),
                       radial-gradient(circle at 75% 80%, rgba(59,110,81,0.22), transparent 50%),
                       #081126`,
          color: '#fafaf9', padding: '24px', position: 'relative',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CategoryDot category={featured.category} />
            <span className="mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: '#93c5fd' }}>
              Featured · {featured.category}
            </span>
          </div>
          {/* Network motif */}
          <svg viewBox="0 0 100 100" style={{ position: 'absolute', right: -20, top: -10, width: 200, opacity: 0.18 }}>
            <g stroke="#93c5fd" strokeWidth="0.6" fill="none">
              <line x1="20" y1="30" x2="60" y2="20" />
              <line x1="60" y1="20" x2="80" y2="60" />
              <line x1="20" y1="30" x2="50" y2="70" />
              <line x1="50" y1="70" x2="80" y2="60" />
              <line x1="50" y1="70" x2="30" y2="90" />
            </g>
            <circle cx="20" cy="30" r="2.5" fill="#93c5fd" />
            <circle cx="60" cy="20" r="2.5" fill="#93c5fd" />
            <circle cx="80" cy="60" r="2.5" fill="#93c5fd" />
            <circle cx="50" cy="70" r="3" fill="#93c5fd" />
            <circle cx="30" cy="90" r="2.5" fill="#93c5fd" />
          </svg>
          <div style={{ position: 'relative' }}>
            <div className="display" style={{ fontSize: 56, fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1 }}>
              {featured.day}
            </div>
            <div className="mono" style={{ fontSize: 11, color: '#93c5fd', letterSpacing: 0.6, marginTop: 6, fontWeight: 700 }}>
              {featured.weekday} · {featured.month} 2026
            </div>
            <div style={{ fontSize: 12, color: 'rgba(250,250,249,0.78)', marginTop: 12 }}>
              {featured.dateText.split(' · ')[1]} · {featured.location}
            </div>
          </div>
        </div>

        {/* Right side: details */}
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Countdown days={featured.daysAway} />
            <span style={{ fontSize: 11.5, color: '#4d4d4a' }}>
              Hosted by <strong style={{ color: '#0c0c0b' }}>{featured.host}</strong>
            </span>
          </div>
          <h3 className="display" style={{ fontSize: 26, fontWeight: 600, lineHeight: 1.2 }}>
            {featured.title}
          </h3>
          <p style={{ fontSize: 13.5, color: '#4d4d4a', lineHeight: 1.55, maxWidth: 540 }}>
            {featured.blurb}
          </p>

          {/* Social proof + capacity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 4 }}>
            <div style={{ display: 'flex' }}>
              {['MR', 'DL', 'JK', 'AW'].map((i, idx) => (
                <span key={i} style={{
                  width: 28, height: 28, borderRadius: '50%', background: '#ebebe5', color: '#4d4d4a',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Inter Tight', sans-serif", fontWeight: 700, fontSize: 10,
                  border: '2px solid #fff', marginLeft: idx === 0 ? 0 : -8,
                }}>{i}</span>
              ))}
              <span style={{
                width: 28, height: 28, borderRadius: '50%', background: '#0c0c0b', color: '#fafaf9',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 9,
                border: '2px solid #fff', marginLeft: -8,
              }}>+30</span>
            </div>
            <div style={{ fontSize: 12, color: '#4d4d4a' }}>
              <strong style={{ color: '#0c0c0b' }}>Maya, David</strong> and 32 others going
            </div>
            <div style={{ flex: 1 }} />
            <CapacityBar going={featured.going} capacity={featured.capacity} w={140} />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button className="btn btn-cta btn-md" style={{ flex: '0 0 auto' }}>RSVP — I'm going</button>
            <button className="btn btn-outline btn-md">Add to calendar</button>
            <button className="btn btn-ghost btn-md">Details →</button>
          </div>
        </div>
      </article>

      {/* Rest as compact list inside single card */}
      <div style={{
        background: '#fff', border: '1px solid #dcdcd6', borderRadius: 12, overflow: 'hidden',
        boxShadow: '0 1px 0 rgba(12,12,11,0.03)',
      }}>
        {rest.map((ev, i) => <CompactEventRow key={ev.id} ev={ev} divider={i > 0} />)}
      </div>
    </div>
  );
}

function CompactEventRow({ ev, divider }) {
  return (
    <div style={{
      padding: '14px 18px', display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 18,
      alignItems: 'center', borderTop: divider ? '1px solid #ebebe5' : 'none', cursor: 'pointer',
    }}>
      <DateBlock ev={ev} size="sm" />
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CategoryDot category={ev.category} />
          <span className="mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: '#4d4d4a' }}>
            {ev.category} · {ev.host}
          </span>
          <Countdown days={ev.daysAway} />
        </div>
        <h3 className="display" style={{ fontSize: 15.5, fontWeight: 600, color: '#0c0c0b', marginTop: 4 }}>
          {ev.title}
        </h3>
        <div style={{ fontSize: 12, color: '#4d4d4a', marginTop: 3 }}>
          {ev.dateText} · {ev.location}
        </div>
      </div>
      <CapacityBar going={ev.going} capacity={ev.capacity} w={100} />
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-cta btn-sm">RSVP</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  C2 — Grouped by month
// ═══════════════════════════════════════════════════════════════════════
function CalendarC2() {
  const groups = {};
  EVENTS.forEach(ev => {
    const k = `${ev.monthLong} 2026`;
    if (!groups[k]) groups[k] = [];
    groups[k].push(ev);
  });

  return (
    <div style={{ width: '100%', minHeight: '100%', background: '#fafaf9', padding: '36px 40px 48px' }}>
      <SectionHeader
        kicker="Upcoming · 4 events · 3 months"
        title="On the calendar"
        action={<CategoryChips />}
      />

      <div style={{
        background: '#fff', border: '1px solid #dcdcd6', borderRadius: 12, overflow: 'hidden',
        boxShadow: '0 1px 0 rgba(12,12,11,0.03)',
      }}>
        {Object.entries(groups).map(([monthKey, evs], gi) => (
          <div key={monthKey}>
            {/* Sticky month header */}
            <div style={{
              padding: '12px 22px', background: '#fafaf9',
              borderTop: gi === 0 ? 'none' : '1px solid #dcdcd6',
              borderBottom: '1px solid #ebebe5',
              display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
              position: 'sticky', top: 0, zIndex: 1,
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span className="display" style={{ fontSize: 17, fontWeight: 600, color: '#0c0c0b' }}>
                  {monthKey.split(' ')[0]}
                </span>
                <span className="mono" style={{ fontSize: 10.5, color: '#4d4d4a', letterSpacing: 0.6 }}>
                  {monthKey.split(' ')[1]} · {evs.length} {evs.length === 1 ? 'event' : 'events'}
                </span>
              </div>
              <span className="mono" style={{ fontSize: 10, color: '#4d4d4a', letterSpacing: 0.6, textTransform: 'uppercase' }}>
                {evs.reduce((s, e) => s + e.going, 0)} alumni going
              </span>
            </div>

            {evs.map((ev, i) => (
              <div key={ev.id} style={{
                padding: '18px 22px', display: 'grid',
                gridTemplateColumns: '80px 1fr auto', gap: 22, alignItems: 'center',
                borderTop: i > 0 ? '1px solid #ebebe5' : 'none',
                cursor: 'pointer',
              }}>
                {/* Big date column */}
                <div style={{ textAlign: 'center' }}>
                  <div className="mono" style={{ fontSize: 10, color: '#2563eb', fontWeight: 700, letterSpacing: 0.6 }}>
                    {ev.weekday}
                  </div>
                  <div className="display" style={{ fontSize: 40, fontWeight: 600, lineHeight: 1, letterSpacing: '-0.03em', color: '#0c0c0b', marginTop: 4 }}>
                    {ev.day}
                  </div>
                  <div className="mono" style={{ fontSize: 9.5, color: '#4d4d4a', letterSpacing: 0.6, marginTop: 4 }}>
                    {ev.dateText.split(' · ')[1] || 'All day'}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <CategoryDot category={ev.category} />
                    <span className="mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: '#4d4d4a' }}>
                      {ev.category}
                    </span>
                    <span style={{ color: '#dcdcd6' }}>·</span>
                    <span style={{ fontSize: 11, color: '#4d4d4a' }}>{ev.host}</span>
                    <Countdown days={ev.daysAway} />
                  </div>
                  <h3 className="display" style={{ fontSize: 17, fontWeight: 600 }}>{ev.title}</h3>
                  <div style={{ fontSize: 12, color: '#4d4d4a', marginTop: 4 }}>{ev.location}</div>
                  <div style={{ marginTop: 8 }}>
                    <CapacityBar going={ev.going} capacity={ev.capacity} w={140} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button className="btn btn-cta btn-sm">RSVP</button>
                  <button className="btn btn-ghost btn-sm">Details</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  C3 — Horizontal timeline
// ═══════════════════════════════════════════════════════════════════════
function CalendarC3() {
  // Map events onto a 70-day timeline starting today (May 27).
  // For mock purposes: e2 at day 1, e1 at day 12, e3 at day 22, e4 at day 46.
  const TIMELINE_DAYS = 60;
  const today = 0;
  const focusedIdx = 0;

  return (
    <div style={{ width: '100%', minHeight: '100%', background: '#fafaf9', padding: '36px 40px 48px' }}>
      <SectionHeader
        kicker="Upcoming · next 60 days"
        title="On the calendar"
        action={<CategoryChips />}
      />

      {/* Timeline card */}
      <div style={{
        background: '#fff', border: '1px solid #dcdcd6', borderRadius: 12,
        padding: '28px 32px 22px', boxShadow: '0 1px 0 rgba(12,12,11,0.03)', marginBottom: 14,
      }}>
        {/* Axis labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          {['MAY', 'JUN', 'JUL'].map(m => (
            <span key={m} className="mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, color: '#4d4d4a' }}>
              {m} 2026
            </span>
          ))}
        </div>

        {/* Axis line + ticks */}
        <div style={{ position: 'relative', height: 80, marginTop: 8 }}>
          {/* Background week ticks */}
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{
              position: 'absolute', top: 28, bottom: 28,
              left: `${(i * 7 / TIMELINE_DAYS) * 100}%`, width: 1, background: '#ebebe5',
            }} />
          ))}

          {/* Main axis */}
          <div style={{
            position: 'absolute', left: 0, right: 0, top: '50%', height: 2,
            background: 'linear-gradient(90deg, #2563eb, #ebebe5)', borderRadius: 1,
          }} />

          {/* Today marker */}
          <div style={{
            position: 'absolute', left: `${(today / TIMELINE_DAYS) * 100}%`, top: 16, bottom: 16,
            width: 2, background: '#9b2c1f',
          }}>
            <div className="mono" style={{
              position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)',
              fontSize: 9, fontWeight: 700, color: '#9b2c1f', letterSpacing: 0.6,
              background: '#fff', padding: '2px 6px', borderRadius: 4,
              border: '1px solid rgba(155,44,31,0.3)', whiteSpace: 'nowrap',
            }}>TODAY · MAY 27</div>
          </div>

          {/* Event nodes */}
          {EVENTS.map((ev, i) => {
            const pos = (ev.daysAway / TIMELINE_DAYS) * 100;
            const isFocused = i === focusedIdx;
            const color = { Networking: '#2563eb', Career: '#3b6e51', Founders: '#722f37', Reunion: '#a16207' }[ev.category];
            return (
              <div key={ev.id} style={{
                position: 'absolute', left: `${pos}%`, top: 'calc(50% - 1px)',
                transform: 'translate(-50%, -50%)',
              }}>
                <div style={{
                  width: isFocused ? 28 : 18, height: isFocused ? 28 : 18,
                  borderRadius: '50%', background: color, border: `3px solid ${isFocused ? '#fff' : '#fff'}`,
                  boxShadow: isFocused
                    ? `0 0 0 3px ${color}33, 0 6px 14px -4px ${color}66`
                    : `0 2px 6px -2px ${color}55`,
                  cursor: 'pointer',
                }} />
                {/* Label below */}
                <div className="mono" style={{
                  position: 'absolute', top: isFocused ? 22 : 16, left: '50%', transform: 'translateX(-50%)',
                  fontSize: 9.5, fontWeight: 700, letterSpacing: 0.5, color,
                  whiteSpace: 'nowrap',
                }}>{ev.month} {ev.day}</div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 14, borderTop: '1px solid #ebebe5' }}>
          {[
            ['Networking', '#2563eb'], ['Career', '#3b6e51'],
            ['Founders', '#722f37'], ['Reunion', '#a16207'],
          ].map(([label, color]) => (
            <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4d4d4a' }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: color }} />
              {label}
            </span>
          ))}
          <div style={{ flex: 1 }} />
          <span className="mono" style={{ fontSize: 10, color: '#4d4d4a', letterSpacing: 0.5 }}>
            ← scroll for past · forward for further out →
          </span>
        </div>
      </div>

      {/* Focused event detail card */}
      <article style={{
        background: '#fff', border: '1px solid #2563eb', borderRadius: 12,
        padding: '20px 24px', boxShadow: '0 1px 0 rgba(12,12,11,0.03), 0 8px 24px -12px rgba(37,99,235,0.18)',
        display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 22, alignItems: 'center',
      }}>
        <DateBlock ev={EVENTS[focusedIdx]} size="lg" />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span className="mono" style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: '#2563eb' }}>
              ▾ Selected on timeline
            </span>
            <Countdown days={EVENTS[focusedIdx].daysAway} />
          </div>
          <h3 className="display" style={{ fontSize: 22, fontWeight: 600 }}>{EVENTS[focusedIdx].title}</h3>
          <div style={{ fontSize: 12.5, color: '#4d4d4a', marginTop: 4 }}>
            {EVENTS[focusedIdx].dateText} · {EVENTS[focusedIdx].location} · Hosted by {EVENTS[focusedIdx].host}
          </div>
          <p style={{ fontSize: 13, color: '#0c0c0b', lineHeight: 1.55, marginTop: 8, maxWidth: 580 }}>
            {EVENTS[focusedIdx].blurb}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          <CapacityBar going={EVENTS[focusedIdx].going} capacity={EVENTS[focusedIdx].capacity} w={140} />
          <button className="btn btn-cta btn-md">RSVP</button>
          <button className="btn btn-ghost btn-sm">Details →</button>
        </div>
      </article>

      <div style={{ marginTop: 14, fontSize: 11.5, color: '#4d4d4a', textAlign: 'center' }}>
        Click any node on the timeline to focus that event ↑
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  C4 — Calendar peek (mini-month grid + list)
// ═══════════════════════════════════════════════════════════════════════
function CalendarC4() {
  return (
    <div style={{ width: '100%', minHeight: '100%', background: '#fafaf9', padding: '36px 40px 48px' }}>
      <SectionHeader
        kicker="Upcoming · 4 events"
        title="On the calendar"
        action={<CategoryChips />}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 18 }}>
        {/* Event list (single card) */}
        <div style={{
          background: '#fff', border: '1px solid #dcdcd6', borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 1px 0 rgba(12,12,11,0.03)',
        }}>
          {EVENTS.map((ev, i) => <CompactEventRow key={ev.id} ev={ev} divider={i > 0} />)}
        </div>

        {/* Calendar widget */}
        <div style={{
          background: '#fff', border: '1px solid #dcdcd6', borderRadius: 12,
          padding: 16, boxShadow: '0 1px 0 rgba(12,12,11,0.03)', height: 'fit-content',
          position: 'sticky', top: 24,
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <button className="btn btn-ghost btn-sm" style={{ height: 28, padding: '0 8px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div className="display" style={{ fontSize: 15, fontWeight: 600 }}>June 2026</div>
            <button className="btn btn-ghost btn-sm" style={{ height: 28, padding: '0 8px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>

          {/* Day-of-week labels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="mono" style={{ fontSize: 10, color: '#4d4d4a', textAlign: 'center', padding: '4px 0', fontWeight: 700, letterSpacing: 0.4 }}>{d}</div>
            ))}
          </div>

          {/* Day cells (June 2026 starts on a Monday) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {/* Leading empty (Sunday is start; Jun 1 2026 was Monday → 1 empty) */}
            <DayCell empty />
            {Array.from({ length: 30 }, (_, i) => i + 1).map(d => {
              const hasEvent = [7, 17].includes(d);
              const category = d === 7 ? 'Networking' : d === 17 ? 'Founders' : null;
              return <DayCell key={d} day={d} hasEvent={hasEvent} category={category} />;
            })}
          </div>

          {/* Mini legend */}
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #ebebe5' }}>
            <div className="mono" style={{ fontSize: 9.5, color: '#4d4d4a', letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
              This month · 2 events
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <MiniLegendRow day={7} title="NYC Alumni Mixer" category="Networking" />
              <MiniLegendRow day={17} title="Founders Roundtable" category="Founders" />
            </div>
            <button className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: 12 }}>
              Show all 4 events
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DayCell({ day, empty, hasEvent, category }) {
  if (empty) return <div style={{ aspectRatio: '1', minHeight: 32 }} />;
  const color = category ? { Networking: '#2563eb', Career: '#3b6e51', Founders: '#722f37', Reunion: '#a16207' }[category] : null;
  return (
    <button style={{
      aspectRatio: '1', minHeight: 32, border: 'none', borderRadius: 6, background: hasEvent ? '#fafaf9' : 'transparent',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
      fontFamily: "'Inter Tight', sans-serif", fontSize: 12, fontWeight: hasEvent ? 600 : 400,
      color: '#0c0c0b', cursor: 'pointer', transition: 'background 150ms',
    }}>
      {day}
      {hasEvent && <span style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />}
    </button>
  );
}

function MiniLegendRow({ day, title, category }) {
  const color = { Networking: '#2563eb', Career: '#3b6e51', Founders: '#722f37', Reunion: '#a16207' }[category];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5 }}>
      <span className="mono" style={{ width: 18, fontWeight: 700, color: '#0c0c0b' }}>{day}</span>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ color: '#0c0c0b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
    </div>
  );
}

Object.assign(window, { CalendarC1, CalendarC2, CalendarC3, CalendarC4 });
