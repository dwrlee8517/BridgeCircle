/* eslint-disable */
// Admin-only data — pending approvals, member directory rows, announcements,
// invitations log, analytics figures. Loaded alongside civic-data.jsx so
// admin screens can read both window.BC_DATA and window.BC_ADMIN.

const PENDING_APPROVALS = [
  {
    id: 'app-1041',
    name: 'Jordan Mwangi',
    initials: 'JM',
    cohort: 2017,
    appliedAt: '2 days ago',
    city: 'Nairobi, Kenya',
    title: 'Climate Policy Fellow',
    employer: 'East African Climate Lab',
    submittedNotes: 'I was admitted via the Hartwood Africa pilot in 2018 — would love to connect with Matty Osei and the climate folks.',
    verification: { status: 'matched', match: 'Hartwood Africa cohort, 2018-A · 1 record' },
    flag: null,
  },
  {
    id: 'app-1042',
    name: 'Ada Friedman',
    initials: 'AF',
    cohort: 2021,
    appliedAt: '3 days ago',
    city: 'Berlin, Germany',
    title: 'Senior Designer',
    employer: 'Linde',
    submittedNotes: 'Finished the Hartwood Design certificate last spring. Submitted my completion letter.',
    verification: { status: 'matched', match: 'Certificate program, 2024 spring · 1 record' },
    flag: null,
  },
  {
    id: 'app-1043',
    name: 'Theo Romero',
    initials: 'TR',
    cohort: 2008,
    appliedAt: '4 days ago',
    city: 'Mexico City, Mexico',
    title: 'Founder',
    employer: 'Patio Studios',
    submittedNotes: 'Class of 2008 — referred by Sam Aldridge.',
    verification: { status: 'partial', match: 'Cohort matched · referrer pending confirmation' },
    flag: null,
  },
  {
    id: 'app-1044',
    name: 'Ren Kobayashi',
    initials: 'RK',
    cohort: 2020,
    appliedAt: '5 days ago',
    city: 'Tokyo, Japan',
    title: 'PhD candidate',
    employer: 'Tokyo Institute of Technology',
    submittedNotes: '',
    verification: { status: 'unmatched', match: 'No Hartwood records match this name + cohort' },
    flag: 'duplicate-email',
  },
];

const ADMIN_MEMBERS = [
  { id: 'mem-001', name: 'Maren Vasilakis',  initials: 'MV', cohort: 2014, role: 'admin',  city: 'Brooklyn, NY',     joined: 'May 2020', lastSeen: '2h ago', status: 'active',  reports: 0 },
  { id: 'mem-002', name: 'Dev Ramachandran', initials: 'DR', cohort: 2009, role: 'admin',  city: 'Oakland, CA',      joined: 'Jun 2020', lastSeen: '1d',     status: 'active',  reports: 0 },
  { id: 'mem-003', name: 'Iris Okonkwo',     initials: 'IO', cohort: 2019, role: 'member', city: 'Brooklyn, NY',     joined: '3d ago',   lastSeen: '3h',     status: 'active',  reports: 0 },
  { id: 'mem-004', name: 'Priya Sastry',     initials: 'PS', cohort: 2016, role: 'member', city: 'London, UK',       joined: 'Mar 2022', lastSeen: '1d',     status: 'active',  reports: 0 },
  { id: 'mem-005', name: 'Sam Aldridge',     initials: 'SA', cohort: 2011, role: 'member', city: 'Chicago, IL',      joined: 'Aug 2021', lastSeen: '2d',     status: 'active',  reports: 0 },
  { id: 'mem-006', name: 'Lena Park',        initials: 'LP', cohort: 2018, role: 'member', city: 'Brooklyn, NY',     joined: 'Sep 2023', lastSeen: '4d',     status: 'active',  reports: 0 },
  { id: 'mem-007', name: 'Matty Osei',       initials: 'MO', cohort: 2007, role: 'member', city: 'New York, NY',     joined: 'Nov 2022', lastSeen: '5d',     status: 'active',  reports: 1 },
  { id: 'mem-008', name: 'Ari Vasquez',      initials: 'AV', cohort: 2013, role: 'member', city: 'Austin, TX',       joined: 'Feb 2021', lastSeen: '14d',    status: 'paused',  reports: 0 },
  { id: 'mem-009', name: 'Klaus Reiter',     initials: 'KR', cohort: 2005, role: 'member', city: 'Munich, Germany',  joined: 'Jan 2021', lastSeen: '21d',    status: 'paused',  reports: 0 },
  { id: 'mem-010', name: 'Mira Chen',        initials: 'MC', cohort: 2019, role: 'member', city: 'Toronto, Canada',  joined: 'Apr 2023', lastSeen: '30d+',   status: 'suspended', reports: 2 },
];

