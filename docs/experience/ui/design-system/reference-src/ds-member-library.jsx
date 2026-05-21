/* eslint-disable */
// Atrium Design System — Member Card Library (Section 26)
// A deep set of member-card variants: sizes from inline chip to full banner,
// aspect ratios from 1:1 to 6:1, info-focus variants (stats / open-to / network),
// and animated variants including expand, flip, hover-preview, peek, breathing.

function MemberLibrarySection() {
  return (
    <DSSection id="memberlib" eyebrow="Components · 26" title="Member Card Library">

      <style>{`
        @keyframes ds-pulse-soft { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0; } }
        @keyframes ds-ring-pulse { 0% { box-shadow: 0 0 0 0 var(--ring,${dshex(DSC.ok, 0.45)}); } 70% { box-shadow: 0 0 0 14px ${dshex(DSC.ok, 0)}; } 100% { box-shadow: 0 0 0 0 ${dshex(DSC.ok, 0)}; } }
      `}</style>

      {/* ── SIZE SCALE ──────────────────────────────────────────────── */}
      <DSSub title="Size scale — inline mention up to full-bleed banner">
        <SizeLineup />
        <p style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.muted, lineHeight: 1.6, marginTop: 16, maxWidth: 640 }}>
          Eight density steps — pick by context, not by preference. Mention chip for prose, micro square for grids, pill for chrome, tall portrait for editorial columns, landscape banner for hero rows.
        </p>
      </DSSub>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 28 }}>
        <VariantCard label="MentionChip — inline @ style" note="For prose. 18px avatar, name underlined on hover.">
          <p style={{ fontFamily: DSF.body, fontSize: 14, color: DSC.ink2, lineHeight: 1.7, margin: 0 }}>
            Earlier today, <MentionChip name="Maren Holt" initials="MH" /> told <MentionChip name="Iris Okonkwo" initials="IO" /> about the Spring Supper. <MentionChip name="Sam Aldridge" initials="SA" /> is saving the corner seat.
          </p>
        </VariantCard>

        <VariantCard label="MicroSquare — 80px tile" note="Avatar-only grid item, label below. For 'who's online' rails.">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <MicroSquareCard name="Iris Okonkwo" initials="IO" cohort="'11" />
            <MicroSquareCard name="Dev Patel"    initials="DP" cohort="'11" />
            <MicroSquareCard name="Sam Aldridge" initials="SA" cohort="'11" />
            <MicroSquareCard name="Rosa Ferrara" initials="RF" cohort="'17" />
            <MicroSquareCard name="Juno Park"    initials="JP" cohort="'18" />
          </div>
        </VariantCard>

        <VariantCard label="CompactPill — chrome chip" note="For 'reply to', breadcrumbs, attribution lines.">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <CompactPillCard name="Iris Okonkwo" initials="IO" cohort="'11" />
            <CompactPillCard name="Dev Patel" initials="DP" cohort="'11" />
            <CompactPillCard name="Sam Aldridge" initials="SA" cohort="'11" />
          </div>
        </VariantCard>

        <VariantCard label="TallPortrait — editorial column" note="Vertical 1:2 ratio. For magazine-style grids and 'on deck' rails.">
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
            <TallPortraitCard name="Iris Okonkwo" initials="IO" cohort="'11" role="VP Investments" quote="Climate is the only pivot that won't age." />
          </div>
        </VariantCard>
      </div>

      <DSSub title="Landscape banner — full-width hero row">
        <LandscapeBannerCard
          name="Iris Okonkwo" initials="IO"
          cohort="Class of '11 · Brooklyn"
          role="VP Investments · Common Capital · Climate vertical"
          quote="The career pivots that won't age — climate, in five years."
        />
      </DSSub>

      {/* ── INFORMATION FOCUS ───────────────────────────────────────── */}
      <DSSub title="Information focus — same person, three emphases">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          <StatsForwardCard />
          <OpenToCard />
          <NetworkCard />
        </div>
        <p style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.muted, lineHeight: 1.6, marginTop: 16, maxWidth: 640 }}>
          Same member, three different cards: stats-forward (for cohort dashboards), open-to (for the directory CTA), network (for matchmaking screens). Pick by the user task, not the member.
        </p>
      </DSSub>

      {/* ── INTERACTIVE / ANIMATED ──────────────────────────────────── */}
      <DSSub title="Interactive & animated — click and hover patterns">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          <VariantCard label="ExpandableCard — click to expand inline" note="Smooth grid-rows height animation. The default member card with progressive disclosure.">
            <ExpandableMemberCard />
          </VariantCard>

          <VariantCard label="FlipCard — front/back 3D rotation" note="Click to flip. Front: identity. Back: story.">
            <FlipMemberCard />
          </VariantCard>

          <VariantCard label="HoverPreviewChip — chip → popover" note="Hover an inline chip to peek at the full card.">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', minHeight: 60 }}>
              <HoverPreviewChip name="Iris Okonkwo" initials="IO" role="VP Investments · Common Capital" cohort="'11" />
              <HoverPreviewChip name="Dev Patel" initials="DP" role="Partner, Greenleaf Ventures" cohort="'11" />
            </div>
          </VariantCard>

          <VariantCard label="BreathingLive — active-now indicator" note="Card breathes a soft halo while the member is online.">
            <BreathingLiveCard />
          </VariantCard>

          <VariantCard label="PeekCard — slide-out detail on hover" note="Reveals extra detail panel from the right edge. For dense lists.">
            <PeekCard />
          </VariantCard>

          <VariantCard label="StaggerStack — list reveal one at a time" note="Search results / cohort lists materialize from the top.">
            <StaggerStack />
          </VariantCard>
        </div>
      </DSSub>

      {/* ── BENTO LAYOUT ────────────────────────────────────────────── */}
      <DSSub title="Bento layout — mixing sizes in one composition">
        <BentoMemberLayout />
        <p style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.muted, lineHeight: 1.6, marginTop: 16, maxWidth: 640 }}>
          A page can mix three or four sizes without feeling chaotic — landscape banner on top, tall portrait on the side, micro grid filling the remainder. Aspect-ratio diversity is what makes a 'circle' feel populated.
        </p>
      </DSSub>

    </DSSection>
  );
}

