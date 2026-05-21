/* eslint-disable */
// Fake but plausible data for the BridgeCircle Civic prototype.
// Names/orgs are invented; the structure mirrors what's in app/(member)/.

const ORG = {
  name: 'The Hartwood Society',
  shortName: 'Hartwood',
  motto: 'A members-first circle for the Class of 2003 onward.',
};

const VIEWER = {
  id: 'maren-vasilakis',
  name: 'Maren Vasilakis',
  firstName: 'Maren',
  initials: 'MV',
  year: 2014,
  cohortShort: "’14",
  title: 'VP of Product',
  employer: 'Topfield',
  city: 'Brooklyn, NY',
  helper: { advice: true, mentorship: true },
};

const MEMBERS = [
  {
    id: 'iris-okonkwo', name: 'Iris Okonkwo', year: 2019, initials: 'IO',
    title: 'Founder', employer: 'The Long Take Co.', city: 'Brooklyn, NY',
    open: 'mentor', tags: ['Documentary', 'Fundraising', 'Storytelling'],
    bio: 'Building a small documentary studio focused on overlooked civic life. Looking to talk with anyone who has navigated investor pitches for art-leaning work.',
    joined: '3d',
    career: [
      { from: 2023, to: null,  role: 'Founder & Director',  org: 'The Long Take Co.',  city: 'Brooklyn, NY', summary: 'Documentary studio focused on overlooked civic life. Two shorts on the festival circuit; first feature in pre-production.' },
      { from: 2020, to: 2023,  role: 'Senior Producer',     org: 'Field Notes Media',  city: 'Brooklyn, NY', summary: 'Led a four-person team producing public-radio companion videos for WNYC and KQED.' },
      { from: 2017, to: 2020,  role: 'Associate Producer',  org: 'Public Counsel',     city: 'New York, NY', summary: 'Mini-docs for civil-rights nonprofits. Two pieces archived at the Smithsonian.' },
      { from: 2015, to: 2017,  role: 'Production Assistant',org: 'Lagos Documentary Forum', city: 'Lagos, Nigeria', summary: 'First job — coordinated festival programming and traveling press.' },
    ],
    education: [
      { from: 2017, to: 2019, degree: 'M.F.A., Documentary Practice', school: 'Hartwood College',          city: 'New York, NY', honors: 'Class of ’19 · DPF Fellow' },
      { from: 2011, to: 2015, degree: 'B.A., English Literature',     school: 'University of Lagos',       city: 'Lagos, Nigeria', honors: 'First-class honours' },
    ],
    interests: ['Documentary as public memory', 'Long-form video on the open web', 'Federal arts funding policy', 'Trans-Atlantic Black diaspora archives'],
    hobbies:   ['Cooking jollof', 'Open-water swimming', 'Letterpress printing', 'Polaroid portraits'],
    languages: ['English', 'Igbo (conversational)', 'Yoruba (reading)'],
  },
  {
    id: 'dev-ramachandran', name: 'Dev Ramachandran', year: 2009, initials: 'DR',
    title: 'Director, Engineering', employer: 'Brevity', city: 'Oakland, CA',
    open: 'advice', tags: ['Eng leadership', 'Hiring', 'Career'],
    bio: 'Engineering lead. Happy to talk hiring loops, performance reviews, and the first 90 days of a director role.',
    joined: '5d',
  },
  {
    id: 'priya-sastry', name: 'Priya Sastry', year: 2016, initials: 'PS',
    title: 'Senior Designer', employer: 'Field & Co.', city: 'London, UK',
    open: 'advice', tags: ['Design systems', 'Hiring'],
    bio: 'Design systems lead at Field. Mentor for early-career designers; can talk portfolio reviews on weekends.',
    joined: '1w',
  },
  {
    id: 'sam-aldridge', name: 'Sam Aldridge', year: 2011, initials: 'SA',
    title: 'Attorney', employer: 'Hartwood Legal Clinic', city: 'Chicago, IL',
    open: 'mentor', tags: ['Pro bono', 'Nonprofit'],
    bio: 'Pro bono coordinator. Always looking for alumni who want to help with small-business legal clinics.',
    joined: '1w',
  },
  {
    id: 'lena-park', name: 'Lena Park', year: 2018, initials: 'LP',
    title: 'PM', employer: 'Currents', city: 'Brooklyn, NY',
    open: 'mentee', tags: ['Career switch'],
    bio: 'PM at Currents. Considering a switch into AI policy work; would love to talk to anyone in the space.',
    joined: '2w',
  },
  {
    id: 'matty-osei', name: 'Matty Osei', year: 2007, initials: 'MO',
    title: 'Investor', employer: 'Common Capital', city: 'New York, NY',
    open: 'advice', tags: ['Fundraising', 'Seed', 'Climate'],
    bio: 'Seed investor focused on climate adaptation. Office hours on Thursdays for Hartwood folks.',
    joined: '3w',
  },
];

