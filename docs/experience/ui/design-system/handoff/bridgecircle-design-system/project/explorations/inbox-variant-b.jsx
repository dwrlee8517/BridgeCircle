// inbox-variant-b.jsx — EDITORIAL DIGEST
// Scrollable single column. Each item is a self-contained editorial decision card
// with kicker, name as headline, ask as pull-quote, and inline actions.
// No list/detail split — every item is in-place actionable. Reads like a curated
// newsletter of relationship work.

function DigestCard({ item, first }) {
  const k = KIND_META[item.kind];
  const isIncoming = item.dir === 'incoming';
  const isOutgoing = item.state === 'awaiting';

  return React.createElement('article', {
    style:{
      background:'#fff',
      borderRadius:12,
      border:`1px solid ${item.unread ? 'rgba(37,99,235,.18)' : '#ebebe5'}`,
      padding:'20px 22px 18px',
      boxShadow: item.unread ? '0 1px 0 rgba(12,12,11,.03), 0 4px 16px -8px rgba(37,99,235,.08)' : '0 1px 0 rgba(12,12,11,.03)',
      position:'relative',
    },
  },
    // Top meta row — kicker + age
    React.createElement('div', {
      style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 },
    },
      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:10 } },
        React.createElement(Kicker, { color:k.color },
          isOutgoing ? `${k.label} \u00b7 you asked` : (isIncoming ? `${k.label} \u00b7 they asked` : `${k.label} \u00b7 ongoing`)
        ),
        item.unread && React.createElement('span', {
          style:{ width:6, height:6, borderRadius:'50%', background:'#a16207', boxShadow:'0 0 0 3px rgba(161,98,7,.18)' },
        })
      ),
      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:8 } },
        React.createElement(Mono, { size:11, color:'#4d4d4a' }, item.age, ' ago'),
        isOutgoing && React.createElement(Pill, { tone:'muted', size:'sm' }, 'Awaiting reply')
      )
    ),

    // Identity row
    React.createElement('header', { style:{ display:'flex', gap:14, alignItems:'flex-start', marginBottom:14 } },
      React.createElement(Avatar, { name:item.from, color:item.avatar, size:42 }),
      React.createElement('div', { style:{ flex:1, minWidth:0 } },
        React.createElement('h3', {
          style:{ fontFamily:"'Inter Tight',sans-serif", fontSize:18, fontWeight:600, letterSpacing:'-.01em', color:'#0c0c0b', lineHeight:1.2 },
        }, item.from),
        React.createElement('p', { style:{ fontSize:12.5, color:'#4d4d4a', marginTop:2 } },
          item.role, ' \u00b7 ', React.createElement(Mono, { size:11 }, `\u2019${String(item.cohort).slice(-2)}`)
        )
      )
    ),

    // Pull quote — the ask itself
    React.createElement('blockquote', {
      style:{
        borderLeft:`3px solid ${k.color}`,
        paddingLeft:14, marginBottom:16,
        fontFamily:"'Inter Tight',sans-serif",
        fontSize:15.5, lineHeight:1.5, fontStyle:'italic',
        color:'#0c0c0b', letterSpacing:'-.003em',
      },
    }, `\u201c${item.ask}\u201d`),

    // Actions — varies by direction/type
    React.createElement('div', { style:{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' } },
      isOutgoing
        ? [
            React.createElement(Button, { key:'nudge', variant:'outline', size:'sm' }, 'Send a gentle nudge'),
            React.createElement(Button, { key:'withdraw', variant:'ghost', size:'sm', style:{ color:'#b9472a' } }, 'Withdraw'),
          ]
        : isIncoming
        ? [
            React.createElement(Button, { key:'accept', variant:'cta', size:'sm' },
              React.createElement(I.check, { size:13, color:'#0c0c0b' }), 'Accept & reply'
            ),
            React.createElement(Button, { key:'later', variant:'outline', size:'sm' }, 'Snooze 2d'),
            React.createElement(Button, { key:'decline', variant:'ghost', size:'sm', style:{ color:'#4d4d4a' } }, 'Decline'),
          ]
        : [
            React.createElement(Button, { key:'reply', variant:'primary', size:'sm' },
              React.createElement(I.reply, { size:13 }), 'Continue thread'
            ),
            React.createElement(Button, { key:'archive', variant:'ghost', size:'sm', style:{ color:'#4d4d4a' } }, 'Mark read'),
          ],
      React.createElement('span', { style:{ marginLeft:'auto', fontSize:11, color:'#4d4d4a', display:'flex', alignItems:'center', gap:4 } },
        'View profile ', React.createElement(I.arrowRight, { size:11, color:'#4d4d4a' })
      )
    )
  );
}

