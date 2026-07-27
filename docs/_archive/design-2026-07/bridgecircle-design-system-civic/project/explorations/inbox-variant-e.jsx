// inbox-variant-e.jsx — TOGGLE-TOP TWO-COLUMN
// Combines Variant C's segmented toggle with the current inbox's list + detail.
// The left nav rail goes away entirely; the type filter moves to the top of the
// page. Priority lives as the first segment, so a single horizontal control
// drives the whole inbox.

function E_Row({ item, selected, onClick }) {
  const k = KIND_META[item.kind];
  return React.createElement('button', {
    type:'button', onClick,
    style:{
      width:'100%', textAlign:'left', cursor:'pointer',
      fontFamily:"'Inter',sans-serif",
      padding:'10px 12px', borderRadius:8,
      border:`1px solid ${selected ? 'rgba(37,99,235,.25)' : 'transparent'}`,
      background: selected ? 'rgba(37,99,235,.07)' : 'transparent',
      display:'flex', gap:11, transition:'all 150ms', position:'relative',
    },
    onMouseEnter:e=>{ if(!selected) e.currentTarget.style.background='rgba(235,235,229,.65)'; },
    onMouseLeave:e=>{ if(!selected) e.currentTarget.style.background='transparent'; },
  },
    React.createElement('div', { style:{ position:'relative', flexShrink:0 } },
      React.createElement(Avatar, { name:item.from, color:item.avatar, size:34 }),
      item.unread && React.createElement('span', { style:{ position:'absolute', top:-1, right:-1, width:8, height:8, borderRadius:'50%', background:'#a16207', border:'1.5px solid #f4f3ee' } })
    ),
    React.createElement('div', { style:{ minWidth:0, flex:1 } },
      React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', gap:6, alignItems:'center' } },
        React.createElement('span', { style:{ fontSize:13, fontWeight: item.unread ? 700 : 500, color:'#0c0c0b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, item.from),
        React.createElement(Mono, { size:9.5, color:'#4d4d4a' }, item.age, ' ago')
      ),
      React.createElement('div', { style:{ display:'flex', gap:6, margin:'3px 0', alignItems:'center' } },
        React.createElement('span', { style:{ width:6, height:6, borderRadius:'50%', background:k.color } }),
        React.createElement('span', { style:{ fontSize:10, fontWeight:700, color:k.color, textTransform:'uppercase', letterSpacing:'.10em' } }, k.label),
        item.state === 'needs_reply' && React.createElement(Pill, { tone:'warn', size:'sm' }, 'Needs reply'),
        item.state === 'awaiting'    && React.createElement(Pill, { tone:'muted', size:'sm' }, 'Awaiting reply'),
        React.createElement(Mono, { size:9.5, color:'#4d4d4a' }, `\u2019${String(item.cohort).slice(-2)}`)
      ),
      React.createElement('p', {
        style:{ fontSize:11.5, color: item.unread ? '#0c0c0b' : '#4d4d4a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight: item.unread ? 500 : 400 },
      }, item.ask)
    )
  );
}

function E_Detail({ item }) {
  if (!item) return React.createElement('div', {
    style:{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:32, textAlign:'center' },
  },
    React.createElement('div', null,
      React.createElement('p', { style:{ fontSize:16, fontWeight:600, color:'#0c0c0b', fontFamily:"'Inter Tight',sans-serif" } }, 'Nothing needs a reply.'),
      React.createElement('p', { style:{ fontSize:13, color:'#4d4d4a', marginTop:6 } }, 'Look around People or set what you\u2019re open to.')
    )
  );

  const k = KIND_META[item.kind];
  const isIncoming = item.state === 'needs_reply';
  const isAwaiting = item.state === 'awaiting';

  return React.createElement('div', { style:{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' } },
    // Header strip
    React.createElement('div', {
      style:{ padding:'16px 22px', borderBottom:'1px solid #ebebe5', display:'flex', gap:13, alignItems:'flex-start', flexShrink:0 },
    },
      React.createElement(Avatar, { name:item.from, color:item.avatar, size:46, square:true }),
      React.createElement('div', { style:{ flex:1, minWidth:0 } },
        React.createElement('div', { style:{ marginBottom:3 } }, React.createElement(Kicker, { color:k.color }, `${k.label} \u00b7 ${isAwaiting ? 'you asked' : isIncoming ? 'incoming' : 'ongoing'}`)),
        React.createElement('h3', { style:{ fontFamily:"'Inter Tight',sans-serif", fontSize:19, fontWeight:600, letterSpacing:'-.01em', color:'#0c0c0b' } }, item.from),
        React.createElement('p', { style:{ fontSize:12, color:'#4d4d4a', marginTop:2 } },
          item.role, ' \u00b7 ', React.createElement(Mono, { size:11 }, `Class of \u2019${String(item.cohort).slice(-2)}`)
        )
      ),
      React.createElement(Mono, { size:11, color:'#4d4d4a' }, item.age, ' ago')
    ),

    // Body — the ask + context
    React.createElement('div', { style:{ flex:1, overflowY:'auto', padding:'20px 22px' } },
      React.createElement('p', { style:{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.10em', color:'#4d4d4a', marginBottom:9 } },
        isAwaiting ? 'Your ask' : isIncoming ? 'Their ask' : 'Latest message'
      ),
      React.createElement('div', {
        style:{ borderLeft:`3px solid ${k.color}`, paddingLeft:14, fontStyle:'italic', fontSize:14, lineHeight:1.55, color:'#0c0c0b' },
      }, `\u201c${item.ask}\u201d`),

      // Quick context block — placeholder for richer detail
      !isAwaiting && React.createElement('div', { style:{ marginTop:22 } },
        React.createElement('p', { style:{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.10em', color:'#4d4d4a', marginBottom:8 } }, 'About them'),
        React.createElement('div', {
          style:{ background:'#fafaf9', border:'1px solid #ebebe5', borderRadius:10, padding:'12px 14px', fontSize:12.5, color:'#4d4d4a', lineHeight:1.55 },
        },
          React.createElement('p', null, item.role),
          React.createElement('div', { style:{ display:'flex', gap:6, marginTop:8 } },
            React.createElement(Pill, { tone:'muted', size:'sm' }, '3 mutual'),
            React.createElement(Pill, { tone:'muted', size:'sm' }, 'Class of \u2019', String(item.cohort).slice(-2)),
            React.createElement(Pill, { tone:'muted', size:'sm' }, 'Verified')
          )
        )
      )
    ),

    // Action footer
    React.createElement('div', { style:{ borderTop:'1px solid #dcdcd6', padding:'14px 22px', display:'flex', gap:8, background:'#fafaf9', flexShrink:0 } },
      isAwaiting
        ? [
            React.createElement(Button, { key:'nudge', variant:'outline', size:'md' }, 'Send a gentle nudge'),
            React.createElement(Button, { key:'wd', variant:'ghost', size:'md', style:{ color:'#b9472a' } }, 'Withdraw request')
          ]
        : isIncoming
        ? [
            React.createElement(Button, { key:'a', variant:'cta', size:'md' },
              React.createElement(I.check, { size:13, color:'#0c0c0b' }), 'Accept & reply'
            ),
            React.createElement(Button, { key:'s', variant:'outline', size:'md' }, 'Snooze 2d'),
            React.createElement(Button, { key:'d', variant:'ghost', size:'md', style:{ color:'#4d4d4a' } }, 'Decline'),
            React.createElement('span', { key:'sp', style:{ flex:1 } }),
            React.createElement(Button, { key:'p', variant:'ghost', size:'md', style:{ color:'#4d4d4a' } },
              'View profile ', React.createElement(I.arrowRight, { size:12, color:'#4d4d4a' })
            )
          ]
        : [
            React.createElement(Button, { key:'r', variant:'primary', size:'md' },
              React.createElement(I.reply, { size:13 }), 'Continue thread'
            ),
            React.createElement(Button, { key:'m', variant:'ghost', size:'md', style:{ color:'#4d4d4a' } }, 'Mark read')
          ]
    )
  );
}

function VariantE_PillsTop() {
  const [filter, setFilter] = React.useState('priority');
  const [role, setRole] = React.useState('all'); // all | helping | getting
  const [selected, setSelected] = React.useState('r1');

  const segments = [
    { id:'priority',   label:'Priority',    color:'#a16207' },
    { id:'all',        label:'All',         color:'#0c0c0b' },
    { id:'advice',     label:'Advice',      color:'#2563eb' },
    { id:'mentorship', label:'Mentorship',  color:'#3b6e51' },
    { id:'connection', label:'Connections', color:'#722f37' },
  ];

  const counts = {
    priority:   INBOX.filter(i => i.state === 'needs_reply').length,
    all:        INBOX.filter(i => i.state !== 'closed').length,
    advice:     INBOX.filter(i => i.kind === 'advice'     && i.state !== 'closed').length,
    mentorship: INBOX.filter(i => i.kind === 'mentorship' && i.state !== 'closed').length,
    connection: INBOX.filter(i => i.kind === 'connection' && i.state !== 'closed').length,
  };

  const items = (() => {
    let pool;
    if (filter === 'priority') pool = INBOX.filter(i => i.state === 'needs_reply');
    else if (filter === 'all') pool = INBOX.filter(i => i.state !== 'closed');
    else                       pool = INBOX.filter(i => i.kind === filter && i.state !== 'closed');
    if (role === 'helping') pool = pool.filter(i => i.dir === 'helping' || i.dir === 'incoming');
    if (role === 'getting') pool = pool.filter(i => i.dir === 'getting');
    return pool;
  })();

  const selectedItem = INBOX.find(i => i.id === selected) || null;

  return React.createElement('div', {
    style:{
      height:'100%', display:'grid', gridTemplateRows:'auto 1fr',
      background:'#fafaf9', fontFamily:"'Inter',sans-serif", overflow:'hidden',
    },
  },

    // ── Top bar — title sits inline with the segmented toggle ──────────────
    React.createElement('header', {
      style:{
        padding:'0 22px',
        background:'#fff', borderBottom:'1px solid #dcdcd6',
        display:'flex', alignItems:'stretch', gap:24,
      },
    },
      React.createElement('div', { style:{ display:'flex', alignItems:'center', flexShrink:0 } },
        React.createElement('h1', {
          style:{ fontFamily:"'Inter Tight',sans-serif", fontSize:22, fontWeight:600, letterSpacing:'-.01em' },
        }, 'Inbox')
      ),

      // The segmented toggle — inline with title
      React.createElement('div', { style:{ display:'flex', gap:0, alignItems:'stretch' } },
        segments.map(s => {
          const active = filter === s.id;
          const n = counts[s.id];
          return React.createElement('button', {
            key:s.id, onClick:()=>setFilter(s.id),
            style:{
              display:'flex', alignItems:'center', gap:7,
              padding:'9px 14px 11px',
              background: active ? `color-mix(in srgb, ${s.color} 9%, transparent)` : 'transparent',
              border:'none', cursor:'pointer',
              fontFamily:'inherit',
              borderBottom: `2px solid ${active ? s.color : 'transparent'}`,
              marginBottom:-1,
              transition:'all 150ms',
            },
            onMouseEnter:e=>{ if(!active){ e.currentTarget.style.background='rgba(235,235,229,.55)'; e.currentTarget.style.borderBottomColor='#dcdcd6'; } },
            onMouseLeave:e=>{ if(!active){ e.currentTarget.style.background='transparent'; e.currentTarget.style.borderBottomColor='transparent'; } },
          },
            s.id === 'priority' && React.createElement('span', {
              style:{ width:7, height:7, borderRadius:'50%', background: active ? '#a16207' : 'rgba(161,98,7,.5)', boxShadow: active ? '0 0 0 2.5px rgba(161,98,7,.20)' : 'none' },
            }),
            React.createElement('span', { style:{ fontSize:13, fontWeight: active ? 700 : 500, color: active ? s.color : '#4d4d4a' } }, s.label),
            n > 0 && React.createElement('span', {
              style:{
                minWidth:18, height:18, padding:'0 6px', borderRadius:9,
                background: active ? s.color : '#ebebe5',
                color: active ? '#fff' : '#4d4d4a',
                fontSize:9.5, fontWeight:700, fontFamily:"'JetBrains Mono',monospace",
                display:'inline-flex', alignItems:'center', justifyContent:'center',
              },
            }, n)
          );
        })
      )
    ),

    // ── Body — list + detail ────────────────────────────────────────────────
    React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'360px 1fr', minHeight:0, overflow:'hidden' } },

      // List col
      React.createElement('div', {
        style:{ display:'flex', flexDirection:'column', borderRight:'1px solid #dcdcd6', background:'#fff', overflow:'hidden' },
      },
        // Sub-filter: role (As helper / As asker) + count + sort
        React.createElement('div', {
          style:{ display:'flex', flexDirection:'column', gap:8, padding:'10px 12px', borderBottom:'1px solid #ebebe5', flexShrink:0, background:'rgba(244,243,238,.45)' },
        },
          // Role segmented control
          React.createElement('div', { style:{ display:'flex', gap:4, background:'#fff', borderRadius:8, padding:3, border:'1px solid #ebebe5' } },
            [
              ['all',     'All',       null],
              ['helping', 'As helper', '#3b6e51'],
              ['getting', 'As asker',  '#a16207'],
            ].map(([id, label, color]) => {
              const active = role === id;
              return React.createElement('button', {
                key:id, onClick:()=>setRole(id),
                style:{
                  flex:1, height:26, borderRadius:6, border:'none', cursor:'pointer',
                  background: active ? (color ? `color-mix(in srgb, ${color} 10%, #fff)` : '#0c0c0b') : 'transparent',
                  color: active ? (color || '#fff') : '#4d4d4a',
                  border: active && color ? `1px solid color-mix(in srgb, ${color} 30%, transparent)` : '1px solid transparent',
                  fontFamily:'inherit', fontSize:11, fontWeight: active ? 700 : 500,
                  display:'inline-flex', alignItems:'center', justifyContent:'center', gap:5,
                  transition:'all 150ms',
                },
              },
                color && React.createElement('span', { style:{ width:6, height:6, borderRadius:'50%', background: active ? color : 'transparent', border:`1.5px solid ${color || 'transparent'}` } }),
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
              style:{ fontSize:11, color:'#4d4d4a', background:'transparent', border:'none', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 },
            },
              'Newest first ', React.createElement(I.arrowDown, { size:10, color:'#4d4d4a' })
            )
          )
        ),
        React.createElement('div', { style:{ flex:1, overflowY:'auto', padding:'6px' } },
          items.length === 0
            ? React.createElement('p', { style:{ padding:24, fontSize:13, color:'#4d4d4a', textAlign:'center', fontStyle:'italic' } }, 'Nothing here.')
            : React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:2 } },
                items.map(it => React.createElement(E_Row, { key:it.id, item:it, selected: selected === it.id, onClick:()=>setSelected(it.id) }))
              )
        )
      ),

      // Detail col
      React.createElement('div', { style:{ display:'flex', flexDirection:'column', background:'#fff', overflow:'hidden' } },
        React.createElement(E_Detail, { item: selectedItem })
      )
    )
  );
}

Object.assign(window, { VariantE_PillsTop });
