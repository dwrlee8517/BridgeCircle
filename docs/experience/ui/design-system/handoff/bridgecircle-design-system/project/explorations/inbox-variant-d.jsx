// inbox-variant-d.jsx — RELATIONSHIP PIPELINE
// 4-column kanban by workflow state: Needs reply / Drafted / Awaiting them / Closed.
// Each item is a compact card. Reframes the inbox as a relationship pipeline you
// move people through, not a list of unread items. Useful when relationships are
// long-running and you care about flow, not zero.

function PipelineCard({ item, dim }) {
  const k = KIND_META[item.kind];
  return React.createElement('article', {
    style:{
      background:'#fff', borderRadius:8,
      border:`1px solid ${item.unread ? 'rgba(161,98,7,.30)' : '#ebebe5'}`,
      padding:'10px 11px',
      boxShadow:'0 1px 0 rgba(12,12,11,.03)',
      fontFamily:"'Inter',sans-serif",
      opacity: dim ? .7 : 1,
      cursor:'grab',
      transition:'all 150ms',
      position:'relative',
    },
    onMouseEnter:e=>{ e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 4px 12px -2px rgba(12,12,11,.08)'; },
    onMouseLeave:e=>{ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 1px 0 rgba(12,12,11,.03)'; },
  },
    // Kind strip top
    React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:6, marginBottom:8 } },
      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:5 } },
        React.createElement('span', { style:{ width:6, height:6, borderRadius:'50%', background:k.color } }),
        React.createElement('span', { style:{ fontSize:9, fontWeight:700, color:k.color, textTransform:'uppercase', letterSpacing:'.10em' } }, k.label)
      ),
      React.createElement(Mono, { size:9, color:'#4d4d4a' }, item.age)
    ),

    // Identity row
    React.createElement('div', { style:{ display:'flex', gap:8, alignItems:'center', marginBottom:7 } },
      React.createElement(Avatar, { name:item.from, color:item.avatar, size:24 }),
      React.createElement('div', { style:{ minWidth:0, flex:1 } },
        React.createElement('div', { style:{ fontSize:12, fontWeight:600, color:'#0c0c0b', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' } }, item.from),
        React.createElement('div', { style:{ fontSize:10, color:'#4d4d4a', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' } }, item.role)
      )
    ),

    // Ask snippet
    React.createElement('p', {
      style:{ fontSize:11, color:'#4d4d4a', lineHeight:1.4, overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', fontStyle:'italic', marginBottom:8 },
    }, `\u201c${item.ask}\u201d`),

    // Footer — direction tag
    React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:6, paddingTop:7, borderTop:'1px solid #ebebe5' } },
      React.createElement('span', { style:{ fontSize:9.5, color:'#4d4d4a', display:'flex', alignItems:'center', gap:4, fontWeight:600 } },
        item.dir === 'helping'
          ? [ React.createElement(I.arrowDown, { key:'i', size:10, color:'#3b6e51' }), React.createElement('span', { key:'l', style:{ color:'#3b6e51' } }, 'Helping') ]
          : item.dir === 'getting'
          ? [ React.createElement(I.arrowUp, { key:'i', size:10, color:'#a16207' }), React.createElement('span', { key:'l', style:{ color:'#a16207' } }, 'Getting help') ]
          : [ React.createElement('span', { key:'l', style:{ color:'#4d4d4a' } }, 'New incoming') ]
      ),
      item.unread && React.createElement('span', { style:{ width:6, height:6, borderRadius:'50%', background:'#a16207', boxShadow:'0 0 0 2.5px rgba(161,98,7,.18)' } })
    )
  );
}

function PipelineColumn({ id, title, hint, color, accent, items, totalCount, isHighlight }) {
  return React.createElement('div', {
    style:{
      flex:1, display:'flex', flexDirection:'column', minWidth:0, minHeight:0,
      background: isHighlight ? `linear-gradient(180deg, ${accent}10, transparent 60%), #fafaf9` : '#fafaf9',
      borderRight:'1px solid #dcdcd6',
    },
  },
    // Header
    React.createElement('div', {
      style:{
        padding:'14px 14px 10px',
        position:'sticky', top:0, zIndex:1,
        background: isHighlight ? `linear-gradient(180deg, ${accent}18, ${accent}06)` : '#fafaf9',
        borderBottom: isHighlight ? `2px solid ${color}` : '1px solid #ebebe5',
      },
    },
      React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 } },
        React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:7 } },
          React.createElement('span', { style:{ width:8, height:8, borderRadius:2, background:color } }),
          React.createElement('h3', { style:{ fontSize:12, fontWeight:700, color:'#0c0c0b', letterSpacing:'.01em' } }, title)
        ),
        React.createElement('span', {
          style:{
            minWidth:18, height:18, padding:'0 6px', borderRadius:9,
            background: isHighlight ? color : '#ebebe5',
            color: isHighlight ? '#fff' : '#4d4d4a',
            fontSize:9.5, fontWeight:700,
            display:'inline-flex', alignItems:'center', justifyContent:'center',
            fontFamily:"'JetBrains Mono',monospace",
          },
        }, items.length)
      ),
      React.createElement('p', { style:{ fontSize:10.5, color:'#4d4d4a', fontStyle:'italic' } }, hint)
    ),

    // Cards
    React.createElement('div', { style:{ flex:1, overflowY:'auto', padding:'8px 10px 14px', display:'flex', flexDirection:'column', gap:7 } },
      items.length === 0
        ? React.createElement('div', {
            style:{ padding:'30px 10px', textAlign:'center', fontSize:11, color:'#4d4d4a',
              border:'1.5px dashed #dcdcd6', borderRadius:8, marginTop:6 },
          }, 'Nothing here.')
        : items.map(it => React.createElement(PipelineCard, { key:it.id, item:it, dim: id === 'closed' }))
    )
  );
}

