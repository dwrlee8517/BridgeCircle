/* eslint-disable */
const { useMemo, useState } = React;

const DATA = window.BC_MATCHING_DATA;

function personById(id) {
  return DATA.people.find((person) => person.id === id) || DATA.people[0];
}

function helperOfferFor(id) {
  return DATA.helperOffers.find((offer) => offer.helperId === id) || null;
}

function initialsFrom(name) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2);
}

const STYLE = `
  :root {
    --pm-accent: #2563eb;
    --pm-accent-soft: rgba(37, 99, 235, .08);
    --pm-accent-chip: rgba(37, 99, 235, .14);
    --pm-paper: #fafaf9;
    --pm-card: #ffffff;
    --pm-panel: #f4f3ee;
    --pm-ink: #0c0c0b;
    --pm-muted: #4d4d4a;
    --pm-mute-2: #71717a;
    --pm-rule: #dcdcd6;
    --pm-rule-soft: #ebebe5;
    --pm-ok: #165e34;
    --pm-warn: #b25e00;
    --pm-bad: #9b2c1f;
    --pm-dark-card: #141416;
    --pm-dark-panel: #1c1c1f;
  }

  .pm-civic {
    min-height: 100vh;
    background: var(--pm-paper);
    color: var(--pm-ink);
    font-family: "Inter", system-ui, sans-serif;
  }

  .pm-topbar {
    position: sticky;
    top: 0;
    z-index: 100;
    height: 64px;
    padding: 0 24px;
    background: var(--pm-ink);
    color: var(--pm-paper);
    border-bottom: 1px solid #222;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
  }

  .pm-wordmark {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: 0;
    color: inherit;
    padding: 0;
    cursor: pointer;
  }

  .pm-wordmark-mark {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background: var(--pm-accent);
    display: grid;
    place-items: center;
    flex: 0 0 auto;
  }

  .pm-wordmark-mark::after {
    content: "";
    width: 16px;
    height: 16px;
    border-radius: 999px;
    background: var(--pm-paper);
  }

  .pm-wordmark-text {
    font-family: "Inter Tight", "Inter", system-ui, sans-serif;
    font-size: 18px;
    line-height: 1;
    font-weight: 600;
    letter-spacing: -.02em;
  }

  .pm-wordmark-text span {
    color: var(--pm-accent);
  }

  .pm-topbar-meta {
    display: flex;
    align-items: center;
    gap: 16px;
    min-width: 0;
  }

  .pm-source-button {
    border: 1px solid #3f3f46;
    background: transparent;
    color: #a1a1aa;
    border-radius: 4px;
    padding: 6px 12px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .pm-version {
    font-family: "JetBrains Mono", ui-monospace, monospace;
    font-size: 10px;
    letter-spacing: .12em;
    text-transform: uppercase;
    color: #71717a;
    white-space: nowrap;
  }

  .pm-layout {
    display: grid;
    grid-template-columns: 260px minmax(0, 1fr);
    min-height: calc(100vh - 64px);
  }

  .pm-sidebar {
    position: sticky;
    top: 64px;
    height: calc(100vh - 64px);
    overflow-y: auto;
    background: var(--pm-card);
    border-right: 1px solid var(--pm-rule);
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .pm-nav-group-title,
  .pm-mono,
  .pm-chip,
  .pm-stat-label,
  .pm-section-num,
  .pm-section-card-title,
  .pm-field-label,
  .pm-status {
    font-family: "JetBrains Mono", ui-monospace, monospace;
  }

  .pm-nav-group-title {
    margin: 0 0 10px;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: .1em;
    color: var(--pm-mute-2);
  }

  .pm-nav {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .pm-nav button {
    background: transparent;
    border: 0;
    border-radius: 4px;
    color: var(--pm-ink);
    cursor: pointer;
    display: block;
    font-size: 13px;
    font-weight: 500;
    padding: 6px 8px;
    text-align: left;
  }

  .pm-nav button.is-active {
    color: var(--pm-accent);
    font-weight: 600;
    background: var(--pm-accent-soft);
  }

  .pm-sidebar-note {
    margin-top: auto;
    padding: 12px;
    background: var(--pm-paper);
    border: 1px solid var(--pm-rule);
    border-radius: 6px;
    color: var(--pm-mute-2);
    font-size: 11px;
    line-height: 1.5;
  }

  .pm-main {
    max-width: 1080px;
    width: 100%;
    padding: 40px 48px 80px;
    overflow-x: hidden;
  }

  .pm-manifesto {
    margin-bottom: 40px;
  }

  .pm-dotline {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .pm-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--pm-accent);
    flex: 0 0 auto;
  }

  .pm-dotline span:last-child {
    color: var(--pm-accent);
    font-family: "JetBrains Mono", ui-monospace, monospace;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: .1em;
    text-transform: uppercase;
  }

  .pm-h1,
  .pm-h2,
  .pm-card-title,
  .pm-frame-title {
    font-family: "Inter Tight", "Inter", system-ui, sans-serif;
    letter-spacing: -.025em;
  }

  .pm-h1 {
    margin: 0 0 16px;
    font-size: 36px;
    line-height: 1.08;
    font-weight: 600;
  }

  .pm-manifesto p {
    margin: 0;
    max-width: 780px;
    color: var(--pm-mute-2);
    font-size: 15px;
    line-height: 1.6;
  }

  .pm-section {
    padding-top: 32px;
    border-top: 2px solid var(--pm-ink);
    margin-bottom: 80px;
    scroll-margin-top: 92px;
  }

  .pm-section-header {
    margin-bottom: 24px;
  }

  .pm-section-num {
    display: block;
    margin-bottom: 8px;
    color: var(--pm-accent);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: .12em;
    text-transform: uppercase;
  }

  .pm-h2 {
    margin: 0 0 6px;
    font-size: 24px;
    line-height: 1.15;
    font-weight: 600;
  }

  .pm-section-header p {
    margin: 0;
    max-width: 720px;
    color: var(--pm-mute-2);
    font-size: 13px;
    line-height: 1.55;
  }

  .pm-frame {
    overflow: hidden;
    background: var(--pm-paper);
    border: 2px solid var(--pm-ink);
    border-radius: 6px;
    box-shadow: 0 12px 32px rgba(12, 12, 11, .08);
  }

  .pm-announcement {
    border-bottom: 1px solid var(--pm-rule);
    background: var(--pm-accent-soft);
    padding: 10px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    min-width: 0;
    font-size: 12px;
  }

  .pm-announcement-main {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .pm-announcement-label {
    color: var(--pm-accent);
    font-family: "JetBrains Mono", ui-monospace, monospace;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
    flex: 0 0 auto;
  }

  .pm-announcement-text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
  }

  .pm-frame-body {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .pm-frame-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 18px;
    border-bottom: 1px solid var(--pm-rule);
    padding-bottom: 16px;
  }

  .pm-frame-title {
    margin: 6px 0 0;
    font-size: 24px;
    line-height: 1.15;
    font-weight: 600;
  }

  .pm-frame-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--pm-mute-2);
    font-family: "JetBrains Mono", ui-monospace, monospace;
    font-size: 10px;
    letter-spacing: .08em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .pm-frame-meta strong {
    color: var(--pm-accent);
  }

  .pm-dashboard-grid {
    display: grid;
    grid-template-columns: minmax(0, 65fr) minmax(280px, 35fr);
    gap: 24px;
    align-items: start;
  }

  .pm-grid-2 {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
    gap: 20px;
    align-items: start;
  }

  .pm-grid-3 {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  .pm-stack {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  .pm-stack-tight {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
  }

  .pm-section-card-title {
    border-top: 2px solid var(--pm-ink);
    padding-top: 12px;
    margin-bottom: 16px;
    display: flex;
    align-items: baseline;
    gap: 8px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: var(--pm-accent);
  }

  .pm-section-card-title strong {
    color: var(--pm-ink);
    font-family: "Inter Tight", "Inter", system-ui, sans-serif;
    font-size: 15px;
    letter-spacing: -.02em;
    text-transform: none;
  }

  .pm-card {
    background: var(--pm-card);
    border: 1px solid var(--pm-rule);
    border-radius: 6px;
    padding: 14px;
    min-width: 0;
  }

  .pm-card.panel {
    background: var(--pm-panel);
  }

  .pm-card.dark {
    background: var(--pm-ink);
    border-color: var(--pm-ink);
    color: var(--pm-paper);
  }

  .pm-card-title {
    margin: 0;
    font-size: 15px;
    line-height: 1.24;
    font-weight: 600;
  }

  .pm-copy {
    margin: 8px 0 0;
    color: var(--pm-mute-2);
    font-size: 12px;
    line-height: 1.5;
  }

  .pm-card.dark .pm-copy,
  .pm-card.dark .pm-field-label {
    color: rgba(250, 250, 249, .68);
  }

  .pm-row {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .pm-between {
    justify-content: space-between;
    align-items: flex-start;
    gap: 14px;
  }

  .pm-wrap {
    flex-wrap: wrap;
  }

  .pm-avatar {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    background: var(--pm-ink);
    color: var(--pm-paper);
    display: grid;
    place-items: center;
    font-family: "JetBrains Mono", ui-monospace, monospace;
    font-size: 13px;
    font-weight: 700;
    flex: 0 0 auto;
  }

  .pm-avatar.small {
    width: 28px;
    height: 28px;
    border-radius: 4px;
    background: var(--pm-accent-soft);
    border: 1px solid rgba(37, 99, 235, .22);
    color: var(--pm-accent);
    font-size: 10px;
  }

  .pm-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    border: 1px solid var(--pm-rule);
    background: var(--pm-panel);
    color: var(--pm-muted);
    border-radius: 6px;
    padding: 3px 8px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: .14em;
    text-transform: uppercase;
    line-height: 1.2;
    max-width: 100%;
  }

  .pm-chip.accent {
    background: var(--pm-accent-chip);
    border-color: var(--pm-accent);
    color: var(--pm-accent);
  }

  .pm-chip.ok {
    background: rgba(22, 94, 52, .14);
    border-color: var(--pm-ok);
    color: var(--pm-ok);
  }

  .pm-chip.warn {
    background: rgba(178, 94, 0, .14);
    border-color: var(--pm-warn);
    color: var(--pm-warn);
  }

  .pm-chip.bad {
    background: rgba(155, 44, 31, .14);
    border-color: var(--pm-bad);
    color: var(--pm-bad);
  }

  .pm-chip-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: currentColor;
    flex: 0 0 auto;
  }

  .pm-button {
    border: 1px solid var(--pm-ink);
    background: var(--pm-ink);
    color: var(--pm-paper);
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    min-height: 30px;
  }

  .pm-button.accent {
    border-color: var(--pm-accent);
    background: var(--pm-accent);
    color: #fff;
  }

  .pm-button.secondary {
    background: transparent;
    color: var(--pm-ink);
  }

  .pm-button.ghost {
    border-color: transparent;
    background: transparent;
    color: var(--pm-mute-2);
  }

  .pm-button:disabled {
    opacity: .45;
    cursor: not-allowed;
  }

  .pm-control-rail {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }

  .pm-search-card {
    background: var(--pm-card);
    border: 1px solid var(--pm-rule);
    border-radius: 6px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .pm-search-icon {
    width: 16px;
    height: 16px;
    color: var(--pm-mute-2);
    flex: 0 0 auto;
  }

  .pm-input,
  .pm-textarea,
  .pm-select {
    width: 100%;
    border: 1px solid var(--pm-rule);
    border-radius: 4px;
    background: var(--pm-paper);
    color: var(--pm-ink);
    outline: none;
    font-family: "Inter", system-ui, sans-serif;
    font-size: 12px;
    padding: 8px 10px;
  }

  .pm-search-card .pm-input {
    border: 0;
    background: transparent;
    padding: 0;
    font-size: 13px;
  }

  .pm-textarea {
    min-height: 86px;
    resize: vertical;
    line-height: 1.45;
  }

  .pm-field-label {
    display: block;
    margin-bottom: 6px;
    color: var(--pm-mute-2);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: .08em;
    text-transform: uppercase;
  }

  .pm-list {
    display: flex;
    flex-direction: column;
    border-top: 1px solid var(--pm-rule);
  }

  .pm-list-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    border-bottom: 1px solid var(--pm-rule-soft);
    padding: 10px 0;
    min-width: 0;
  }

  .pm-list-row strong {
    font-size: 13px;
  }

  .pm-small {
    margin: 2px 0 0;
    color: var(--pm-mute-2);
    font-size: 11px;
    line-height: 1.4;
  }

  .pm-mini-rec {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .pm-quote {
    margin: 0;
    padding-left: 10px;
    border-left: 2.5px solid rgba(37, 99, 235, .34);
    color: var(--pm-muted);
    font-size: 12px;
    font-style: italic;
    line-height: 1.45;
  }

  .pm-recommendation {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 250px;
    gap: 16px;
    background: var(--pm-card);
    border: 1px solid var(--pm-rule);
    border-radius: 6px;
    padding: 14px;
    min-width: 0;
  }

  .pm-reasons {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 12px;
  }

  .pm-reason {
    display: grid;
    grid-template-columns: 26px minmax(0, 1fr);
    gap: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--pm-rule-soft);
    color: var(--pm-muted);
    font-size: 12px;
    line-height: 1.45;
  }

  .pm-reason span:first-child {
    color: var(--pm-accent);
    font-family: "JetBrains Mono", ui-monospace, monospace;
    font-size: 9px;
    font-weight: 700;
  }

  .pm-side-panel {
    border-left: 1px solid var(--pm-rule-soft);
    padding-left: 14px;
    min-width: 0;
  }

  .pm-status {
    margin-top: 8px;
    color: var(--pm-mute-2);
    font-size: 9px;
    letter-spacing: .08em;
    text-transform: uppercase;
  }

  .pm-capacity {
    margin-top: 10px;
  }

  .pm-gauge {
    margin-top: 6px;
    height: 6px;
    overflow: hidden;
    background: var(--pm-panel);
    border: 1px solid var(--pm-rule);
    border-radius: 1px;
  }

  .pm-gauge span {
    display: block;
    height: 100%;
  }

  .pm-event-person {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    align-items: start;
    border-top: 1px solid var(--pm-rule-soft);
    padding-top: 12px;
  }

  .pm-note {
    margin-top: 8px;
    padding: 8px 10px;
    border-left: 2.5px solid rgba(37, 99, 235, .34);
    background: var(--pm-paper);
    color: var(--pm-muted);
    border-radius: 4px;
    font-size: 12px;
    font-style: italic;
    line-height: 1.45;
  }

  .pm-timeline {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .pm-timeline-step {
    background: var(--pm-card);
    border: 1px solid var(--pm-rule);
    border-radius: 6px;
    padding: 12px;
    opacity: .55;
  }

  .pm-timeline-step.is-active {
    opacity: 1;
    border-color: var(--pm-accent);
    background: var(--pm-accent-soft);
  }

  .pm-spotlight {
    min-height: 250px;
    background: var(--pm-ink);
    color: var(--pm-paper);
    border-radius: 6px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .pm-spotlight-quote {
    margin: 14px 0;
    font-family: "Inter Tight", "Inter", system-ui, sans-serif;
    font-size: 22px;
    line-height: 1.28;
    letter-spacing: -.025em;
  }

  .pm-empty {
    display: grid;
    place-items: center;
    min-height: 220px;
    border: 1px dashed var(--pm-rule);
    border-radius: 6px;
    background: var(--pm-panel);
    padding: 24px;
    text-align: center;
    color: var(--pm-mute-2);
    font-size: 12px;
    line-height: 1.5;
  }

  @media (max-width: 980px) {
    .pm-layout {
      grid-template-columns: minmax(0, 1fr);
    }

    .pm-sidebar {
      position: static;
      height: auto;
      border-right: 0;
      border-bottom: 1px solid var(--pm-rule);
      padding: 14px 16px;
      gap: 12px;
    }

    .pm-sidebar-note {
      display: none;
    }

    .pm-nav {
      flex-direction: row;
      overflow-x: auto;
      padding-bottom: 2px;
    }

    .pm-nav button {
      white-space: nowrap;
      flex: 0 0 auto;
    }

    .pm-main {
      max-width: none;
      padding: 28px 18px 64px;
    }

    .pm-dashboard-grid,
    .pm-grid-2,
    .pm-grid-3,
    .pm-recommendation {
      grid-template-columns: minmax(0, 1fr);
    }

    .pm-side-panel {
      border-left: 0;
      border-top: 1px solid var(--pm-rule-soft);
      padding-left: 0;
      padding-top: 12px;
    }
  }

  @media (max-width: 640px) {
    .pm-topbar {
      height: auto;
      min-height: 64px;
      padding: 12px 14px;
      align-items: flex-start;
      flex-direction: column;
    }

    .pm-topbar-meta {
      width: 100%;
      justify-content: space-between;
    }

    .pm-version {
      display: none;
    }

    .pm-h1 {
      font-size: 30px;
    }

    .pm-announcement,
    .pm-frame-body {
      padding: 14px;
    }

    .pm-announcement {
      align-items: flex-start;
      flex-direction: column;
    }

    .pm-announcement-text {
      white-space: normal;
    }

    .pm-frame-head {
      align-items: flex-start;
      flex-direction: column;
    }

    .pm-frame-meta {
      flex-wrap: wrap;
      white-space: normal;
    }

    .pm-list-row,
    .pm-event-person,
    .pm-timeline {
      grid-template-columns: minmax(0, 1fr);
    }

    .pm-chip {
      white-space: normal;
      overflow-wrap: anywhere;
    }
  }
`;