// ─── SIZE LINEUP — VISUAL COMPARISON ───────────────────────────────────────

function SizeLineup() {
  const sizes = [
    { label: 'Mention chip', w: 110, h: 22 },
    { label: 'Micro square', w: 78,  h: 100 },
    { label: 'Compact pill', w: 130, h: 32 },
    { label: 'List row',     w: 240, h: 56 },
    { label: 'Standard card',w: 200, h: 220 },
    { label: 'Tall portrait',w: 156, h: 280 },
    { label: 'Landscape banner', w: 360, h: 100 },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap', padding: '20px 18px', background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: 14 }}>
      {sizes.map(s => (
        <div key={s.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ width: s.w, height: s.h, background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 8, position: 'relative', overflow: 'hidden', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
            {/* Mini sample for context */}
            <div style={{ position: 'absolute', top: 6, left: 6, width: Math.min(20, s.h * 0.30), height: Math.min(20, s.h * 0.30), borderRadius: 999, background: `linear-gradient(135deg, ${DSC.accent}, ${DSC.ok})` }} />
            <div style={{ position: 'absolute', top: 6, left: Math.min(20, s.h * 0.30) + 10, right: 6, height: 4, background: dshex(DSC.muted, 0.50), borderRadius: 999 }} />
            <div style={{ position: 'absolute', top: 14, left: Math.min(20, s.h * 0.30) + 10, right: 6, height: 3, background: dshex(DSC.muted, 0.28), borderRadius: 999 }} />
          </div>
          <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.06em', textAlign: 'center' }}>{s.label}<br /><span style={{ color: DSC.mute2 }}>{s.w}×{s.h}</span></div>
        </div>
      ))}
    </div>
  );
}

// ─── SIZE VARIANTS ─────────────────────────────────────────────────────────

function MentionChip({ name, initials }) {
  const [hov, setHov] = React.useState(false);
  const seed = (name || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const pairs = [[DSC.accent, DSC.ok], [DSC.ok, DSC.ink], [DSC.accent, DSC.ink]];
  const [ca, cb] = pairs[seed % 3];
  return (
    <span onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, verticalAlign: -3, cursor: 'pointer', color: hov ? DSC.accent : DSC.ink, fontWeight: 600, borderBottom: hov ? `1px solid ${DSC.accent}` : `1px solid transparent`, transition: 'color 100ms ease, border-color 100ms ease', paddingBottom: 0.5 }}>
      <span style={{ display: 'inline-grid', placeItems: 'center', width: 18, height: 18, borderRadius: 999, background: `linear-gradient(135deg, ${ca}, ${cb})`, color: '#fff', fontFamily: DSF.display, fontSize: 7.5, fontWeight: 700, letterSpacing: '0.01em', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.18)' }}>{initials}</span>
      {name.split(' ')[0]}
    </span>
  );
}

function MicroSquareCard({ name, initials, cohort }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '8px', borderRadius: 10, cursor: 'pointer', transition: 'background 120ms ease' }}
         onMouseEnter={e => { e.currentTarget.style.background = DSC.cardAlt; }}
         onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
      <DSAvatar name={name} initials={initials} size={48} />
      <div style={{ textAlign: 'center', minWidth: 56 }}>
        <div style={{ fontFamily: DSF.body, fontSize: 11, fontWeight: 600, color: DSC.ink, lineHeight: 1.2 }}>{name.split(' ')[0]}</div>
        <div style={{ fontFamily: DSF.mono, fontSize: 9, color: DSC.mute2, letterSpacing: '0.08em', marginTop: 1 }}>{cohort}</div>
      </div>
    </div>
  );
}

