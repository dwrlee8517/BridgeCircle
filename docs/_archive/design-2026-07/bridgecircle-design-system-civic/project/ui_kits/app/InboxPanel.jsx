// BridgeCircle UI Kit — InboxPanel.jsx
// Toggle-top, two-column inbox.
//   Header: "Inbox" title + segmented toggle [Priority | All | Advice | Mentorship | Connections]
//   List header: As helper / As asker sub-toggle, item count, sort
//   Body: list (360px) + detail (1fr). No left nav rail.
// Export: window.BCInboxPanel

const INBOX_ITEMS = [
  { id:'r1', type:'incoming_ask',            title:'Jordan Lee',    cohort:2022, role:'Consultant, McKinsey',       badge:'Mentorship req', badgeTone:'warn',  subtitle:'Breaking into VC after consulting', date:'2h ago', unread:true,  isHelper:true,  section:'mentorship', avatarColor:'#2563eb',
    detail:{ kind:'ask', askType:'Mentorship', ask:'I\u2019m a second-year at McKinsey considering a move into venture. Would love your perspective \u2014 what you wish you\u2019d known and what skills transferred.', helpNeeded:'30-minute call about VC job search and firm culture.' }},
  { id:'r2', type:'incoming_ask',            title:'Nora Patel',    cohort:2024, role:'Student, Cornell',           badge:'Advice req',     badgeTone:'warn',  subtitle:'APM resume review before applications', date:'1d ago', unread:true,  isHelper:true,  section:'advice',     avatarColor:'#15a05f',
    detail:{ kind:'ask', askType:'Advice', ask:'Applying to APM programs this fall. Could you look at my resume and tell me what stands out and what\u2019s missing?', helpNeeded:'Async resume review with written feedback.' }},
  { id:'t1', type:'active_thread',           title:'Marcus Chen',   cohort:2019, role:'Finance, Goldman Sachs',    badge:'Advice',         badgeTone:'info',  subtitle:'Re: consulting \u2192 PM transition', date:'1d ago', unread:true,  isHelper:true,  section:'advice',     avatarColor:'#a16207',
    detail:{ kind:'thread', messages:[
      { from:'Marcus', text:'Thanks for agreeing to chat. I\u2019ve been in fixed income for 3 years but really want to move to product.', time:'2d ago' },
      { from:'you',    text:'The key was a side project that showed product instincts. Happy to dig in.', time:'1d ago' },
      { from:'Marcus', text:'That\u2019s really helpful. Would you be open to a call this week?', time:'1d ago' },
    ]}},
  { id:'t2', type:'active_thread',           title:'Jamie Kim',     cohort:2020, role:'PM at Stripe',              badge:'Mentorship',     badgeTone:'info',  subtitle:'Session 3 \u2014 APM essay review', date:'3d ago', unread:false, isHelper:true,  section:'mentorship', avatarColor:'#2563eb',
    detail:{ kind:'thread', messages:[
      { from:'Jamie', text:'Hey \u2014 I revised the essays. Can you take a look before I submit?', time:'4d ago' },
      { from:'you',   text:'Sure, send them over. Give me a day or two.', time:'3d ago' },
    ]}},
  { id:'t3', type:'active_thread',           title:'Priya Nair',    cohort:2018, role:'Head of Strategy, Spotify', badge:'Mentorship',     badgeTone:'info',  subtitle:'Check-in on your progress', date:'2d ago', unread:false, isHelper:false, section:'mentorship', avatarColor:'#4d4d4a',
    detail:{ kind:'thread', messages:[
      { from:'Priya', text:'How are the APM applications going? Any blockers I can help with?', time:'3d ago' },
      { from:'you',   text:'Mostly good \u2014 essay drafts are almost done. Would love a review.', time:'2d ago' },
    ]}},
  { id:'o1', type:'outgoing_ask',            title:'Sam Chen',      cohort:2021, role:'Policy Lead, Meta',         badge:'Awaiting reply', badgeTone:'muted', subtitle:'Sent 2 days ago', date:'2d ago', unread:false, isHelper:false, section:'advice',     avatarColor:'#7c3aed',
    detail:{ kind:'outgoing', ask:'I\u2019m exploring a move from consulting into product strategy. Would love 30 minutes to hear about your transition.' }},
  { id:'fr1', type:'friend_request_incoming', title:'Sofia Ramirez', cohort:2021, role:'Product Designer, Figma',  badge:'Connection req', badgeTone:'info',  subtitle:'Wants to connect \u2014 sent you a note', date:'5h ago', unread:true,  isHelper:false, section:'connections', avatarColor:'#7c3aed',
    detail:{ kind:'friend_request', message:'Hi! I came across your profile while searching for product people in NYC. I\u2019d love to connect.' }},
  { id:'dm1',type:'dm_thread',              title:'David Liu',     cohort:2016, role:'EM at Google',              badge:'Message',        badgeTone:'muted', subtitle:"Let\u2019s catch up next week", date:'3d ago', unread:false, isHelper:false, section:'connections', avatarColor:'#4d4d4a',
    detail:{ kind:'thread', messages:[
      { from:'David', text:'Wanted to say thanks for the intro to Priya. Really helpful.', time:'4d ago' },
      { from:'you',   text:'Of course! You two should talk.', time:'4d ago' },
      { from:'David', text:"Let\u2019s catch up next week", time:'3d ago' },
    ]}},
];

