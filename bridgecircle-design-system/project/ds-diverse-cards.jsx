/* eslint-disable */
// Atrium Design System — Diversified Cards & Patterns (Section 24)
// More variants of member, event, and community cards.

function DiverseCardsSection() {
  return (
    <DSSection id="diversecards" eyebrow="Components · 24" title="Diversified Cards & Patterns">

      <style>{`
        @keyframes ds-live-pulse {
          0%   { box-shadow: 0 0 0 0 ${dshex(DSC.bad, 0.55)}; }
          70%  { box-shadow: 0 0 0 12px ${dshex(DSC.bad, 0)}; }
          100% { box-shadow: 0 0 0 0 ${dshex(DSC.bad, 0)}; }
        }
      `}</style>

      <DSSub title="Member card variants — different densities, same primitives">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
          <VariantCard label="Compact row — dense list" note="Single-line member display for tables or scrollable lists.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <CompactMemberRow name="Iris Okonkwo"    role="VP Investments, Common Capital" cohort="'11" city="Brooklyn"     tag={{ tone: 'accent', label: 'Mentor' }} />
              <CompactMemberRow name="Dev Patel"        role="Partner, Greenleaf Ventures"   cohort="'11" city="San Francisco" tag={{ tone: 'ok',     label: 'Active' }} />
              <CompactMemberRow name="Rosa Ferrara"     role="CEO, Solaris Grid"             cohort="'17" city="Lagos"        tag={{ tone: 'muted',  label: '5y' }} />
              <CompactMemberRow name="Theo Harrington" role="Product, Waymark"               cohort="'20" city="Brooklyn"     tag={{ tone: 'muted',  label: 'New' }} />
            </div>
          </VariantCard>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 14, marginTop: 14, alignItems: 'flex-start' }}>
          <VariantCard label="Hero portrait card — for profile pages" note="Vertical photo + headline + pull quote + pins + dual CTA.">
            <HeroMemberPortrait />
          </VariantCard>
          <VariantCard label="Member compare — side-by-side matchmaking" note="Show overlapping fit between two members.">
            <MemberCompare />
          </VariantCard>
        </div>
      </DSSub>

      <DSSub title="Event card variants">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14, marginBottom: 14 }}>
          <VariantCard label="Live-now banner" note="Pulsing LIVE dot — only shown while event is in progress.">
            <LiveEventBanner />
          </VariantCard>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          <VariantCard label="Past event recap" note="Date stamp + attendee stack + outcome quote.">
            <PastEventRecap />
          </VariantCard>
          <VariantCard label="Workshop with capacity" note="Foregrounds 'last N seats' urgency without urgency-spam.">
            <WorkshopEventCard />
          </VariantCard>
        </div>
      </DSSub>

      <DSSub title="Community patterns">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          <VariantCard label="Cohort spotlight" note="Aggregates a class — their recent moves, new threads, and a member highlight.">
            <CohortSpotlightCard />
          </VariantCard>
          <VariantCard label="Welcome new member" note="Issued on first sign-in. Uses the circle motif as primary art.">
            <WelcomeNewMemberCard />
          </VariantCard>
        </div>
      </DSSub>

    </DSSection>
  );
}

// ─── MEMBER VARIANTS ───────────────────────────────────────────────────────

function CompactMemberRow({ name, role, cohort, city, tag }) {
  const [hov, setHov] = React.useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'grid', gridTemplateColumns: '36px 1fr auto auto', gap: 14, alignItems: 'center', padding: '10px 14px', background: hov ? DSC.cardAlt : DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 10, cursor: 'pointer', transition: 'background 100ms ease, transform 100ms ease', transform: hov ? 'translateX(2px)' : '' }}>
      <DSAvatar name={name} initials={name.split(' ').map(s => s[0]).join('')} size={36} />
      <div style={{ minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: DSF.display, fontSize: 14, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.01em' }}>{name}</span>
        <span style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{role}</span>
      </div>
      <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.mute2, letterSpacing: '0.10em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{cohort} · {city}</div>
      <DSTag tone={tag.tone} dot>{tag.label}</DSTag>
    </div>
  );
}