function App() {
  const [activeSection, setActiveSection] = useState("people");
  const [recState, setRecState] = useState({});
  const [eventHidden, setEventHidden] = useState({});
  const [connectionState, setConnectionState] = useState({});
  const [spotlightStage, setSpotlightStage] = useState("private");
  const [digestMode, setDigestMode] = useState("Weekly digest only");

  const setRecommendationState = (id, state) => {
    setRecState((prev) => ({ ...prev, [id]: state }));
  };

  const jump = (id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="pm-civic">
      <style>{STYLE}</style>
      <Topbar onJump={() => jump("people")} />
      <div className="pm-layout">
        <Sidebar active={activeSection} onJump={jump} />
        <main className="pm-main">
          <Manifesto digestMode={digestMode} />
          <PeopleScreen recState={recState} onRecState={setRecommendationState} />
          <SavedQuestionScreen
            digestMode={digestMode}
            setDigestMode={setDigestMode}
            recState={recState}
            onRecState={setRecommendationState}
          />
          <HelperScreen recState={recState} onRecState={setRecommendationState} />
          <EventScreen
            eventHidden={eventHidden}
            setEventHidden={setEventHidden}
            connectionState={connectionState}
            setConnectionState={setConnectionState}
          />
          <ThankYouScreen
            spotlightStage={spotlightStage}
            setSpotlightStage={setSpotlightStage}
          />
        </main>
      </div>
    </div>
  );
}

