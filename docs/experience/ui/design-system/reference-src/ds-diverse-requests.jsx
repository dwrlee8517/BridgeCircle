/* eslint-disable */
// Atrium Design System — Diversified Requests & Inbox (Section 25)
// More inbox card archetypes — coffee invites, office hours, 3rd-party intros,
// AI reply suggestions, re-engagement nudges, follow-up reminders.

function DiverseRequestsSection() {
  return (
    <DSSection id="diverserequests" eyebrow="Components · 25" title="Diversified Requests & Inbox">

      <DSSub title="Specific request types — clearer intent than 'mentor request'">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          <VariantCard label="Coffee invite" note="Specific 1-on-1 with suggested time slots.">
            <CoffeeInviteCard />
          </VariantCard>
          <VariantCard label="Office hours · book a slot" note="Recurring host availability with bookable slots.">
            <OfficeHoursCard />
          </VariantCard>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14, marginTop: 14 }}>
          <VariantCard label="3rd-party introduction" note="Matchmaker pattern — someone connects two members.">
            <ThirdPartyIntroCard />
          </VariantCard>
        </div>
      </DSSub>

      <DSSub title="Inbox helpers — assistive cards, not new requests">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          <VariantCard label="AI reply suggestion" note="Drafts a response in your voice; never auto-sends.">
            <ReplySuggestionCard />
          </VariantCard>
          <VariantCard label="Re-engagement nudge" note="Quiet ping after a long silence with someone you cared about.">
            <ReengagementCard />
          </VariantCard>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14, marginTop: 14 }}>
          <VariantCard label="Follow-up reminder · self-promise" note="A thing you said you'd do, gently surfaced.">
            <FollowupReminderCard />
          </VariantCard>
        </div>
      </DSSub>

    </DSSection>
  );
}

// ─── COFFEE INVITE ─────────────────────────────────────────────────────────

function CoffeeInviteCard() {
  const [picked, setPicked] = React.useState(null);
  const slots = ['Tue 9 am', 'Wed 2 pm', 'Thu 4 pm', 'Fri 8 am'];
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 16, padding: '18px 20px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 999, background: dshex(DSC.accent, 0.12), display: 'grid', placeItems: 'center', color: DSC.accent, flexShrink: 0 }}>
          <CoffeeGlyph />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.accent, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>Coffee invite · 2h ago</div>
          <div style={{ fontFamily: DSF.display, fontSize: 16, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.015em', marginTop: 3 }}>Iris Okonkwo</div>
        </div>
        <DSAvatar name="Iris Okonkwo" initials="IO" size={36} />
      </div>

      <p style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.ink2, lineHeight: 1.55, margin: 0 }}>
        "Free for a coffee in Brooklyn this week? Would love to hear how the launch is landing — and trade notes on climate underwriting."
      </p>

      <div style={{ marginTop: 14 }}>
        <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>Iris is free</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {slots.map(s => {
            const on = picked === s;
            return (
              <button key={s} onClick={() => setPicked(s)} style={{ background: on ? DSC.ink : DSC.cardAlt, color: on ? DSC.paper : DSC.ink, border: `1px solid ${on ? DSC.ink : DSC.rule}`, borderRadius: 999, padding: '6px 12px', fontFamily: DSF.body, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 120ms ease' }}>{s}</button>
            );
          })}
          <button style={{ background: 'transparent', color: DSC.muted, border: `1px dashed ${DSC.rule}`, borderRadius: 999, padding: '6px 12px', fontFamily: DSF.body, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Suggest another</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <DSButton size="sm" disabled={!picked} style={{ flex: 1, justifyContent: 'center' }}>
          {picked ? `Confirm ${picked} →` : 'Pick a time'}
        </DSButton>
        <DSButton size="sm" variant="ghost">Reply</DSButton>
      </div>
    </div>
  );
}

function CoffeeGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" />
      <path d="M16 12h2a3 3 0 0 1 0 6h-2" />
      <path d="M7 4c-1 1-1 2 0 3M11 4c-1 1-1 2 0 3M15 4c-1 1-1 2 0 3" />
    </svg>
  );
}

// ─── OFFICE HOURS ──────────────────────────────────────────────────────────

function OfficeHoursCard() {
  const slots = [
    { time: '16:00', dur: '15 min', taken: false },
    { time: '16:15', dur: '15 min', taken: true,  by: 'Theo H.' },
    { time: '16:30', dur: '15 min', taken: false },
    { time: '16:45', dur: '15 min', taken: false },
  ];
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 16, padding: '18px 20px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 999, background: dshex(DSC.ok, 0.12), display: 'grid', placeItems: 'center', color: DSC.ok, flexShrink: 0 }}>
          <ClockGlyph />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.ok, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>Office hours · weekly</div>
          <div style={{ fontFamily: DSF.display, fontSize: 16, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.015em', marginTop: 3 }}>Iris's open hours · every Tue 4–5 pm</div>
          <div style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted, marginTop: 2 }}>15-min slots · Brooklyn or video</div>
        </div>
      </div>

      <div style={{ background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: 12, padding: 4 }}>
        {slots.map((s, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12, alignItems: 'center', padding: '10px 12px', borderRadius: 8, background: s.taken ? 'transparent' : DSC.card, marginBottom: i === slots.length - 1 ? 0 : 4, opacity: s.taken ? 0.55 : 1 }}>
            <div style={{ fontFamily: DSF.mono, fontSize: 12, color: DSC.ink, fontWeight: 700, letterSpacing: '0.04em', minWidth: 48 }}>{s.time}</div>
            <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted }}>
              {s.taken ? <>Taken · {s.by}</> : <>{s.dur} · available</>}
            </div>
            {s.taken
              ? <span style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>Booked</span>
              : <DSButton size="sm" variant="outline" style={{ padding: '5px 12px', fontSize: 11.5 }}>Book</DSButton>}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, lineHeight: 1.5 }}>
        Iris caps office hours at 4 slots/week. <a style={{ color: DSC.accent, fontWeight: 600, cursor: 'pointer' }}>See all upcoming</a>
      </div>
    </div>
  );
}

function ClockGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 16 14" strokeLinecap="round" strokeLinejoin="round" /></svg>
  );
}

// ─── 3RD-PARTY INTRO ───────────────────────────────────────────────────────

function ThirdPartyIntroCard() {
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 16, padding: '18px 22px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <DSAvatar name="Maren Holt" initials="MH" size={28} />
          <div style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.muted }}>
            <strong style={{ color: DSC.ink, fontWeight: 700 }}>Maren</strong> wants to introduce you to a fellow member.
          </div>
        </div>
        <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>4h ago</div>
      </div>

      {/* Match visual */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center', margin: '20px 0 16px', padding: '14px 16px', background: dshex(DSC.accent, 0.06), border: `1px solid ${dshex(DSC.accent, 0.20)}`, borderRadius: 12 }}>
        {/* You */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BadgeOverlayAvatar name="You" initials="YOU" size={44} badge="verified" />
          <div>
            <div style={{ fontFamily: DSF.display, fontSize: 13.5, fontWeight: 600, color: DSC.ink }}>You</div>
            <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, marginTop: 1 }}>Climate underwriter</div>
          </div>
        </div>
        {/* Arrow + match badge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <svg width="28" height="20" viewBox="0 0 28 20" fill="none">
            <path d="M2 10h24M22 5l5 5-5 5" stroke={DSC.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M26 10H2M6 5L1 10l5 5" stroke={DSC.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.accent, letterSpacing: '0.10em', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>84% fit</span>
        </div>
        {/* Theo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexDirection: 'row-reverse', textAlign: 'right' }}>
          <DSAvatar name="Theo Harrington" initials="TH" size={44} />
          <div>
            <div style={{ fontFamily: DSF.display, fontSize: 13.5, fontWeight: 600, color: DSC.ink }}>Theo Harrington</div>
            <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, marginTop: 1 }}>Product, Waymark · '20</div>
          </div>
        </div>
      </div>

      <blockquote style={{ margin: 0, padding: '10px 12px', background: DSC.cardAlt, borderLeft: `2px solid ${DSC.accent}`, borderRadius: '0 6px 6px 0' }}>
        <p style={{ fontFamily: DSF.display, fontStyle: 'italic', fontSize: 13.5, color: DSC.ink2, lineHeight: 1.5, margin: 0 }}>
          "Theo's building the exact kind of climate fintech tooling Iris underwrites. Strong case for a 30-min."
        </p>
        <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, marginTop: 6 }}>— Maren · matchmaker note</div>
      </blockquote>

      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        <DSButton size="md" style={{ flex: 1, justifyContent: 'center', minWidth: 160 }}>Accept intro</DSButton>
        <DSButton size="md" variant="outline">Pass for now</DSButton>
        <DSButton size="md" variant="ghost">Reply to Maren</DSButton>
      </div>
    </div>
  );
}

// ─── AI REPLY SUGGESTION ───────────────────────────────────────────────────

function ReplySuggestionCard() {
  const drafts = [
    "Happy to help. Would Tue 4 pm work? Iris's office hours are usually open then.",
    "Yes — quick coffee Thu 8 am Brooklyn? I'll save you a seat at Spring Supper too.",
    "Let's do it. Reply with three times that work and I'll pick.",
  ];
  const [idx, setIdx] = React.useState(0);
  return (
    <div style={{ background: dshex(DSC.accent, 0.06), border: `1px solid ${dshex(DSC.accent, 0.24)}`, borderRadius: 16, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1L9.5 6.5L15 8L9.5 9.5L8 15L6.5 9.5L1 8L6.5 6.5Z" fill={DSC.accent} /></svg>
        <span style={{ fontFamily: DSF.body, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', color: DSC.accent, textTransform: 'uppercase' }}>Suggested reply</span>
        <span style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted }}>· in your voice</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {drafts.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} aria-label={`Draft ${i + 1}`} style={{ width: 14, height: 14, borderRadius: 999, background: idx === i ? DSC.accent : DSC.card, border: `1px solid ${idx === i ? DSC.accent : dshex(DSC.accent, 0.30)}`, cursor: 'pointer' }} />
          ))}
        </div>
      </div>

      <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 12, padding: '14px 16px', minHeight: 80 }}>
        <p style={{ fontFamily: DSF.body, fontSize: 14, color: DSC.ink, lineHeight: 1.55, margin: 0 }}>{drafts[idx]}</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <DSButton size="sm">Use this reply</DSButton>
        <DSButton size="sm" variant="outline">Edit first</DSButton>
        <button onClick={() => setIdx((idx + 1) % drafts.length)} style={{ background: 'none', border: 'none', color: DSC.accent, fontFamily: DSF.body, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M3 12a9 9 0 0 1 14.5-7L20 3M21 12a9 9 0 0 1-14.5 7L4 21" /></svg>
          Another draft
        </button>
      </div>

      <div style={{ marginTop: 12, fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.06em' }}>
        Draft {idx + 1} of {drafts.length} · Never auto-sent
      </div>
    </div>
  );
}

// ─── RE-ENGAGEMENT ─────────────────────────────────────────────────────────

function ReengagementCard() {
  return (
    <div style={{ background: DSC.card, border: `1px dashed ${DSC.muted}`, borderRadius: 16, padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
      {/* Big "90" ghost */}
      <div aria-hidden="true" style={{ position: 'absolute', right: -10, top: -16, fontFamily: DSF.display, fontSize: 130, fontWeight: 600, color: dshex(DSC.muted, 0.10), letterSpacing: '-0.04em', lineHeight: 1, pointerEvents: 'none' }}>90</div>

      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <DSAvatar name="Dev Patel" initials="DP" size={44} />
          <div>
            <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>Quiet for 90 days</div>
            <div style={{ fontFamily: DSF.display, fontSize: 17, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.015em', marginTop: 2 }}>You haven't talked to Dev.</div>
          </div>
        </div>

        <div style={{ marginTop: 14, padding: '10px 12px', background: DSC.cardAlt, borderRadius: 10, fontFamily: DSF.body, fontSize: 12.5, color: DSC.ink2, lineHeight: 1.5 }}>
          Last topic: <strong style={{ color: DSC.ink, fontWeight: 600 }}>climate VCs and the Hawkins paper</strong>. You were going to send him your notes.
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <DSButton size="sm" leadIcon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12V7a2 2 0 1 1 4 0v4M9 11V5a2 2 0 1 1 4 0v6M13 12V6a2 2 0 1 1 4 0v8M17 12V9a2 2 0 1 1 4 0v6a7 7 0 0 1-14 0" strokeLinecap="round" strokeLinejoin="round" /></svg>}>Send a quick hi</DSButton>
          <DSButton size="sm" variant="outline">Send those notes</DSButton>
          <DSButton size="sm" variant="ghost">Hide for 30 days</DSButton>
        </div>
      </div>
    </div>
  );
}