function CompactPillCard({ name, initials, cohort }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '3px 12px 3px 3px', borderRadius: 999, background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, cursor: 'pointer', transition: 'border-color 120ms ease, background 120ms ease' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = DSC.ink; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = DSC.rule; }}>
      <DSAvatar name={name} initials={initials} size={26} />
      <span style={{ fontFamily: DSF.body, fontSize: 12.5, fontWeight: 600, color: DSC.ink }}>{name.split(' ')[0]}</span>
      <span style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.08em' }}>{cohort}</span>
    </span>
  );
}

function TallPortraitCard({ name, initials, cohort, role, quote }) {
  return (
    <div style={{ width: 168, background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
      {/* Portrait — 1:1 square at top */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', background: `repeating-linear-gradient(135deg, ${DSC.panel} 0 7px, ${dshex(DSC.muted, 0.18)} 7px 8px)` }}>
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
          <DSAvatar name={name} initials={initials} size={56} />
        </div>
        <div style={{ position: 'absolute', bottom: 6, right: 6, fontFamily: DSF.mono, fontSize: 8.5, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.10em', background: DSC.ink, padding: '2px 6px', borderRadius: 2 }}>{cohort}</div>
      </div>
      {/* Body */}
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ fontFamily: DSF.display, fontSize: 14, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.01em', lineHeight: 1.15 }}>{name}</div>
        <div style={{ fontFamily: DSF.body, fontSize: 11, color: DSC.muted, marginTop: 3 }}>{role}</div>
        <p style={{ fontFamily: DSF.display, fontStyle: 'italic', fontSize: 11.5, color: DSC.ink2, margin: '10px 0 0', lineHeight: 1.45, paddingLeft: 10, borderLeft: `2px solid ${DSC.accent}` }}>
          "{quote}"
        </p>
      </div>
    </div>
  );
}

function LandscapeBannerCard({ name, initials, cohort, role, quote }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 22, padding: '20px 24px', alignItems: 'center', background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 16, boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 4px 14px rgba(42,34,26,0.06)' }}>
      <div style={{ position: 'relative' }}>
        <DSAvatar name={name} initials={initials} size={84} />
        <span style={{ position: 'absolute', right: -2, bottom: -2, width: 22, height: 22, borderRadius: 999, background: DSC.ok, border: `3px solid ${DSC.card}`, display: 'grid', placeItems: 'center' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4 4 10-10" /></svg>
        </span>
      </div>
      <div>
        <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.accent, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>{cohort}</div>
        <div style={{ fontFamily: DSF.display, fontSize: 24, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.02em', lineHeight: 1, marginTop: 4 }}>{name}</div>
        <div style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.muted, marginTop: 4 }}>{role}</div>
        <p style={{ fontFamily: DSF.display, fontStyle: 'italic', fontSize: 14, color: DSC.ink2, margin: '10px 0 0', lineHeight: 1.4, paddingLeft: 12, borderLeft: `2px solid ${DSC.accent}` }}>"{quote}"</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <PinMiniChip name="Anchor" color={DSC.accent} />
          <PinMiniChip name="Mentor" color={DSC.ok} />
        </div>
        <DSButton size="sm" style={{ justifyContent: 'center' }}>Reach out →</DSButton>
      </div>
    </div>
  );
}

// ─── INFO-FOCUS VARIANTS ───────────────────────────────────────────────────

function StatsForwardCard() {
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: '18px 18px 16px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <DSAvatar name="Iris Okonkwo" initials="IO" size={36} />
        <div>
          <div style={{ fontFamily: DSF.display, fontSize: 14, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.01em' }}>Iris Okonkwo</div>
          <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.10em', marginTop: 1 }}>5 YEARS IN THE CIRCLE</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${DSC.ruleSoft}` }}>
        {[
          { v: '247', l: 'Conversations', c: DSC.accent },
          { v: '18',  l: 'Events',        c: DSC.ok },
          { v: '12',  l: 'Vouches',       c: '#3f5680' },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: i === 0 ? 'left' : i === 2 ? 'right' : 'center' }}>
            <div style={{ fontFamily: DSF.display, fontSize: 28, fontWeight: 600, color: s.c, letterSpacing: '-0.025em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{s.v}</div>
            <div style={{ fontFamily: DSF.mono, fontSize: 9, color: DSC.muted, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, marginTop: 5 }}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${DSC.ruleSoft}`, fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: DSC.ok }} />
        Currently <strong style={{ color: DSC.ink, fontWeight: 600 }}>most active</strong> in '11 cohort.
      </div>
    </div>
  );
}

function OpenToCard() {
  const items = [
    { active: true,  label: 'Coffee in Brooklyn' },
    { active: true,  label: '30-min advice calls' },
    { active: true,  label: 'Reviewing climate pitches' },
    { active: false, label: 'Long-term mentorship' },
  ];
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: '18px 18px 16px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <DSAvatar name="Iris Okonkwo" initials="IO" size={36} />
        <div>
          <div style={{ fontFamily: DSF.display, fontSize: 14, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.01em' }}>Iris Okonkwo</div>
          <DSTag tone="accent" dot>Open right now</DSTag>
        </div>
      </div>
      <div style={{ marginTop: 14, fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>This month</div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((it, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: DSF.body, fontSize: 12.5, color: it.active ? DSC.ink : DSC.mute2, textDecoration: it.active ? 'none' : 'line-through' }}>
            <span style={{ width: 16, height: 16, borderRadius: 999, background: it.active ? DSC.accent : 'transparent', border: `1.5px solid ${it.active ? DSC.accent : DSC.rule}`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              {it.active && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4 4 10-10" /></svg>}
            </span>
            {it.label}
          </li>
        ))}
      </ul>
      <DSButton size="sm" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}>Reach out</DSButton>
    </div>
  );
}

function NetworkCard() {
  const mutuals = [
    { name: 'Maren Holt', initials: 'MH' },
    { name: 'Sam Aldridge', initials: 'SA' },
    { name: 'Dev Patel', initials: 'DP' },
    { name: 'Rosa Ferrara', initials: 'RF' },
  ];
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: '18px 18px 16px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <DSAvatar name="Iris Okonkwo" initials="IO" size={36} />
        <div>
          <div style={{ fontFamily: DSF.display, fontSize: 14, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.01em' }}>Iris Okonkwo</div>
          <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, marginTop: 1 }}>Known by <strong style={{ color: DSC.ink, fontWeight: 700 }}>12</strong> in your circle</div>
        </div>
      </div>
      {/* Mini network graph */}
      <div style={{ marginTop: 14, position: 'relative', height: 110, background: DSC.cardAlt, border: `1px solid ${DSC.ruleSoft}`, borderRadius: 10, overflow: 'hidden' }}>
        <svg width="100%" height="100%" viewBox="0 0 280 110" style={{ position: 'absolute', inset: 0 }}>
          {/* Connections */}
          {[[50, 55, 140, 55], [90, 20, 140, 55], [90, 90, 140, 55], [140, 55, 210, 30], [140, 55, 210, 80], [140, 55, 240, 55]].map(([x1, y1, x2, y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={dshex(DSC.accent, 0.45)} strokeWidth="1.2" strokeDasharray="2 2" />
          ))}
          {/* Center node — Iris */}
          <circle cx="140" cy="55" r="16" fill={DSC.accent} />
          <text x="140" y="59" textAnchor="middle" fontFamily="Inter Tight, system-ui" fontSize="9" fontWeight="700" fill="#fff">IO</text>
          {/* Mutuals */}
          {[[50, 55, 'MH'], [90, 20, 'YOU'], [90, 90, 'SA'], [210, 30, 'DP'], [210, 80, 'RF'], [240, 55, 'JP']].map(([cx, cy, label], i) => {
            const isYou = label === 'YOU';
            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r={isYou ? 12 : 10} fill={isYou ? DSC.ok : DSC.cardAlt} stroke={isYou ? DSC.ok : DSC.muted} strokeWidth={isYou ? 0 : 1.5} />
                <text x={cx} y={cy + (isYou ? 4 : 3.5)} textAnchor="middle" fontFamily="Inter Tight, system-ui" fontSize={isYou ? 8 : 8} fontWeight="700" fill={isYou ? '#fff' : DSC.muted}>{label}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <AvatarStack people={mutuals} size={22} />
        <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, lineHeight: 1.45, flex: 1 }}>
          via <strong style={{ color: DSC.ink, fontWeight: 600 }}>Maren</strong>, <strong style={{ color: DSC.ink, fontWeight: 600 }}>Sam</strong>, and 10 others
        </div>
      </div>
    </div>
  );
}

// ─── INTERACTIVE / ANIMATED VARIANTS ───────────────────────────────────────

function ExpandableMemberCard() {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ background: DSC.card, border: `1px solid ${open ? DSC.accent : DSC.rule}`, borderRadius: 14, overflow: 'hidden', boxShadow: open ? `0 1px 0 rgba(255,255,255,.6) inset, 0 8px 24px rgba(42,34,26,0.10)` : '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)', transition: 'border-color 200ms ease, box-shadow 200ms ease' }}>
      {/* Collapsed header — always visible */}
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <DSAvatar name="Iris Okonkwo" initials="IO" size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: DSF.display, fontSize: 15, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.01em' }}>Iris Okonkwo</div>
          <div style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted, marginTop: 2 }}>VP Investments · Common Capital · '11</div>
        </div>
        <DSTag tone="accent" dot>Open to mentor</DSTag>
        <span style={{ display: 'grid', placeItems: 'center', width: 28, height: 28, borderRadius: 999, background: open ? DSC.accent : DSC.cardAlt, color: open ? '#fff' : DSC.muted, transition: 'background 180ms ease, color 180ms ease, transform 180ms ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
        </span>
      </button>

      {/* Expandable region — grid-rows trick for smooth height animation */}
      <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows 320ms cubic-bezier(0.2,0.8,0.2,1)' }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ borderTop: `1px solid ${DSC.ruleSoft}`, padding: '16px 16px 18px', opacity: open ? 1 : 0, transition: 'opacity 240ms ease 60ms' }}>
            <p style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.ink2, lineHeight: 1.55, margin: 0 }}>
              Iris has spent five years underwriting climate infrastructure at Common Capital. She anchored Hartwood in '21 and runs the '11 cohort's office-hours rotation.
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
              <DSTag>Climate tech</DSTag>
              <DSTag>Fundraising</DSTag>
              <DSTag>Underwriting</DSTag>
              <DSTag>Brooklyn</DSTag>
            </div>
            {/* Mini stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 14, padding: '10px 12px', background: DSC.cardAlt, borderRadius: 8 }}>
              {[['247', 'msgs'], ['18', 'events'], ['12', 'vouches']].map(([v, l], i) => (
                <div key={i}>
                  <div style={{ fontFamily: DSF.display, fontSize: 18, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.02em', lineHeight: 1 }}>{v}</div>
                  <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <DSButton size="sm" style={{ flex: 1, justifyContent: 'center' }}>Send intro</DSButton>
              <DSButton size="sm" variant="outline">Open profile</DSButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlipMemberCard() {
  const [flipped, setFlipped] = React.useState(false);
  return (
    <div onClick={() => setFlipped(f => !f)} style={{ perspective: 1200, cursor: 'pointer', height: 220 }}>
      <div style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d', transition: 'transform 600ms cubic-bezier(0.4,0.2,0.2,1)', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
        {/* Front */}
        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <DSAvatar name="Iris Okonkwo" initials="IO" size={56} />
            <span style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>Tap to flip ↻</span>
          </div>
          <div>
            <div style={{ fontFamily: DSF.display, fontSize: 20, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.02em', lineHeight: 1.1 }}>Iris Okonkwo</div>
            <div style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.muted, marginTop: 4 }}>VP Investments · Common Capital · '11</div>
          </div>
        </div>
        {/* Back */}
        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: DSC.ink, color: DSC.paper, borderRadius: 14, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 8px 22px rgba(42,34,26,0.18)' }}>
          <div>
            <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>The story</div>
            <p style={{ fontFamily: DSF.display, fontStyle: 'italic', fontSize: 14, color: DSC.paper, margin: '8px 0 0', lineHeight: 1.5 }}>
              "Came in '11 to learn from people two careers ahead. Stayed because I started becoming that for someone else."
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: DSF.mono, fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.10em' }}>iris@hartwood.org</div>
            <span style={{ fontFamily: DSF.mono, fontSize: 9.5, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.10em' }}>Tap to flip ↺</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function HoverPreviewChip({ name, initials, role, cohort }) {
  const [hov, setHov] = React.useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-block' }} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 12px 4px 4px', borderRadius: 999, background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, cursor: 'pointer' }}>
        <DSAvatar name={name} initials={initials} size={24} />
        <span style={{ fontFamily: DSF.body, fontSize: 12.5, fontWeight: 600, color: DSC.ink }}>{name}</span>
      </span>
      {/* Popover */}
      <div style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, width: 260, background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 12, padding: '14px 16px', boxShadow: '0 16px 36px rgba(42,34,26,0.18)', opacity: hov ? 1 : 0, transform: hov ? 'translateY(0)' : 'translateY(6px)', pointerEvents: hov ? 'auto' : 'none', transition: 'opacity 160ms ease, transform 160ms ease', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <DSAvatar name={name} initials={initials} size={38} />
          <div>
            <div style={{ fontFamily: DSF.display, fontSize: 14, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.01em' }}>{name}</div>
            <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.accent, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, marginTop: 2 }}>{cohort} · Brooklyn</div>
          </div>
        </div>
        <div style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.ink2, lineHeight: 1.45 }}>{role}</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <DSTag tone="accent" dot>Open to mentor</DSTag>
        </div>
      </div>
    </span>
  );
}

function BreathingLiveCard() {
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ position: 'relative' }}>
          <DSAvatar name="Iris Okonkwo" initials="IO" size={42} />
          <span style={{ position: 'absolute', right: -2, bottom: -2, width: 14, height: 14, borderRadius: 999, background: DSC.ok, border: `2.5px solid ${DSC.card}`, animation: 'ds-ring-pulse 2s ease-out infinite' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: DSF.display, fontSize: 15, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.01em' }}>Iris Okonkwo</div>
          <div style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted, display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: DSC.ok }} />
            Active now · replying to threads
          </div>
        </div>
        <DSButton size="sm" variant="outline">Say hi</DSButton>
      </div>
      <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${DSC.ruleSoft}`, display: 'flex', alignItems: 'center', gap: 8, fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted }}>
        <ActivityDots />
        Typing in <strong style={{ color: DSC.ink, fontWeight: 600 }}>#climate-vc</strong>
      </div>
    </div>
  );
}

function ActivityDots() {
  return (
    <span style={{ display: 'inline-flex', gap: 3 }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{ width: 4, height: 4, borderRadius: 999, background: DSC.accent, animation: `ds-pulse-soft 1.4s ease-in-out infinite`, animationDelay: `${i * 0.18}s` }} />
      ))}
    </span>
  );
}

function PeekCard() {
  const [hov, setHov] = React.useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ position: 'relative', background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)', overflow: 'hidden', cursor: 'pointer', transition: 'border-color 180ms ease' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <DSAvatar name="Iris Okonkwo" initials="IO" size={36} />
          <div>
            <div style={{ fontFamily: DSF.display, fontSize: 14, fontWeight: 600, color: DSC.ink }}>Iris Okonkwo</div>
            <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, marginTop: 2 }}>VP Investments · '11</div>
          </div>
        </div>
        <span style={{ fontFamily: DSF.mono, fontSize: 9.5, color: hov ? DSC.accent : DSC.muted, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, transition: 'color 180ms ease' }}>hover →</span>
      </div>
      {/* Slide-out detail panel */}
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '70%', background: DSC.ink, color: DSC.paper, padding: '14px 16px', transform: hov ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 240ms cubic-bezier(0.2,0.8,0.2,1)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
        <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>Quick peek</div>
        <p style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.paper, lineHeight: 1.4, margin: 0 }}>Climate VC. Anchored Hartwood in '21. Open to coffee in Brooklyn this month.</p>
        <DSButton size="sm" variant="primary" style={{ marginTop: 6, alignSelf: 'flex-start' }}>Open →</DSButton>
      </div>
    </div>
  );
}

