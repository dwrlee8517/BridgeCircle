# AI composer UX — when simple wins, when deep is required

A research note to inform the AI-assisted ask composer decision (see `composer-flows.html` for the three options in play). Captured 2026-05-07.

The instinct that prompted this research is right: **a faster, simpler model that users actually use beats a more capable one they avoid.** But that's a heuristic, not a rule. The rule is more nuanced — and BridgeCircle's specific shape of problem (low-frequency, socially consequential, asymmetric) points to a clearer answer than a flat "simple wins."

---

## A framework: three axes that decide simple vs. deep

Looking across the precedent cases below, three axes consistently predict whether a simple/inline AI assistant or a deeper/guided one is the right call.

| Axis | Simple/inline wins when… | Deep/guided wins when… |
|---|---|---|
| **Frequency** | User performs the action often (daily, hourly) | User performs it rarely (a few times a year) |
| **Audience** | Output is private or low-stakes | Output goes to a real person who will judge it |
| **Intent clarity** | User knows what they want, just needs speed | User isn't sure what to say or how |

When all three lean the same direction, the choice is obvious. When they split, it gets interesting.

**BridgeCircle's ask composer scores: rare · social · unclear intent.** All three axes lean toward depth. Which is the opposite of the gut "simple wins" intuition — and worth sitting with before committing.

---

## Precedent cases

### 1. Gmail Smart Compose vs. Help Me Write — both shipped, different jobs

Smart Compose (2018) is inline ghost-text autocomplete. By 2017 ~12% of Gmail messages contained AI-suggested content — billions of accepts/day. It works because the user *already knows what they want to say*; the AI just types faster than them.

Help Me Write / Gemini (2024–2026) is a full-draft button on a blank canvas. Different surface, different job. Google didn't replace Smart Compose with Help Me Write — they coexist because they solve different problems. Smart Compose for "I'm typing"; Help Me Write for "I'm staring at a blank email."

**Takeaway:** the two surfaces don't compete. High-frequency micro-assistance and low-frequency draft generation have to be designed separately. BridgeCircle's composer is unambiguously the second kind.

### 2. LinkedIn AI message drafting — the cautionary tale

LinkedIn's AI-Assisted Messages (in Recruiter and now consumer InMail) is the closest existing analog to Option 1 in our flows: one button, immediate draft, no intent capture. The data on it cuts both ways.