// ─── FOLLOWUP REMINDER ─────────────────────────────────────────────────────

function FollowupReminderCard() {
  return (
    <div style={{ background: dshex(DSC.warn, 0.06), border: `1px solid ${dshex(DSC.warn, 0.26)}`, borderRadius: 16, padding: '16px 18px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 14, alignItems: 'center' }}>
      {/* Icon */}
      <div style={{ width: 40, height: 40, borderRadius: 999, background: dshex(DSC.warn, 0.16), color: DSC.warn, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 1 1-3-6.7M21 3v6h-6" />
        </svg>
      </div>

      {/* Body */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.warn, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>Gentle nudge · 3 weeks overdue</div>
        <div style={{ fontFamily: DSF.body, fontSize: 13.5, color: DSC.ink, marginTop: 4, lineHeight: 1.5 }}>
          You said you'd send <strong style={{ fontWeight: 700 }}>Iris</strong> a thought on her climate underwriting piece.
        </div>
        <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, marginTop: 4, fontStyle: 'italic' }}>
          "Will follow up after Spring Supper" — your note, 28 April.
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
        <DSButton size="sm">Reply now</DSButton>
        <DSButton size="sm" variant="ghost" style={{ padding: '4px 10px', fontSize: 11.5 }}>Move to next week</DSButton>
      </div>
    </div>
  );
}

window.DiverseRequestsSection = DiverseRequestsSection;