// Segmented top toggle: Priority + All + 3 type segments.
const TOP_SEGMENTS = [
  { id:'priority',    label:'Priority',    color:'#c4314b' },
  { id:'all',         label:'All',         color:'#0c0c0b' },
  { id:'advice',      label:'Advice',      color:'#2563eb' },
  { id:'mentorship',  label:'Mentorship',  color:'#15a05f' },
  { id:'connections', label:'Connections', color:'#7c3aed' },
];

// Kind color lookup by item.section — used for the dot on each list row.
const KIND_COLOR = { advice:'#2563eb', mentorship:'#15a05f', connections:'#7c3aed' };
const KIND_LABEL = { advice:'Advice',  mentorship:'Mentorship', connections:'Connection' };

function isPriority(item) {
  return item.unread || item.type === 'incoming_ask' || item.type === 'friend_request_incoming';
}

function getInitials(name) {
  return (name||'?').split(/\s+/).map(w=>w[0]).filter(Boolean).slice(0,2).join('').toUpperCase();
}

// ── Row ────────────────────────────────────────────────────────────────────────
function InboxRow({ item, isSelected, onClick }) {
  const kindColor = KIND_COLOR[item.section] || '#4d4d4a';
  const kindLabel = KIND_LABEL[item.section] || '';
  return React.createElement('button', {
    type:'button', onClick,
    style:{
      width:'100%', textAlign:'left', padding:'10px 12px', borderRadius:8,
      border:`1px solid ${isSelected ? 'rgba(37,99,235,.25)' : 'transparent'}`,
      background: isSelected ? 'rgba(37,99,235,.07)' : 'transparent',
      display:'flex', alignItems:'flex-start', gap:11, cursor:'pointer',
      fontFamily:"'Inter',sans-serif", transition:'all 150ms',
    },
    onMouseEnter: e => { if (!isSelected) e.currentTarget.style.background='rgba(235,235,229,.65)'; },
    onMouseLeave: e => { if (!isSelected) e.currentTarget.style.background='transparent'; },
  },
    React.createElement('div', { style:{ position:'relative', flexShrink:0 } },
      React.createElement('div', { style:{ width:34, height:34, borderRadius:'50%', background:item.avatarColor, display:'flex', alignItems:'center', justifyContent:'center' } },
        React.createElement('span', { style:{ fontFamily:"'Inter Tight',sans-serif", fontSize:11, fontWeight:700, color:'#fff' } }, getInitials(item.title))
      ),
      item.unread && React.createElement('div', { style:{ position:'absolute', top:-1, right:-1, width:8, height:8, borderRadius:'50%', background:'#a16207', border:'1.5px solid #f4f3ee' } })
    ),
    React.createElement('div', { style:{ minWidth:0, flex:1 } },
      React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', gap:6, alignItems:'center' } },
        React.createElement('span', { style:{ fontSize:13, fontWeight:item.unread?700:500, color:'#0c0c0b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, item.title),
        React.createElement('span', { style:{ fontFamily:"'JetBrains Mono',monospace", fontSize:9.5, color:'#4d4d4a', flexShrink:0 } }, item.date)
      ),
      React.createElement('div', { style:{ display:'flex', gap:6, margin:'3px 0', alignItems:'center' } },
        React.createElement('span', { style:{ width:6, height:6, borderRadius:'50%', background:kindColor, flexShrink:0 } }),
        React.createElement('span', { style:{ fontSize:10, fontWeight:700, color:kindColor, textTransform:'uppercase', letterSpacing:'.10em' } }, kindLabel),
        React.createElement(BCStatusBadge, { tone:item.badgeTone, size:'sm' }, item.badge),
        React.createElement('span', { style:{ fontFamily:"'JetBrains Mono',monospace", fontSize:9.5, color:'#4d4d4a' } }, `'${String(item.cohort).slice(-2)}`)
      ),
      React.createElement('p', { style:{ fontSize:11.5, color:item.unread?'#0c0c0b':'#4d4d4a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:item.unread?500:400 } }, item.subtitle)
    )
  );
}

// ── Detail pane ────────────────────────────────────────────────────────────────
function DetailPane({ item, isMobile }) {
  const [msg, setMsg] = React.useState('');
  const [accepted, setAccepted] = React.useState(false);

  React.useEffect(() => { setAccepted(false); setMsg(''); }, [item?.id]);

  if (!item) return React.createElement('div', {
    style:{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:32, textAlign:'center' },
  },
    React.createElement('div', null,
      React.createElement('p', { style:{ fontSize:16, fontWeight:600, color:'#0c0c0b', fontFamily:"'Inter Tight',sans-serif" } }, 'Nothing needs a reply.'),
      React.createElement('p', { style:{ fontSize:13, color:'#4d4d4a', marginTop:6 } }, 'Look around People or set what you\u2019re open to.')
    )
  );

  const d = item.detail || {};

  // Outgoing ask
  if (item.type === 'outgoing_ask') return React.createElement('div', { style:{ flex:1, overflowY: isMobile ? 'visible' : 'auto', padding: isMobile ? '20px 16px' : 24 } },
    React.createElement('div', { style:{ display:'flex', gap:12, marginBottom:20, alignItems:'flex-start' } },
      React.createElement(BCAvatar, { name:item.title, size:48, square:true }),
      React.createElement('div', null,
        React.createElement('h3', { style:{ fontFamily:"'Inter Tight',sans-serif", fontSize:18, fontWeight:600, color:'#0c0c0b' } }, item.title),
        React.createElement('p', { style:{ fontSize:12, color:'#4d4d4a', marginTop:2 } }, item.role),
        React.createElement('div', { style:{ marginTop:6 } }, React.createElement(BCStatusBadge, { tone:'muted' }, 'Awaiting response'))
      )
    ),
    React.createElement('div', { style:{ marginBottom:20 } },
      React.createElement('p', { style:{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'#4d4d4a', marginBottom:8 } }, 'Your ask'),
      React.createElement('div', { style:{ borderLeft:'3px solid #dcdcd6', paddingLeft:12, fontSize:13.5, lineHeight:1.6, color:'#4d4d4a', fontStyle:'italic' } }, `\u201c${d.ask}\u201d`)
    ),
    React.createElement('div', { style:{ padding:14, borderRadius:10, background:'#f4f3ee', border:'1px solid #dcdcd6' } },
      React.createElement('p', { style:{ fontSize:12, color:'#4d4d4a', lineHeight:1.5 } }, 'Most people respond within a few days. You\u2019ll get a notification when they reply.'),
      React.createElement(BCButton, { variant:'ghost', size:'sm', style:{ marginTop:10, color:'#9b2c1f', borderRadius:8 } }, 'Withdraw request')
    )
  );

  // Friend request
  if (item.type === 'friend_request_incoming') return React.createElement('div', { style:{ flex:1, overflowY: isMobile ? 'visible' : 'auto', padding: isMobile ? '20px 16px' : 24 } },
    React.createElement('div', { style:{ display:'flex', gap:12, marginBottom:20, alignItems:'flex-start' } },
      React.createElement(BCAvatar, { name:item.title, size:48, square:false }),
      React.createElement('div', null,
        React.createElement('h3', { style:{ fontFamily:"'Inter Tight',sans-serif", fontSize:18, fontWeight:600, color:'#0c0c0b' } }, item.title),
        React.createElement('p', { style:{ fontSize:12, color:'#4d4d4a', marginTop:2 } }, item.role),
        React.createElement('div', { style:{ marginTop:6 } }, React.createElement(BCStatusBadge, { tone:'info' }, 'Wants to connect'))
      )
    ),
    d.message && React.createElement('div', { style:{ borderLeft:'3px solid #2563eb', paddingLeft:12, fontStyle:'italic', fontSize:13.5, lineHeight:1.6, color:'#0c0c0b', marginBottom:20 } }, `\u201c${d.message}\u201d`),
    React.createElement('div', { style:{ display:'flex', gap:8 } },
      React.createElement(BCButton, { variant:'offer', size:'default', style:{ borderRadius:8 } }, 'Accept'),
      React.createElement(BCButton, { variant:'outline', size:'default', style:{ borderRadius:8 } }, 'Decline')
    )
  );

  // Incoming ask
  if (item.type === 'incoming_ask') {
    if (accepted) return React.createElement('div', { style:{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:32, textAlign:'center' } },
      React.createElement('div', null,
        React.createElement('div', { style:{ width:48, height:48, borderRadius:'50%', background:'rgba(21,160,95,.12)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' } },
          React.createElement('svg', { width:20, height:20, viewBox:'0 0 24 24', fill:'none', stroke:'#15a05f', strokeWidth:2.5, strokeLinecap:'round', strokeLinejoin:'round' },
            React.createElement('polyline', { points:'20 6 9 17 4 12' })
          )
        ),
        React.createElement('h3', { style:{ fontFamily:"'Inter Tight',sans-serif", fontSize:18, fontWeight:600, color:'#0c0c0b' } }, 'Reply sent.'),
        React.createElement('p', { style:{ fontSize:13, color:'#4d4d4a', marginTop:6 } }, `You accepted ${item.title.split(' ')[0]}\u2019s request.`)
      )
    );
    return React.createElement('div', { style:{ flex:1, overflowY: isMobile ? 'visible' : 'auto', padding: isMobile ? '20px 16px' : 24 } },
      React.createElement('div', { style:{ display:'flex', gap:12, marginBottom:20, alignItems:'flex-start' } },
        React.createElement(BCAvatar, { name:item.title, size:48, square:true }),
        React.createElement('div', null,
          React.createElement('h3', { style:{ fontFamily:"'Inter Tight',sans-serif", fontSize:18, fontWeight:600, color:'#0c0c0b' } }, item.title),
          React.createElement('p', { style:{ fontSize:12, color:'#4d4d4a', marginTop:2 } }, `${item.role} \u00b7 Class of '${String(item.cohort).slice(-2)}`),
          React.createElement('div', { style:{ marginTop:6 } }, React.createElement(BCStatusBadge, { tone:'warn', dot:true }, `${d.askType} request`))
        )
      ),
      React.createElement('div', { style:{ marginBottom:16 } },
        React.createElement('p', { style:{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'#4d4d4a', marginBottom:8 } }, 'Their ask'),
        React.createElement('div', { style:{ borderLeft:'3px solid #2563eb', paddingLeft:12, fontStyle:'italic', fontSize:13.5, lineHeight:1.6, color:'#0c0c0b' } }, `\u201c${d.ask}\u201d`)
      ),
      d.helpNeeded && React.createElement('div', { style:{ marginBottom:20 } },
        React.createElement('p', { style:{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'#4d4d4a', marginBottom:6 } }, 'What they need'),
        React.createElement('p', { style:{ fontSize:13, color:'#4d4d4a', lineHeight:1.55 } }, d.helpNeeded)
      ),
      React.createElement('div', { style:{ borderTop:'1px solid #dcdcd6', paddingTop:16, display:'flex', flexDirection:'column', gap:10 } },
        React.createElement('p', { style:{ fontSize:12, fontWeight:600, color:'#0c0c0b' } }, 'Reply (optional)'),
        React.createElement('textarea', {
          rows:3, value:msg, onChange:e=>setMsg(e.target.value),
          placeholder:'A few sentences is plenty\u2026',
          style:{ fontFamily:"'Inter',sans-serif", fontSize:13, color:'#0c0c0b', border:'1px solid #dcdcd6', borderRadius:10, padding:'9px 12px', resize:'none', outline:'none', lineHeight:1.55, background:'#fff', width:'100%', transition:'border-color 150ms, box-shadow 150ms' },
          onFocus:e=>{ e.target.style.borderColor='#2563eb'; e.target.style.boxShadow='0 0 0 4px rgba(37,99,235,.10)'; },
          onBlur:e=>{ e.target.style.borderColor='#dcdcd6'; e.target.style.boxShadow='none'; },
        }),
        React.createElement('div', { style:{ display:'flex', gap:8 } },
          React.createElement(BCButton, { variant:'offer', size:'default', onClick:()=>setAccepted(true), style:{ borderRadius:8 } }, 'Accept & reply'),
          React.createElement(BCButton, { variant:'outline', size:'default', style:{ borderRadius:8 } }, 'Decline')
        )
      )
    );
  }

  // Active thread / DM
  return React.createElement('div', { style:{ display:'flex', flexDirection:'column', flex:1, overflow: isMobile ? 'visible' : 'hidden' } },
    React.createElement('div', { style:{ padding: isMobile ? '12px 16px' : '14px 20px', borderBottom:'1px solid rgba(220,220,214,.5)', display:'flex', gap:12, alignItems:'center', flexShrink:0 } },
      React.createElement(BCAvatar, { name:item.title, size:36, square:item.type==='active_thread' }),
      React.createElement('div', null,
        React.createElement('h3', { style:{ fontSize:14, fontWeight:600, color:'#0c0c0b' } }, item.title),
        React.createElement('p', { style:{ fontSize:11, color:'#4d4d4a' } }, item.role)
      ),
      React.createElement('div', { style:{ marginLeft:'auto' } }, React.createElement(BCStatusBadge, { tone:item.badgeTone }, item.badge))
    ),
    React.createElement('div', { style:{ flex:1, overflowY: isMobile ? 'visible' : 'auto', padding: isMobile ? '16px 12px' : 20, display:'flex', flexDirection:'column', gap:14 } },
      (d.messages||[]).map((m,i) =>
        React.createElement('div', { key:i, style:{ display:'flex', gap:10, flexDirection:m.from==='you'?'row-reverse':'row', alignItems:'flex-end' } },
          React.createElement(BCAvatar, { name:m.from==='you'?'AW':item.title, size:26 }),
          React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:3, alignItems:m.from==='you'?'flex-end':'flex-start', maxWidth:'72%' } },
            React.createElement('div', { style:{ padding:'10px 13px', borderRadius:12, fontSize:13.5, lineHeight:1.55, background:m.from==='you'?'#2563eb':'#f4f3ee', color:m.from==='you'?'#fff':'#0c0c0b' } }, m.text),
            React.createElement('span', { style:{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:'#4d4d4a' } }, m.time)
          )
        )
      )
    ),
    React.createElement('div', {
      style:{
        borderTop:'1px solid #dcdcd6', padding:'12px 16px',
        display:'flex', gap:8, alignItems:'flex-end', flexShrink:0,
        background:'#fff',
        // Plain block on mobile: a sticky/fixed bar visually rubber-bands
        // with the page on iOS overscroll, which reads as "the bottom panel
        // jumps." Body has padding-bottom: 64px which keeps this bar clear
        // of the fixed tab bar at end-of-scroll.
      },
    },
      React.createElement('textarea', {
        rows:2, value:msg, onChange:e=>setMsg(e.target.value), placeholder:'Reply\u2026',
        style:{ flex:1, fontFamily:"'Inter',sans-serif", fontSize:13, color:'#0c0c0b', border:'1px solid #dcdcd6', borderRadius:10, padding:'8px 12px', resize:'none', outline:'none', background:'#fff', transition:'border-color 150ms' },
        onFocus:e=>{ e.target.style.borderColor='#2563eb'; },
        onBlur:e=>{ e.target.style.borderColor='#dcdcd6'; },
      }),
      React.createElement(BCButton, { variant:'default', size:'sm', style:{ borderRadius:8, alignSelf:'flex-end' } }, 'Send')
    )
  );
}

// ── Mobile detection hook ─────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 760px)').matches
  );
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 760px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener ? mq.addEventListener('change', handler) : mq.addListener(handler);
    return () => {
      mq.removeEventListener ? mq.removeEventListener('change', handler) : mq.removeListener(handler);
    };
  }, []);
  return isMobile;
}