function HeroMemberPortrait() {
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 4px 14px rgba(42,34,26,0.08)' }}>
      {/* Portrait area */}
      <div style={{ position: 'relative', aspectRatio: '5 / 4', background: DSC.panel, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `repeating-linear-gradient(135deg, ${DSC.panel} 0 8px, ${dshex(DSC.muted, 0.20)} 8px 9px)` }} />
        <div style={{ position: 'absolute', top: 10, left: 10, padding: '4px 10px', background: DSC.accent, color: '#fff', fontFamily: DSF.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: 2 }}>Portrait</div>
        <div style={{ position: 'absolute', bottom: 12, right: 14, display: 'flex', alignItems: 'center', gap: 6, fontFamily: DSF.mono, fontSize: 9.5, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.10em', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
          <span style={{ width: 5, height: 5, borderRadius: 999, background: DSC.ok, boxShadow: `0 0 0 2px ${dshex(DSC.ok, 0.30)}` }} />
          ONLINE
        </div>
      </div>
      {/* Body */}
      <div style={{ padding: '18px 18px 16px' }}>
        <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.accent, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>Class of '11 · Brooklyn</div>
        <div style={{ fontFamily: DSF.display, fontSize: 22, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.025em', lineHeight: 1.05, marginTop: 5 }}>Iris Okonkwo</div>
        <div style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.muted, marginTop: 4 }}>VP Investments · Common Capital</div>

        <p style={{ fontFamily: DSF.display, fontStyle: 'italic', fontSize: 14, fontWeight: 500, color: DSC.ink2, margin: '12px 0 0', lineHeight: 1.45, borderLeft: `2px solid ${DSC.accent}`, paddingLeft: 12 }}>
          "Climate is the only career pivot that won't age."
        </p>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
          <PinMiniChip name="Anchor" color={DSC.accent} />
          <PinMiniChip name="Mentor" color={DSC.ok} />
          <PinMiniChip name="Old Guard" color="#7a3a5e" />
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <DSButton size="sm" style={{ flex: 1, justifyContent: 'center' }}>Reach out</DSButton>
          <DSButton size="sm" variant="outline">View</DSButton>
        </div>
      </div>
    </div>
  );
}

function MemberCompare() {
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 16, padding: '20px 20px 18px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <DSEyebrow>Match preview</DSEyebrow>
        <span style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.06em' }}>FIT 84%</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 14, alignItems: 'center' }}>
        {/* Person A */}
        <CompareTile name="Iris Okonkwo" initials="IO" role="VP Investments" sub="Common Capital · '11" tone={DSC.accent} />
        {/* Connector */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ display: 'inline-flex', width: 28, height: 28, borderRadius: 999, background: dshex(DSC.accent, 0.13), color: DSC.accent, alignItems: 'center', justifyContent: 'center', fontFamily: DSF.mono, fontSize: 11, fontWeight: 700 }}>&</span>
          <div style={{ width: 1, height: 32, background: dshex(DSC.muted, 0.30) }} />
        </div>
        {/* Person B */}
        <CompareTile name="Theo Harrington" initials="TH" role="Product, Waymark" sub="Brooklyn · '20" tone={DSC.ok} />
      </div>

      {/* Shared signals */}
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${DSC.ruleSoft}` }}>
        <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>In common</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <DSTag tone="ok" dot>Climate tech</DSTag>
          <DSTag tone="muted">Brooklyn</DSTag>
          <DSTag tone="muted">3 mutual: Dev, Sam, Rosa</DSTag>
        </div>
      </div>
      <DSButton size="sm" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}>Send intro for both →</DSButton>
    </div>
  );
}

function CompareTile({ name, initials, role, sub, tone }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '14px 10px', background: dshex(tone, 0.06), border: `1px solid ${dshex(tone, 0.22)}`, borderRadius: 12, textAlign: 'center' }}>
      <DSAvatar name={name} initials={initials} size={40} />
      <div>
        <div style={{ fontFamily: DSF.display, fontSize: 13, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.01em' }}>{name}</div>
        <div style={{ fontFamily: DSF.body, fontSize: 11, color: DSC.muted, marginTop: 2 }}>{role}</div>
        <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: tone, marginTop: 3, letterSpacing: '0.08em', fontWeight: 700, textTransform: 'uppercase' }}>{sub}</div>
      </div>
    </div>
  );
}

// ─── EVENT VARIANTS ────────────────────────────────────────────────────────

function LiveEventBanner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: DSC.ink, color: DSC.paper, padding: '12px 16px 12px 18px', borderRadius: 14, boxShadow: '0 6px 18px rgba(42,34,26,0.18)' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: dshex(DSC.bad, 0.20), color: '#ff8a72', fontFamily: DSF.mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', borderRadius: 999 }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: '#ff5d3f', animation: 'ds-live-pulse 1.6s ease-out infinite' }} />
        Live
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: DSF.display, fontSize: 16, fontWeight: 600, letterSpacing: '-0.015em' }}>
          Brooklyn Breakfast <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>· started 12 min ago</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4, fontFamily: DSF.body, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <AvatarStack size={20} people={[{ name: 'Iris', initials: 'IO' }, { name: 'Dev', initials: 'DP' }, { name: 'Sam', initials: 'SA' }]} total={8} />
            8 in attendance
          </span>
          <span>Hosted by Dev · Class of '11</span>
        </div>
      </div>
      <DSButton size="sm" variant="primary" style={{ whiteSpace: 'nowrap' }}>Join now →</DSButton>
    </div>
  );
}

function PastEventRecap() {
  const attendees = [
    { name: 'Iris',  initials: 'IO' },
    { name: 'Sam',   initials: 'SA' },
    { name: 'Dev',   initials: 'DP' },
    { name: 'Maren', initials: 'MH' },
    { name: 'Rosa',  initials: 'RF' },
  ];
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 16, padding: '18px 20px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
        <div>
          <DSEyebrow>Past · Tue 14 May</DSEyebrow>
          <div style={{ fontFamily: DSF.display, fontSize: 18, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.015em', marginTop: 6 }}>Spring Supper</div>
          <div style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted, marginTop: 2 }}>Hosted by Iris Okonkwo · Brooklyn</div>
        </div>
        <DSTag tone="ok" dot>Recap up</DSTag>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <AvatarStack people={attendees} total={12} size={28} />
        <span style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.muted }}>12 attended</span>
      </div>

      <blockquote style={{ margin: '14px 0 0', padding: '10px 12px', background: dshex(DSC.accent, 0.07), borderLeft: `2px solid ${DSC.accent}`, borderRadius: '0 6px 6px 0', fontFamily: DSF.display, fontStyle: 'italic', fontSize: 13.5, color: DSC.ink2, lineHeight: 1.45 }}>
        "Best supper yet. Sam's seating chart was a stroke."<br />
        <span style={{ fontStyle: 'normal', fontSize: 11.5, color: DSC.muted, marginTop: 4, display: 'inline-block' }}>— Rosa Ferrara, '17</span>
      </blockquote>

      <div style={{ display: 'flex', gap: 16, marginTop: 14, fontFamily: DSF.body, fontSize: 12.5, fontWeight: 600 }}>
        <a style={{ color: DSC.accent, cursor: 'pointer' }}>Read recap →</a>
        <a style={{ color: DSC.muted, cursor: 'pointer' }}>See photos · 8</a>
      </div>
    </div>
  );
}

function WorkshopEventCard() {
  const going = 17, cap = 20;
  const pct = (going / cap) * 100;
  const left = cap - going;
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 16, padding: '18px 20px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <DSEyebrow>Workshop · Fri 23 May</DSEyebrow>
        <DSTag tone="warn" dot>Last {left} seats</DSTag>
      </div>
      <div style={{ fontFamily: DSF.display, fontSize: 18, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.015em', marginTop: 6 }}>Fundraising 101 — climate edition</div>
      <div style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.muted, marginTop: 4 }}>Iris Okonkwo & Rosa Ferrara · 7:00 pm · 90 min</div>

      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 5, fontFamily: DSF.body }}>
          <span style={{ fontFamily: DSF.mono, color: DSC.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Capacity</span>
          <span style={{ color: DSC.ink2, fontWeight: 600 }}>{going} / {cap} going</span>
        </div>
        <div style={{ background: DSC.rule, borderRadius: 999, height: 8, overflow: 'hidden', position: 'relative' }}>
          <div style={{ background: pct > 80 ? DSC.warn : DSC.accent, height: '100%', width: `${pct}%`, borderRadius: 999, transition: 'width 400ms cubic-bezier(0.2,0.8,0.2,1)' }} />
        </div>
      </div>

      <DSButton size="md" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>Claim your seat →</DSButton>
    </div>
  );
}

// ─── COMMUNITY PATTERNS ────────────────────────────────────────────────────

function CohortSpotlightCard() {
  return (
    <div style={{ background: `linear-gradient(140deg, ${DSC.ink} 0%, ${dshex('#3f5680', 1)} 100%)`, color: DSC.paper, borderRadius: 16, padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
      <svg aria-hidden="true" width="200" height="140" viewBox="0 0 200 140" style={{ position: 'absolute', right: -30, top: -20, opacity: 0.22 }}>
        <circle cx="70" cy="70" r="50" fill="none" stroke={DSC.accent} strokeWidth="1.4" />
        <circle cx="120" cy="70" r="50" fill="none" stroke={DSC.ok} strokeWidth="1.4" />
      </svg>

      <div style={{ position: 'relative' }}>
        <div style={{ fontFamily: DSF.mono, fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>This week in</div>
        <div style={{ fontFamily: DSF.display, fontSize: 32, fontWeight: 600, color: '#fff', letterSpacing: '-0.025em', lineHeight: 1, marginTop: 4 }}>Class of '11</div>

        <div style={{ display: 'flex', gap: 22, marginTop: 16, flexWrap: 'wrap' }}>
          {[
            { value: '47', label: 'Active members' },
            { value: '12', label: 'New threads' },
            { value: '3',  label: 'Events hosted' },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontFamily: DSF.display, fontSize: 24, fontWeight: 600, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
              <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 18, padding: '12px 14px', background: 'rgba(255,255,255,0.06)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <DSAvatar name="Iris" initials="IO" size={32} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: DSF.body, fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>Spotlight</div>
            <div style={{ fontFamily: DSF.body, fontSize: 13, color: '#fff', fontWeight: 600, marginTop: 1 }}>Iris hit 100 mentor hours this month.</div>
          </div>
          <a style={{ fontFamily: DSF.body, fontSize: 12, color: '#ff9b7a', fontWeight: 700, cursor: 'pointer' }}>Open →</a>
        </div>
      </div>
    </div>
  );
}

function WelcomeNewMemberCard() {
  return (
    <div style={{ background: DSC.card, border: `2px solid ${DSC.accent}`, borderRadius: 16, padding: '24px 22px 20px', position: 'relative', overflow: 'hidden', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 6px 16px rgba(42,34,26,0.06)' }}>
      <svg aria-hidden="true" width="260" height="160" viewBox="0 0 260 160" style={{ position: 'absolute', right: -50, top: -30, opacity: 0.18, pointerEvents: 'none' }}>
        <circle cx="100" cy="90" r="70" fill="none" stroke={DSC.accent} strokeWidth="1.5" />
        <circle cx="170" cy="90" r="70" fill="none" stroke={DSC.ok}     strokeWidth="1.5" />
      </svg>

      <div style={{ position: 'relative' }}>
        <DSEyebrow accent>Welcome aboard · 18 May 2026</DSEyebrow>
        <div style={{ fontFamily: DSF.display, fontSize: 26, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.025em', lineHeight: 1.1, marginTop: 8 }}>
          Welcome to Hartwood,<br />
          <span style={{ color: DSC.accent }}>Theo Harrington.</span>
        </div>
        <p style={{ fontFamily: DSF.body, fontSize: 13.5, color: DSC.muted, lineHeight: 1.6, marginTop: 10, maxWidth: 340 }}>
          You joined the circle yesterday, anchored by <strong style={{ color: DSC.ink2, fontWeight: 600 }}>Maren</strong> and <strong style={{ color: DSC.ink2, fontWeight: 600 }}>Iris</strong>. Here are your first three steps.
        </p>

        <ol style={{ listStyle: 'none', padding: 0, margin: '16px 0 0', display: 'flex', flexDirection: 'column', gap: 8, counterReset: 'wsteps' }}>
          {['Read the code of conduct', 'Introduce yourself in #welcome', 'RSVP to Spring Supper'].map((s, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: DSF.body, fontSize: 13, color: DSC.ink2 }}>
              <span style={{ width: 24, height: 24, borderRadius: 999, background: dshex(DSC.accent, 0.13), color: DSC.accent, display: 'grid', placeItems: 'center', fontFamily: DSF.mono, fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <DSButton size="md" style={{ flex: 1, justifyContent: 'center' }}>Read welcome letter</DSButton>
          <DSButton size="md" variant="outline">Browse</DSButton>
        </div>
      </div>
    </div>
  );
}

window.DiverseCardsSection = DiverseCardsSection;
