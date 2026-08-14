// Sample data for the Help flows (FLOWS.md §3). Replace with real content.
window.BCHelpData = {
  // People who can speak to a typed question (find state). Results are
  // private to the asker — a member never learns they matched.
  people: [
    { id: "p1", i: "MC", av: 1, name: "Maya Chen", first: "Maya", yr: "18", circle: true, open: true, pid: "maya-chen",
      evidence: "Made the agency \u2192 in-house jump in 2018",
      keywords: ["in-house", "agency", "design", "move", "switch", "portfolio", "internship"],
      why: "Maya spent three years at an agency before going in-house at a consumer fintech in 2018 \u2014 and she\u2019s talked two other members through this exact decision.",
      role: "Product Designer \u00b7 Notion \u00b7 San Francisco",
      about: "Designs systems and product at Notion; spent her agency years shipping brand work she still loves. Big believer in switching when the learning flattens.",
      career: ["Product Designer \u00b7 Notion \u00b7 2021\u2013now", "Designer \u00b7 Studio Ampersand \u00b7 2018\u20132021"],
      share: "Prof. Whitman\u2019s studio \u2014 4 years apart" },
    { id: "p2", i: "JB", av: 4, name: "Jordan Blake", first: "Jordan", yr: "15", circle: false, open: true, pid: "jordan-blake",
      evidence: "Hires in-house designers from agencies",
      keywords: ["in-house", "design", "hiring", "interview", "portfolio", "agency"],
      why: "Jordan runs a small in-house design team and hires designers straight out of agencies \u2014 he can tell you what the switch looks like from the hiring side.",
      role: "Design Manager \u00b7 Linear \u00b7 New York",
      about: "Built Linear\u2019s first design team from scratch; hires two or three designers a year and reads every portfolio himself.",
      career: ["Design Manager \u00b7 Linear \u00b7 2020\u2013now", "Senior Designer \u00b7 R/GA \u00b7 2015\u20132020"] },
    { id: "p3", i: "DO", av: 2, name: "Daniel Osei", first: "Daniel", yr: "12", circle: false, open: true, pid: "daniel-osei",
      evidence: "Mentors people switching tracks",
      keywords: ["switch", "career", "change", "track", "move", "design"],
      why: "Daniel mentors members changing tracks \u2014 he\u2019s guided switches into and out of design, engineering, and product over the last decade.",
      role: "Design Director \u00b7 independent \u00b7 Los Angeles",
      about: "Runs an independent practice after fifteen years in-house; mentors early-career members on the messy middle of career changes.",
      career: ["Independent design director \u00b7 2019\u2013now", "Design Director \u00b7 Headspace \u00b7 2014\u20132019"],
      share: "Chadwick robotics club \u2014 10 years apart" },
    { id: "p4", i: "PN", av: 3, name: "Priya Nair", first: "Priya", yr: "20", circle: true, open: false, pid: "priya-nair",
      evidence: "Went in-house at a fintech last spring",
      keywords: ["in-house", "fintech", "startup", "design", "move"],
      why: "Priya made the same move just last spring \u2014 hers is the freshest read on what the first six months in-house actually feel like.",
      role: "Senior Designer \u00b7 Stripe \u00b7 Seattle",
      about: "Went in-house at Stripe last spring after four agency years; keeps honest notes on what she\u2019d do differently.",
      career: ["Senior Designer \u00b7 Stripe \u00b7 2025\u2013now", "Designer \u00b7 Instrument \u00b7 2021\u20132025"] }
  ],

  // Your asks — one recipient per ask; open + circle asks share the 5-slot cap.
  yourAsks: [
    { id: "a1", kind: "direct", status: "waiting", sent: "2 days ago", daysLeft: 12,
      text: "How did you know it was time to move in-house? I\u2019m weighing it after two agency internships.",
      to: { i: "MC", av: 1, name: "Maya Chen", first: "Maya", yr: "18", pid: "maya-chen" } },
    { id: "a2", kind: "open", status: "offers", sent: "5 days ago", daysLeft: 9, reach: "matches", anon: true,
      text: "Could someone intro me to a design-led startup that takes juniors seriously?",
      offers: [
        { id: "o1", i: "TW", av: 2, name: "Tess Winter", yr: "16", evidence: "Design manager at a design-led startup",
          note: "I\u2019ve hired juniors at two design-led startups \u2014 happy to intro you to both founders." },
        { id: "o2", i: "AR", av: 4, name: "Andr\u00e9s Rios", yr: "19", evidence: "Second designer at a seed-stage startup",
          note: "We\u2019re not hiring right now, but I can walk you through how I picked my startup \u2014 and who is." }
      ] },
    { id: "a3", kind: "direct", status: "declined", sent: "1 day ago", daysLeft: 0,
      text: "Would you look over my case-study draft before Friday?",
      to: { i: "RS", av: 3, name: "Ravi Shah", first: "Ravi", yr: "14", pid: "ravi-shah" },
      declineNote: "I can\u2019t take this on right now \u2014 crunch season on my end. Wishing you luck with it." },
    { id: "a4", kind: "open", status: "quiet", sent: "12 days ago", daysLeft: 2, reach: "school", anon: false,
      text: "Is a coding bootcamp worth it alongside a design degree?", offers: [] }
  ],

  // Ended asks — reachable from history, never nagging.
  historyAsks: [
    { id: "h1", text: "Choosing between two summer offers", end: "Resolved", meta: "Resolved with Jordan Blake \u00b7 took the in-house offer \u00b7 May" },
    { id: "h2", text: "Feedback on my first client contract", end: "Closed", meta: "Closed after 14 days \u00b7 April" },
    { id: "h3", text: "Which electives pair well with the design studio?", end: "Retracted", meta: "You retracted this \u00b7 March" }
  ],

  give: {
    helpedNote: "You\u2019ve helped 4 members this term",
    topics: [
      "Making the agency \u2192 in-house move \u2014 and how to time it",
      "Reviewing first portfolios the way hiring managers read them",
      "Freelancing through school: pricing, contracts, first clients"
    ],
    asks: [
      { id: "m1", source: "match", topic: "Making the agency \u2192 in-house move \u2014 and how to time it", time: "5h ago",
        q: "How risky is going into design instead of SWE?",
        asker: { i: "SO", av: 3, name: "Sam Okafor", first: "Sam", yr: "27", role: "CS \u201927", pid: "sam-okafor" },
        full: [
          "I\u2019m two years into CS and keep gravitating to the design side of every project \u2014 I took the intro studio, redid our club\u2019s site, and it\u2019s the only work where I lose track of time.",
          "What I can\u2019t tell is how risky the switch actually is. Everyone around me treats SWE as the safe default. If you chose design over engineering: how did the trade-off actually play out?"
        ],
        draft: "Hey Sam \u2014 I switched from a CS track into design partway through school, so I\u2019ve sat exactly where you are. Happy to walk you through how I weighed it." },
      { id: "m2", source: "match", topic: "Reviewing first portfolios the way hiring managers read them", time: "1d ago",
        q: "Would someone look over my first portfolio?",
        asker: { i: "EP", av: 4, name: "Eva Park", first: "Eva", yr: "28", role: "Design \u201928", pid: "eva-park" },
        full: [
          "I\u2019ve put together my first real portfolio \u2014 three studio projects plus one personal one \u2014 and I\u2019m about to start applying for summer internships.",
          "Before I send it anywhere, I\u2019d love a blunt read from someone who actually reviews these: what would make you stop scrolling, and what would make you pass?"
        ],
        draft: "Hi Eva \u2014 I look at a lot of student portfolios for internship hires. Send it over and I\u2019ll go through it the way I would a real application." },
      { id: "s1", source: "search", topic: null, time: "2d ago",
        q: "What\u2019s a fair rate for freelance brand work?",
        asker: { i: "NK", av: 2, name: "Noah Kim", first: "Noah", yr: "26", role: "\u201926", pid: "noah-kim" },
        full: [
          "A local caf\u00e9 asked me to do their whole brand \u2014 logo, menus, signage. It\u2019s my first paid project and I have no idea what to charge; my instinct is to undercharge just to land it.",
          "If you\u2019ve freelanced as a student: how did you price your early work, and what do you wish you\u2019d done differently?"
        ],
        draft: "Hey Noah \u2014 I freelanced brand work all through school and kept notes on what I charged and when I raised it. Glad to share real numbers." },
      { id: "s2", source: "search", topic: null, time: "3d ago", anon: true,
        q: "Moving abroad after graduation \u2014 how did you handle the visa side?",
        asker: { i: "?", av: 1, name: "A member", first: "them", yr: "21", role: "\u201921", pid: "" },
        full: [
          "I have an offer that would mean relocating to Berlin next spring, and the visa process looks like a maze of appointments and notarized copies.",
          "If you\u2019ve moved abroad for work after graduating: what did you wish you\u2019d started earlier, and where did you get stuck?"
        ],
        draft: "Hi \u2014 I moved abroad two years after graduating and went through the work-visa maze myself. Happy to share the timeline that actually worked." },
      { id: "d1", source: "direct", topic: null, time: "Yesterday",
        q: "Could you help me prep for a design internship interview?",
        asker: { i: "LP", av: 2, name: "Lena Petrova", first: "Lena", yr: "26", role: "Design \u201926", pid: "lena-petrova" },
        full: [
          "I have a final-round interview for a product design internship in two weeks \u2014 a portfolio walkthrough plus a live whiteboard exercise, and I\u2019ve never done either in front of strangers.",
          "You went through this a few years ago \u2014 would you do a practice run with me, or even just tell me what surprised you?"
        ],
        acceptDraft: "Hi Lena \u2014 glad to help. The whiteboard part is much less scary with one practice run; let\u2019s set one up this week.",
        declineReasons: ["I can\u2019t take this on right now", "This one\u2019s outside what I can speak to"] }
    ]
  }
};

