/* eslint-disable */
// Atrium Design System — Long-form Content Layout (Section 37)

function LongformSection() {
  return (
    <DSSection id="longform" eyebrow="Components · 37" title="Long-form Content Layout">

      <DSSub title="Article template — Hartwood Letter, issue №142">
        <ArticlePage />
      </DSSub>

      <DSSub title="Long-form atoms — drop cap · TOC · pull quote · footnote · caption · citation">
        <LongformAtoms />
      </DSSub>

    </DSSection>
  );
}

function ArticlePage() {
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 18, overflow: 'hidden', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 4px 14px rgba(42,34,26,0.06)' }}>
      {/* Header eyebrow */}
      <div style={{ padding: '14px 24px', background: DSC.cardAlt, borderBottom: `1px solid ${DSC.rule}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.accent, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>The Hartwood Letter · Issue №142</span>
        <span style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.06em' }}>~ 8 min read · 19 May 2026</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 200px', gap: 28, padding: '36px 24px 44px' }}>
        {/* Left: TOC */}
        <aside style={{ position: 'sticky', top: 14, alignSelf: 'flex-start' }}>
          <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>In this letter</div>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column' }}>
            {[
              { n: '01', t: 'A door, opened',         active: false },
              { n: '02', t: "The next cohort's debt", active: true },
              { n: '03', t: 'What we keep building',  active: false },
              { n: '04', t: 'Footnotes & sources',    active: false },
            ].map(s => (
              <li key={s.n} style={{ display: 'grid', gridTemplateColumns: '24px 1fr', gap: 8, padding: '6px 0', borderLeft: `2px solid ${s.active ? DSC.accent : 'transparent'}`, paddingLeft: 12, marginLeft: -14 }}>
                <span style={{ fontFamily: DSF.mono, fontSize: 9.5, color: s.active ? DSC.accent : DSC.mute2, letterSpacing: '0.10em', fontWeight: 700 }}>{s.n}</span>
                <a style={{ fontFamily: DSF.body, fontSize: 12, color: s.active ? DSC.ink : DSC.muted, lineHeight: 1.4, fontWeight: s.active ? 600 : 500, cursor: 'pointer' }}>{s.t}</a>
              </li>
            ))}
          </ol>
        </aside>

        {/* Center: article body */}
        <article style={{ maxWidth: 640, fontFamily: DSF.body, color: DSC.ink2, fontSize: 16, lineHeight: 1.7 }}>
          <h1 style={{ fontFamily: DSF.display, fontSize: 42, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.025em', lineHeight: 1.05, margin: 0 }}>
            What we owe the next cohort.
          </h1>
          <p style={{ fontFamily: DSF.display, fontStyle: 'italic', fontSize: 18, color: DSC.muted, lineHeight: 1.55, margin: '12px 0 24px', fontWeight: 500 }}>
            Five years in, Hartwood is no longer "an experiment in how members find each other." Now it has to decide what kind of door it opens.
          </p>

          {/* Author */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderTop: `1px solid ${DSC.ruleSoft}`, borderBottom: `1px solid ${DSC.ruleSoft}`, marginBottom: 28 }}>
            <DSAvatar name="Maren Holt" initials="MH" size={36} />
            <div>
              <div style={{ fontFamily: DSF.body, fontSize: 13, fontWeight: 600, color: DSC.ink }}>By Maren Holt</div>
              <div style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.muted, letterSpacing: '0.06em' }}>Class of '14 · Brooklyn</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <button title="Save" style={{ width: 30, height: 30, borderRadius: 999, background: 'transparent', border: `1px solid ${DSC.rule}`, color: DSC.muted, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                <Icon name="bookmark" size={13} color="currentColor" />
              </button>
              <button title="Share" style={{ width: 30, height: 30, borderRadius: 999, background: 'transparent', border: `1px solid ${DSC.rule}`, color: DSC.muted, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                <Icon name="share" size={13} color="currentColor" />
              </button>
            </div>
          </div>

          <h2 style={{ fontFamily: DSF.display, fontSize: 22, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.02em', lineHeight: 1.2, margin: '8px 0 14px' }}>The next cohort's debt</h2>

          <p style={{ margin: '0 0 18px' }}>
            <span style={{ fontFamily: DSF.display, fontSize: 56, fontWeight: 600, color: DSC.accent, float: 'left', lineHeight: 0.85, padding: '6px 10px 0 0', letterSpacing: '-0.05em' }}>F</span>
            ive years after the first supper, we have a problem worth having: more people want in than the room can hold. The members coming in now — the class of '24 — won't remember the church basement, the broken projector, the night Iris explained climate underwriting to fourteen strangers and the chairs ran out.
          </p>

          <p style={{ margin: '0 0 18px' }}>
            They'll arrive into something that already works. That's the gift we owe them, and also the debt: a place where the seats are warm, but where they didn't choose the chairs.<sup style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.accent, fontWeight: 700, verticalAlign: 'super', marginLeft: 1, cursor: 'pointer' }}>1</sup>
          </p>

          {/* Pull quote */}
          <blockquote style={{ margin: '28px 0', padding: '18px 0 18px 26px', borderLeft: `3px solid ${DSC.accent}` }}>
            <p style={{ fontFamily: DSF.display, fontStyle: 'italic', fontSize: 22, fontWeight: 500, color: DSC.ink, lineHeight: 1.4, margin: 0, letterSpacing: '-0.015em' }}>
              "The places that last are the ones that keep deciding who they let in — not because they are exclusive, but because they remember what they're for."
            </p>
            <div style={{ marginTop: 12, fontFamily: DSF.body, fontSize: 12, color: DSC.muted, letterSpacing: '0.04em' }}>— Iris Okonkwo, '11, in last year's letter<sup style={{ fontFamily: DSF.mono, fontSize: 9, color: DSC.accent, fontWeight: 700, verticalAlign: 'super', marginLeft: 1, cursor: 'pointer' }}>2</sup></div>
          </blockquote>

          <p style={{ margin: '0 0 18px' }}>
            The decision in front of us isn't whether to grow. It's whether to keep deciding. Two principles have held since 2021: every member is invited by another, and the Society admits no one without a face. We've broken neither, and we shouldn't.
          </p>

          {/* Caption-attached image */}
          <figure style={{ margin: '32px -8px' }}>
            <div style={{ aspectRatio: '16 / 9', background: `radial-gradient(120% 90% at 30% 25%, #a8b48a 0%, #5f7038 45%, #2e3618 100%)`, borderRadius: 10, position: 'relative', overflow: 'hidden', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.10)' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(46,54,24,0.45) 100%)' }} />
              <div style={{ position: 'absolute', left: 14, top: 14, padding: '3px 8px', background: 'rgba(0,0,0,0.55)', color: '#fff', fontFamily: DSF.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: 3 }}>Brooklyn · 16:9</div>
            </div>
            <figcaption style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.muted, fontStyle: 'italic', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
              The garden behind 14 Pineapple, where the first supper happened. <span style={{ fontFamily: DSF.mono, fontStyle: 'normal', color: DSC.mute2, fontSize: 10, letterSpacing: '0.06em' }}>· Fig. 02 · Photo M.H.</span>
            </figcaption>
          </figure>

          <h2 style={{ fontFamily: DSF.display, fontSize: 22, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.02em', lineHeight: 1.2, margin: '28px 0 14px' }}>What we keep building</h2>

          <p style={{ margin: '0 0 18px' }}>
            One commitment for the coming year: invest in the supper, not the platform. We will not add a single feature this fall. We <em>will</em> fund nine more dinners, in three new cities. Lagos. Mexico CDMX. Edinburgh.
          </p>

          {/* Footnotes */}
          <h3 style={{ fontFamily: DSF.mono, fontSize: 11, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, margin: '36px 0 12px' }}>Footnotes & sources</h3>
          <ol style={{ paddingLeft: 18, margin: 0, fontFamily: DSF.body, fontSize: 13, color: DSC.muted, lineHeight: 1.6 }}>
            <li style={{ marginBottom: 8 }}>The 2018 cohort — the only one without a founders' dinner — has the lowest five-year retention. A coincidence, but a costly one. <a style={{ color: DSC.accent, fontWeight: 600, cursor: 'pointer' }}>See data, p. 14</a></li>
            <li>Okonkwo, I. <em>"On Membership."</em> The Hartwood Letter · Issue 86, 2025. <a style={{ color: DSC.accent, fontWeight: 600, cursor: 'pointer' }}>Read →</a></li>
          </ol>
        </article>

        {/* Right: aside notes */}
        <aside style={{ position: 'sticky', top: 14, alignSelf: 'flex-start' }}>
          <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>Pull aside</div>
          <div style={{ background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, lineHeight: 1.5, marginBottom: 8 }}>The number you've seen pinned to the gate of every supper since 2021:</div>
            <div style={{ fontFamily: DSF.display, fontSize: 38, fontWeight: 600, color: DSC.accent, letterSpacing: '-0.03em', lineHeight: 1 }}>14</div>
            <div style={{ fontFamily: DSF.body, fontSize: 11, color: DSC.muted, marginTop: 6, lineHeight: 1.4 }}>Strangers and good wine.</div>
          </div>
        </aside>
      </div>

      {/* Footer */}
      <div style={{ padding: '14px 24px', background: DSC.cardAlt, borderTop: `1px solid ${DSC.rule}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.08em' }}>HARTWOOD.ORG / LETTER / 142</span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <a style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted, cursor: 'pointer' }}>← Issue 141</a>
          <a style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.accent, fontWeight: 600, cursor: 'pointer' }}>Issue 143 →</a>
        </div>
      </div>
    </div>
  );
}

function LongformAtoms() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
      <VariantCard label="Drop cap" note="First letter of the first paragraph, accent-colored, 56px display.">
        <p style={{ fontFamily: DSF.body, fontSize: 14, color: DSC.ink2, lineHeight: 1.65, margin: 0 }}>
          <span style={{ fontFamily: DSF.display, fontSize: 52, fontWeight: 600, color: DSC.accent, float: 'left', lineHeight: 0.85, padding: '5px 10px 0 0', letterSpacing: '-0.05em' }}>F</span>
          ive years after the first supper, we have a problem worth having: more people want in than the room can hold.
        </p>
      </VariantCard>

      <VariantCard label="Pull quote" note="Accent left-rule + display italic. Attribution in body 12.">
        <blockquote style={{ margin: 0, padding: '4px 0 4px 18px', borderLeft: `3px solid ${DSC.accent}` }}>
          <p style={{ fontFamily: DSF.display, fontStyle: 'italic', fontSize: 17, fontWeight: 500, color: DSC.ink, lineHeight: 1.4, margin: 0, letterSpacing: '-0.01em' }}>"The places that last are the ones that keep deciding who they let in."</p>
          <div style={{ marginTop: 10, fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted }}>— Iris Okonkwo, '11</div>
        </blockquote>
      </VariantCard>

      <VariantCard label="Footnote reference + entry" note="Superscript number in accent, mono, clickable.">
        <p style={{ fontFamily: DSF.body, fontSize: 13.5, color: DSC.ink2, lineHeight: 1.6, margin: 0 }}>
          They'll arrive into something that already works.<sup style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.accent, fontWeight: 700, verticalAlign: 'super', marginLeft: 1 }}>1</sup>
        </p>
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px dashed ${DSC.ruleSoft}`, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.accent, fontWeight: 700, marginTop: 2 }}>1</span>
          <span style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted, lineHeight: 1.55, fontStyle: 'italic' }}>The 2018 cohort has the lowest five-year retention. A coincidence, but a costly one.</span>
        </div>
      </VariantCard>

      <VariantCard label="Caption" note="Image figcaption — body italic, centered, with mono meta.">
        <div style={{ aspectRatio: '16 / 9', background: `radial-gradient(120% 90% at 30% 25%, #c08b6a 0%, #7a5a3a 45%, #2a221a 100%)`, borderRadius: 8, marginBottom: 10 }} />
        <div style={{ fontFamily: DSF.body, fontStyle: 'italic', fontSize: 12, color: DSC.muted, textAlign: 'center', lineHeight: 1.5 }}>
          The garden behind 14 Pineapple. <span style={{ fontFamily: DSF.mono, fontStyle: 'normal', color: DSC.mute2, fontSize: 9.5, letterSpacing: '0.06em' }}>Fig. 02 · M.H.</span>
        </div>
      </VariantCard>

      <VariantCard label="Citation row" note="Bibliographic entry — body small, italics for title.">
        <ol style={{ paddingLeft: 16, margin: 0, fontFamily: DSF.body, fontSize: 12, color: DSC.muted, lineHeight: 1.6 }}>
          <li>Okonkwo, I. <em>"On Membership."</em> The Hartwood Letter · 86, 2025.</li>
          <li>Patel, D. <em>"Climate underwriting in the U.S."</em> CC Quarterly, 2024.</li>
        </ol>
      </VariantCard>

      <VariantCard label="Reading time + meta" note="Mono eyebrow with author, time, date, location.">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: DSF.mono, fontSize: 10.5, color: DSC.muted, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>
          <DSAvatar name="Maren Holt" initials="MH" size={20} />
          <span>Maren Holt</span>
          <span>·</span>
          <span>~8 min</span>
          <span>·</span>
          <span>19 May 2026</span>
          <span>·</span>
          <span style={{ color: DSC.accent }}>Brooklyn</span>
        </div>
      </VariantCard>
    </div>
  );
}

window.LongformSection = LongformSection;