// ── Back chevron used in mobile detail header ────────────────────────────────
function BackArrow() {
  return React.createElement('svg', {
    width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
  },
    React.createElement('path', { d: 'm15 18-6-6 6-6' })
  );
}

// ── Main inbox ─────────────────────────────────────────────────────────────────
function BCInboxPanel() {
  const isMobile = useIsMobile();
  const [filter, setFilter]   = React.useState('priority');   // priority | all | advice | mentorship | connections
  const [role, setRole]       = React.useState('give');       // give (As helper) | get (As asker)
  // On mobile, null = showing list; on desktop, always have one selected.
  const [selected, setSelected] = React.useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 760px)').matches ? null : 'r1'
  );

  const priorityItems = INBOX_ITEMS.filter(isPriority);

  const counts = {
    priority:    priorityItems.length,
    all:         INBOX_ITEMS.length,
    advice:      INBOX_ITEMS.filter(i => i.section === 'advice').length,
    mentorship:  INBOX_ITEMS.filter(i => i.section === 'mentorship').length,
    connections: INBOX_ITEMS.filter(i => i.section === 'connections').length,
  };

  const isConnections = filter === 'connections';
  const items = (() => {
    let pool;
    if (filter === 'priority')    pool = priorityItems;
    else if (filter === 'all')    pool = INBOX_ITEMS.slice();
    else                          pool = INBOX_ITEMS.filter(i => i.section === filter);
    // Connections aren't split by help direction — it's just connecting.
    if (!isConnections) {
      if (role === 'give') pool = pool.filter(i => i.isHelper);
      if (role === 'get')  pool = pool.filter(i => !i.isHelper);
    }
    return pool;
  })();

  const selectedItem = INBOX_ITEMS.find(i => i.id === selected) || null;

  const handleFilter = (id) => {
    setFilter(id);
    let pool;
    if (id === 'priority')    pool = priorityItems;
    else if (id === 'all')    pool = INBOX_ITEMS;
    else                      pool = INBOX_ITEMS.filter(i => i.section === id);
    // Default to whichever role actually has items under this filter, so the
    // list is never empty right after switching.
    const helpers = pool.filter(i => i.isHelper);
    const nextRole = helpers.length ? 'give' : 'get';
    setRole(nextRole);
    // On mobile, switching filter should keep the user on the list view, not
    // jump them into a detail pane.
    if (isMobile) { setSelected(null); return; }
    const firstInRole = (nextRole === 'give' ? helpers : pool.filter(i => !i.isHelper))[0];
    if (firstInRole) setSelected(firstInRole.id);
  };

  // Mobile: when nothing is selected, show list pane; otherwise show detail
  // pane (with a back button). Desktop: both panes side-by-side.
  const mobileView = isMobile ? (selectedItem ? 'detail' : 'list') : null;

  return React.createElement('div', {
    style:{
      display:'grid',
      gridTemplateRows: 'auto 1fr',
      // Desktop: lock to parent height with internal scrollers (classic
      // two-pane chat layout).
      // Mobile:  grow naturally so `main` (auto-scroll, like other tabs)
      //          handles scrolling and both top/bottom bars stay anchored.
      height: isMobile ? 'auto' : '100%',
      minHeight: isMobile ? 0 : 600,
      background:'#fafaf9',
      overflow: isMobile ? 'visible' : 'hidden',
    },
  },

    // ── Top bar ────────────────────────────────────────────────────────────
    // Desktop: title sits inline with a tab strip.
    // Mobile:  title stacks above; tabs become a wrapping pill row so every
    //          filter is always visible (no hidden horizontal scroll).
    React.createElement('header', {
      style:{
        padding: isMobile ? '10px 14px 12px' : '0 22px',
        background:'#fff', borderBottom:'1px solid #dcdcd6',
        display:'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'stretch',
        gap: isMobile ? 10 : 24,
        flexShrink:0,
      },
    },
      // Title — hidden in mobile detail view (we put a back-button header
      // inside the detail pane instead, to save vertical space).
      !(isMobile && mobileView === 'detail') && React.createElement('div', {
        style:{
          display:'flex', alignItems:'center', flexShrink:0,
          padding: isMobile ? 0 : 0,
        },
      },
        React.createElement('h1', {
          style:{ fontFamily:"'Inter Tight',sans-serif", fontSize: isMobile ? 18 : 22, fontWeight:600, color:'#0c0c0b', letterSpacing:'-.01em' },
        }, 'Inbox')
      ),

      // Filter row — desktop tabs vs. mobile pills.
      React.createElement('div', {
        style:{
          display:'flex',
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          gap: isMobile ? 6 : 0,
          alignItems: isMobile ? 'center' : 'stretch',
          minWidth: 0,
        },
      },
        TOP_SEGMENTS.map(s => {
          const active = filter === s.id;
          const n = counts[s.id];

          // ── Mobile: pill ──────────────────────────────────────────────────
          if (isMobile) {
            return React.createElement('button', {
              key:s.id, onClick:()=>handleFilter(s.id),
              style:{
                display:'inline-flex', alignItems:'center', gap:6,
                padding:'6px 10px',
                borderRadius:999,
                background: active ? `color-mix(in srgb, ${s.color} 12%, #fff)` : '#f4f3ee',
                border: `1px solid ${active ? `color-mix(in srgb, ${s.color} 35%, transparent)` : '#ebebe5'}`,
                cursor:'pointer',
                fontFamily:"'Inter',sans-serif",
                whiteSpace:'nowrap',
                transition:'all 150ms',
              },
            },
              s.id === 'priority' && React.createElement('span', {
                style:{ width:6, height:6, borderRadius:'50%', background:'#c4314b', flexShrink:0 },
              }),
              React.createElement('span', { style:{ fontSize:12.5, fontWeight: active ? 700 : 500, color: active ? s.color : '#4d4d4a' } }, s.label),
              n > 0 && React.createElement('span', {
                style:{
                  minWidth:16, height:16, padding:'0 5px', borderRadius:8,
                  background: (active || s.id==='priority') ? s.color : '#ebebe5',
                  color: (active || s.id==='priority') ? '#fff' : '#4d4d4a',
                  fontSize:9, fontWeight:700, fontFamily:"'JetBrains Mono',monospace",
                  display:'inline-flex', alignItems:'center', justifyContent:'center',
                },
              }, n),
            );
          }

          // ── Desktop: tab ──────────────────────────────────────────────────
          return React.createElement('button', {
            key:s.id, onClick:()=>handleFilter(s.id),
            style:{
              display:'flex', alignItems:'center', gap:7,
              padding:'9px 14px 11px',
              background: active ? `color-mix(in srgb, ${s.color} 9%, transparent)` : 'transparent',
              border:'none', cursor:'pointer',
              fontFamily:"'Inter',sans-serif",
              borderBottom: `2px solid ${active ? s.color : 'transparent'}`,
              marginBottom:-1,
              flexShrink:0,
              whiteSpace:'nowrap',
              transition:'all 150ms',
            },
            onMouseEnter:e=>{ if(!active){ e.currentTarget.style.background='rgba(235,235,229,.55)'; e.currentTarget.style.borderBottomColor='#dcdcd6'; } },
            onMouseLeave:e=>{ if(!active){ e.currentTarget.style.background='transparent'; e.currentTarget.style.borderBottomColor='transparent'; } },
          },
            s.id === 'priority' && React.createElement('span', {
              style:{ width:7, height:7, borderRadius:'50%', background: active ? '#c4314b' : 'rgba(196,49,75,.6)', boxShadow: active ? '0 0 0 2.5px rgba(196,49,75,.20)' : 'none', flexShrink:0 },
            }),
            React.createElement('span', { style:{ fontSize:13, fontWeight: active ? 700 : 500, color: active ? s.color : '#4d4d4a' } }, s.label),
            n > 0 && React.createElement('span', {
              style:{
                minWidth:18, height:18, padding:'0 6px', borderRadius:9,
                background: (active || s.id==='priority') ? s.color : '#ebebe5',
                color: (active || s.id==='priority') ? '#fff' : '#4d4d4a',
                fontSize:9.5, fontWeight:700, fontFamily:"'JetBrains Mono',monospace",
                display:'inline-flex', alignItems:'center', justifyContent:'center',
              },
            }, n)
          );
        })
      )
    ),

    // ── Body — list + detail ────────────────────────────────────────────────
    React.createElement('div', {
      style:{
        display: isMobile ? 'block' : 'grid',
        gridTemplateColumns: isMobile ? undefined : '360px 1fr',
        minHeight: 0,
        overflow: isMobile ? 'visible' : 'hidden',
      },
    },

      // List col — hidden on mobile when a thread is open
      (!isMobile || mobileView === 'list') && React.createElement('div', {
        style:{
          display:'flex', flexDirection:'column',
          borderRight: isMobile ? 'none' : '1px solid #dcdcd6',
          background:'#fff',
          overflow: isMobile ? 'visible' : 'hidden',
          height: isMobile ? 'auto' : '100%',
        },
      },
        // Sub-filter: role + count
        React.createElement('div', {
          style:{ display:'flex', flexDirection:'column', gap:8, padding:'10px 12px', borderBottom:'1px solid #ebebe5', flexShrink:0, background:'rgba(244,243,238,.45)' },
        },
          // Role segmented control — hidden for Connections (no help direction)
          !isConnections && React.createElement('div', { style:{ display:'flex', gap:4, background:'#fff', borderRadius:8, padding:3, border:'1px solid #ebebe5' } },
            [
              ['give', 'Helping', '#15a05f'],
              ['get',  'Asking',  '#2563eb'],
            ].map(([id, label, color]) => {
              const active = role === id;
              return React.createElement('button', {
                key:id, onClick:()=>setRole(id),
                style:{
                  flex:1, height:26, borderRadius:6,
                  background: active ? '#0c0c0b' : 'transparent',
                  color: active ? '#fff' : '#4d4d4a',
                  border: active ? '1px solid #0c0c0b' : '1px solid transparent',
                  cursor:'pointer', fontFamily:"'Inter',sans-serif", fontSize:11, fontWeight: active ? 700 : 500,
                  display:'inline-flex', alignItems:'center', justifyContent:'center', gap:5,
                  transition:'all 150ms',
                },
              },
                color && React.createElement('span', { style:{ width:6, height:6, borderRadius:'50%', background: active ? color : 'transparent', border:`1.5px solid ${active ? color : 'rgba(77,77,74,.45)'}` } }),
                label,
              );
            })
          ),
          // Count + sort
          React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between' } },
            React.createElement('span', { style:{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'#4d4d4a', letterSpacing:'.08em', textTransform:'uppercase' } },
              `${items.length} ${items.length === 1 ? 'item' : 'items'}`
            ),
            React.createElement('button', {
              style:{ fontSize:11, color:'#4d4d4a', background:'transparent', border:'none', cursor:'pointer', fontFamily:"'Inter',sans-serif", display:'flex', alignItems:'center', gap:4 },
            },
              'Newest first ',
              React.createElement('svg', { width:10, height:10, viewBox:'0 0 24 24', fill:'none', stroke:'#4d4d4a', strokeWidth:2, strokeLinecap:'round', strokeLinejoin:'round' },
                React.createElement('path', { d:'M12 5v14' }),
                React.createElement('path', { d:'m19 12-7 7-7-7' })
              )
            )
          )
        ),

        // Thread list — desktop has its own scroller; mobile flows in main.
        React.createElement('div', { style:{ flex:1, overflowY: isMobile ? 'visible' : 'auto', padding:'6px' } },
          items.length === 0
            ? React.createElement('p', { style:{ padding:24, fontSize:13, color:'#4d4d4a', textAlign:'center', fontStyle:'italic' } }, 'Nothing here.')
            : React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:2 } },
                items.map(item =>
                  React.createElement(InboxRow, { key:item.id, item, isSelected:selected===item.id, onClick:()=>setSelected(item.id) })
                )
              )
        )
      ),

      // Detail col — hidden on mobile when no thread is open
      (!isMobile || mobileView === 'detail') && React.createElement('div', {
        style:{
          display:'flex', flexDirection:'column', background:'#fff',
          overflow: isMobile ? 'visible' : 'hidden',
          height: isMobile ? 'auto' : '100%',
        },
      },
        // Mobile: back-to-list header
        isMobile && selectedItem && React.createElement('div', {
          style:{
            display:'flex', alignItems:'center', gap:6,
            padding:'8px 8px 8px 6px',
            borderBottom:'1px solid #ebebe5',
            background:'#fff',
            flexShrink:0,
          },
        },
          React.createElement('button', {
            type:'button', onClick:()=>setSelected(null),
            style:{
              display:'inline-flex', alignItems:'center', gap:4,
              padding:'8px 10px 8px 6px',
              background:'transparent', border:'none', cursor:'pointer',
              color:'#4d4d4a', fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:500,
              borderRadius:6,
            },
          },
            React.createElement(BackArrow),
            'Inbox'
          )
        ),
        React.createElement(DetailPane, { item: selectedItem, isMobile })
      )
    )
  );
}

Object.assign(window, { BCInboxPanel });
