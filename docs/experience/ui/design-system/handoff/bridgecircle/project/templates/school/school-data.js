// Sample data for the School section (FLOWS.md §6). Replace with real content.
window.BCSchoolData = {

  // Events. `going` seeds the RSVP state; the pages overlay session overrides.
  // Times are member-local first, campus second (two-campus rule).
  events: [
    {
      id: "spring-mixer", short: "Spring Mixer", title: "Spring Mixer on the Main Court Patio",
      cat: "Social", mo: "MAY", dd: "14", dw: "THU",
      dateLine: "Thu, May 14", timeLine: "6:00 \u2013 9:00 PM PT", listTime: "Thu 6:00 PM PT",
      ics: "20260514T180000", place: "Main Court Patio", place2: "Palos Verdes campus",
      format: "In person", format2: "Casual \u00b7 all classes",
      desc: "An easy evening on the patio \u2014 name tags, snacks, and no program.",
      host: { name: "the Alumni Office", pid: "" },
      going: true, goingCount: 43, goingNames: "Maya, Jordan", circleGoing: 3,
      avs: [{ i: "MC", av: 1 }, { i: "JB", av: 4 }],
      spotsLeft: 0, full: false, online: false,
      about: "No agenda and no speeches. Come as you are, find a name tag, and let the patio do the work \u2014 the point is running into people you\u2019d never think to message.\n\nFirst one of these? They skew friendly: about half current students, half alumni back in town, and nobody stays in their class year for long.",
      itinerary: [],
      facts: [
        { l: "Parking", v: "Lot B, off Academy Road", link: "Directions \u2192", href: "https://maps.google.com/?q=Chadwick+School+Palos+Verdes" },
        { l: "Cost", v: "Free \u2014 snacks and drinks covered" }
      ]
    },
    {
      id: "founders-dinner", short: "Founders Dinner", title: "Founders Dinner at The Riviera",
      cat: "Dinner", mo: "MAY", dd: "19", dw: "TUE",
      dateLine: "Tue, May 19", timeLine: "7:00 \u2013 9:30 PM PT", listTime: "Tue 7:00 PM PT",
      ics: "20260519T190000", place: "The Riviera", place2: "Redondo Beach",
      format: "In person", format2: "Seated dinner \u00b7 RSVP required",
      desc: "One long table, three courses, and the stories behind six alumni-founded companies.",
      host: { name: "Daniel Osei \u201912", pid: "daniel-osei" },
      going: true, goingCount: 27, goingNames: "Priya, Daniel", circleGoing: 2,
      avs: [{ i: "PN", av: 3 }, { i: "DO", av: 2 }],
      spotsLeft: 12, full: false, online: false,
      about: "Six founders, one table, and the parts that never make the announcement post \u2014 the first hire that didn\u2019t work out, the pivot nobody voted for, the check that almost didn\u2019t clear.\n\nSeats are mixed on purpose: you\u2019ll be next to someone whose work you don\u2019t know yet. Daniel hosts and keeps the stories moving between courses.",
      itinerary: [
        { t: "7:00", x: "Doors \u00b7 find your seat" },
        { t: "7:30", x: "Dinner \u2014 first stories between courses" },
        { t: "9:00", x: "Dessert \u00b7 open tables" }
      ],
      facts: [
        { l: "Cost", v: "$30 at the door \u2014 covers the full dinner" },
        { l: "Dress", v: "Come from work as you are" },
        { l: "Plus-ones", v: "Members only for this one" },
        { l: "Parking", v: "Valet at the front, validated", link: "Directions \u2192", href: "https://maps.google.com/?q=The+Riviera+Redondo+Beach" }
      ]
    },
    {
      id: "portfolio-clinic", short: "Resume & portfolio clinic", title: "Resume & portfolio clinic",
      cat: "Career", mo: "JUN", dd: "02", dw: "TUE",
      dateLine: "Tue, Jun 2", timeLine: "5:30 \u2013 7:00 PM PT \u00b7 Wed 9:30 AM KST", listTime: "Tue 5:30 PM PT \u00b7 Wed 9:30 AM KST",
      ics: "20260602T173000", place: "Online", place2: "Link unlocks with your RSVP",
      format: "Online", format2: "Bring one page or one project",
      desc: "Alumni reviewers read your resume or portfolio the way they read real applications.",
      host: { name: "Jordan Blake \u201915", pid: "jordan-blake" },
      going: false, goingCount: 18, goingNames: "Eva, Noah", circleGoing: 1,
      avs: [{ i: "EP", av: 4 }, { i: "NK", av: 2 }],
      spotsLeft: 0, full: false, online: true,
      about: "A working session, not a webinar. You\u2019ll be in a small room with one reviewer \u2014 someone who screens portfolios or resumes for real hires \u2014 and they\u2019ll read yours cold, narrating what makes them keep going and what makes them stop.\n\nBring one thing: a single page or a single project. Polished is not required; honest is.",
      itinerary: [
        { t: "5:30", x: "How reviewers actually read \u2014 10 minutes" },
        { t: "5:45", x: "Small rooms \u00b7 one reviewer per group" },
        { t: "6:45", x: "Notes to take home" }
      ],
      facts: [
        { l: "Format", v: "Video on is nice, not required" },
        { l: "Cost", v: "Free" }
      ]
    },
    {
      id: "studio-trek", short: "LA design studio trek", title: "LA design studio trek",
      cat: "Career", mo: "JUN", dd: "12", dw: "FRI",
      dateLine: "Fri, Jun 12", timeLine: "9:00 AM \u2013 4:00 PM PT", listTime: "Fri 9:00 AM PT",
      ics: "20260612T090000", place: "Three studios", place2: "Vans from campus",
      format: "In person", format2: "Day trip \u00b7 lunch covered",
      desc: "A day across three LA studios where alumni work \u2014 honest Q&A at every stop.",
      host: { name: "the Alumni Office", pid: "" },
      going: false, goingCount: 30, goingNames: "Lena, Sam", circleGoing: 1,
      avs: [{ i: "LP", av: 2 }, { i: "SO", av: 3 }],
      spotsLeft: 0, full: true, online: false,
      about: "Thirty seats, three studios, one day. At each stop an alum walks you through what they\u2019re actually working on, then takes questions with the door closed \u2014 the kind you can\u2019t ask on a website.\n\nVans leave from campus at 9 sharp and have you back by 4. Lunch is at the second stop.",
      itinerary: [
        { t: "9:00", x: "Vans leave campus \u2014 don\u2019t be the story" },
        { t: "10:00", x: "Stop one \u00b7 brand studio" },
        { t: "12:30", x: "Stop two \u00b7 product team \u00b7 lunch" },
        { t: "2:30", x: "Stop three \u00b7 independent practice" }
      ],
      facts: [
        { l: "Cost", v: "Free \u2014 vans and lunch covered" },
        { l: "Capacity", v: "30 seats \u00b7 currently full, waitlist open" }
      ]
    },
    {
      id: "reunion-weekend", short: "Reunion Weekend", title: "Reunion Weekend on campus",
      cat: "Reunion", mo: "OCT", dd: "17", dw: "SAT",
      dateLine: "Sat\u2013Mon, Oct 17\u201319", timeLine: "All weekend \u00b7 schedule by class", listTime: "Sat, all day",
      ics: "20261017T100000", place: "Chadwick campus", place2: "Palos Verdes",
      format: "In person", format2: "All classes \u00b7 family welcome",
      desc: "Three days on campus \u2014 class dinners, tours of what\u2019s changed, and the Sunday brunch.",
      host: { name: "the Alumni Office", pid: "" },
      going: false, goingCount: 112, goingNames: "Maya, Ravi", circleGoing: 5,
      avs: [{ i: "MC", av: 1 }, { i: "RS", av: 3 }],
      spotsLeft: 0, full: false, online: false,
      about: "The big one. Every class gets its own dinner on Saturday; everything else \u2014 campus tours, the faculty coffee, Sunday brunch on the main lawn \u2014 is everyone together.\n\nFull class-by-class schedule lands in September. RSVP now just tells us to save you a seat.",
      itinerary: [],
      facts: [
        { l: "Family", v: "Partners and kids welcome all weekend" },
        { l: "Cost", v: "Class dinner $45 \u00b7 everything else free" },
        { l: "Staying over", v: "Hotel block at the Terranea \u2014 code CHADWICK26" }
      ]
    }
  ],

  // Ended events (cancelled / past) — reachable from stale links and old
  // notifications only (FLOWS §6-detail: the page stays reachable and states it
  // plainly). Not shown in School's upcoming list.
  endedEvents: [
    {
      id: "careers-law-panel", short: "Careers in Law panel", title: "Careers in Law panel",
      cat: "Career", mo: "MAY", dd: "07", dw: "THU",
      dateLine: "Thu, May 7", timeLine: "5:00 \u2013 6:30 PM PT", listTime: "Thu 5:00 PM PT",
      ics: "20260507T170000", place: "Online", place2: "Link unlocks with your RSVP",
      format: "Online", format2: "Panel \u00b7 Q&A",
      desc: "Four alumni in law \u2014 big firm, public defense, in-house \u2014 on how they got there.",
      host: { name: "the Alumni Office", pid: "" },
      going: true, goingCount: 21, goingNames: "Ravi, Grace", circleGoing: 1,
      avs: [{ i: "RS", av: 3 }, { i: "GK", av: 2 }],
      spotsLeft: 0, full: false, online: true, cancelled: true,
      about: "Cancelled \u2014 two of the four panelists had a scheduling conflict, and a two-person panel wasn\u2019t the event we promised. We\u2019re rescheduling for the fall.",
      itinerary: [],
      facts: []
    }
  ],

  // Who's going — shared bench, referenced by id from each event.
  // Circle members list first (FLOWS §6-detail). `more` = beyond the sample.
  attendees: {
    "spring-mixer": {
      list: [
        { i: "MC", av: 1, name: "Maya Chen", yr: "18", circle: true, pid: "maya-chen" },
        { i: "PN", av: 3, name: "Priya Nair", yr: "20", circle: true, pid: "priya-nair" },
        { i: "RS", av: 3, name: "Ravi Shah", yr: "14", circle: true, pid: "ravi-shah" },
        { i: "JB", av: 4, name: "Jordan Blake", yr: "15", circle: false, pid: "jordan-blake" },
        { i: "TW", av: 2, name: "Tess Winter", yr: "16", circle: false, pid: "" },
        { i: "LP", av: 2, name: "Lena Petrova", yr: "26", circle: false, pid: "lena-petrova" },
        { i: "SO", av: 3, name: "Sam Okafor", yr: "27", circle: false, pid: "sam-okafor" },
        { i: "EP", av: 4, name: "Eva Park", yr: "28", circle: false, pid: "eva-park" }
      ],
      more: 36
    },
    "founders-dinner": {
      list: [
        { i: "PN", av: 3, name: "Priya Nair", yr: "20", circle: true, pid: "priya-nair" },
        { i: "RS", av: 3, name: "Ravi Shah", yr: "14", circle: true, pid: "ravi-shah" },
        { i: "DO", av: 2, name: "Daniel Osei", yr: "12", circle: false, pid: "daniel-osei" },
        { i: "TW", av: 2, name: "Tess Winter", yr: "16", circle: false, pid: "" },
        { i: "AR", av: 4, name: "Andr\u00e9s Rios", yr: "19", circle: false, pid: "" },
        { i: "NK", av: 2, name: "Noah Kim", yr: "26", circle: false, pid: "noah-kim" }
      ],
      more: 21
    },
    "portfolio-clinic": {
      list: [
        { i: "MC", av: 1, name: "Maya Chen", yr: "18", circle: true, pid: "maya-chen" },
        { i: "JB", av: 4, name: "Jordan Blake", yr: "15", circle: false, pid: "jordan-blake" },
        { i: "EP", av: 4, name: "Eva Park", yr: "28", circle: false, pid: "eva-park" },
        { i: "NK", av: 2, name: "Noah Kim", yr: "26", circle: false, pid: "noah-kim" }
      ],
      more: 14
    },
    "studio-trek": {
      list: [
        { i: "PN", av: 3, name: "Priya Nair", yr: "20", circle: true, pid: "priya-nair" },
        { i: "LP", av: 2, name: "Lena Petrova", yr: "26", circle: false, pid: "lena-petrova" },
        { i: "SO", av: 3, name: "Sam Okafor", yr: "27", circle: false, pid: "sam-okafor" }
      ],
      more: 27
    },
    "reunion-weekend": {
      list: [
        { i: "MC", av: 1, name: "Maya Chen", yr: "18", circle: true, pid: "maya-chen" },
        { i: "PN", av: 3, name: "Priya Nair", yr: "20", circle: true, pid: "priya-nair" },
        { i: "RS", av: 3, name: "Ravi Shah", yr: "14", circle: true, pid: "ravi-shah" },
        { i: "DO", av: 2, name: "Daniel Osei", yr: "12", circle: false, pid: "daniel-osei" }
      ],
      more: 108
    }
  },

  // Announcements. `unread` seeds the dot; reading pages mark read in-session.
  announcements: [
    {
      id: "mentorship-cohort", tag: "Mentorship", pinned: true, unread: false,
      title: "Class of \u201926 mentorship cohort opens Friday",
      time: "Opens Friday", date: "May 12",
      body: "The spring mentorship cohort opens to the Class of \u201926 this Friday at noon. Twenty alumni mentors, one term, one standing call a month \u2014 and a match made on what you\u2019re actually working through, not on job titles.\n\nHow it works: you write three sentences about where you are and where you\u2019re stuck. Mentors read those, not your resume. Matches go out the following week, and the first calls happen before the month is out.\n\nSpots are capped at twenty so every match gets real attention. If Friday passes you by, the fall cohort opens in September \u2014 and asking for help in the meantime is what the Help page is for."
    },
    {
      id: "recruiting-roles", tag: "Hiring", pinned: false, unread: true,
      title: "12 alumni added recruiting roles this week",
      time: "1d ago", date: "May 11",
      body: "Twelve members added open roles to their profiles this week \u2014 the most in one week since the circle opened. Design, engineering, and two early operations roles, from seed-stage teams to one very large company that shall remain nameless until you find it.\n\nThe roles live on each member\u2019s profile, not on a jobs board \u2014 that\u2019s deliberate. A role here comes with a person attached: someone who\u2019ll tell you what the team is actually like before you apply.\n\nBrowse People and look for the \u201chiring\u201d note on profiles, or ask on the Help page and let the matching do the walking."
    },
    {
      id: "reunion-dates", tag: "Reunion", pinned: false, unread: true,
      title: "Reunion weekend set for Oct 17\u201319",
      time: "Yesterday", date: "May 10",
      body: "It\u2019s official: Reunion Weekend is October 17\u201319, on campus. Class dinners on Saturday night, campus tours and the faculty coffee through the weekend, and brunch on the main lawn to send everyone home on Sunday.\n\nEvery class gets its own dinner table \u2014 yes, even the class of \u201926, who will have been alumni for all of five months. Partners and kids are welcome at everything except the class dinners.\n\nThe event is on the School page now; RSVP just tells us to save you a seat. The class-by-class schedule lands in September."
    },
    {
      id: "reading-room", tag: "General", pinned: false, unread: false,
      title: "The alumni reading room opens in June",
      time: "May 2", date: "May 2",
      body: "The library renovation wraps this month, and with it comes something new: an alumni reading room on the second floor, open to members whenever campus is.\n\nIt\u2019s a workroom, not a museum \u2014 desks, good light, fast wifi, and a door that closes. If you\u2019re back in town and need a place to take a call or finish a thing, it\u2019s yours.\n\nBadge in at the main library desk with your member email. First coffee is on the honor cart."
    },
    {
      id: "service-day", tag: "General", pinned: false, unread: false,
      title: "Spring service day \u2014 what 60 of you built",
      time: "Apr 24", date: "Apr 24",
      body: "Sixty members gave a Saturday to the spring service day, and the Harbor City community garden now has twelve raised beds, a tool shed, and a watering schedule with names on it.\n\nThank you \u2014 particularly the \u201908 crew who drove down from the valley with their own lumber, and the six students who stayed to finish the shed roof after the official end time.\n\nThe fall service day is being scoped now. If your team or company wants to co-host, reply to this from your member email."
    }
  ],

  // Newsletter. Issues newest-first; issue pages read by number.
  newsletter: {
    issues: [
      {
        n: 14, month: "May 2026", headline: "This month in the network",
        lines: ["Spring hiring \u2014 12 new alumni roles", "Three mentors to meet this month", "Reunion weekend \u2014 first details"],
        sections: [
          { h: "Spring hiring", body: "Twelve members added open roles to their profiles this week \u2014 a record for the circle. The spread is wide: brand and product design, two engineering teams, and a pair of early operations seats at companies you\u2019d recognize from earlier issues.\n\nEvery role here comes with a person, and that\u2019s the point \u2014 before you apply anywhere, someone will tell you what the team is actually like.", link: { label: "Browse who\u2019s hiring in People \u2192", href: "../people/People.dc.html" } },
          { h: "Three mentors to meet", body: "The spring mentorship cohort opens Friday, and three of the twenty mentors are new to the program: a founder who sold her company last year and wants to talk about the parts that weren\u2019t fun, a design director who reviews portfolios for a living, and an engineer who switched to product management twice \u2014 once on purpose.\n\nThree sentences about where you\u2019re stuck is all it takes to be matched." },
          { h: "Reunion weekend \u2014 first details", body: "October 17\u201319, on campus. Class dinners Saturday, tours and the faculty coffee through the weekend, brunch on the lawn Sunday. The full schedule lands in September; the RSVP is open now on the School page.", link: { label: "Read the announcement \u2192", href: "./AnnouncementRead.dc.html?id=reunion-dates" } }
        ]
      },
      {
        n: 13, month: "April 2026", headline: "A season of switches",
        lines: ["Four members changed tracks this spring", "The service day, by the numbers", "New: the alumni reading room"],
        sections: [
          { h: "Four members changed tracks", body: "Agency to in-house, engineering to product, big company to a two-person team, and one very brave leap into freelancing. Four members made the switch this spring, and three of them found their landing spot through an ask on the Help page.\n\nIf you\u2019re weighing a move of your own, the people who just made one are the best maps \u2014 and they\u2019re easy to find." },
          { h: "Service day, by the numbers", body: "Sixty members, twelve raised beds, one tool shed, zero injuries. The Harbor City community garden is planted, and the fall service day is already being scoped." }
        ]
      },
      {
        n: 12, month: "March 2026", headline: "New faces, first asks",
        lines: ["38 new members joined this term", "What the first hundred asks were about", "The mixer returns in May"],
        sections: [
          { h: "38 new members", body: "The spring intake brought thirty-eight new members \u2014 the biggest single term yet, and the first with more current students than alumni. If you see a profile with a fresh-ink class year, say hello; the first week is when a welcome matters most." },
          { h: "The first hundred asks", body: "The Help page crossed one hundred asks this month. The topics, roughly in order: career switches, portfolio and resume reads, intro requests, moving cities, and \u2014 a distant but persistent fifth \u2014 whether a coding bootcamp is worth it. The answers are private; the pattern is nice to know." }
        ]
      },
      {
        n: 11, month: "February 2026", headline: "The circle warms up",
        lines: ["Help finds its footing", "Two founders, one dinner idea", "Office hours that stuck"],
        sections: [
          { h: "Help finds its footing", body: "Three months in, the pattern is set: asks go out quietly, offers come back kindly, and nobody keeps score. The average ask gets its first offer inside two days." },
          { h: "A dinner idea", body: "Two founders in the circle floated the same idea in the same week: one long table, the stories behind alumni companies, no slides. It\u2019s being planned for May \u2014 watch the School page." }
        ]
      }
    ]
  }
};