function DigestSection({ title, items, accent = '#0c0c0b', subtitle, first }) {
  if (!items.length) return null;
  return React.createElement('section', { style:{ marginBottom: first ? 32 : 28 } },
    React.createElement('header', { style:{ display:'flex', alignItems:'baseline', gap:12, marginBottom:14, padding:'0 4px' } },
      React.createElement('h2', {
        style:{ fontFamily:"'Inter Tight',sans-serif", fontSize:22, fontWeight:600, color:'#0c0c0b', letterSpacing:'-.01em' },
      }, title),
      React.createElement('span', { style:{ width:1, height:14, background:'#dcdcd6' } }),
      React.createElement(Mono, { size:11, color:'#4d4d4a' }, `${items.length} ${items.length === 1 ? 'item' : 'items'}`),
      subtitle && React.createElement('span', { style:{ fontSize:12.5, color:'#4d4d4a', fontStyle:'italic' } }, subtitle)
    ),
    React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:12 } },
      items.map(it => React.createElement(DigestCard, { key:it.id, item:it }))
    )
  );
}

function VariantB_Digest() {
  const priority = INBOX.filter(i => i.state === 'needs_reply');
  const active   = INBOX.filter(i => i.state === 'drafted');
  const awaiting = INBOX.filter(i => i.state === 'awaiting');

  return React.createElement('div', {
    style:{
      height:'100%', overflowY:'auto',
      background:'#fafaf9', fontFamily:"'Inter',sans-serif",
    },
  },
    // Masthead
    React.createElement('header', {
      style:{
        padding:'30px 36px 24px',
        borderBottom:'1px solid #ebebe5',
        background:'linear-gradient(180deg, rgba(255,255,255,.7), transparent), #fafaf9',
      },
    },
      React.createElement(Kicker, null, 'Today \u00b7 Tuesday, May 27'),
      React.createElement('h1', {
        style:{ fontFamily:"'Inter Tight',sans-serif", fontSize:32, fontWeight:600, letterSpacing:'-.02em', color:'#0c0c0b', marginTop:10, lineHeight:1.1 },
      }, 'Your relationship work'),
      React.createElement('p', {
        style:{ fontSize:14, color:'#4d4d4a', marginTop:6, maxWidth:480, lineHeight:1.55 },
      }, `${priority.length} need a reply, ${active.length} threads are open, ${awaiting.length} are waiting on someone else.`),

      // Quick stats strip
      React.createElement('div', { style:{ display:'flex', gap:18, marginTop:22, alignItems:'center' } },
        React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:7 } },
          React.createElement('span', { style:{ width:8, height:8, borderRadius:'50%', background:'#a16207', boxShadow:'0 0 0 3px rgba(161,98,7,.18)' } }),
          React.createElement('span', { style:{ fontSize:12, fontWeight:600 } }, 'Priority'),
          React.createElement(Mono, { size:11, color:'#4d4d4a' }, priority.length)
        ),
        React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:7 } },
          React.createElement('span', { style:{ width:8, height:8, borderRadius:'50%', background:'#2563eb' } }),
          React.createElement('span', { style:{ fontSize:12, fontWeight:600 } }, 'Open'),
          React.createElement(Mono, { size:11, color:'#4d4d4a' }, active.length)
        ),
        React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:7 } },
          React.createElement('span', { style:{ width:8, height:8, borderRadius:'50%', background:'#4d4d4a' } }),
          React.createElement('span', { style:{ fontSize:12, fontWeight:600 } }, 'Sent'),
          React.createElement(Mono, { size:11, color:'#4d4d4a' }, awaiting.length)
        ),
        React.createElement('div', { style:{ marginLeft:'auto', display:'flex', gap:8 } },
          React.createElement(Button, { variant:'outline', size:'sm' },
            React.createElement(I.search, { size:12 }), 'Search'
          ),
          React.createElement(Button, { variant:'outline', size:'sm' }, 'All time')
        )
      )
    ),

    // Body — sectioned digest
    React.createElement('div', { style:{ padding:'28px 36px 60px', maxWidth:760, margin:'0 auto' } },
      React.createElement(DigestSection, {
        title:'Needs a reply',
        subtitle:'\u2014 try not to leave these past two days',
        items: priority,
        first:true,
      }),
      React.createElement(DigestSection, {
        title:'Open threads',
        subtitle:'\u2014 they replied; your turn',
        items: active,
      }),
      React.createElement(DigestSection, {
        title:'Waiting on them',
        items: awaiting,
      }),

      // Footer mark
      React.createElement('div', {
        style:{ marginTop:24, paddingTop:20, borderTop:'1px solid #ebebe5', textAlign:'center' },
      },
        React.createElement('p', { style:{ fontSize:12, color:'#4d4d4a', fontStyle:'italic' } },
          'That\u2019s everything. ',
          React.createElement('a', { href:'#', style:{ color:'#2563eb', fontWeight:600, fontStyle:'normal', textDecoration:'none' } }, 'See closed this week \u2192')
        )
      )
    )
  );
}

Object.assign(window, { VariantB_Digest });
