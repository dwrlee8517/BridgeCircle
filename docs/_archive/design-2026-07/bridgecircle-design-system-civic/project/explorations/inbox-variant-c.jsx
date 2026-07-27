// inbox-variant-c.jsx — DUAL ROLE SPLIT
// Two parallel columns: "You're helping" / "You're being helped".
// Makes the role duality the primary spatial structure rather than a sub-filter.
// One detail pane below; selecting an item from either column opens it.

function RoleCard({ item, selected, onClick }) {
  const k = KIND_META[item.kind];
  return React.createElement('button', {
    type:'button', onClick,
    style:{
      width:'100%', textAlign:'left', cursor:'pointer',
      fontFamily:"'Inter',sans-serif",
      background: selected ? '#fff' : 'transparent',
      border:`1px solid ${selected ? '#0c0c0b' : 'transparent'}`,
      borderRadius:9, padding:'10px 12px',
      boxShadow: selected ? '0 4px 14px -4px rgba(12,12,11,.10)' : 'none',
      transition:'all 150ms',
      position:'relative',
    },
    onMouseEnter:e=>{ if(!selected) e.currentTarget.style.background='rgba(255,255,255,.5)'; },
    onMouseLeave:e=>{ if(!selected) e.currentTarget.style.background='transparent'; },
  },
    React.createElement('div', { style:{ display:'flex', gap:10, alignItems:'flex-start' } },
      React.createElement('div', { style:{ position:'relative', flexShrink:0 } },
        React.createElement(Avatar, { name:item.from, color:item.avatar, size:32 }),
        item.unread && React.createElement('span', { style:{ position:'absolute', top:-2, right:-2, width:8, height:8, borderRadius:'50%', background:'#a16207', border:'1.5px solid #f4f3ee' } })
      ),
      React.createElement('div', { style:{ minWidth:0, flex:1 } },
        React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:6 } },
          React.createElement('span', { style:{ fontSize:13, fontWeight: item.unread ? 700 : 600, color:'#0c0c0b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, item.from),
          React.createElement(Mono, { size:9.5, color:'#4d4d4a' }, item.age)
        ),
        React.createElement('div', { style:{ display:'flex', gap:5, alignItems:'center', margin:'3px 0 5px' } },
          React.createElement('span', { style:{ width:6, height:6, borderRadius:'50%', background:k.color } }),
          React.createElement('span', { style:{ fontSize:9.5, fontWeight:700, color:k.color, textTransform:'uppercase', letterSpacing:'.08em' } }, k.label)
        ),
        React.createElement('p', { style:{ fontSize:11.5, color:item.unread ? '#0c0c0b' : '#4d4d4a', lineHeight:1.4, overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' } }, item.ask)
      )
    )
  );
}

function RoleColumn({ title, kicker, accent, items, selected, onSelect, side }) {
  return React.createElement('div', {
    style:{
      flex:1, display:'flex', flexDirection:'column', minHeight:0,
      borderRight: side === 'left' ? '1px solid #dcdcd6' : 'none',
      background: side === 'left' ? 'linear-gradient(180deg, rgba(59,110,81,.04), transparent 30%)' : 'linear-gradient(180deg, rgba(161,98,7,.05), transparent 30%)',
    },
  },
    // Column header — bold, with role glyph
    React.createElement('div', {
      style:{
        padding:'18px 18px 14px',
        borderBottom:'1px solid #ebebe5',
        background:'rgba(255,255,255,.55)',
      },
    },
      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:9, marginBottom:6 } },
        React.createElement('span', { style:{ width:8, height:8, borderRadius:'50%', background:accent, boxShadow:`0 0 0 3px ${accent}22` } }),
        React.createElement('span', { style:{ fontSize:10, fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase', color:accent } }, kicker)
      ),
      React.createElement('div', { style:{ display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:8 } },
        React.createElement('h2', {
          style:{ fontFamily:"'Inter Tight',sans-serif", fontSize:17, fontWeight:600, color:'#0c0c0b', letterSpacing:'-.01em' },
        }, title),
        React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:6 } },
          React.createElement(Mono, { size:11, color:'#4d4d4a' }, items.length),
          items.filter(i=>i.unread).length > 0 && React.createElement('span', {
            style:{ background:accent, color:'#fff', minWidth:16, height:16, borderRadius:8, padding:'0 5px', fontSize:9.5, fontWeight:700, display:'inline-flex', alignItems:'center', justifyContent:'center' },
          }, items.filter(i=>i.unread).length, ' new')
        )
      )
    ),

    // List
    React.createElement('div', { style:{ flex:1, overflowY:'auto', padding:'8px 8px' } },
      items.length === 0
        ? React.createElement('p', { style:{ padding:'30px 16px', textAlign:'center', fontSize:12, color:'#4d4d4a', fontStyle:'italic' } }, 'Nothing here yet.')
        : React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:2 } },
            items.map(it => React.createElement(RoleCard, { key:it.id, item:it, selected: selected === it.id, onClick:()=>onSelect(it.id) }))
          )
    )
  );
}