const PENDING_REQUESTS = [
  {
    id: 'req-01',
    from: MEMBERS[4], // Lena
    sentAt: '2 days ago',
    body: 'I’m thinking about leaving Currents for an AI-policy nonprofit and I’d love to hear how you thought through your jump from product to policy. 30 min?',
    type: 'mentorship',
  },
  {
    id: 'req-02',
    from: MEMBERS[0], // Iris
    sentAt: '3 days ago',
    body: 'Working on our seed deck. Could I get 20 minutes to walk you through it for a gut check? Heard you’ve done this with two other Hartwood founders.',
    type: 'mentorship',
  },
  {
    id: 'req-03',
    from: { ...MEMBERS[5], name: 'Matty Osei', initials: 'MO' },
    sentAt: '5 days ago',
    body: 'Want to compare notes on climate seed deals before our office hours next week? You mentioned a couple in the founders’ chat.',
    type: 'advice',
  },
];

const FRIEND_REQUESTS = [
  { id: 'fr-01', from: MEMBERS[1], sentAt: '1 day ago' },
  { id: 'fr-02', from: MEMBERS[3], sentAt: '4 days ago' },
];

const EVENTS = [
  {
    id: 'evt-01',
    title: 'Spring Supper at Hartwood',
    when: 'Tue · May 20, 2026 · 7:00 PM',
    where: 'The Hartwood House, Brooklyn',
    going: 38, capacity: 60,
    host: 'Maren Vasilakis · ’14',
    days: 6,
    blurb: 'Long-table supper for any Hartwood member in NYC. Bring one person you’d like to introduce to the circle.',
  },
  {
    id: 'evt-02',
    title: 'Mentor Office Hours · June',
    when: 'Thu · Jun 5, 2026 · 12:00 PM',
    where: 'Online (Zoom)',
    going: 12, capacity: 25,
    host: 'Dev Ramachandran · ’09',
    days: 22,
    blurb: 'Rolling 15-min slots with five mentors across engineering, design, and policy. Sign up for a slot in advance.',
  },
  {
    id: 'evt-03',
    title: 'London Walk · Regent’s Park',
    when: 'Sun · Jun 14, 2026 · 11:00 AM',
    where: 'Hanover Gate, London',
    going: 7, capacity: 20,
    host: 'Priya Sastry · ’16',
    days: 31,
    blurb: 'A quiet Sunday walk for Hartwood members in London. Coffee at the Boating Lake café after.',
  },
  // Past events — days < 0
  {
    id: 'evt-past-01',
    title: 'Winter Dinner · Hartwood House',
    when: 'Sat · Feb 8, 2026 · 7:00 PM',
    where: 'The Hartwood House, Brooklyn',
    going: 44, capacity: 50,
    host: "Sam Aldridge · '11",
    days: -100,
    blurb: 'The winter long-table. Forty-four members gathered in the depths of February — conversation ran well past midnight.',
  },
  {
    id: 'evt-past-02',
    title: 'Design Systems Office Hours',
    when: 'Thu · Mar 12, 2026 · 12:00 PM',
    where: 'Online (Zoom)',
    going: 18, capacity: 25,
    host: "Priya Sastry · '16",
    days: -68,
    blurb: 'Three 20-min slots on design tokens, component libraries, and handoff workflows. Recording in the member archive.',
  },
];