// A wider bench so long result lists (~50 matches) can be demoed.
(function () {
  const firsts = ["Ava", "Ben", "Chloe", "Dev", "Elena", "Felix", "Grace", "Hugo", "Isla", "Jonas", "Kira", "Liam", "Mina", "Nate", "Oona", "Pablo", "Quinn", "Rosa", "Theo", "Uma", "Vera", "Wes", "Yuri", "Zoe", "Aditi", "Bram", "Cleo", "Dario", "Effie", "Farid", "Gwen", "Hana", "Ivo", "June", "Kofi", "Lara", "Milo", "Nia", "Omar", "Pia", "Reza", "Sena", "Tova", "Ugo", "Wren", "Asha"];
  const lasts = ["Kim", "Alvarez", "Brooks", "Cho", "Dabo", "Eriksen", "Fujita", "Gruber", "Haddad", "Ito", "Janssen", "Kaur", "Lindqvist", "Mbeki", "Novak", "Okoye", "Park", "Quist", "Rahman", "Sato"];
  const kinds = [
    { ev: "Went in-house at a product company", kw: ["in-house", "design", "move"], why: "Made the same in-house move mid-career and has compared notes with agency friends since." },
    { ev: "Agency design lead who reviews portfolios", kw: ["agency", "portfolio", "design"], why: "Sees both sides of the fence \u2014 leads agency work and reviews portfolios for hires." },
    { ev: "Switched tracks from engineering to design", kw: ["switch", "design", "career", "change"], why: "Changed tracks after graduating and can speak to the first two years of the switch." },
    { ev: "Hires designers at a startup", kw: ["design", "hiring", "startup", "interview"], why: "Screens design candidates every quarter \u2014 knows what makes a switcher credible." },
    { ev: "Mentors early-career members on big moves", kw: ["career", "move", "change", "internship"], why: "Has mentored a dozen members through early-career decisions like this one." }
  ];
  const p = window.BCHelpData.people;
  for (let n = 0; n < 46; n++) {
    const f = firsts[n % firsts.length], l = lasts[(n * 7) % lasts.length], k = kinds[n % kinds.length];
    p.push({
      id: "gx" + n, i: f[0] + l[0], av: (n % 4) + 1,
      name: f + " " + l, first: f, yr: String(8 + (n % 17)).padStart(2, "0"),
      circle: n % 9 === 0, open: n % 3 !== 0, pid: "",
      evidence: k.ev, role: k.ev, keywords: k.kw, why: k.why
    });
  }
})();
