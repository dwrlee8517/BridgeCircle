/* eslint-disable */
// Atrium Design System — Email Templates (Section 42)

function EmailTemplatesSection() {
  return (
    <DSSection id="emails" eyebrow="Components · 42" title="Email Templates">

      <DSSub title="Welcome email — first touch after admissions confirms">
        <EmailFrame subject="Welcome to Hartwood, Maren." preview="Iris is hosting Tuesday. Here's your key.">
          <WelcomeEmail />
        </EmailFrame>
      </DSSub>

      <DSSub title="Weekly digest · The Wire">
        <EmailFrame subject="The Wire · week of 19 May" preview="3 replies waiting · Iris just joined · Spring Supper Tue">
          <WireDigest />
        </EmailFrame>
      </DSSub>

      <DSSub title="RSVP confirmation · with calendar attachment">
        <EmailFrame subject="You're going to Spring Supper · Tue 7:30 pm" preview="Brooklyn · seated next to Iris">
          <RSVPEmail />
        </EmailFrame>
      </DSSub>

      <DSSub title="Anniversary card · the wax seal in your inbox">
        <EmailFrame subject="Five years in the circle." preview="You joined 19 May 2021. Here's what you've made.">
          <AnniversaryEmail />
        </EmailFrame>
      </DSSub>

      <DSSub title="Mention notification · short, signed">
        <EmailFrame subject="Sam mentioned you in #climate-vc" preview='"@maren has the underwriting deck — let me dig…"'>
          <MentionEmail />
        </EmailFrame>
      </DSSub>

      <DSSub title="Voice rules — what these emails do, and don't, sound like">
        <EmailVoiceRules />
      </DSSub>

    </DSSection>
  );
}

// ─── EMAIL FRAME ───────────────────────────────────────────────────────────

