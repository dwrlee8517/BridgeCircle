/* eslint-disable */
// Atrium Design System — Charts (Section 41)

function ChartsSection() {
  return (
    <DSSection id="charts" eyebrow="Components · 41" title="Charts">

      <DSSub title="Sparkline — inline trend, no axes">
        <SparklineRow />
      </DSSub>

      <DSSub title="Line chart — multi-series trend">
        <LineChart />
      </DSSub>

      <DSSub title="Bar chart — comparing categories">
        <BarChart />
      </DSSub>

      <DSSub title="Donut — proportional makeup">
        <DonutChart />
      </DSSub>

      <DSSub title="KPI · stat with trend arrow">
        <KPIRow />
      </DSSub>

    </DSSection>
  );
}

// ─── SPARKLINE ─────────────────────────────────────────────────────────────

function Sparkline({ data, color = DSC.accent, w = 100, h = 28, area = true }) {
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    h - ((v - min) / range) * (h - 4) - 2,
  ]);
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const areaPath = `${path} L${w},${h} L0,${h} Z`;
  const last = points[points.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {area && <path d={areaPath} fill={color} fillOpacity="0.14" />}
      <path d={path} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill={color} />
    </svg>
  );
}

function SparklineRow() {
  const stats = [
    { label: 'Replies sent',    value: '247', delta: '+18',  data: [12, 18, 16, 22, 19, 26, 31, 28, 34, 38, 42, 47], color: DSC.accent },
    { label: 'Events attended', value: '18',  delta: '+2',   data: [3, 5, 4, 6, 7, 8, 9, 11, 12, 14, 16, 18],         color: DSC.ok },
    { label: 'New connections', value: '42',  delta: '+6',   data: [8, 10, 9, 11, 14, 18, 22, 25, 29, 33, 37, 42],    color: '#3f5680' },
    { label: 'Avg reply time',  value: '2.4d', delta: '−0.6d', data: [3.6, 3.4, 3.3, 3.1, 2.9, 2.8, 2.7, 2.6, 2.5, 2.4, 2.4, 2.4], color: DSC.warn },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      {stats.map((s, i) => {
        const up = !s.delta.startsWith('−');
        return (
          <div key={i} style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
            <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>{s.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontFamily: DSF.display, fontSize: 22, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.025em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{s.value}</span>
              <span style={{ fontFamily: DSF.mono, fontSize: 10.5, color: up ? DSC.ok : DSC.warn, fontWeight: 700 }}>{up ? '↑' : '↓'} {s.delta.replace('−', '')}</span>
            </div>
            <div style={{ marginTop: 8 }}><Sparkline data={s.data} color={s.color} w={140} h={26} /></div>
            <div style={{ fontFamily: DSF.mono, fontSize: 9, color: DSC.mute2, letterSpacing: '0.06em', marginTop: 4 }}>12 weeks</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── LINE CHART ────────────────────────────────────────────────────────────

function LineChart() {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const series = [
    { name: 'New members',   color: DSC.accent, data: [8, 12, 14, 18, 22, 28, 32, 28, 30, 36, 42, 47] },
    { name: 'Active hosts',   color: DSC.ok,    data: [4, 5, 6, 8, 11, 12, 14, 13, 15, 17, 19, 22] },
    { name: 'Mentor threads', color: '#3f5680', data: [12, 14, 13, 16, 18, 19, 18, 20, 22, 25, 27, 30] },
  ];
  const W = 640, H = 200, P = 36;
  const max = 50, min = 0;
  const xFor = (i) => P + (i / (months.length - 1)) * (W - P - 16);
  const yFor = (v) => H - P + 8 - ((v - min) / (max - min)) * (H - P - 24);

  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>Annual trend · 2025</div>
          <div style={{ fontFamily: DSF.display, fontSize: 17, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.015em', marginTop: 4 }}>The circle, all year.</div>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          {series.map(s => (
            <div key={s.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color }} />
              <span style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.ink2, fontWeight: 500 }}>{s.name}</span>
            </div>
          ))}
        </div>
      </div>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* Grid */}
        {[0, 10, 20, 30, 40, 50].map(g => (
          <g key={g}>
            <line x1={P} y1={yFor(g)} x2={W - 16} y2={yFor(g)} stroke={DSC.ruleSoft} strokeWidth="1" />
            <text x={P - 6} y={yFor(g) + 4} textAnchor="end" fontFamily={DSF.mono.split(',')[0]} fontSize="9" fill={DSC.muted}>{g}</text>
          </g>
        ))}
        {/* X-axis labels */}
        {months.map((m, i) => (
          <text key={m} x={xFor(i)} y={H - 8} textAnchor="middle" fontFamily={DSF.mono.split(',')[0]} fontSize="9" fill={DSC.mute2} letterSpacing="0.06em">{m}</text>
        ))}
        {/* Lines */}
        {series.map(s => {
          const path = s.data.map((v, i) => `${i === 0 ? 'M' : 'L'}${xFor(i)},${yFor(v)}`).join(' ');
          return (
            <g key={s.name}>
              <path d={path} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {s.data.map((v, i) => <circle key={i} cx={xFor(i)} cy={yFor(v)} r="2.5" fill={DSC.card} stroke={s.color} strokeWidth="1.5" />)}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── BAR CHART ─────────────────────────────────────────────────────────────

function BarChart() {
  const cohorts = ['09','10','11','12','13','14','15','16','17','18','19','20','21'];
  const counts  = [22, 41, 58, 72, 84, 91, 105, 118, 124, 132, 116, 94, 78];
  const max = Math.max(...counts);
  const viewer = '14';
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>Members by class</div>
          <div style={{ fontFamily: DSF.display, fontSize: 17, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.015em', marginTop: 4 }}>Class of '18 is the largest · 132 members</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, height: 140, alignItems: 'stretch', borderBottom: `1px solid ${DSC.rule}` }}>
        {cohorts.map((c, i) => {
          const h = (counts[i] / max) * 100;
          const isViewer = c === viewer;
          return (
            <div key={c} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
              <span style={{ fontFamily: DSF.mono, fontSize: 9, fontWeight: 700, color: isViewer ? DSC.accent : DSC.mute2 }}>{counts[i]}</span>
              <div style={{ width: '100%', height: `${h}%`, background: isViewer ? DSC.accent : dshex(DSC.ink, 0.30), borderRadius: '4px 4px 0 0' }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        {cohorts.map(c => (
          <div key={c} style={{ flex: 1, textAlign: 'center', fontFamily: DSF.mono, fontSize: 9.5, color: c === viewer ? DSC.accent : DSC.muted, letterSpacing: '0.06em', fontWeight: c === viewer ? 700 : 500 }}>'{c}</div>
        ))}
      </div>
    </div>
  );
}

// ─── DONUT ─────────────────────────────────────────────────────────────────

function DonutChart() {
  const slices = [
    { name: 'Mentor',  value: 42, color: DSC.accent },
    { name: 'Advice',  value: 28, color: DSC.ok },
    { name: 'Mentee',  value: 18, color: '#3f5680' },
    { name: 'Closed',  value: 12, color: DSC.muted },
  ];
  const total = slices.reduce((s, x) => s + x.value, 0);
  const r = 60, sw = 18, cx = 80, cy = 80;
  const C = 2 * Math.PI * r;
  let cumulative = 0;
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: '18px 20px', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 24, alignItems: 'center' }}>
      <div style={{ position: 'relative', width: 160, height: 160 }}>
        <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
          {slices.map((s, i) => {
            const frac = s.value / total;
            const dash = frac * C;
            const offset = -cumulative * C;
            cumulative += frac;
            return (
              <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={sw} strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={offset} />
            );
          })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          <div>
            <div style={{ fontFamily: DSF.display, fontSize: 28, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.025em', lineHeight: 1 }}>100</div>
            <div style={{ fontFamily: DSF.mono, fontSize: 9, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', marginTop: 4, fontWeight: 700 }}>Members</div>
          </div>
        </div>
      </div>
      <div>
        <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>By openness</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {slices.map(s => (
            <li key={s.name} style={{ display: 'grid', gridTemplateColumns: '12px 1fr auto auto', gap: 10, alignItems: 'center' }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: s.color }} />
              <span style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.ink2 }}>{s.name}</span>
              <span style={{ fontFamily: DSF.mono, fontSize: 11, color: DSC.ink, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{s.value}</span>
              <span style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.muted, fontVariantNumeric: 'tabular-nums' }}>{Math.round(s.value / total * 100)}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── KPI ──────────────────────────────────────────────────────────────────

function KPIRow() {
  const kpis = [
    { label: 'Conversations', value: '247',  delta: '+18%', dir: 'up',  context: 'vs last quarter' },
    { label: 'Hours mentored',value: '42',   delta: '−4',   dir: 'down', context: 'this month' },
    { label: 'Reply rate',    value: '94%',  delta: '+2pt', dir: 'up',   context: '12-week avg' },
    { label: 'New cities',    value: '3',    delta: 'same', dir: 'flat', context: 'Lagos · CDMX · Edinburgh' },
  ];
  const cfg = {
    up:   { tone: DSC.ok,   arrow: '↑' },
    down: { tone: DSC.bad,  arrow: '↓' },
    flat: { tone: DSC.muted, arrow: '→' },
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      {kpis.map(k => {
        const c = cfg[k.dir];
        return (
          <div key={k.label} style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: '18px 18px 16px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
            <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>{k.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8 }}>
              <span style={{ fontFamily: DSF.display, fontSize: 38, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{k.value}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: DSF.mono, fontSize: 11, fontWeight: 700, color: c.tone, background: dshex(c.tone, 0.12), padding: '3px 8px', borderRadius: 999 }}>
                <span>{c.arrow}</span>{k.delta}
              </span>
            </div>
            <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, marginTop: 8 }}>{k.context}</div>
          </div>
        );
      })}
    </div>
  );
}

window.ChartsSection = ChartsSection;
