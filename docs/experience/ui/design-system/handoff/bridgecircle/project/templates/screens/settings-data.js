// Seed data for Settings.dc.html — exposes window.BCSettingsData.
// Session state: bcSettingsPrefs (toggles), bcUnblocked, bcHelpPageState.openTo
// (pause — shared with Help·Give, one source of truth per ADR 0011).

window.BCSettingsData = {
  account: {
    email: "iris.lau@alum.chadwick.edu",
    joined: "Joined March 2026 \u00b7 invited through Chadwick"
  },

  // Per-type notification & email preferences (FLOWS §7d).
  // Transactional only for v1 — no weekly digest.
  prefTypes: [
    { key: "asks", label: "Asks & offers",
      desc: "Someone asks you, offers on your ask, or a thread opens" },
    { key: "notes", label: "Decline notes",
      desc: "A no, cushioned \u2014 you\u2019ll never get silence instead" },
    { key: "connect", label: "Connect requests",
      desc: "Someone wants to join your circle, or accepted your request" },
    { key: "events", label: "Event updates",
      desc: "Reminders, changes, cancellations, waitlist spots" },
    { key: "expiry", label: "Ask expiry warnings",
      desc: "A heads-up before an ask closes at day 14" }
  ],

  blocked: [
    { id: "b1", i: "MW", av: 4, name: "Marcus Webb", yr: "13", since: "Blocked April 12" }
  ]
};