// Rich detail keyed by event id. Only events with detail pages need an entry;
// the events screen falls back to the base EVENT row if no detail exists.
const EVENT_DETAILS = {
  'evt-01': {
    tagline: 'A long-table supper, in the Hartwood tradition.',
    about: [
      'Eight times a year, twelve Hartwood members sit down for a long-table supper at the House in Brooklyn. The tradition started in 2014 — a way for new arrivals to meet older alumni without the awkwardness of a name-tagged mixer.',
      'Spring Supper is the one we open up to plus-ones. Bring someone you’d like to introduce to the circle — a colleague, a partner, a friend who might one day be a member.',
    ],
    agenda: [
      { time: '7:00 PM', title: 'Arrival & welcome drinks', sub: 'In the front room — wine, seltzer, and a pause to settle in.' },
      { time: '7:30 PM', title: 'Seating',                   sub: 'You’ll find your name on the long table. Plus-ones sit beside you.' },
      { time: '8:00 PM', title: 'First & second courses',    sub: 'Family-style. Vegetarian on the table by default; meat opt-in.' },
      { time: '9:30 PM', title: 'A round of reflections',    sub: 'Two minutes each, going round the table. What’s on your mind this season.' },
      { time: '10:30 PM', title: 'Coffee & a walk home',     sub: 'Optional. Hartwood House closes at 11.' },
    ],
    location: {
      name: 'The Hartwood House',
      street: '247 Smith Street',
      cityZip: 'Brooklyn, NY 11231',
      transit: 'F/G to Carroll St · 4-min walk',
      mapHint: 'Side entrance, second door — buzzer marked “HRTWD”.',
    },
    hosts: [
      { id: 'maren-vasilakis', name: 'Maren Vasilakis', initials: 'MV', role: 'Host · Class of ’14' },
      { id: 'sam-aldridge',    name: 'Sam Aldridge',    initials: 'SA', role: 'Co-host · Class of ’11' },
    ],
    practical: [
      { label: 'Cost',          value: '$40 sliding scale',  sub: 'Pay-what-you-can — anything you can spare goes to the next supper.' },
      { label: 'Dress',         value: 'Casual smart',       sub: 'Wear what you’d wear to dinner at a friend’s house.' },
      { label: 'Diet',          value: 'Vegetarian default', sub: 'Meat option on RSVP. Tell us about allergies in the notes.' },
      { label: 'Accessibility', value: 'Step-free entry',    sub: 'Side entrance is step-free; main bathroom is on the ground floor.' },
      { label: 'Plus-ones',     value: 'One guest each',     sub: 'Bring someone you’d like to introduce to the circle.' },
    ],
    attendees: [
      'iris-okonkwo', 'dev-ramachandran', 'priya-sastry', 'sam-aldridge',
      'lena-park', 'matty-osei', 'iris-okonkwo', 'dev-ramachandran',
    ],
    comments: [
      { from: 'iris-okonkwo',    at: 'Mon · 3:14 PM', body: 'Bringing my partner — she just moved from Lagos and would love to meet folks in the circle.' },
      { from: 'dev-ramachandran', at: 'Sun · 9:01 AM', body: 'I’ll be 10 min late from a team thing. Save me a seat near the window if you can.' },
      { from: 'priya-sastry',    at: 'Sat · 6:42 PM', body: 'Flying in from London on the same day — fingers crossed for an on-time landing. Excited.' },
    ],
    related: ['evt-02', 'evt-03'],
  },


  'evt-past-01': {
    tagline: 'The Hartwood winter tradition since 2016.',
    about: [
      'Forty-four members filled the long-table in February for the annual winter dinner. A particularly good vintage — the conversation ran well past midnight.',
      'Photos and a short recap are in the member archive. If you attended and want to add a note, the discussion is still open.',
    ],
    agenda: [
      { time: '7:00 PM', title: 'Arrival & welcome drinks', sub: 'Front room, wine and seltzer.' },
      { time: '7:30 PM', title: 'Seating & first course', sub: 'Family-style, vegetarian default.' },
      { time: '9:00 PM', title: 'Reflections round', sub: 'Two minutes each going round the table.' },
      { time: '10:30 PM', title: 'Coffee & close', sub: 'Optional walk home together.' },
    ],
    location: {
      name: 'The Hartwood House',
      street: '247 Smith Street',
      cityZip: 'Brooklyn, NY 11231',
      transit: 'F/G to Carroll St · 4-min walk',
      mapHint: 'Side entrance, second door — buzzer marked "HRTWD".',
    },
    practical: [],
    attendees: ['iris-okonkwo', 'dev-ramachandran', 'priya-sastry', 'sam-aldridge', 'lena-park', 'matty-osei'],
    comments: [
      { from: 'dev-ramachandran', at: 'Feb 9 · 9:14 AM', body: 'The soup course might have been the best thing I ate all winter. Already looking forward to spring.' },
      { from: 'sam-aldridge', at: 'Feb 9 · 10:01 AM', body: 'Thanks everyone for coming. Photos are going up in the member archive this week.' },
    ],
    hosts: [
      { id: 'sam-aldridge', name: 'Sam Aldridge', initials: 'SA', role: "Host · Class of '11" },
    ],
    related: ['evt-01', 'evt-02'],
  },
  'evt-past-02': {
    tagline: 'Three focused 20-min slots on DS craft.',
    about: [
      'Eighteen members joined for an hour on design systems. Topics ranged from token architecture to handoff documentation and what to actually version in a component library.',
    ],
    agenda: [
      { time: '12:00 PM', title: 'Token naming conventions', sub: 'Priya walks through the Field & Co. system.' },
      { time: '12:20 PM', title: 'Component versioning', sub: 'When to break, when to deprecate.' },
      { time: '12:40 PM', title: 'Handoff & documentation', sub: 'Open Q&A.' },
    ],
    location: null,
    practical: [],
    attendees: ['iris-okonkwo', 'priya-sastry', 'lena-park', 'dev-ramachandran'],
    comments: [
      { from: 'lena-park', at: 'Mar 12 · 2:20 PM', body: 'The session on token naming was exactly what I needed. Sharing with my team tomorrow.' },
      { from: 'priya-sastry', at: 'Mar 13 · 9:00 AM', body: 'Recording is now in the archive — link in the Slack channel.' },
    ],
    hosts: [
      { id: 'priya-sastry', name: 'Priya Sastry', initials: 'PS', role: "Host · Class of '16" },
    ],
    related: ['evt-02', 'evt-03'],
  },
};