function StaggerStack() {
  const [seed, setSeed] = React.useState(0);
  const members = [
    { name: 'Iris Okonkwo', initials: 'IO', role: 'VP Investments · Common Capital' },
    { name: 'Dev Patel',    initials: 'DP', role: 'Partner · Greenleaf Ventures' },
    { name: 'Rosa Ferrara', initials: 'RF', role: 'CEO · Solaris Grid' },
    { name: 'Sam Aldridge', initials: 'SA', role: 'Climate engineer · Lagos' },
  ];
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {members.map((m, i) => (
          <div key={`${seed}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 10, animation: `ds-fade-up 280ms cubic-bezier(0.2,0.8,0.2,1) ${i * 80}ms both` }}>
            <DSAvatar name={m.name} initials={m.initials} size={28} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: DSF.body, fontSize: 12.5, fontWeight: 600, color: DSC.ink }}>{m.name}</div>
              <div style={{ fontFamily: DSF.body, fontSize: 11, color: DSC.muted, marginTop: 1 }}>{m.role}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
        <DSButton size="sm" variant="outline" onClick={() => setSeed(s => s + 1)}>Replay</DSButton>
      </div>
    </div>
  );
}

// ─── BENTO LAYOUT ──────────────────────────────────────────────────────────

function BentoMemberLayout() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'auto auto', gap: 12 }}>
      {/* Top — Landscape banner spans 4 cols */}
      <div style={{ gridColumn: '1 / 5' }}>
        <LandscapeBannerCard name="Iris Okonkwo" initials="IO" cohort="On Deck · Class of '11" role="VP Investments · Common Capital" quote="The career pivots that won't age — climate, in five years." />
      </div>
      {/* Bottom-left — Tall portrait spans 1 col */}
      <div style={{ gridColumn: '1 / 2' }}>
        <TallPortraitCard name="Dev Patel" initials="DP" cohort="'11" role="Partner, Greenleaf" quote="Climate VCs are still scouts." />
      </div>
      {/* Bottom-middle — Open-to + Stats stacked */}
      <div style={{ gridColumn: '2 / 4', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <BreathingLiveCard />
        <CompactMemberRow name="Sam Aldridge" role="Climate engineer, Lagos" cohort="'11" city="Lagos" tag={{ tone: 'ok', label: 'Active' }} />
        <CompactMemberRow name="Rosa Ferrara" role="CEO, Solaris Grid" cohort="'17" city="Mexico CDMX" tag={{ tone: 'accent', label: 'Mentor' }} />
      </div>
      {/* Bottom-right — Micro grid */}
      <div style={{ gridColumn: '4 / 5', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, alignContent: 'flex-start', padding: '12px', background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: 12 }}>
        <div style={{ gridColumn: '1 / 3', fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Active now</div>
        {['JP', 'TH', 'LV', 'OK'].map((init, i) => (
          <MicroSquareCard key={i} name={`Member ${i + 1}`} initials={init} cohort={`'${18 + i}`} />
        ))}
      </div>
    </div>
  );
}

window.MemberLibrarySection = MemberLibrarySection;