function VariantD_Pipeline() {
  const [filter, setFilter] = React.useState('all');

  const all = filter === 'all' ? INBOX : INBOX.filter(i => i.kind === filter);

  const cols = [
    { id:'needs_reply', title:'NEEDS REPLY',       hint:'\u2014 your move',          color:'#a16207', accent:'rgba(161,98,7,1)', highlight:true,
      items: all.filter(i => i.state === 'needs_reply') },
    { id:'drafted',     title:'IN CONVERSATION',   hint:'\u2014 ongoing threads',    color:'#2563eb', accent:'rgba(37,99,235,1)',
      items: all.filter(i => i.state === 'drafted') },
    { id:'awaiting',    title:'WAITING ON THEM',   hint:'\u2014 you sent, they owe', color:'#4d4d4a', accent:'rgba(77,77,74,1)',
      items: all.filter(i => i.state === 'awaiting') },
    { id:'closed',      title:'CLOSED THIS WEEK',  hint:'\u2014 wrapped or thanked', color:'#3b6e51', accent:'rgba(59,110,81,1)',
      items: all.filter(i => i.state === 'closed') },
  ];

  return React.createElement('div', {
    style:{
      height:'100%', display:'grid', gridTemplateRows:'auto 1fr',
      background:'#fafaf9', fontFamily:"'Inter',sans-serif", overflow:'hidden',
    },
  },
    // Top bar
    React.createElement('header', {
      style:{
        padding:'16px 22px 14px',
        borderBottom:'1px solid #dcdcd6', background:'#fff',
        display:'flex', alignItems:'center', justifyContent:'space-between', gap:14, flexWrap:'wrap',
      },
    },
      React.createElement('div', null,
        React.createElement(Kicker, null, 'Pipeline view'),
        React.createElement('h1', {
          style:{ fontFamily:"'Inter Tight',sans-serif", fontSize:22, fontWeight:600, letterSpacing:'-.01em', marginTop:7, lineHeight:1.1 },
        }, 'Inbox'),
        React.createElement('p', { style:{ fontSize:12, color:'#4d4d4a', marginTop:4 } }, 'Drag relationships through the stages. Aging items glow.')
      ),

      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:10 } },
        // Type filter pills
        React.createElement('div', { style:{ display:'flex', gap:4, background:'#f4f3ee', borderRadius:8, padding:3 } },
          [['all','All'],['advice','Advice'],['mentorship','Mentorship'],['connection','Connections']].map(([id,label]) =>
            React.createElement('button', {
              key:id, onClick:()=>setFilter(id),
              style:{
                padding:'5px 10px', borderRadius:6, border:'none', cursor:'pointer',
                background: filter === id ? '#fff' : 'transparent',
                boxShadow: filter === id ? '0 1px 2px rgba(12,12,11,.06)' : 'none',
                fontFamily:'inherit', fontSize:11, fontWeight: filter === id ? 700 : 500,
                color: filter === id ? '#0c0c0b' : '#4d4d4a',
                transition:'all 150ms',
              },
            }, label)
          )
        ),
        React.createElement('div', { style:{ width:1, height:20, background:'#dcdcd6' } }),
        React.createElement(Button, { variant:'outline', size:'sm' },
          React.createElement(I.search, { size:12 }), 'Search'
        )
      )
    ),

    // The 4 columns
    React.createElement('div', { style:{ display:'flex', minHeight:0, overflow:'hidden' } },
      cols.map(c => React.createElement(PipelineColumn, {
        key:c.id, id:c.id, title:c.title, hint:c.hint, color:c.color, accent:c.accent,
        items:c.items, isHighlight:c.highlight,
      }))
    )
  );
}

Object.assign(window, { VariantD_Pipeline });