const ACTIVITY = [
  { who: 'Iris Okonkwo', what: 'requested mentorship', when: '3h', type: 'ask' },
  { who: 'Dev Ramachandran', what: 'sent a friend request', when: '1d', type: 'friend' },
  { who: 'Priya Sastry', what: 'posted in #design-leads', when: '1d', type: 'post' },
  { who: 'Sam Aldridge', what: 'accepted your intro', when: '2d', type: 'intro' },
  { who: 'Spring Supper', what: 'is six days away', when: '2d', type: 'event' },
  { who: 'Lena Park', what: 'sent a message', when: '4d', type: 'msg' },
];

// Accepted threads — the "after a yes" state. A thread is what you open
// after a mentorship request gets accepted, or after a direct message.
// Maren ↔ Iris is the canonical example: a few messages in, scheduling
// a 30-min call about Iris's seed deck.
const THREADS = [
  {
    id: 'thr-iris-maren',
    title: 'Seed deck gut-check',
    withMember: 'iris-okonkwo',
    state: 'active',
    startedAt: 'May 9, 2026',
    next: { when: 'Thu · May 22 · 4:00 PM', kind: 'Zoom · 30 min' },
    summary: 'Walking through The Long Take Co.’s pitch deck — slides 1–6 reviewed, plan to close 7–12 next week.',
    messages: [
      { from: 'iris-okonkwo', at: 'Mon · 11:14 AM', body: 'Thanks for picking this up so quickly. I’m sending the deck now — would love your eyes especially on the “why now” slide.' },
      { from: 'iris-okonkwo', at: 'Mon · 11:14 AM', body: 'Attached: Long Take Co. — seed v3.pdf', kind: 'file' },
      { from: 'maren-vasilakis', at: 'Mon · 12:02 PM', body: 'Got it. I’ll mark it up tonight. One thing already — the team slide is buried at p.18; investors I trust want to see it by p.5.' },
      { from: 'iris-okonkwo', at: 'Mon · 12:04 PM', body: 'Oh that’s good. We can move it. Anything else you saw right away?' },
      { from: 'maren-vasilakis', at: 'Mon · 12:30 PM', body: 'Yes — the 5-year revenue projection in the warm-storytelling space reads optimistic. I’d either soften it or add the comp benchmarks underneath. We can talk through it Thursday.' },
      { from: 'maren-vasilakis', at: 'Tue · 9:11 AM', body: 'Sent a calendar hold for Thursday 4pm. 30 min for now, can extend if we’re close.' },
      { from: 'iris-okonkwo', at: 'Tue · 9:18 AM', body: 'Confirmed. Excited.' },
    ],
  },
  {
    id: 'thr-dev-maren',
    title: 'Director-level hiring loops',
    withMember: 'dev-ramachandran',
    state: 'active',
    startedAt: 'May 2, 2026',
    next: null,
    summary: 'Dev is sharing his director-loop template; one async exchange so far.',
    messages: [
      { from: 'dev-ramachandran', at: 'Fri · 3:12 PM', body: 'Sending my director-level loop template — happy to walk through any of it on a quick call.' },
      { from: 'maren-vasilakis', at: 'Fri · 4:00 PM', body: 'Thanks. Reading now.' },
    ],
  },
];