The numbers say AI helps:
- Personalized connection requests get **~45% acceptance vs ~15% for generic** — a 3× lift ([Leadspark benchmark](https://www.leadspark-ai.com/resources/linkedin-response-rate-benchmarks)).
- AI-driven first messages report **4.19% response vs 2.60% non-AI** — but this is sales/recruiter outreach where the bar is "got a reply at all," not "started a real relationship."

The qualitative reception is worse. LinkedIn AI messages got widely mocked in 2024–2025 for sounding obvious — "As a fellow alum of [School]…" became a meme. The 1.6× lift over non-AI is real but small, and almost certainly comes from the median user (who would've sent something terrible) being lifted to mediocre. For users who'd write a careful message anyway, the AI reduces effort and reduces effectiveness.

**Takeaway:** Option 1 done badly = LinkedIn. The output looks like AI to the recipient. Option 1 done *well* requires the helper-context fix (career history + bio in the prompt) — without it, we ship the LinkedIn failure mode.

### 3. Lavender (sales email coach) — the strongest middle-path evidence

Lavender is the most relevant precedent we have. It's an AI-assisted writing tool for high-stakes one-off messages with real recipients. They tried multiple postures and converged on **coaching + lightweight generation**, not pure generation:

- Real-time scoring as the user types (suggests subject-line edits, sentence length, tone)
- A "Start my Email" generator from bullet points (not blank-canvas one-shot)
- Personalization assistant that pulls recipient signals into a side panel

Their reported numbers: **20.5% reply rate across 20k+ active users, ~4× industry average** ([Lavender review, Reply.io 2026](https://reply.io/blog/lavender-ai-review/)). The pattern they describe: emails go from 15 minutes to 3–5 minutes — reduction in time, *not* elimination of the human. The user is still authoring; the AI is coaching.

This is essentially Option 2's posture. The "form is the help" — guidance is woven into the writing surface rather than offered as a single magic button.

**Takeaway:** the best-performing tool in the most adjacent domain chose middle-path coaching, not one-click generation. Their bet: writers want to feel like authors, recipients can tell the difference.

### 4. Hinge / Bumble AI icebreakers — the brand-corrosive failure

Dating apps shipped AI icebreakers and AI prompt-graders in 2024–2025. Critical reception has been negative on authenticity grounds. From [Slate's 2026 piece](https://slate.com/technology/2026/01/dating-apps-artificial-intelligence-weird-hinge-bumble-tinder.html): "generative everything — bios, prompts, openers — risks pushing profiles toward a smooth, samey median, making it harder to tell whether you like someone or just their autocomplete." Hinge's own data shows AI lifted matches 15%, but qualitative product narratives describe a backlash where *obvious imperfections became an authenticity signal* — users started preferring messages that read like a real human wrote them, even badly.

This is the closest brand-risk analog to BridgeCircle. Both are warm-network products where the recipient evaluates the sender. In dating apps, AI homogenization made the product worse for everyone — including the people not using AI, because every message became suspect. The same failure mode threatens BridgeCircle: **if mentors start to feel they're getting AI slop, the warm-circle thesis collapses for the whole network**, not just for AI users.

**Takeaway:** the recipient side of the AI question matters at least as much as the sender side. Anything we ship has to survive a mentor squinting at the message and not being able to tell whether the asker actually wrote it.

### 5. GitHub Copilot vs. Cursor agents — complement, don't replace

In coding, both inline ghost-text (Copilot) and agentic chat (Cursor Composer, Claude Code) ship and thrive. Copilot drives the most daily uses — small completions inside files where the developer knows what they want. Agents drive the most important uses — multi-file changes, refactors, ambiguous tasks. They're complementary because they solve different problems for different intent shapes.

**Takeaway:** "find something in the middle" can also mean *don't pick* — ship two surfaces if the user has two different needs. We'll come back to this.

### 6. Apple Writing Tools — quick actions over chat

When Apple shipped Writing Tools in macOS Sequoia / iOS 18, they explicitly chose **quick-action menus** (Rewrite, Proofread, Summarize, Make Friendlier) over a chat surface. Their bet: most users in most contexts know what they want done to text they've already written; they don't want to type a request to an assistant. This is the "Smart Compose for editing" posture — the AI is a verb you apply, not a person you talk to.

**Takeaway:** for users with clear intent on existing text, lens-based variants (shorter / warmer / more direct) are a known winner. This is exactly Option 2's variant-buttons row.

---

## What this means for BridgeCircle

The composer is **rare, social, and starts with unclear intent**. Every axis pushes toward depth, not speed. The Lavender pattern (coach + light generation) and the Hinge cautionary tale point the same direction: ship something that helps the user *think*, not something that does the writing *for* them.

But the user's instinct is also right that pure Option 3 may be too heavy. A few times a year, someone wants to fire off "Hey — would you have 15 min to chat about X?" to a helper they already know. Forcing a multi-turn chat for that is friction without payoff.

So the candidate "middle" is not literally Option 2 — it's **Option 2 with two qualifications**:

1. **A quick-send escape.** Users who already know what they want can skip the wizard and go straight to the textarea. This is the equivalent of Gmail keeping Smart Compose alongside Help Me Write — two surfaces for two intents.
2. **Borrow Option 3's transparency moment.** Before drafting, show the user *which signals* the AI is leaning on (helper's career arc, bio note, shared school). Two reasons:
   - Asker keeps authorship — they can drop a signal that feels off, which means they're never surprised by what the AI decides to lead with.
   - The draft looks less like AI and more like *informed by what the asker actually noticed*. This is the brand-side defense against the Hinge failure mode.

Concretely:

> **Recommended posture: Coaching composer (Option 2) with a "skip" affordance for return users, plus the signals-transparency moment from Option 3.**
>
> - First-time / unsure users hit the wizard and are guided to a draft they can edit.
> - Return / confident users tap "I know what I want to say" and get a textarea + Lavender-style inline coaching (length cues, "be more specific" hints) and a regenerate button. This is Option 1, but earned — it appears once the user has shown they don't need the wizard.
> - Both paths show the signals panel before generating, not after.

This is more work than Option 1 and less than full Option 3, and it specifically addresses the two strongest precedent signals: Lavender's middle-path reply-rate data, and Hinge's authenticity-backlash warning.

---

## What we'd be wrong about

Three things this analysis could get wrong; worth flagging before committing.

1. **The "rare action" framing might be too strong.** If asks become a weekly behavior for active users (one of the goals!), the high-frequency / inline / Option-1 case strengthens. Worth re-evaluating after we have 4+ weeks of usage data.
2. **Sales-email lessons may not transfer cleanly.** Lavender users are paid to send better emails; their effort budget is higher than an alumnus's. The wizard could feel like work in a way it doesn't for sales reps.
3. **A truly excellent Option 3 might dominate everything.** If the conversational version *feels magical* — the way Cursor's agent did vs. Copilot for some workflows — it could re-set user expectations about effort. Hard to predict from precedent because nothing in the category has shipped a great version yet.

---

## Recommendation, restated

Build **Option 2 with a quick-send escape and Option 3's signals-transparency moment.** Reject pure Option 1 (LinkedIn failure mode without the helper-context fix; with it, it becomes our floor not our ceiling). Reject pure Option 3 (heavy for a low-frequency action; pursue if Option 2 + qualifications underperforms after pilot data).

If a single sentence: *the composer should feel like a thoughtful friend asking what you're working on, not a magic button or a chat with a stranger.*

---

## Sources

- LinkedIn response rate benchmarks: [Leadspark, 2026](https://www.leadspark-ai.com/resources/linkedin-response-rate-benchmarks)
- LinkedIn AI message guidance: [LinkedIn Recruiter Help](https://www.linkedin.com/help/recruiter/answer/a5946230)
- Lavender review and reply-rate data: [Reply.io, 2026](https://reply.io/blog/lavender-ai-review/), [Originality.AI](https://originality.ai/blog/lavender-ai-review)
- Gmail Gemini era announcement: [Google blog](https://blog.google/products-and-platforms/products/gmail/gmail-is-entering-the-gemini-era/)
- Gemini in Gmail product page: [Google Workspace](https://workspace.google.com/products/gmail/ai/)
- Hinge / Bumble AI authenticity coverage: [Slate, 2026](https://slate.com/technology/2026/01/dating-apps-artificial-intelligence-weird-hinge-bumble-tinder.html), [Quartz](https://qz.com/ai-dating-chatbot-hinge-bumble-amata-iris), [Fast Company](https://www.fastcompany.com/91259831/hinge-will-now-use-ai-to-grade-your-dating-profile-prompts), [WebProNews](https://www.webpronews.com/bumble-bets-on-ai-to-fix-your-dating-profile-but-can-algorithms-really-spark-romance/)
