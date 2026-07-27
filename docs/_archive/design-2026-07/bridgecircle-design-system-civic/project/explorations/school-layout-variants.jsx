// School layout variations — three ways to solve the right-rail crowding.

// ─── Shared data ────────────────────────────────────────────────────────
const EVENTS = [
  { id:'e1', title:'Cornell Tech Career Panel', dateText:'Wed May 28 · 12:00 PM', timeRange:'12:00 PM — 1:00 PM EDT',
    month:'MAY', day:'28', weekday:'WED', location:'Virtual', venue:'Zoom', host:'Office of Alumni Affairs',
    category:'Career', going:87, capacity:200, daysAway: 1,
    description:"Four alumni from product, design, and engineering at top tech companies share how they navigated early-career decisions, salary negotiation, and team selection. 30 min panel + 30 min Q&A. Recorded.",
    cost:'Free' },
  { id:'e2', title:'NYC Alumni Mixer — Spring 2026', dateText:'Sat Jun 7 · 6:30 PM', timeRange:'6:30 PM — 9:30 PM EDT',
    month:'JUN', day:'07', weekday:'SAT', location:'Brooklyn, NY', venue:'House of Yes', host:'Class Council',
    category:'Networking', going:34, capacity:60, daysAway: 11,
    description:"A casual evening to reconnect with classmates and meet alumni from adjacent years. Light bites and drinks provided. Bring a friend or come solo — we'll make introductions.",
    cost:'$15 / member' },
  { id:'e3', title:'Founders Coffee — Bay Area', dateText:'Sun Jun 15 · 10:00 AM', timeRange:'10:00 AM — 12:00 PM PDT',
    month:'JUN', day:'15', weekday:'SUN', location:'San Francisco, CA', venue:"Sightglass, SoMa", host:"Maya Reyes '19",
    category:'Founders', going:18, capacity:25, daysAway: 19,
    description:"Informal coffee for current and aspiring founders in the Bay Area. One ask, one offer per person, then break into smaller groups.",
    cost:'You buy your own' },
  { id:'e4', title:"Class of '20 — 6-Year Reunion", dateText:'Fri Oct 24 · 7:00 PM', timeRange:'7:00 PM — 11:00 PM EDT',
    month:'OCT', day:'24', weekday:'FRI', location:'Ithaca, NY', venue:'Statler Hotel', host:'Reunion Committee',
    category:'Reunion', going:142, capacity:300, daysAway: 150,
    description:"Cocktails, dinner, and dancing for the Class of '20. Part of Cornell reunion weekend.",
    cost:'$95 / member' },
];
const ANNS = [
  { id:'an1', kind:'Announcement', title:'2026 Mentorship Awards — Nominate by Jun 12', body:'Recognize the alumni who showed up for you this year. Three categories, peer-nominated.', author:'Office of Alumni Affairs', stamp:'2d ago', pinned:true },
  { id:'an2', kind:'Update', title:'120 new members joined the circle in May', body:'Welcome to our largest joining month yet. Help newcomers feel seen.', author:'Community team', stamp:'5d ago' },
  { id:'an3', kind:'Opportunity', title:'Mock-interview marathon — sign up to help', body:"New grads from '25 and '26 are asking. 30-minute slots, virtual or in person.", author:'Career Office', stamp:'1w ago' },
];
const CAT_COLOR = { Networking: '#2563eb', Career: '#3b6e51', Founders: '#722f37', Reunion: '#a16207' };