const STATS = {
  newThisWeek: 12,
  openMentors: 148,
  upcomingEvents: 6,
};

const ADVICE_REQUESTS = [
  {
    id: 'adv-01',
    from: MEMBERS[2], // Priya Sastry
    sentAt: '1 day ago',
    body: "Quick one — what's your take on the right PM-to-eng ratio at Series A? We're debating internally and I trust your read on this.",
    type: 'advice',
  },
  {
    id: 'adv-02',
    from: MEMBERS[4], // Lena Park
    sentAt: '2 days ago',
    body: "Do you have a framing you'd recommend for a PM→policy resume narrative? Trying to make the pivot story land clearly on paper.",
    type: 'advice',
  },
];

const MY_ASKS = [
  {
    id: 'myask-01',
    to: MEMBERS[5], // Matty Osei
    sentAt: '3 days ago',
    body: "I'm curious how climate seed deals get structured for content-heavy companies — would love 20 minutes to hear how you think about it.",
    type: 'mentorship',
    status: 'pending',
  },
  {
    id: 'myask-02',
    to: MEMBERS[1], // Dev Ramachandran
    sentAt: '1 week ago',
    body: "How do you structure a performance conversation with a senior IC who's been underperforming for a full quarter?",
    type: 'advice',
    status: 'answered',
    reply: "Start facts-first — specific behaviors, not traits. Then a joint goal-setting session within the week. Happy to send the one-pager I use if helpful.",
    repliedAt: '5 days ago',
  },
  {
    id: 'myask-03',
    to: MEMBERS[2], // Priya Sastry
    sentAt: '2 weeks ago',
    body: "Who should I be talking to in London about design systems culture? Heading there in June and want to make the most of it.",
    type: 'advice',
    status: 'answered',
    reply: "Ping the Monzo Design team — they're the most thoughtful about DS culture I've encountered. Happy to make an intro if useful.",
    repliedAt: '12 days ago',
  },
  {
    id: 'myask-04',
    to: MEMBERS[3], // Sam Aldridge
    sentAt: '3 weeks ago',
    body: "Can you advise on a simple operating agreement for a two-person LLC? Helping a friend who can't yet afford counsel.",
    type: 'mentorship',
    status: 'accepted',
  },
];

const ANNOUNCEMENTS = [
  {
    id: 'ann-01',
    label: 'Spring Supper',
    title: 'Only 22 seats left — May 20th',
    body: "The long-table is nearly full. Bring a plus-one before it closes.",
    cta: 'View event',
    ctaRoute: 'events',
    tone: 'accent',
  },
  {
    id: 'ann-02',
    label: 'From the council',
    title: 'Verified intro pilot starts June 1st',
    body: "New requests will require a voucher from a mutual member. This should cut cold outreach in half.",
    cta: null,
    ctaRoute: null,
    tone: 'ink',
  },
  {
    id: 'ann-03',
    label: 'New members',
    title: '18 new members joined in May',
    body: "Including a cluster of eight from Lagos — one of the largest single-month cohorts in three years.",
    cta: 'See who joined',
    ctaRoute: 'people',
    tone: 'ok',
  },
];

const NOTIFICATIONS = [
  { id: 'notif-01', type: 'inbox',  text: 'Lena Park sent an advice request',             when: '2h',  read: false },
  { id: 'notif-02', type: 'event',  text: 'Spring Supper: 22 seats remain — you are hosting', when: '4h', read: false },
  { id: 'notif-03', type: 'thread', text: 'Iris replied in "Seed deck gut-check"',          when: '1d',  read: false },
  { id: 'notif-04', type: 'inbox',  text: 'Priya Sastry sent an advice request',            when: '1d',  read: true  },
  { id: 'notif-05', type: 'member', text: 'Dev Ramachandran accepted your connection',      when: '2d',  read: true  },
];

window.BC_DATA = { ORG, VIEWER, MEMBERS, PENDING_REQUESTS, FRIEND_REQUESTS, EVENTS, EVENT_DETAILS, ACTIVITY, STATS, THREADS, ADVICE_REQUESTS, MY_ASKS, ANNOUNCEMENTS, NOTIFICATIONS };
