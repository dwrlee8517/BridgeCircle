// inbox-variant-a.jsx — TRIAGE FOCUS
// One item at a time, full-attention. Keyboard-driven decision flow.
// Inspired by Superhuman / Hey — reframes the inbox as a sequence of single decisions.
// Above: progress + queue stats. Center: large decision card. Below: dock of upcoming.

function VariantA_Triage() {
  const triage = INBOX.filter(i => i.state === 'needs_reply' || i.state === 'drafted');
  const [idx, setIdx] = React.useState(0);
  const item = triage[idx];
  const total = triage.length;

  const next = React.useCallback(() => setIdx(i => Math.min(i + 1, total - 1)), [total]);
  const prev = React.useCallback(() => setIdx(i => Math.max(i - 1, 0)), []);

  // Keyboard: J/K navigate, Y accept, N decline, E snooze. (Visual only — events
  // wouldn't fire inside the artboard reliably; the affordance is what matters.)

  const k = KIND_META[item.kind];
  const isAsk = item.type === 'incoming_ask' || item.type === 'friend_request';

  return React.createElement('div', {
    style:{
      height:'100%', background:'#081126', position:'relative', overflow:'hidden',
      fontFamily:"'Inter',sans-serif", color:'#fff',
      // Subtle relationship-map motif
      backgroundImage:'radial-gradient(circle at 80% 20%, rgba(37,99,235,.15), transparent 35%), radial-gradient(circle at 15% 85%, rgba(161,98,7,.08), transparent 30%)',
    },
  },
    // ── Top bar — progress + mode ───────────────────────────────────────────
    React.createElement('div', {
      style:{ position:'absolute', top:0, left:0, right:0, padding:'18px 28px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        zIndex:5 },
    },
      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:14 } },
        React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:8 } },
          React.createElement('div', { style:{ width:6, height:6, borderRadius:'50%', background:'#a16207', boxShadow:'0 0 0 3px rgba(161,98,7,.25)' } }),
          React.createElement('span', { style:{ fontSize:11, fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase', color:'rgba(255,255,255,.78)' } }, 'Triage')
        ),
        React.createElement('div', { style:{ width:1, height:14, background:'rgba(255,255,255,.18)' } }),
        React.createElement('span', { style:{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:'rgba(255,255,255,.6)', letterSpacing:'.04em' } }, `${String(idx+1).padStart(2,'0')} / ${String(total).padStart(2,'0')}`),
        React.createElement('div', { style:{ display:'flex', gap:3, alignItems:'center' } },
          ...triage.map((_, i) =>
            React.createElement('span', { key:i, style:{ width: i === idx ? 18 : 6, height:2, borderRadius:99, background: i <= idx ? '#93c5fd' : 'rgba(255,255,255,.15)', transition:'all 200ms' } })
          )
        )
      ),
      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:14 } },
        React.createElement('span', { style:{ fontSize:11, color:'rgba(255,255,255,.5)' } }, 'Done in ~6 min'),
        React.createElement('button', {
          style:{ background:'transparent', border:'1px solid rgba(255,255,255,.18)', color:'rgba(255,255,255,.85)', borderRadius:8, padding:'5px 10px', fontSize:11, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:'inherit' },
        }, 'Exit triage')
      )
    ),

    // ── Center — the decision card ──────────────────────────────────────────
    React.createElement('div', {
      style:{ position:'absolute', top:64, left:0, right:0, bottom:140,
        display:'flex', alignItems:'center', justifyContent:'center', padding:'0 28px' },
    },
      React.createElement('div', {
        style:{
          width:'100%', maxWidth:580, background:'#fafaf9', color:'#0c0c0b',
          borderRadius:14, padding:'30px 32px 26px',
          boxShadow:'0 24px 60px -16px rgba(0,0,0,.45), 0 4px 10px -2px rgba(0,0,0,.25)',
          position:'relative',
        },
      },
        // Identity row
        React.createElement('div', { style:{ display:'flex', gap:14, alignItems:'flex-start', marginBottom:18 } },
          React.createElement(Avatar, { name:item.from, color:item.avatar, size:48, square:true }),
          React.createElement('div', { style:{ flex:1, minWidth:0 } },
            React.createElement('div', { style:{ marginBottom:4 } }, React.createElement(Kicker, { color:k.color }, `${k.label} request \u2014 incoming`)),
            React.createElement('h2', { style:{ fontFamily:"'Inter Tight',sans-serif", fontSize:22, fontWeight:600, color:'#0c0c0b', letterSpacing:'-.01em', lineHeight:1.15 } }, item.from),
            React.createElement('p', { style:{ fontSize:12.5, color:'#4d4d4a', marginTop:3 } },
              item.role, ' \u00b7 ', React.createElement(Mono, { size:11 }, `Class of \u2019${String(item.cohort).slice(-2)}`)
            )
          ),
          React.createElement(Mono, { size:11, color:'#4d4d4a' }, item.age, ' ago')
        ),

        // The ask, pull-quote treatment
        React.createElement('div', {
          style:{ borderLeft:`3px solid ${k.color}`, paddingLeft:14, marginBottom:22 },
        },
          React.createElement('p', {
            style:{ fontFamily:"'Inter Tight',sans-serif", fontSize:18, fontStyle:'italic', lineHeight:1.4, color:'#0c0c0b', letterSpacing:'-.005em' },
          }, `\u201c${item.ask}\u201d`)
        ),

        // Decision actions
        React.createElement('div', { style:{ display:'flex', gap:8, alignItems:'center' } },
          React.createElement('button', {
            style:{ flex:1, height:42, borderRadius:9, background:'#f59e0b', color:'#0c0c0b', border:'none', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8 },
          },
            React.createElement(I.check, { size:14 }),
            'Accept & reply',
            React.createElement(Kbd, null, 'Y')
          ),
          React.createElement('button', {
            style:{ height:42, padding:'0 16px', borderRadius:9, background:'#fff', color:'#0c0c0b', border:'1px solid #dcdcd6', fontSize:12.5, fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:7 },
          }, 'Snooze',  React.createElement(Kbd, null, 'E')),
          React.createElement('button', {
            style:{ height:42, padding:'0 16px', borderRadius:9, background:'#fff', color:'#b9472a', border:'1px solid #dcdcd6', fontSize:12.5, fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:7 },
          }, 'Decline', React.createElement(Kbd, null, 'N'))
        ),

        // Helper hints
        React.createElement('div', {
          style:{ marginTop:18, paddingTop:14, borderTop:'1px solid #ebebe5', display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:11, color:'#4d4d4a' },
        },
          React.createElement('span', null, 'Drafted reply? Tap ', React.createElement(Kbd, null, '\u21B5'), ' to review it.'),
          React.createElement('button', { style:{ background:'transparent', border:'none', color:'#2563eb', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 } },
            'See full thread', React.createElement(I.arrowRight, { size:12, color:'#2563eb' })
          )
        )
      )
    ),

    // ── Bottom — queue dock ────────────────────────────────────────────────
    React.createElement('div', {
      style:{ position:'absolute', bottom:0, left:0, right:0, padding:'14px 28px 18px',
        background:'linear-gradient(180deg, transparent, rgba(0,0,0,.25))' },
    },
      React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:9 } },
        React.createElement('span', { style:{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'rgba(255,255,255,.6)', letterSpacing:'.08em', textTransform:'uppercase' } }, 'Up next'),
        React.createElement('div', { style:{ display:'flex', gap:6 } },
          React.createElement(Kbd, { dark:true }, 'J'),
          React.createElement(Kbd, { dark:true }, 'K'),
          React.createElement('span', { style:{ fontSize:10, color:'rgba(255,255,255,.45)' } }, 'to move')
        )
      ),
      React.createElement('div', { style:{ display:'flex', gap:8, overflowX:'auto' } },
        triage.map((it, i) => {
          const km = KIND_META[it.kind];
          const active = i === idx;
          return React.createElement('button', {
            key: it.id,
            onClick:()=>setIdx(i),
            style:{
              flex:'0 0 auto', display:'flex', alignItems:'center', gap:9,
              padding:'8px 12px', borderRadius:9,
              background: active ? 'rgba(255,255,255,.10)' : 'rgba(255,255,255,.04)',
              border:`1px solid ${active ? 'rgba(255,255,255,.20)' : 'rgba(255,255,255,.08)'}`,
              cursor:'pointer', fontFamily:'inherit', minWidth:0,
              opacity: i < idx ? .45 : 1,
              transition:'all 150ms',
            },
          },
            React.createElement(Avatar, { name:it.from, color:it.avatar, size:24, square:true }),
            React.createElement('div', { style:{ textAlign:'left', minWidth:0 } },
              React.createElement('div', { style:{ fontSize:11, fontWeight:600, color:'#fff', whiteSpace:'nowrap' } }, it.from),
              React.createElement('div', { style:{ fontSize:9, color:km.color === '#2563eb' ? '#93c5fd' : 'rgba(255,255,255,.55)', textTransform:'uppercase', letterSpacing:'.08em', fontWeight:700 } }, km.label)
            ),
            i < idx && React.createElement(I.check, { size:11, color:'rgba(255,255,255,.45)' })
          );
        })
      )
    )
  );
}

Object.assign(window, { VariantA_Triage });