// ─── Shared atoms ───────────────────────────────────────────────────────
function Countdown({ days }) {
  let c;
  if (days === 1) c = { color:'#a16207', bg:'rgba(161,98,7,0.12)', text:'Tomorrow' };
  else if (days <= 7) c = { color:'#a16207', bg:'rgba(161,98,7,0.12)', text:`In ${days}d` };
  else if (days <= 30) c = { color:'#2563eb', bg:'rgba(37,99,235,0.08)', text:`In ${days}d` };
  else c = { color:'#4d4d4a', bg:'#ebebe5', text:`In ${days}d` };
  return <span className="mono" style={{ padding:'3px 8px', borderRadius:4, fontSize:10, fontWeight:700, letterSpacing:0.4, textTransform:'uppercase', color:c.color, background:c.bg, border:`1px solid ${c.color}33` }}>{c.text}</span>;
}
function CapacityBar({ going, capacity, w=140 }) {
  const pct = Math.min(100, Math.round((going/capacity)*100));
  const color = pct>=85 ? '#9b2c1f' : pct>=70 ? '#a16207' : '#3b6e51';
  return <div style={{ display:'flex', alignItems:'center', gap:8 }}>
    <div style={{ width:w, height:4, background:'#ebebe5', borderRadius:2, overflow:'hidden' }}>
      <div style={{ width:`${pct}%`, height:'100%', background:color }} />
    </div>
    <span className="mono" style={{ fontSize:10, color:'#4d4d4a' }}>{going}/{capacity}</span>
  </div>;
}
function DateBlock({ ev, size='md' }) {
  const s = size === 'sm' ? { w:44, m:9, d:16, p:'5px 4px' } : { w:54, m:10, d:20, p:'7px 6px' };
  return <div style={{ width:s.w, padding:s.p, borderRadius:6, background:'#fff', border:'1px solid #dcdcd6', textAlign:'center', flexShrink:0 }}>
    <div className="mono" style={{ fontSize:s.m, fontWeight:700, color:'#2563eb', letterSpacing:0.6 }}>{ev.month}</div>
    <div className="display" style={{ fontSize:s.d, fontWeight:600, color:'#0c0c0b', lineHeight:1, marginTop:2 }}>{ev.day}</div>
    <div className="mono" style={{ fontSize:8.5, color:'#4d4d4a', letterSpacing:0.5, marginTop:2 }}>{ev.weekday}</div>
  </div>;
}
function CategoryDot({ category }) {
  return <span style={{ width:7, height:7, borderRadius:'50%', background:CAT_COLOR[category]||'#4d4d4a' }} />;
}
function PinnedBanner({ ann }) {
  return <div style={{
    display:'flex', alignItems:'center', gap:14, padding:'12px 18px 12px 14px', marginBottom:20,
    background:'color-mix(in srgb, #2563eb 5%, #fff)', border:'1px solid #dcdcd6', borderLeft:'3px solid #2563eb',
    borderRadius:10, cursor:'pointer',
  }}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
      <path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79L3 15h18l-4.89-2.45A2 2 0 0 1 15 10.76V5a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
    </svg>
    <span className="mono" style={{ fontSize:9.5, fontWeight:700, textTransform:'uppercase', letterSpacing:0.10*10/10, color:'#2563eb', whiteSpace:'nowrap' }}>Pinned · {ann.kind}</span>
    <span style={{ color:'#dcdcd6' }}>·</span>
    <span className="display" style={{ fontSize:14, fontWeight:600, color:'#0c0c0b', flex:1, minWidth:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{ann.title}</span>
    <span className="mono" style={{ fontSize:10.5, color:'#4d4d4a', whiteSpace:'nowrap' }}>{ann.stamp}</span>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
  </div>;
}
function SectionHeader({ kicker, title, h2Size = 22, action }) {
  return <div style={{ borderTop:'1px solid #dcdcd6', paddingTop:20, marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:12, flexWrap:'wrap' }}>
    <div>
      <div className="kicker" style={{ marginBottom:8 }}>{kicker}</div>
      <h2 className="display" style={{ fontSize:h2Size, fontWeight:600, color:'#0c0c0b' }}>{title}</h2>
    </div>
    {action}
  </div>;
}
function CategoryChips() {
  return <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
    {['All','Networking','Career','Founders','Reunion'].map((l,i) => (
      <button key={l} style={{ fontSize:11.5, fontWeight:500, padding:'5px 12px', borderRadius:999, border:`1px solid ${i===0 ? 'rgba(37,99,235,0.25)' : '#dcdcd6'}`, background: i===0 ? 'rgba(37,99,235,0.08)' : '#fff', color: i===0 ? '#2563eb' : '#4d4d4a' }}>{l}</button>
    ))}
  </div>;
}

// ─── Master-detail (parameterized list width) ───────────────────────────
function MasterDetail({ listWidth = 380, selectedIdx = 0 }) {
  const ev = EVENTS[selectedIdx];
  const c = CAT_COLOR[ev.category];
  // Group by month
  const monthsOrdered = []; const groups = {};
  EVENTS.forEach((e, i) => {
    const key = { MAY:'May', JUN:'June', OCT:'October' }[e.month] + ' 2026';
    if (!groups[key]) { groups[key] = []; monthsOrdered.push(key); }
    groups[key].push({ event: e, idx: i });
  });

  return <div style={{
    display:'grid', gridTemplateColumns:`${listWidth}px 1fr`,
    background:'#fff', border:'1px solid #dcdcd6', borderRadius:14, overflow:'hidden',
    boxShadow:'0 1px 0 rgba(12,12,11,0.03), 0 18px 36px -22px rgba(12,12,11,0.14)',
  }}>
    {/* List column */}
    <div style={{ borderRight:'1px solid #ebebe5', background:'#fafaf9' }}>
      <div style={{ padding:'10px 16px', borderBottom:'1px solid #ebebe5', display:'flex', justifyContent:'space-between' }}>
        <span className="mono" style={{ fontSize:10, color:'#4d4d4a', letterSpacing:0.6, textTransform:'uppercase', fontWeight:700 }}>
          {EVENTS.length} upcoming · {monthsOrdered.length} months
        </span>
        <span className="mono" style={{ fontSize:10.5, color:'#4d4d4a' }}>Sort ▾</span>
      </div>
      {monthsOrdered.map(mk => (
        <div key={mk}>
          <div style={{ padding:'8px 16px 6px', borderBottom:'1px solid #ebebe5', background:'#f4f3ee', display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
            <span className="display" style={{ fontSize:12.5, fontWeight:600, color:'#0c0c0b' }}>{mk.split(' ')[0]}</span>
            <span className="mono" style={{ fontSize:9, color:'#4d4d4a', letterSpacing:0.5, textTransform:'uppercase' }}>{groups[mk].length} {groups[mk].length===1?'event':'events'}</span>
          </div>
          {groups[mk].map(({ event:e, idx }) => {
            const sel = idx === selectedIdx;
            return <div key={e.id} style={{
              padding:'11px 16px 11px 13px', borderLeft: sel ? `3px solid ${CAT_COLOR[e.category]}` : '3px solid transparent',
              borderBottom:'1px solid #ebebe5', background: sel ? '#fff' : 'transparent',
              display:'grid', gridTemplateColumns:'auto 1fr', gap:10, alignItems:'center',
            }}>
              <DateBlock ev={e} size="sm" />
              <div style={{ minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:3 }}>
                  <CategoryDot category={e.category} />
                  <span className="mono" style={{ fontSize:9, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:'#4d4d4a' }}>{e.category}</span>
                  <Countdown days={e.daysAway} />
                </div>
                <div className="display" style={{ fontSize:12.5, fontWeight: sel?600:500, color:'#0c0c0b', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{e.title}</div>
                <div style={{ fontSize:10.5, color:'#4d4d4a', marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{e.dateText.split(' · ')[1]} · {e.location.split(',')[0]}</div>
              </div>
            </div>;
          })}
        </div>
      ))}
    </div>

    {/* Detail column */}
    <div style={{ display:'flex', flexDirection:'column' }}>
      <div style={{
        background:`linear-gradient(135deg, ${c}, ${c}cc 50%, #081126 100%)`, color:'#fafaf9',
        padding:'26px 30px', position:'relative', overflow:'hidden',
        display:'grid', gridTemplateColumns:'1fr auto', gap:22, alignItems:'center',
      }}>
        <div style={{ position:'relative', minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, flexWrap:'wrap' }}>
            <span className="mono" style={{ fontSize:10, fontWeight:700, letterSpacing:0.8, textTransform:'uppercase', color:'#fafaf9', padding:'3px 9px', borderRadius:4, background:'rgba(250,250,249,0.14)', border:'1px solid rgba(250,250,249,0.22)' }}>◆ {ev.category}</span>
            <Countdown days={ev.daysAway} />
            <span className="mono" style={{ fontSize:10.5, color:'rgba(250,250,249,0.7)', letterSpacing:0.5, whiteSpace:'nowrap' }}>Hosted by {ev.host}</span>
          </div>
          <h3 className="display" style={{ fontSize:24, fontWeight:600, lineHeight:1.15 }}>{ev.title}</h3>
          <div style={{ fontSize:13, color:'rgba(250,250,249,0.85)', marginTop:8 }}>{ev.dateText} · {ev.location}</div>
        </div>
        <div style={{ textAlign:'center', padding:'14px 22px', background:'rgba(250,250,249,0.08)', border:'1px solid rgba(250,250,249,0.18)', borderRadius:12, flexShrink:0 }}>
          <div className="mono" style={{ fontSize:11, color:'rgba(250,250,249,0.7)', fontWeight:700, letterSpacing:0.8 }}>{ev.month}</div>
          <div className="display" style={{ fontSize:56, fontWeight:600, lineHeight:0.95, letterSpacing:'-0.06em', marginTop:2 }}>{ev.day}</div>
          <div className="mono" style={{ fontSize:10, color:'rgba(250,250,249,0.7)', letterSpacing:0.6, marginTop:4 }}>{ev.weekday} · 2026</div>
        </div>
      </div>
      <div style={{ padding:'20px 28px 22px', display:'flex', flexDirection:'column', gap:14 }}>
        <p style={{ fontSize:13, color:'#0c0c0b', lineHeight:1.55 }}>{ev.description}</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', background:'#fafaf9', border:'1px solid #ebebe5', borderRadius:10, overflow:'hidden' }}>
          <FactCell label="When" value={ev.timeRange.split(' — ')[0] + ' EDT'} sub={`${ev.weekday} · ${ev.month} ${ev.day}`} />
          <FactCell label="Where" value={ev.venue} sub={ev.location} />
          <FactCell label="Host" value={ev.host} sub={ev.cost} last />
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
          <div style={{ display:'flex' }}>
            {['MR','DL','JK','AW','SC'].map((i, idx) => <span key={i} style={{ width:28, height:28, borderRadius:'50%', background:'#ebebe5', color:'#4d4d4a', display:'inline-flex', alignItems:'center', justifyContent:'center', fontFamily:"'Inter Tight', sans-serif", fontWeight:700, fontSize:10, border:'2px solid #fff', marginLeft: idx===0 ? 0 : -10 }}>{i}</span>)}
          </div>
          <div style={{ fontSize:12, color:'#4d4d4a' }}><strong style={{ color:'#0c0c0b', fontWeight:600 }}>Maya, David</strong> + {ev.going-2} others</div>
          <div style={{ flex:1 }} />
          <CapacityBar going={ev.going} capacity={ev.capacity} w={120} />
        </div>
        <div style={{ display:'flex', gap:8, paddingTop:12, borderTop:'1px solid #ebebe5', flexWrap:'wrap' }}>
          <button className="btn btn-cta btn-md">RSVP — I'm going</button>
          <button className="btn btn-outline btn-md">Add to calendar</button>
          <button className="btn btn-ghost btn-md">Invite</button>
          <div style={{ flex:1 }} />
          <button className="btn btn-ghost btn-md">Full details →</button>
        </div>
      </div>
    </div>
  </div>;
}
function FactCell({ label, value, sub, last }) {
  return <div style={{ padding:'10px 13px', borderRight: last ? 'none' : '1px solid #ebebe5' }}>
    <div className="mono" style={{ fontSize:9, color:'#4d4d4a', letterSpacing:0.6, textTransform:'uppercase', fontWeight:700 }}>{label}</div>
    <div className="display" style={{ fontSize:13, fontWeight:600, color:'#0c0c0b', marginTop:3 }}>{value}</div>
    <div style={{ fontSize:10.5, color:'#4d4d4a', marginTop:1 }}>{sub}</div>
  </div>;
}

// ─── Announcements rails (3 variants) ───────────────────────────────────
function AnnRailFull({ items, width }) {
  return <aside style={{ width, position:'sticky', top:24, height:'fit-content' }}>
    <SectionHeader kicker={`Announcements · ${items.length}`} title="From the office" h2Size={18} />
    <div style={{ background:'#fff', border:'1px solid #dcdcd6', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 0 rgba(12,12,11,0.03)' }}>
      {items.map((an, i) => <article key={an.id} style={{ padding:'14px 16px', borderTop: i===0 ? 'none' : '1px solid #ebebe5' }}>
        <div className="mono" style={{ fontSize:9.5, fontWeight:700, letterSpacing:0.10*10/10, textTransform:'uppercase', color:'#4d4d4a', marginBottom:6 }}>{an.kind}</div>
        <h3 className="display" style={{ fontSize:13.5, fontWeight:600, color:'#0c0c0b', lineHeight:1.3 }}>{an.title}</h3>
        <p style={{ fontSize:12, color:'#4d4d4a', lineHeight:1.5, marginTop:6 }}>{an.body}</p>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:10 }}>
          <span style={{ fontSize:11, color:'#4d4d4a' }}>{an.author}</span>
          <span className="mono" style={{ fontSize:10, color:'#4d4d4a' }}>{an.stamp}</span>
        </div>
      </article>)}
    </div>
  </aside>;
}
function AnnRailCompact({ items, width }) {
  return <aside style={{ width, position:'sticky', top:24, height:'fit-content' }}>
    <SectionHeader kicker={`Announcements · ${items.length}`} title="From the office" h2Size={16} />
    <div style={{ background:'#fff', border:'1px solid #dcdcd6', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 0 rgba(12,12,11,0.03)' }}>
      {items.map((an, i) => <article key={an.id} style={{ padding:'12px 14px', borderTop: i===0 ? 'none' : '1px solid #ebebe5', cursor:'pointer' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
          <span className="mono" style={{ fontSize:9, fontWeight:700, letterSpacing:0.6, textTransform:'uppercase', color:'#4d4d4a' }}>{an.kind}</span>
          <span className="mono" style={{ fontSize:9.5, color:'#dcdcd6' }}>·</span>
          <span className="mono" style={{ fontSize:9.5, color:'#4d4d4a' }}>{an.stamp}</span>
        </div>
        <h3 className="display" style={{ fontSize:13, fontWeight:600, color:'#0c0c0b', lineHeight:1.3, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{an.title}</h3>
      </article>)}
    </div>
    <button className="btn btn-ghost btn-sm" style={{ width:'100%', marginTop:8, color:'#4d4d4a', fontSize:11.5 }}>See all →</button>
  </aside>;
}
function AnnGrid3up({ items }) {
  return <div>
    <SectionHeader kicker={`Announcements · ${items.length}`} title="From the office" />
    <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12 }}>
      {items.map(an => <article key={an.id} style={{ background:'#fff', border:'1px solid #dcdcd6', borderRadius:12, padding:'16px 18px', boxShadow:'0 1px 0 rgba(12,12,11,0.03)' }}>
        <div className="mono" style={{ fontSize:9.5, fontWeight:700, letterSpacing:0.10*10/10, textTransform:'uppercase', color:'#4d4d4a', marginBottom:6 }}>{an.kind}</div>
        <h3 className="display" style={{ fontSize:14, fontWeight:600, color:'#0c0c0b', lineHeight:1.3 }}>{an.title}</h3>
        <p style={{ fontSize:12, color:'#4d4d4a', lineHeight:1.5, marginTop:6 }}>{an.body}</p>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:12, paddingTop:10, borderTop:'1px dashed #ebebe5' }}>
          <span style={{ fontSize:11, color:'#4d4d4a' }}>{an.author}</span>
          <span className="mono" style={{ fontSize:10, color:'#4d4d4a' }}>{an.stamp}</span>
        </div>
      </article>)}
    </div>
  </div>;
}

// ─── Variants ───────────────────────────────────────────────────────────
const pinned = ANNS.find(a => a.pinned);
const others = ANNS.filter(a => !a.pinned);
const Wrap = ({ children }) => <div style={{ width:'100%', minHeight:'100%', background:'#fafaf9', padding:'24px 32px 32px' }}>{children}</div>;

function SchoolCurrent() {
  return <Wrap>
    <PinnedBanner ann={pinned} />
    <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:32, alignItems:'flex-start' }}>
      <div>
        <SectionHeader kicker={`Upcoming · ${EVENTS.length} events`} title="On the calendar" action={<CategoryChips />} />
        <MasterDetail listWidth={380} />
      </div>
      <AnnRailFull items={others} width={320} />
    </div>
    <NoteStrip text="Calendar at 864px wide · list 380 + detail 484. Detail panel feels cramped: facts grid cells are ~145px each, host text wraps." tone="warn" />
  </Wrap>;
}

function SchoolOption1() {
  return <Wrap>
    <PinnedBanner ann={pinned} />
    <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:28, alignItems:'flex-start' }}>
      <div>
        <SectionHeader kicker={`Upcoming · ${EVENTS.length} events`} title="On the calendar" action={<CategoryChips />} />
        <MasterDetail listWidth={300} />
      </div>
      <AnnRailCompact items={others} width={280} />
    </div>
    <NoteStrip text="Rail 280px (titles only, click to expand) + list 300px → calendar gains ~100px. Detail panel breathes. Announcements scan as headlines." tone="good" />
  </Wrap>;
}

function SchoolOption2() {
  // Reflow: list as horizontal strip on top, detail panel below full-width
  const selected = 0;
  return <Wrap>
    <PinnedBanner ann={pinned} />
    <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:32, alignItems:'flex-start' }}>
      <div>
        <SectionHeader kicker={`Upcoming · ${EVENTS.length} events`} title="On the calendar" action={<CategoryChips />} />
        <div style={{ background:'#fff', border:'1px solid #dcdcd6', borderRadius:14, overflow:'hidden', boxShadow:'0 1px 0 rgba(12,12,11,0.03), 0 18px 36px -22px rgba(12,12,11,0.14)' }}>
          {/* Horizontal strip of events */}
          <div style={{ display:'grid', gridTemplateColumns:`repeat(${EVENTS.length}, 1fr)`, borderBottom:'1px solid #ebebe5', background:'#fafaf9' }}>
            {EVENTS.map((e, i) => {
              const sel = i === selected;
              return <button key={e.id} style={{
                padding:'14px 16px', border:'none', borderRight: i<EVENTS.length-1 ? '1px solid #ebebe5' : 'none',
                borderTop: sel ? `3px solid ${CAT_COLOR[e.category]}` : '3px solid transparent',
                background: sel ? '#fff' : 'transparent', textAlign:'left', cursor:'pointer',
                display:'flex', flexDirection:'column', gap:6,
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <DateBlock ev={e} size="sm" />
                  <div style={{ minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <CategoryDot category={e.category} />
                      <span className="mono" style={{ fontSize:9, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:'#4d4d4a' }}>{e.category}</span>
                    </div>
                    <Countdown days={e.daysAway} />
                  </div>
                </div>
                <div className="display" style={{ fontSize:12.5, fontWeight: sel?600:500, color:'#0c0c0b', lineHeight:1.3, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{e.title}</div>
                <div style={{ fontSize:10.5, color:'#4d4d4a' }}>{e.location.split(',')[0]}</div>
              </button>;
            })}
          </div>
          {/* Detail panel below — gets the full calendar column width */}
          <DetailPanelOnly ev={EVENTS[selected]} />
        </div>
      </div>
      <AnnRailFull items={others} width={320} />
    </div>
    <NoteStrip text="List moves to top as horizontal strip; detail panel below gets full calendar-column width (~864px). Best when announcements need full body copy." tone="good" />
  </Wrap>;
}

function DetailPanelOnly({ ev }) {
  const c = CAT_COLOR[ev.category];
  return <div>
    <div style={{
      background:`linear-gradient(135deg, ${c}, ${c}cc 50%, #081126 100%)`, color:'#fafaf9',
      padding:'28px 32px', position:'relative', overflow:'hidden',
      display:'grid', gridTemplateColumns:'1fr auto', gap:28, alignItems:'center',
    }}>
      <div style={{ position:'relative', minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, flexWrap:'wrap' }}>
          <span className="mono" style={{ fontSize:10, fontWeight:700, letterSpacing:0.8, textTransform:'uppercase', color:'#fafaf9', padding:'3px 9px', borderRadius:4, background:'rgba(250,250,249,0.14)', border:'1px solid rgba(250,250,249,0.22)' }}>◆ {ev.category}</span>
          <Countdown days={ev.daysAway} />
          <span className="mono" style={{ fontSize:10.5, color:'rgba(250,250,249,0.7)', letterSpacing:0.5, whiteSpace:'nowrap' }}>Hosted by {ev.host}</span>
        </div>
        <h3 className="display" style={{ fontSize:28, fontWeight:600, lineHeight:1.1 }}>{ev.title}</h3>
        <div style={{ fontSize:13.5, color:'rgba(250,250,249,0.85)', marginTop:10 }}>{ev.dateText} · {ev.location}</div>
      </div>
      <div style={{ textAlign:'center', padding:'18px 26px', background:'rgba(250,250,249,0.08)', border:'1px solid rgba(250,250,249,0.18)', borderRadius:14, flexShrink:0 }}>
        <div className="mono" style={{ fontSize:12, color:'rgba(250,250,249,0.7)', fontWeight:700, letterSpacing:0.8 }}>{ev.month}</div>
        <div className="display" style={{ fontSize:64, fontWeight:600, lineHeight:0.95, letterSpacing:'-0.06em', marginTop:4 }}>{ev.day}</div>
        <div className="mono" style={{ fontSize:10.5, color:'rgba(250,250,249,0.7)', letterSpacing:0.6, marginTop:6 }}>{ev.weekday} · 2026</div>
      </div>
    </div>
    <div style={{ padding:'22px 32px 24px', display:'flex', flexDirection:'column', gap:16 }}>
      <p style={{ fontSize:13.5, color:'#0c0c0b', lineHeight:1.6 }}>{ev.description}</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', background:'#fafaf9', border:'1px solid #ebebe5', borderRadius:10, overflow:'hidden' }}>
        <FactCell label="When" value={ev.timeRange} sub={`${ev.weekday} · ${ev.month} ${ev.day}`} />
        <FactCell label="Where" value={ev.venue} sub={ev.location} />
        <FactCell label="Host" value={ev.host} sub={ev.cost} last />
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:16 }}>
        <div style={{ display:'flex' }}>
          {['MR','DL','JK','AW','SC'].map((i, idx) => <span key={i} style={{ width:30, height:30, borderRadius:'50%', background:'#ebebe5', color:'#4d4d4a', display:'inline-flex', alignItems:'center', justifyContent:'center', fontFamily:"'Inter Tight', sans-serif", fontWeight:700, fontSize:10.5, border:'2px solid #fff', marginLeft: idx===0 ? 0 : -10 }}>{i}</span>)}
        </div>
        <div style={{ fontSize:12.5, color:'#4d4d4a' }}><strong style={{ color:'#0c0c0b', fontWeight:600 }}>Maya, David</strong> and {ev.going-2} others going</div>
        <div style={{ flex:1 }} />
        <CapacityBar going={ev.going} capacity={ev.capacity} w={140} />
      </div>
      <div style={{ display:'flex', gap:8, paddingTop:12, borderTop:'1px solid #ebebe5', flexWrap:'wrap' }}>
        <button className="btn btn-cta btn-md">RSVP — I'm going</button>
        <button className="btn btn-outline btn-md">Add to calendar</button>
        <button className="btn btn-ghost btn-md">Invite a friend</button>
        <div style={{ flex:1 }} />
        <button className="btn btn-ghost btn-md">Full details →</button>
      </div>
    </div>
  </div>;
}

function SchoolOption3() {
  return <Wrap>
    <PinnedBanner ann={pinned} />
    <SectionHeader kicker={`Upcoming · ${EVENTS.length} events`} title="On the calendar" action={<CategoryChips />} />
    <MasterDetail listWidth={380} />
    <div style={{ marginTop:32 }}>
      <AnnGrid3up items={others} />
    </div>
    <NoteStrip text="Calendar gets full page width (~1216px). Announcements as 3-up grid below — compact, no body truncation. Loses persistent right-rail visibility." tone="neutral" />
  </Wrap>;
}

function NoteStrip({ text, tone }) {
  const cfg = {
    good:    { color:'#3b6e51', bg:'rgba(59,110,81,0.10)',  border:'rgba(59,110,81,0.28)' },
    warn:    { color:'#9b2c1f', bg:'rgba(155,44,31,0.10)',  border:'rgba(155,44,31,0.28)' },
    neutral: { color:'#4d4d4a', bg:'#f4f3ee',                border:'#dcdcd6' },
  }[tone];
  return <div style={{
    marginTop:20, padding:'10px 14px',
    background:cfg.bg, border:`1px solid ${cfg.border}`, borderRadius:8,
    fontSize:11.5, color:cfg.color, fontFamily:"'JetBrains Mono', monospace", letterSpacing:0.2,
  }}>
    ▸ {text}
  </div>;
}

Object.assign(window, { SchoolCurrent, SchoolOption1, SchoolOption2, SchoolOption3 });
