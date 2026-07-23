// Seed data for Home.dc.html — exposes window.BCHomeData.
// Home is pure composition (FLOWS §2): asks, events and announcements come
// straight from ../help/help-data.js, ../school/school-data.js and
// ../messages/messages-data.js. This file holds only what no other surface
// owns: the coordinator's pulse line and the deck items that are Home-native
// (Recognition, It worked).

window.BCHomeData = {

  // The coordinator's line — one warm templated sentence over weekly counts,
  // never a stream (voice-guidelines register).
  pulse: "Quiet week. 3 new alumni joined and 1 mentor refreshed their profile.",
  pulseAllClear: "All quiet. Nothing is waiting on you this week.",

  // Recognition — warm milestones only. Never a leaderboard, no counts or
  // ranking; a quiet doorway to a profile or a hello.
  recognition: {
    meta: "Class of \u201914",
    title: "Maya Chen just started at Figma.",
    body: "A quiet congratulations goes a long way \u2014 she\u2019d hear it from you first.",
    href: "../profile/Profile.dc.html?id=1",
    label: "Say congrats"
  },

  // It worked — a consented outcome story (FLOWS §5.4). Names appear only
  // because both members said so.
  itWorked: {
    meta: "Shared with both members\u2019 okay",
    title: "A first client contract, signed.",
    body: "An open ask about freelance pricing ended with a mentor\u2019s rate template \u2014 and a caf\u00e9 brand project with a real invoice behind it."
  }
};