function VariantC_Split() {
  const [filter, setFilter] = React.useState('all');
  const [selected, setSelected] = React.useState('r1');

  const all = INBOX.filter(i => i.state !== 'closed');
  const filtered = filter === 'all' ? all : all.filter(i => i.kind === filter);

  const helping = filtered.filter(i => i.dir === 'helping' || (i.dir === 'incoming'));
  const getting = filtered.filter(i => i.dir === 'getting' || (i.state === 'awaiting'));

  const selectedItem = INBOX.find(i => i.id === selected);
  const k = selectedItem ? KIND_META[selectedItem.kind] : null;

  return React.createElement('div', {
    style:{
      height:'100%', display:'grid', gridTemplateRows:'auto 1fr auto',
      background:'#fafaf9', fontFamily:"'Inter',sans-serif", overflow:'hidden',
    },
  },
    // Top bar — title + filter pills shared by both columns
    React.createElement('header', {
      style:{
        padding:'14px 22px',
        borderBottom:'1px solid #dcdcd6', background:'#fff',
        display:'flex', alignItems:'center', justifyContent:'space-between', gap:14,
      },
    },
      React.createElement('div', { style:{ display:'flex', alignItems:'baseline', gap:10 } },
        React.createElement('h1', {
          style:{ fontFamily:"'Inter Tight',sans-serif", fontSize:20, fontWeight:600, letterSpacing:'-.01em' },
        }, 'Inbox'),
        React.createElement('span', { style:{ fontSize:12, color:'#4d4d4a' } }, 'Two sides of the same work.')
      ),
      React.createElement('div', { style:{ display:'flex', gap:5, background:'#f4f3ee', borderRadius:9, padding:3 } },
        [['all','All'],['advice','Advice'],['mentorship','Mentorship'],['connection','Connections']].map(([id,label]) =>
          React.createElement('button', {
            key:id, onClick:()=>setFilter(id),
            style:{
              padding:'5px 11px', borderRadius:7, border:'none', cursor:'pointer',
              background: filter === id ? '#fff' : 'transparent',
              boxShadow: filter === id ? '0 1px 2px rgba(12,12,11,.06)' : 'none',
              fontFamily:'inherit', fontSize:11.5, fontWeight: filter === id ? 700 : 500,
              color: filter === id ? '#0c0c0b' : '#4d4d4a',
              transition:'all 150ms',
            },
          }, label)
        )
      )
    ),

    // The two columns
    React.createElement('div', { style:{ display:'flex', minHeight:0, overflow:'hidden' } },
      React.createElement(RoleColumn, {
        title:"You're helping", kicker:'As helper', accent:'#3b6e51',
        items: helping, selected, onSelect:setSelected, side:'left',
      }),
      React.createElement(RoleColumn, {
        title:"You're being helped", kicker:'As asker', accent:'#a16207',
        items: getting, selected, onSelect:setSelected, side:'right',
      }),
    ),

    // Bottom detail strip — preview of selection, click expands
    selectedItem && React.createElement('footer', {
      style:{
        borderTop:'1px solid #dcdcd6', background:'#fff',
        padding:'14px 22px', display:'flex', gap:14, alignItems:'center',
        boxShadow:'0 -4px 14px -6px rgba(12,12,11,.06)',
      },
    },
      React.createElement(Avatar, { name:selectedItem.from, color:selectedItem.avatar, size:38, square:true }),
      React.createElement('div', { style:{ flex:1, minWidth:0 } },
        React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:8, marginBottom:3 } },
          React.createElement('span', { style:{ fontSize:13, fontWeight:600 } }, selectedItem.from),
          React.createElement(Pill, { tone:selectedItem.kind, size:'sm' }, k.label),
          React.createElement(Mono, { size:10, color:'#4d4d4a' }, '\u00b7 ', selectedItem.age, ' ago')
        ),
        React.createElement('p', { style:{ fontSize:12, color:'#4d4d4a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, `\u201c${selectedItem.ask}\u201d`)
      ),
      React.createElement('div', { style:{ display:'flex', gap:8 } },
        React.createElement(Button, { variant:'outline', size:'sm' }, 'Snooze'),
        React.createElement(Button, { variant:'cta', size:'sm' }, 'Open & reply ', React.createElement(I.arrowRight, { size:13, color:'#0c0c0b' }))
      )
    )
  );
}

Object.assign(window, { VariantC_Split });