function EmailFrame({ subject, preview, children }) {
  return (
    <div style={{ background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 14px rgba(42,34,26,0.08)' }}>
      {/* Client chrome */}
      <div style={{ padding: '10px 14px', background: DSC.panel, borderBottom: `1px solid ${DSC.rule}`, display: 'grid', gridTemplateColumns: '90px 1fr auto', gap: 8, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: 999, background: dshex(DSC.muted, 0.35) }} />
          <span style={{ width: 9, height: 9, borderRadius: 999, background: dshex(DSC.muted, 0.35) }} />
          <span style={{ width: 9, height: 9, borderRadius: 999, background: dshex(DSC.muted, 0.35) }} />
        </div>
        <div style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.ink, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {subject} <span style={{ color: DSC.muted, fontWeight: 400 }}>· {preview}</span>
        </div>
        <span style={{ fontFamily: DSF.mono, fontSize: 9, color: DSC.muted, letterSpacing: '0.06em' }}>Inbox</span>
      </div>
      {/* From / to */}
      <div style={{ padding: '10px 18px', background: '#fdfbf5', borderBottom: `1px solid ${DSC.ruleSoft}`, fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, display: 'flex', flexWrap: 'wrap', gap: 18 }}>
        <span><strong style={{ color: DSC.ink, fontWeight: 600 }}>From</strong>  The Hartwood Society &lt;letter@hartwood.org&gt;</span>
        <span><strong style={{ color: DSC.ink, fontWeight: 600 }}>To</strong>  maren@hartwood.org</span>
      </div>
      <div style={{ background: '#fdfbf5', padding: 0 }}>{children}</div>
    </div>
  );
}

function EmailWordmark({ small }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <svg width={small ? 24 : 32} height={small ? 18 : 24} viewBox="0 0 32 24" aria-hidden="true">
        <circle cx="11" cy="12" r="9" fill={DSC.accent} fillOpacity="0.85" />
        <circle cx="21" cy="12" r="9" fill={DSC.ok}     fillOpacity="0.85" />
      </svg>
      <span style={{ fontFamily: DSF.display, fontSize: small ? 13 : 16, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.015em' }}>BridgeCircle</span>
    </div>
  );
}

function EmailFooter() {
  return (
    <div style={{ padding: '20px 28px 24px', borderTop: `1px solid ${DSC.ruleSoft}`, background: '#fdfbf5' }}>
      <EmailWordmark small />
      <div style={{ fontFamily: DSF.body, fontSize: 11, color: DSC.muted, marginTop: 10, lineHeight: 1.55 }}>
        The Hartwood Society · Brooklyn, NY · <a style={{ color: DSC.accent, cursor: 'pointer' }}>hartwood.org</a><br />
        You're getting this because you're a member. <a style={{ color: DSC.muted, textDecoration: 'underline', cursor: 'pointer' }}>Email preferences</a> · <a style={{ color: DSC.muted, textDecoration: 'underline', cursor: 'pointer' }}>Unsubscribe</a>
      </div>
    </div>
  );
}

// ─── 1. WELCOME ─────────────────────────────────────────────────────────────

function WelcomeEmail() {
  return (
    <div>
      <div style={{ padding: '28px 28px 18px', position: 'relative', overflow: 'hidden' }}>
        <svg aria-hidden="true" width="320" height="200" viewBox="0 0 320 200" style={{ position: 'absolute', right: -40, top: -30, opacity: 0.18, pointerEvents: 'none' }}>
          <circle cx="120" cy="100" r="80" fill="none" stroke={DSC.accent} strokeWidth="1.4" />
          <circle cx="200" cy="100" r="80" fill="none" stroke={DSC.ok}     strokeWidth="1.4" />
        </svg>
        <EmailWordmark />
        <div style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.accent, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginTop: 22, position: 'relative' }}>Issue №142 · Welcome letter</div>
        <h1 style={{ fontFamily: DSF.display, fontSize: 30, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.025em', lineHeight: 1.05, margin: '10px 0 0', position: 'relative' }}>Welcome to Hartwood, <span style={{ color: DSC.accent }}>Maren.</span></h1>
      </div>
      <div style={{ padding: '6px 28px 22px', fontFamily: DSF.body, fontSize: 14.5, color: DSC.ink2, lineHeight: 1.7 }}>
        <p style={{ margin: '0 0 14px' }}>You're now a member of the circle. Iris and Dev opened the door — they've each received a note from us, too.</p>
        <p style={{ margin: '0 0 18px' }}>Three small things to do this week:</p>
        <ol style={{ paddingLeft: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { n: '01', t: 'Set up your profile', d: 'About 4 minutes. You can write the bio later.' },
            { n: '02', t: 'RSVP to Spring Supper', d: 'Tuesday 27 May · Brooklyn · Iris is hosting.' },
            { n: '03', t: 'Introduce yourself in #welcome', d: 'A line on what you\u2019re working on. People will reach out.' },
          ].map(s => (
            <li key={s.n} style={{ display: 'grid', gridTemplateColumns: '32px 1fr', gap: 12, alignItems: 'baseline' }}>
              <span style={{ fontFamily: DSF.mono, fontSize: 11, color: DSC.accent, letterSpacing: '0.10em', fontWeight: 700 }}>{s.n}</span>
              <span><strong style={{ color: DSC.ink, fontWeight: 700 }}>{s.t}.</strong> <span style={{ color: DSC.muted }}>{s.d}</span></span>
            </li>
          ))}
        </ol>
        <div style={{ marginTop: 22 }}>
          <a style={{ display: 'inline-block', background: DSC.accent, color: '#fff', borderRadius: 999, padding: '12px 22px', fontFamily: DSF.body, fontSize: 14, fontWeight: 600, textDecoration: 'none', boxShadow: '0 1px 0 rgba(255,255,255,.25) inset, 0 1px 2px rgba(42,34,26,0.08)' }}>Open the circle →</a>
        </div>
        <p style={{ margin: '24px 0 0', fontStyle: 'italic', fontFamily: DSF.display, color: DSC.muted, fontSize: 14 }}>~ The Hartwood Society</p>
      </div>
      <EmailFooter />
    </div>
  );
}

// ─── 2. WIRE DIGEST ─────────────────────────────────────────────────────────

function WireDigest() {
  return (
    <div>
      <div style={{ padding: '24px 28px 14px' }}>
        <EmailWordmark />
        <div style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.accent, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginTop: 22 }}>The Wire · week of 19 May</div>
        <h1 style={{ fontFamily: DSF.display, fontSize: 26, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.025em', margin: '8px 0 0' }}>Good morning, Maren.</h1>
      </div>
      <div style={{ padding: '6px 28px 20px', fontFamily: DSF.body, fontSize: 14, color: DSC.ink2, lineHeight: 1.6 }}>
        <p style={{ margin: '0 0 16px' }}>Three things from the wire this week. Reply when you have a minute.</p>

        {/* On your desk */}
        <div style={{ borderTop: `2px solid ${DSC.ink}`, paddingTop: 12, marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: DSF.display, fontSize: 16, fontWeight: 600, color: DSC.ink }}>On your desk</span>
            <span style={{ background: dshex(DSC.accent, 0.12), color: DSC.accent, fontFamily: DSF.body, fontSize: 10.5, fontWeight: 700, padding: '2px 9px', borderRadius: 999, letterSpacing: '0.04em' }}>3 replies</span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13.5 }}>
            <li><strong style={{ color: DSC.ink, fontWeight: 700 }}>Jordan Reyes</strong> — climate fintech intro · waiting 6 days</li>
            <li><strong style={{ color: DSC.ink, fontWeight: 700 }}>Priya Subramaniam</strong> — leadership hire · waiting 2 days</li>
            <li><strong style={{ color: DSC.ink, fontWeight: 700 }}>Theo Harrington</strong> — career check-in · waiting 1 day</li>
          </ul>
        </div>

        {/* Calendar */}
        <div style={{ borderTop: `2px solid ${DSC.ink}`, paddingTop: 12, marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: DSF.display, fontSize: 16, fontWeight: 600, color: DSC.ink }}>On your calendar</span>
            <span style={{ background: dshex(DSC.ok, 0.14), color: DSC.ok, fontFamily: DSF.body, fontSize: 10.5, fontWeight: 700, padding: '2px 9px', borderRadius: 999, letterSpacing: '0.04em' }}>2 events</span>
          </div>
          <div style={{ marginTop: 10, padding: '12px 14px', background: '#fefcf3', border: `1px solid ${DSC.ruleSoft}`, borderRadius: 8 }}>
            <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.accent, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>T−8d · You're hosting</div>
            <div style={{ fontFamily: DSF.display, fontSize: 16, fontWeight: 600, color: DSC.ink, marginTop: 4 }}>Spring Supper · Tue 27 May · 7:30 pm</div>
            <div style={{ fontSize: 12, color: DSC.muted, marginTop: 2 }}>14 of 20 going · co-host Sam Aldridge</div>
          </div>
        </div>

        {/* Wire */}
        <div style={{ borderTop: `2px solid ${DSC.ink}`, paddingTop: 12, marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: DSF.display, fontSize: 16, fontWeight: 600, color: DSC.ink }}>On the wire</span>
            <span style={{ background: dshex('#3f5680', 0.14), color: '#3f5680', fontFamily: DSF.body, fontSize: 10.5, fontWeight: 700, padding: '2px 9px', borderRadius: 999, letterSpacing: '0.04em' }}>+8 this week</span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0', display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: DSC.muted }}>
            <li><strong style={{ color: DSC.ink, fontWeight: 600 }}>Dev Patel</strong> joined office hours · Tue 4 pm</li>
            <li><strong style={{ color: DSC.ink, fontWeight: 600 }}>Rosa Ferrara</strong> opened a thread on climate underwriting</li>
            <li><strong style={{ color: DSC.ink, fontWeight: 600 }}>Iris Okonkwo</strong> wrote the new Letter — Issue 142</li>
          </ul>
        </div>

        <div style={{ marginTop: 22 }}>
          <a style={{ display: 'inline-block', background: DSC.ink, color: DSC.paper, borderRadius: 999, padding: '11px 20px', fontFamily: DSF.body, fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}>Open Hartwood →</a>
        </div>
      </div>
      <EmailFooter />
    </div>
  );
}

// ─── 3. RSVP ───────────────────────────────────────────────────────────────

function RSVPEmail() {
  return (
    <div>
      <div style={{ padding: '24px 28px 14px' }}>
        <EmailWordmark />
      </div>
      <div style={{ padding: '0 28px 22px', fontFamily: DSF.body, fontSize: 14, color: DSC.ink2, lineHeight: 1.6 }}>
        <div style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.accent, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>Confirmed · See you Tuesday</div>
        <h1 style={{ fontFamily: DSF.display, fontSize: 26, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.025em', margin: '8px 0 12px' }}>You're going to <span style={{ color: DSC.accent }}>Spring Supper</span>.</h1>
        <p style={{ margin: '0 0 18px' }}>Iris saved you a chair. Sam put you next to Theo (you'll get along).</p>

        {/* Ticket-style card */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px', background: DSC.card, border: `1.5px solid ${DSC.ink2}`, borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px' }}>
            <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.accent, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>Admit one · Hartwood</div>
            <div style={{ fontFamily: DSF.display, fontSize: 18, fontWeight: 600, color: DSC.ink, marginTop: 4 }}>Spring Supper</div>
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, fontSize: 12 }}>
              {[['Date','Tue · 27 May'],['Time','7:30 pm'],['Where',"14 Pineapple, Brooklyn"],['Host',"Iris O. '11"]].map(([k,v]) => (
                <div key={k}>
                  <div style={{ fontFamily: DSF.mono, fontSize: 8.5, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>{k}</div>
                  <div style={{ fontWeight: 600, color: DSC.ink, marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: DSC.cardAlt, borderLeft: `2px dashed ${DSC.muted}`, padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontFamily: DSF.mono, fontSize: 8.5, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>Seat</div>
            <div style={{ fontFamily: DSF.display, fontSize: 28, fontWeight: 700, color: DSC.accent, lineHeight: 1, marginTop: 4 }}>08</div>
            <div style={{ fontFamily: DSF.mono, fontSize: 8.5, color: DSC.muted, letterSpacing: '0.10em', fontWeight: 600, marginTop: 4 }}>№142</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          <a style={{ display: 'inline-block', background: DSC.accent, color: '#fff', borderRadius: 999, padding: '10px 18px', fontFamily: DSF.body, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Add to calendar</a>
          <a style={{ display: 'inline-block', background: DSC.cardAlt, color: DSC.ink, border: `1px solid ${DSC.rule}`, borderRadius: 999, padding: '10px 18px', fontFamily: DSF.body, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Bring something →</a>
        </div>
      </div>
      <EmailFooter />
    </div>
  );
}

// ─── 4. ANNIVERSARY ─────────────────────────────────────────────────────────

function AnniversaryEmail() {
  return (
    <div>
      <div style={{ padding: '36px 28px 24px', position: 'relative', overflow: 'hidden' }}>
        <svg aria-hidden="true" width="400" height="240" viewBox="0 0 400 240" style={{ position: 'absolute', right: -50, top: -20, opacity: 0.16, pointerEvents: 'none' }}>
          <circle cx="160" cy="120" r="100" fill="none" stroke={DSC.accent} strokeWidth="1.4" />
          <circle cx="240" cy="120" r="100" fill="none" stroke={DSC.ok}     strokeWidth="1.4" />
        </svg>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, position: 'relative' }}>
          {/* Wax seal */}
          <svg width="84" height="84" viewBox="0 0 120 120">
            <defs>
              <radialGradient id="emailwax" cx="35%" cy="30%">
                <stop offset="0" stopColor="#e88a6c" />
                <stop offset="0.5" stopColor="#c75a3a" />
                <stop offset="1" stopColor="#8a3a20" />
              </radialGradient>
            </defs>
            <path d="M60,8 C82,8 102,18 108,40 C114,62 102,90 80,104 C58,118 38,112 24,96 C10,80 8,52 18,34 C28,16 42,8 60,8 Z" fill="url(#emailwax)" />
            <circle cx="60" cy="60" r="36" fill="none" stroke="rgba(0,0,0,0.32)" strokeWidth="1.2" />
            <text x="60" y="70" textAnchor="middle" fontFamily='"Inter Tight"' fontSize="26" fontWeight="700" fill="#fff">MH</text>
          </svg>
          <div>
            <div style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.accent, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>Anniversary · 19 May 2026</div>
            <h1 style={{ fontFamily: DSF.display, fontSize: 32, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.025em', lineHeight: 1.05, margin: '6px 0 0' }}>Five years <span style={{ color: DSC.muted, fontWeight: 500 }}>in the circle.</span></h1>
          </div>
        </div>
      </div>
      <div style={{ padding: '0 28px 22px', fontFamily: DSF.body, fontSize: 14, color: DSC.ink2, lineHeight: 1.65 }}>
        <p style={{ margin: '0 0 18px' }}>You joined Hartwood on <strong style={{ color: DSC.ink, fontWeight: 700 }}>May 19, 2021</strong>, invited by <strong style={{ color: DSC.ink, fontWeight: 700 }}>Dev Patel</strong> and verified by the Society. Here's what you've made since:</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, padding: '14px 0', borderTop: `1px solid ${DSC.ruleSoft}`, borderBottom: `1px solid ${DSC.ruleSoft}` }}>
          {[
            { v: '247', l: 'Conversations',  c: DSC.accent },
            { v: '18',  l: 'Events attended', c: DSC.ok },
            { v: '12',  l: 'Members invited', c: '#3f5680' },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontFamily: DSF.display, fontSize: 28, fontWeight: 600, color: s.c, letterSpacing: '-0.025em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{s.v}</div>
              <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, marginTop: 5 }}>{s.l}</div>
            </div>
          ))}
        </div>
        <p style={{ margin: '18px 0 0' }}>The next supper is on Tuesday. Iris asked after you.</p>
        <p style={{ margin: '22px 0 0', fontStyle: 'italic', fontFamily: DSF.display, color: DSC.muted }}>~ The Hartwood Society</p>
      </div>
      <EmailFooter />
    </div>
  );
}

// ─── 5. MENTION ─────────────────────────────────────────────────────────────

function MentionEmail() {
  return (
    <div>
      <div style={{ padding: '20px 28px 12px' }}>
        <EmailWordmark small />
      </div>
      <div style={{ padding: '0 28px 22px', fontFamily: DSF.body, fontSize: 14, color: DSC.ink2, lineHeight: 1.65 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <DSAvatar name="Sam Aldridge" initials="SA" size={36} />
          <div>
            <div style={{ fontFamily: DSF.body, fontSize: 14, color: DSC.ink2 }}><strong style={{ color: DSC.ink, fontWeight: 700 }}>Sam Aldridge</strong> mentioned you in <strong style={{ color: DSC.accent, fontWeight: 700 }}>#climate-vc</strong></div>
            <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.06em', marginTop: 2 }}>4 hours ago · Class of '11</div>
          </div>
        </div>
        <blockquote style={{ margin: 0, padding: '12px 16px', background: '#f5edd8', borderLeft: `3px solid ${DSC.accent}`, borderRadius: '0 6px 6px 0' }}>
          <p style={{ fontFamily: DSF.display, fontStyle: 'italic', fontSize: 16, color: DSC.ink, lineHeight: 1.45, margin: 0 }}>"<strong style={{ color: DSC.accent, fontStyle: 'normal' }}>@maren</strong> has the underwriting deck from the November session — let me dig it up and send it your way."</p>
        </blockquote>
        <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          <a style={{ display: 'inline-block', background: DSC.accent, color: '#fff', borderRadius: 999, padding: '10px 18px', fontFamily: DSF.body, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Reply in thread →</a>
          <a style={{ display: 'inline-block', background: 'transparent', color: DSC.muted, padding: '10px 4px', fontFamily: DSF.body, fontSize: 12.5, fontWeight: 600, textDecoration: 'none' }}>Mute this thread</a>
        </div>
      </div>
      <EmailFooter />
    </div>
  );
}

// ─── VOICE RULES ───────────────────────────────────────────────────────────

function EmailVoiceRules() {
  const rules = [
    { good: 'Subject: "You\u2019re going to Spring Supper · Tue 7:30 pm"', bad: 'Subject: "Your RSVP has been confirmed"',                      note: 'Name the event, not the action.' },
    { good: 'From: The Hartwood Society <letter@hartwood.org>',           bad: 'From: noreply@bridgecircle.com',                                note: 'Never noreply. The Society sends letters.' },
    { good: 'Iris saved you a chair.',                                    bad: 'Click the button below to confirm your attendance.',           note: 'Speak in the present tense, in voice.' },
    { good: '"Open the circle →"',                                         bad: '"CLICK HERE TO LOG IN"',                                       note: 'Sentence-case, accent arrow, no shouting.' },
    { good: '~ The Hartwood Society',                                     bad: 'Best, The BridgeCircle Team',                                  note: 'Signature is hand-drawn, not corporate.' },
    { good: 'Plain text fallback exists for every HTML.',                  bad: 'HTML only.',                                                    note: 'A11y: every email has a text-only twin.' },
  ];
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', padding: '10px 18px', background: DSC.panel, fontFamily: DSF.mono, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: DSC.muted, fontWeight: 700 }}>
        <span style={{ color: DSC.ok }}>Use</span><span style={{ color: DSC.bad }}>Not</span><span>Why</span>
      </div>
      {rules.map((r, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', padding: '12px 18px', borderTop: `1px solid ${DSC.ruleSoft}`, gap: 12, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ width: 14, height: 14, borderRadius: 999, background: DSC.ok, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 2 }}>
              <Icon name="check" size={9} color="currentColor" strokeWidth={3.2} />
            </span>
            <span style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.ink, fontWeight: 600, lineHeight: 1.45 }}>{r.good}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ width: 14, height: 14, borderRadius: 999, background: DSC.bad, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 2 }}>
              <Icon name="close" size={9} color="currentColor" strokeWidth={3.2} />
            </span>
            <span style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted, fontStyle: 'italic', lineHeight: 1.45 }}>{r.bad}</span>
          </div>
          <span style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, lineHeight: 1.5 }}>{r.note}</span>
        </div>
      ))}
    </div>
  );
}

window.EmailTemplatesSection = EmailTemplatesSection;