const INVITES = [
  { id: 'inv-201', email: 'hannah.j@unknown.org', cohort: 2015, sentBy: 'Maren Vasilakis', sentAt: '1 day ago',  status: 'pending' },
  { id: 'inv-202', email: 'p.kapur@unknown.org',   cohort: 2018, sentBy: 'Maren Vasilakis', sentAt: '3 days ago', status: 'accepted' },
  { id: 'inv-203', email: 'l.malik@unknown.org',   cohort: 2010, sentBy: 'Dev Ramachandran', sentAt: '4 days ago', status: 'pending' },
  { id: 'inv-204', email: 'n.berg@unknown.org',    cohort: 2009, sentBy: 'Maren Vasilakis', sentAt: '1 week ago', status: 'expired' },
];

const ANNOUNCEMENTS = [
  {
    id: 'ann-301', title: 'Spring Supper RSVPs open',
    body: 'RSVPs for the May 20 Spring Supper at Hartwood House are now open. We have 60 seats. Member only; bring one plus-one.',
    publishedAt: '2 days ago', by: 'Maren Vasilakis', status: 'published', reach: '148 / 152 active',
  },
  {
    id: 'ann-302', title: 'Helper-mode opt-in reminder',
    body: 'A friendly nudge: review your helper preferences. The new "Open to advice / not now" model is live.',
    publishedAt: '1 week ago', by: 'Dev Ramachandran', status: 'published', reach: '147 / 152 active',
  },
  {
    id: 'ann-303', title: 'Annual report — draft for review',
    body: 'Internal draft for the 2025-2026 annual report. Looking for two co-readers before we publish to the wider circle.',
    publishedAt: '—', by: 'Maren Vasilakis', status: 'draft', reach: 'Draft · admins only',
  },
];

// Analytics — numbers + a tiny 12-week trend sparkline as integers
const ANALYTICS = {
  totals: {
    activeMembers: 148,
    newThisMonth: 12,
    askVolume30d: 27,
    eventsHosted30d: 4,
  },
  newMembersByWeek: [3, 1, 4, 2, 5, 2, 3, 6, 4, 7, 5, 6], // 12 weeks
  askVolumeByWeek:  [3, 2, 4, 5, 3, 6, 4, 5, 7, 5, 6, 8],
  cohortMix: [
    { label: "'03–'08", count: 18 },
    { label: "'09–'13", count: 27 },
    { label: "'14–'17", count: 41 },
    { label: "'18–'20", count: 38 },
    { label: "'21–'25", count: 24 },
  ],
  helperRatio: {
    openToMentor: 64,
    openToAdvice: 92,
    openToIntros: 71,
    notNow: 28, // remainder
  },
  topCities: [
    { city: 'Brooklyn, NY',     count: 24 },
    { city: 'San Francisco, CA', count: 18 },
    { city: 'London, UK',        count: 14 },
    { city: 'Chicago, IL',       count: 9 },
    { city: 'Berlin, Germany',   count: 7 },
  ],
  recentReports: [
    { id: 'rpt-01', who: 'Mira Chen',    what: 'spammy DM pattern',                 when: '2d', status: 'open' },
    { id: 'rpt-02', who: 'Matty Osei',   what: 'unverified job posting',            when: '5d', status: 'reviewing' },
    { id: 'rpt-03', who: 'Mira Chen',    what: 'reposted an external recruiter ad', when: '6d', status: 'open' },
  ],
};

const ADMIN_ACTIVITY = [
  { who: 'Maren Vasilakis',  what: 'approved Jordan Mwangi · auto-matched', when: '1h', type: 'approve' },
  { who: 'Dev Ramachandran', what: 'paused Ari Vasquez (helper opt-out)',  when: '3h', type: 'pause' },
  { who: 'Maren Vasilakis',  what: 'sent 6 invites · cohort ’15',          when: '1d', type: 'invite' },
  { who: 'Sam Aldridge',     what: 'published Spring Supper announcement', when: '2d', type: 'announce' },
  { who: 'Maren Vasilakis',  what: 'suspended Mira Chen · 2 reports',      when: '4d', type: 'suspend' },
];

const ADMIN_VIEWER = {
  id: 'maren-vasilakis',
  name: 'Maren Vasilakis',
  firstName: 'Maren',
  initials: 'MV',
  role: 'Super admin',
  cohortShort: "’14",
};

window.BC_ADMIN = {
  PENDING_APPROVALS,
  ADMIN_MEMBERS,
  INVITES,
  ANNOUNCEMENTS,
  ANALYTICS,
  ADMIN_ACTIVITY,
  ADMIN_VIEWER,
};