function Topbar({ onJump }) {
  return (
    <header className="pm-topbar">
      <button className="pm-wordmark" onClick={onJump}>
        <span className="pm-wordmark-mark" aria-hidden="true" />
        <span className="pm-wordmark-text">Bridge<span>Circle</span></span>
      </button>
      <div className="pm-topbar-meta">
        <button className="pm-source-button" onClick={() => window.open("Civic Design System.html", "_blank")}>
          Source: Civic Design System.html
        </button>
        <span className="pm-version">People Matching Concept v0</span>
      </div>
    </header>
  );
}

function Sidebar({ active, onJump }) {
  const groups = [
    {
      title: "Matching Loop",
      items: [
        { id: "people", label: "01 - People page" },
        { id: "saved-question", label: "02 - Saved question" },
        { id: "helper-view", label: "03 - Helper view" },
      ],
    },
    {
      title: "Trust Surfaces",
      items: [
        { id: "events", label: "04 - Event reconnects" },
        { id: "thanks", label: "05 - Thank-you consent" },
      ],
    },
  ];

  return (
    <aside className="pm-sidebar">
      {groups.map((group) => (
        <div key={group.title}>
          <h3 className="pm-nav-group-title">{group.title}</h3>
          <nav className="pm-nav">
            {group.items.map((item) => (
              <button
                key={item.id}
                className={active === item.id ? "is-active" : ""}
                onClick={() => onJump(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      ))}
      <div className="pm-sidebar-note">
        <strong>Civic Editorial</strong> prototype for saved questions, helper-side matching,
        event reconnects, and private-first gratitude. Synthetic data only.
      </div>
    </aside>
  );
}

function Manifesto({ digestMode }) {
  return (
    <div className="pm-manifesto">
      <div className="pm-dotline">
        <span className="pm-dot" />
        <span>Matching Loop Prototype</span>
      </div>
      <h1 className="pm-h1">People matching should feel like a quiet assist.</h1>
      <p>
        A Civic Editorial reinterpretation of the full passive matching loop:
        saved questions create explainable suggestions, helpers see people they might help,
        event reconnects avoid overclaiming, and thank-yous stay private unless both sides approve.
        Current cadence: <strong>{digestMode}</strong>.
      </p>
    </div>
  );
}

function ConceptSection({ id, index, title, copy, children }) {
  return (
    <section id={id} className="pm-section">
      <div className="pm-section-header">
        <span className="pm-section-num">Section {index}</span>
        <h2 className="pm-h2">{title}</h2>
        <p>{copy}</p>
      </div>
      {children}
    </section>
  );
}

function DashboardFrame({ announcement, title, meta, children }) {
  return (
    <div className="pm-frame">
      <div className="pm-announcement">
        <div className="pm-announcement-main">
          <span className="pm-announcement-label">{announcement.label}</span>
          <span className="pm-mute-dot">-</span>
          <span className="pm-announcement-text">{announcement.text}</span>
        </div>
        <span className="pm-mono" style={{ color: "#71717a", fontSize: 10 }}>{announcement.time}</span>
      </div>
      <div className="pm-frame-body">
        <div className="pm-frame-head">
          <div>
            <div className="pm-mono" style={{ color: "#71717a", fontSize: 9, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase" }}>
              {DATA.viewer.school} - Class of {DATA.viewer.year} - {DATA.org.context}
            </div>
            <h3 className="pm-frame-title">{title}</h3>
          </div>
          <div className="pm-frame-meta">
            {meta.map((item) => (
              <span key={item.label}>{item.label}: <strong>{item.value}</strong></span>
            ))}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function PeopleScreen({ recState, onRecState }) {
  const people = DATA.people.filter((person) => person.id !== DATA.viewer.id).slice(0, 4);
  const question = DATA.savedQuestions[0];
  const askerRecs = DATA.recommendations.filter((rec) => rec.direction === "asker_to_helper").slice(0, 2);

  return (
    <ConceptSection
      id="people"
      index="01"
      title="People page with passive matching"
      copy="The page still starts as search, but saved questions turn it into a quieter matching surface with explainable, dismissible suggestions."
    >
      <DashboardFrame
        announcement={{ label: "People", text: "2 new helper matches found from your saved question.", time: "Prototype only" }}
        title="Welcome back, Mina."
        meta={[
          { label: "Saved Questions", value: DATA.savedQuestions.length },
          { label: "Open Helpers", value: DATA.helperOffers.length },
        ]}
      >
        <div className="pm-dashboard-grid">
          <div className="pm-stack">
            <div className="pm-search-card">
              <SearchIcon />
              <input className="pm-input" defaultValue="UX research product internships Korea" aria-label="AI people search" />
              <Chip tone="accent">AI search</Chip>
            </div>

            <div className="pm-card panel">
              <div className="pm-row pm-between pm-wrap">
                <div>
                  <Label>Saved question prompt</Label>
                  <h4 className="pm-card-title">{question.title}</h4>
                </div>
                <Chip tone="ok">{question.status}</Chip>
              </div>
              <p className="pm-copy">{question.summary}</p>
              <div className="pm-control-rail" style={{ marginTop: 12 }}>
                <button className="pm-button accent">Save question</button>
                <button className="pm-button secondary">Edit privacy</button>
                <button className="pm-button ghost">Not now</button>
              </div>
            </div>

            <div>
              <SectionCardTitle label="Member directory" value="+8 new" />
              <div className="pm-grid-2">
                {people.map((person) => (
                  <MemberCard key={person.id} person={person} offer={helperOfferFor(person.id)} />
                ))}
              </div>
            </div>
          </div>

          <aside className="pm-stack">
            <div>
              <SectionCardTitle label="On your desk" value={`${askerRecs.length} suggested`} />
              <div className="pm-stack-tight">
                {askerRecs.map((rec) => (
                  <MiniRecommendation
                    key={rec.id}
                    rec={rec}
                    state={recState[rec.id]}
                    onRecState={onRecState}
                  />
                ))}
              </div>
            </div>
            <NotificationPreview />
          </aside>
        </div>
      </DashboardFrame>
    </ConceptSection>
  );
}

function SavedQuestionScreen({ digestMode, setDigestMode, recState, onRecState }) {
  const question = DATA.savedQuestions[0];
  const recs = DATA.recommendations.filter((rec) => rec.questionId === question.id);

  return (
    <ConceptSection
      id="saved-question"
      index="02"
      title="Saved question detail"
      copy="The detail page explains why each person is relevant and makes cadence, snooze, dismiss, and save-for-later visible before outreach."
    >
      <DashboardFrame
        announcement={{ label: "Saved Question", text: "Private to matching. No automatic ask is sent.", time: question.expiresIn }}
        title={question.title}
        meta={[
          { label: "Privacy", value: "Private" },
          { label: "Cadence", value: digestMode.replace(" only", "") },
        ]}
      >
        <div className="pm-grid-2">
          <div className="pm-stack">
            <div className="pm-card">
              <Label>Question context</Label>
              <p className="pm-copy" style={{ color: "var(--pm-ink)", fontSize: 13 }}>{question.context}</p>
              <div className="pm-control-rail" style={{ marginTop: 12 }}>
                {question.tags.map((tag) => <Chip key={tag}>{tag}</Chip>)}
              </div>
            </div>
            <div className="pm-stack-tight">
              {recs.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  rec={rec}
                  state={recState[rec.id]}
                  onRecState={onRecState}
                />
              ))}
            </div>
          </div>

          <aside className="pm-stack">
            <div className="pm-card dark">
              <Label>Matching rule</Label>
              <h4 className="pm-card-title">Explainable before actionable.</h4>
              <p className="pm-copy">
                Suggestions stay passive until Mina chooses to save, ask, snooze, or dismiss.
              </p>
            </div>
            <div className="pm-card">
              <Label>Notification cadence preview</Label>
              <h4 className="pm-card-title" style={{ marginBottom: 10 }}>{digestMode}</h4>
              <div className="pm-control-rail">
                {["In-app only", "Weekly digest only", "Pause 30 days"].map((mode) => (
                  <button
                    key={mode}
                    className={`pm-button ${digestMode === mode ? "accent" : "secondary"}`}
                    onClick={() => setDigestMode(mode)}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            <GuardrailCard />
          </aside>
        </div>
      </DashboardFrame>
    </ConceptSection>
  );
}

function HelperScreen({ recState, onRecState }) {
  const helperRecs = DATA.recommendations.filter((rec) => rec.direction === "helper_to_asker");
  const helper = personById("noah-choi");
  const offer = helperOfferFor(helper.id);

  return (
    <ConceptSection
      id="helper-view"
      index="03"
      title="Helper-side matching"
      copy="People who opted in to help can see possible mentees without being assigned work. The language stays optional and capacity-aware."
    >
      <DashboardFrame
        announcement={{ label: "Helper", text: "You might be able to help 2 people this week.", time: "Low pressure" }}
        title="Open advice desk"
        meta={[
          { label: "Active", value: offer.capacity.active },
          { label: "Pending", value: offer.capacity.pending },
        ]}
      >
        <div className="pm-grid-2">
          <div className="pm-stack">
            <div className="pm-card panel">
              <div className="pm-row pm-between pm-wrap">
                <div className="pm-row">
                  <Avatar person={helper} />
                  <div>
                    <Label>{helper.school} - Class of {helper.year}</Label>
                    <h4 className="pm-card-title">{helper.name}</h4>
                    <p className="pm-small">{helper.role} at {helper.employer}</p>
                  </div>
                </div>
                <Chip tone="ok">Open to advice</Chip>
              </div>
              <p className="pm-copy">{offer.preferredStyle}</p>
              <Capacity offer={offer} />
            </div>
            <div className="pm-stack-tight">
              {helperRecs.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  rec={rec}
                  state={recState[rec.id]}
                  onRecState={onRecState}
                  helperMode
                />
              ))}
            </div>
          </div>
          <aside className="pm-stack">
            <div className="pm-card">
              <Label>Language guardrail</Label>
              <div className="pm-reasons">
                <Reason n="Use">You might be able to help</Reason>
                <Reason n="Use">Offer advice</Reason>
                <Reason n="Avoid">Assigned mentee</Reason>
                <Reason n="Avoid">You should mentor</Reason>
              </div>
            </div>
            <div className="pm-card">
              <Label>Helper controls</Label>
              <div className="pm-list">
                <SettingRow label="Pause suggestions" value="Any time" />
                <SettingRow label="Max pending asks" value="5" />
                <SettingRow label="Preferred style" value="Short tactical replies" />
              </div>
            </div>
          </aside>
        </div>
      </DashboardFrame>
    </ConceptSection>
  );
}

function EventScreen({ eventHidden, setEventHidden, connectionState, setConnectionState }) {
  const setConnection = (personId, state) => {
    setConnectionState((prev) => ({ ...prev, [personId]: state }));
  };

  return (
    <ConceptSection
      id="events"
      index="04"
      title="Post-event reconnects"
      copy="The product can remind people about event attendees without pretending it knows who talked to whom."
    >
      <DashboardFrame
        announcement={{ label: "Events", text: "People who also attended can be shown once, then folded into digest.", time: "Careful copy" }}
        title="Reconnect reminders"
        meta={[
          { label: "Events", value: DATA.eventConnectionSuggestions.length },
          { label: "Popup", value: "Default off" },
        ]}
      >
        <div className="pm-grid-2">
          <div className="pm-stack">
            {DATA.eventConnectionSuggestions.map((event) => (
              <EventSuggestion
                key={event.id}
                event={event}
                hidden={eventHidden[event.id]}
                onHide={() => setEventHidden((prev) => ({ ...prev, [event.id]: true }))}
                onRestore={() => setEventHidden((prev) => ({ ...prev, [event.id]: false }))}
                connectionState={connectionState}
                setConnection={setConnection}
              />
            ))}
          </div>
          <aside className="pm-stack">
            <div className="pm-card dark">
              <Label>Alert policy</Label>
              <h4 className="pm-card-title">Multiple surfaces, low pressure.</h4>
              <p className="pm-copy">
                Use in-app, weekly email digest, and persistent event-page blocks. Avoid repeat popups.
              </p>
            </div>
            <div className="pm-card">
              <Label>Language guardrail</Label>
              <div className="pm-reasons">
                <Reason n="Use">People who also attended</Reason>
                <Reason n="Use">Reconnect from Songdo Alumni Coffee</Reason>
                <Reason n="Avoid">You met this person</Reason>
                <Reason n="Avoid">Add everyone from this event</Reason>
              </div>
            </div>
          </aside>
        </div>
      </DashboardFrame>
    </ConceptSection>
  );
}

function ThankYouScreen({ spotlightStage, setSpotlightStage }) {
  const primary = DATA.thankYouNotes[0];
  const approved = DATA.thankYouNotes[2];
  const from = personById(primary.fromId);
  const to = personById(primary.toId);
  const approvedFrom = personById(approved.fromId);
  const featured = spotlightStage === "featured";

  return (
    <ConceptSection
      id="thanks"
      index="05"
      title="Thank-you spotlight consent"
      copy="Gratitude is sent privately first. Public spotlighting requires sender permission and recipient approval."
    >
      <DashboardFrame
        announcement={{ label: "Thanks", text: "Private by default. Public only after both sides approve.", time: "Consent flow" }}
        title="Thank-you and spotlight review"
        meta={[
          { label: "Default", value: "Private" },
          { label: "Public", value: "Opt-in" },
        ]}
      >
        <div className="pm-grid-2">
          <div className="pm-stack">
            <div className="pm-card">
              <div className="pm-row pm-between pm-wrap">
                <div className="pm-row">
                  <Avatar person={from} />
                  <div>
                    <Label>Private thank you</Label>
                    <h4 className="pm-card-title">{from.name} to {to.name}</h4>
                  </div>
                </div>
                <Chip tone={featured ? "ok" : spotlightStage === "requested" ? "warn" : "accent"}>
                  {featured ? "Featured" : spotlightStage === "requested" ? "Approval requested" : "Private"}
                </Chip>
              </div>
              <p className="pm-copy" style={{ color: "var(--pm-ink)", fontSize: 13 }}>{primary.body}</p>
              <div className="pm-control-rail" style={{ marginTop: 12 }}>
                <button
                  className="pm-button secondary"
                  onClick={() => setSpotlightStage("private")}
                  disabled={spotlightStage === "private"}
                >
                  Keep private
                </button>
                <button
                  className="pm-button accent"
                  onClick={() => setSpotlightStage("requested")}
                  disabled={spotlightStage !== "private"}
                >
                  Ask to spotlight
                </button>
                <button
                  className="pm-button"
                  onClick={() => setSpotlightStage("featured")}
                  disabled={spotlightStage !== "requested"}
                >
                  Recipient approves
                </button>
              </div>
              <div className="pm-status">
                Current state: {featured ? "public spotlight approved by both sides" : spotlightStage === "requested" ? "waiting for recipient approval" : "private note delivered"}
              </div>
            </div>

            <div className="pm-timeline">
              <ConsentStep active label="01 Private" copy="The note is sent to the recipient only." />
              <ConsentStep active={spotlightStage === "requested" || featured} label="02 Request" copy="Sender allows spotlight consideration." />
              <ConsentStep active={featured} label="03 Approve" copy="Recipient approves before public display." />
            </div>
          </div>
          <aside className="pm-stack">
            {featured ? (
              <div className="pm-spotlight">
                <div>
                  <Label>Thank-you spotlight</Label>
                  <p className="pm-spotlight-quote">"{primary.body}"</p>
                </div>
                <div className="pm-row pm-between">
                  <span className="pm-mono" style={{ color: "rgba(250,250,249,.68)", fontSize: 9 }}>
                    {from.name} - Class of {from.year}
                  </span>
                  <Chip tone="accent">Approved</Chip>
                </div>
              </div>
            ) : (
              <div className="pm-empty">Public spotlight stays empty until both people approve.</div>
            )}
            <div className="pm-card">
              <Label>Already approved example</Label>
              <p className="pm-copy" style={{ color: "var(--pm-ink)" }}>{approved.body}</p>
              <div className="pm-status">{approved.spotlightStatus} - {approvedFrom.name}</div>
            </div>
          </aside>
        </div>
      </DashboardFrame>
    </ConceptSection>
  );
}

function MemberCard({ person, offer }) {
  return (
    <div className="pm-card">
      <div className="pm-row pm-between pm-wrap">
        <Label>{person.school} - Class of {person.year}</Label>
        {offer ? (
          <Chip tone={offer.openToMentorship ? "accent" : "ok"}>
            {offer.openToMentorship ? "Open to mentor" : "Open to advice"}
          </Chip>
        ) : (
          <Chip>Member</Chip>
        )}
      </div>
      <div className="pm-row" style={{ marginTop: 12 }}>
        <Avatar person={person} />
        <div style={{ minWidth: 0 }}>
          <h4 className="pm-card-title">{person.name}</h4>
          <p className="pm-small">{person.role} at {person.employer}</p>
        </div>
      </div>
      <p className="pm-quote" style={{ marginTop: 12 }}>{person.bio}</p>
      <div className="pm-control-rail" style={{ marginTop: 12 }}>
        {person.tags.slice(0, 3).map((tag) => <Chip key={tag}>{tag}</Chip>)}
      </div>
    </div>
  );
}

function MiniRecommendation({ rec, state, onRecState }) {
  const person = personById(rec.personId);
  return (
    <div className="pm-card pm-mini-rec">
      <div className="pm-row pm-between">
        <div className="pm-row">
          <Avatar person={person} small />
          <div style={{ minWidth: 0 }}>
            <strong style={{ fontSize: 13 }}>{person.name}</strong>
            <p className="pm-small">{rec.source}</p>
          </div>
        </div>
        <Chip tone="accent">{rec.confidence}%</Chip>
      </div>
      <p className="pm-quote">{rec.title}</p>
      <div className="pm-control-rail">
        <button className="pm-button accent" onClick={() => onRecState(rec.id, "saved")}>Save</button>
        <button className="pm-button ghost" onClick={() => onRecState(rec.id, "dismissed")}>Dismiss</button>
      </div>
      {state ? <div className="pm-status">State: {state}</div> : null}
    </div>
  );
}

function RecommendationCard({ rec, state, onRecState, helperMode }) {
  const person = personById(rec.personId);
  const question = DATA.savedQuestions.find((item) => item.id === rec.questionId);
  const offer = helperOfferFor(person.id);
  const current = state || "new";
  const disabled = current === "dismissed" || current === "snoozed";

  return (
    <div className="pm-recommendation">
      <div>
        <div className="pm-row pm-between pm-wrap">
          <div className="pm-row">
            <Avatar person={person} />
            <div style={{ minWidth: 0 }}>
              <Label>{rec.title}</Label>
              <h4 className="pm-card-title">{person.name}</h4>
              <p className="pm-small">{person.role} at {person.employer}</p>
            </div>
          </div>
          <Chip tone={rec.confidence >= 85 ? "accent" : rec.confidence >= 75 ? "ok" : "warn"}>
            {rec.confidence}% match
          </Chip>
        </div>
        <div className="pm-reasons">
          {rec.reasons.map((reason, index) => (
            <Reason key={reason} n={`0${index + 1}`}>{reason}</Reason>
          ))}
        </div>
      </div>
      <div className="pm-side-panel">
        <Label>Trigger</Label>
        <p className="pm-small" style={{ marginTop: 6 }}>{rec.trigger}</p>
        <div style={{ marginTop: 12 }}>
          <Label>Saved question</Label>
          <p className="pm-small" style={{ marginTop: 6 }}>{question?.title}</p>
        </div>
        {offer ? <Capacity offer={offer} compact /> : null}
        <div className="pm-control-rail" style={{ marginTop: 12 }}>
          <button
            className="pm-button accent"
            disabled={disabled}
            onClick={() => onRecState(rec.id, helperMode ? "offered" : "started")}
          >
            {rec.actionLabel}
          </button>
          <button className="pm-button secondary" onClick={() => onRecState(rec.id, "saved")}>Save</button>
          <button className="pm-button ghost" onClick={() => onRecState(rec.id, "snoozed")}>Snooze</button>
          <button className="pm-button ghost" onClick={() => onRecState(rec.id, "dismissed")}>Dismiss</button>
        </div>
        <div className="pm-status">State: {current}</div>
      </div>
    </div>
  );
}

function EventSuggestion({ event, hidden, onHide, onRestore, connectionState, setConnection }) {
  if (hidden) {
    return (
      <div className="pm-card panel">
        <div className="pm-row pm-between pm-wrap">
          <div>
            <Label>{event.eventTitle}</Label>
            <h4 className="pm-card-title">Suggestions hidden for this event.</h4>
          </div>
          <button className="pm-button secondary" onClick={onRestore}>Show again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pm-card">
      <div className="pm-row pm-between pm-wrap">
        <div>
          <Label>People who also attended</Label>
          <h4 className="pm-card-title">{event.eventTitle}</h4>
          <p className="pm-small">{event.eventWhen} - {event.location}</p>
        </div>
        <Chip>{event.cadence}</Chip>
      </div>
      <p className="pm-copy">{event.copy}</p>
      <div className="pm-stack-tight" style={{ marginTop: 12 }}>
        {event.people.map((entry) => {
          const person = personById(entry.personId);
          const state = connectionState[person.id] || "not sent";
          return (
            <div className="pm-event-person" key={person.id}>
              <div>
                <div className="pm-row">
                  <Avatar person={person} small />
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ fontSize: 13 }}>{person.name}</strong>
                    <p className="pm-small">{entry.reason}</p>
                  </div>
                </div>
                <div className="pm-note">"{entry.suggestedNote}"</div>
                <div className="pm-status">State: {state}</div>
              </div>
              <div className="pm-control-rail">
                <button
                  className="pm-button accent"
                  disabled={state === "request drafted"}
                  onClick={() => setConnection(person.id, "request drafted")}
                >
                  Friend request
                </button>
                <button className="pm-button ghost" onClick={() => setConnection(person.id, "ignored")}>Ignore</button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="pm-control-rail" style={{ marginTop: 12 }}>
        <button className="pm-button ghost" onClick={onHide}>Stop showing this event</button>
      </div>
    </div>
  );
}

function NotificationPreview() {
  return (
    <div className="pm-card">
      <Label>Notification surfaces</Label>
      <div className="pm-list" style={{ marginTop: 10 }}>
        {DATA.notificationPreview.map((item) => (
          <SettingRow
            key={item.channel}
            label={`${item.channel}: ${item.example}`}
            value={item.defaultOn ? "Default on" : "Default off"}
            tone={item.defaultOn ? "ok" : "warn"}
          />
        ))}
      </div>
    </div>
  );
}

function GuardrailCard() {
  return (
    <div className="pm-card">
      <Label>Trust controls</Label>
      <div className="pm-list">
        <SettingRow label="Dismiss" value="Remove this reasoned match" />
        <SettingRow label="Snooze" value="Hide temporarily" />
        <SettingRow label="Save for later" value="No outreach yet" />
      </div>
    </div>
  );
}

function Capacity({ offer, compact }) {
  const activeRatio = offer.capacity.maxActive > 0 ? offer.capacity.active / offer.capacity.maxActive : 0;
  const pendingRatio = offer.capacity.maxPending > 0 ? offer.capacity.pending / offer.capacity.maxPending : 0;
  const ratio = Math.max(activeRatio, pendingRatio);
  const color = ratio >= 1 ? "var(--pm-bad)" : ratio >= .75 ? "var(--pm-warn)" : "var(--pm-ok)";
  const label = offer.capacity.maxActive > 0
    ? `${offer.capacity.active}/${offer.capacity.maxActive} active`
    : `${offer.capacity.pending}/${offer.capacity.maxPending} pending`;

  return (
    <div className="pm-capacity">
      <div className="pm-row pm-between">
        <Label>Capacity</Label>
        <span className="pm-mono" style={{ color, fontSize: 9, fontWeight: 700 }}>{label}</span>
      </div>
      <div className="pm-gauge">
        <span style={{ width: `${Math.min(100, ratio * 100)}%`, background: color }} />
      </div>
      {!compact ? <p className="pm-small">{offer.preferredStyle}</p> : null}
    </div>
  );
}

function ConsentStep({ active, label, copy }) {
  return (
    <div className={`pm-timeline-step ${active ? "is-active" : ""}`}>
      <Chip tone={active ? "accent" : undefined}>{label}</Chip>
      <p className="pm-small" style={{ marginTop: 8 }}>{copy}</p>
    </div>
  );
}

function SettingRow({ label, value, tone }) {
  return (
    <div className="pm-list-row">
      <span className="pm-small" style={{ margin: 0 }}>{label}</span>
      {tone ? <Chip tone={tone}>{value}</Chip> : <strong>{value}</strong>}
    </div>
  );
}

function SectionCardTitle({ label, value }) {
  return (
    <div className="pm-section-card-title">
      <strong>{label}</strong>
      <span>{value}</span>
    </div>
  );
}

function Reason({ n, children }) {
  return (
    <div className="pm-reason">
      <span>{n}</span>
      <span>{children}</span>
    </div>
  );
}

function Label({ children }) {
  return <span className="pm-field-label">{children}</span>;
}

function Chip({ children, tone }) {
  return (
    <span className={`pm-chip ${tone || ""}`}>
      {tone ? <span className="pm-chip-dot" /> : null}
      {children}
    </span>
  );
}

function Avatar({ person, small }) {
  return (
    <span className={`pm-avatar ${small ? "small" : ""}`} aria-hidden="true">
      {person.initials || initialsFrom(person.name)}
    </span>
  );
}

function SearchIcon() {
  return (
    <svg className="pm-search-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="16" y1="16" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
