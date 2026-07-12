// Profile data for BridgeCircle templates — person lookup for Profile.dc.html (?id=N).
// Mirrors the directory in ../people/People.dc.html.
// Loaded as a plain script from the page <head>; exposes window.BCProfileData.

const people = [
  { id: 1,  i: 'MC', n: 'Maya Chen',     role: 'Design Lead',            co: 'Figma',       loc: 'San Francisco', yr: '14', st: 'circle',    since: 2021, topics: ['Agency \u2192 in-house', 'Design interviews', 'Leadership'] },
  { id: 2,  i: 'JB', n: 'Jordan Blake',  role: 'Design Manager',         co: 'Airbnb',      loc: 'New York',      yr: '12', st: 'open',      since: 2019, topics: ['Hiring', 'Portfolio reviews', 'In-house design'] },
  { id: 3,  i: 'PN', n: 'Priya Nair',    role: 'PM',                     co: 'Notion',      loc: 'Remote',        yr: '17', st: 'requested', since: 2022, topics: ['Design \u2192 PM', 'Product sense'] },
  { id: 4,  i: 'SO', n: 'Sam Okafor',    role: 'Brand Designer',         co: 'Stripe',      loc: 'San Francisco', yr: '16', st: 'open',      since: 2022, topics: ['Brand systems', 'Agency \u2192 in-house'] },
  { id: 5,  i: 'ER', n: 'Elena Ruiz',    role: 'Staff Product Designer', co: 'Google',      loc: 'Mountain View', yr: '11', st: 'none',      since: 2018, topics: ['Design systems', 'Mentoring'] },
  { id: 6,  i: 'TH', n: 'Tom Hale',      role: 'Design Director',        co: 'IDEO',        loc: 'San Francisco', yr: '08', st: 'circle',    since: 2015, topics: ['Agency life', 'Creative leadership'] },
  { id: 7,  i: 'AB', n: 'Aisha Bello',   role: 'UX Researcher',          co: 'Meta',        loc: 'Seattle',       yr: '18', st: 'open',      since: 2021, topics: ['Research ops', 'Interviewing'] },
  { id: 8,  i: 'DK', n: 'Dan Kim',       role: 'Product Designer',       co: 'Toss',        loc: 'Seoul',         yr: '19', st: 'open',      since: 2023, topics: ['Fintech design', 'Relocating abroad'] },
  { id: 9,  i: 'GL', n: 'Grace Liu',     role: 'Design Ops Lead',        co: 'Shopify',     loc: 'Toronto',       yr: '13', st: 'none',      since: 2020, topics: ['Design ops', 'Scaling teams'] },
  { id: 10, i: 'MW', n: 'Marcus Webb',   role: 'Freelance Designer',     co: 'Independent', loc: 'Austin',        yr: '15', st: 'open',      since: 2019, topics: ['Freelancing', 'Client work'] },
  { id: 11, i: 'NP', n: 'Nina Petrova',  role: 'VP Design',              co: 'Ramp',        loc: 'New York',      yr: '07', st: 'circle',    since: 2021, topics: ['Executive path', 'Org design'] },
  { id: 12, i: 'OH', n: 'Omar Haddad',   role: 'Design Engineer',        co: 'Vercel',      loc: 'Remote',        yr: '20', st: 'none',      since: 2023, topics: ['Design engineering', 'Portfolio sites'] },
  { id: 13, i: 'SM', n: 'Sofia Marino',  role: 'Content Designer',       co: 'Slack',       loc: 'Denver',        yr: '16', st: 'open',      since: 2021, topics: ['Content design', 'Career switch'] },
  { id: 14, i: 'KT', n: 'Ken Tanaka',    role: 'Motion Designer',        co: 'Apple',       loc: 'Cupertino',     yr: '14', st: 'none',      since: 2020, topics: ['Motion', 'Prototyping'] },
  { id: 15, i: 'LF', n: 'Lauren Fox',    role: 'Marketing Lead',         co: 'Canva',       loc: 'Sydney',        yr: '13', st: 'open',      since: 2019, topics: ['Brand marketing', 'Positioning'] },
  { id: 16, i: 'DS', n: 'Diego Santos',  role: 'Founder',                co: 'Plum Studio', loc: 'Lisbon',        yr: '10', st: 'circle',    since: 2017, topics: ['Starting a studio', 'Pricing'] },
  { id: 17, i: 'HY', n: 'Hana Yoon',     role: 'Product Designer',       co: 'Linear',      loc: 'Remote',        yr: '21', st: 'open',      since: 2024, topics: ['First design job', 'Startups'] },
  { id: 18, i: 'BC', n: 'Ben Carter',    role: 'Data Scientist',         co: 'Duolingo',    loc: 'Pittsburgh',    yr: '18', st: 'none',      since: 2022, topics: ['Analytics', 'Experimentation'] },
  { id: 19, i: 'RA', n: 'Ruth Adler',    role: 'Design Recruiter',       co: 'Sequoia',     loc: 'San Francisco', yr: '09', st: 'open',      since: 2016, topics: ['Hiring market', 'Portfolios'] },
  { id: 20, i: 'LZ', n: 'Leo Zhang',     role: 'iOS Engineer',           co: 'Airbnb',      loc: 'San Francisco', yr: '17', st: 'none',      since: 2021, topics: ['Mobile', 'Swift'] },
  { id: 21, i: 'CD', n: 'Carmen Diaz',   role: 'Service Designer',       co: 'NHS Digital', loc: 'London',        yr: '12', st: 'open',      since: 2018, topics: ['Service design', 'Public sector'] },
  { id: 22, i: 'JW', n: 'Jonas Weber',   role: 'Creative Director',      co: 'Zalando',     loc: 'Berlin',        yr: '09', st: 'none',      since: 2019, topics: ['Brand', 'Agency \u2192 in-house'] },
  { id: 23, i: 'AO', n: 'Amara Osei',    role: 'PM',                     co: 'Figma',       loc: 'San Francisco', yr: '19', st: 'requested', since: 2023, topics: ['Platform PM', 'APIs'] },
  { id: 24, i: 'YS', n: 'Yuki Sato',     role: 'Illustrator',            co: 'Freelance',   loc: 'Tokyo',         yr: '15', st: 'open',      since: 2018, topics: ['Illustration', 'Licensing'] },
  { id: 25, i: 'RM', n: 'Rosa Marquez',  role: 'UX Writer',              co: 'Intercom',    loc: 'Dublin',        yr: '17', st: 'open',      since: 2022, topics: ['UX writing', 'Docs'] },
  { id: 26, i: 'TN', n: 'Theo Nguyen',   role: 'Product Designer',       co: 'Grab',        loc: 'Singapore',     yr: '18', st: 'none',      since: 2022, topics: ['Marketplace design', 'SEA tech'] },
  { id: 27, i: 'IK', n: 'Ingrid Koh',    role: 'Design Manager',         co: 'Spotify',     loc: 'Stockholm',     yr: '11', st: 'open',      since: 2019, topics: ['Management', 'Design crits'] },
  { id: 28, i: 'AF', n: 'Alex Fournier', role: 'Interaction Designer',   co: 'Ubisoft',     loc: 'Montreal',      yr: '16', st: 'none',      since: 2020, topics: ['Game UX', 'Prototyping'] },
  { id: 29, i: 'WB', n: 'Wes Barnes',    role: 'Design Systems Lead',    co: 'Atlassian',   loc: 'Remote',        yr: '13', st: 'open',      since: 2021, topics: ['Design tokens', 'Systems adoption'] },
  { id: 30, i: 'CN', n: 'Chloe Nakamura',role: 'Visual Designer',        co: 'Nintendo',    loc: 'Kyoto',         yr: '19', st: 'none',      since: 2023, topics: ['Visual craft', 'Working in Japan'] },
  { id: 31, i: 'RS', n: 'Raj Singh',     role: 'Principal Designer',     co: 'Adobe',       loc: 'San Jose',      yr: '09', st: 'open',      since: 2016, topics: ['Principal track', 'Craft reviews'] },
  { id: 32, i: 'EM', n: 'Emma M\u00fcller',   role: 'UX Researcher',          co: 'SAP',         loc: 'Berlin',        yr: '14', st: 'none',      since: 2019, topics: ['Enterprise research', 'Stakeholders'] },
  { id: 33, i: 'FA', n: 'Femi Adeyemi',  role: 'Product Designer',       co: 'Flutterwave', loc: 'Lagos',         yr: '20', st: 'open',      since: 2023, topics: ['Fintech in Africa', 'Remote work'] },
  { id: 34, i: 'LB', n: 'Lucie Bernard', role: 'Art Director',           co: 'Herm\u00e8s',      loc: 'Paris',         yr: '12', st: 'none',      since: 2018, topics: ['Luxury brand', 'Print'] },
  { id: 35, i: 'GK', n: 'Gus Kowalski',  role: 'Staff Designer',         co: 'Netflix',     loc: 'Los Angeles',   yr: '10', st: 'open',      since: 2019, topics: ['TV interfaces', 'Staff track'] },
  { id: 36, i: 'MJ', n: 'Mina Jang',     role: 'Product Designer',       co: 'Coupang',     loc: 'Seoul',         yr: '18', st: 'circle',    since: 2022, topics: ['E-commerce', 'Korea tech'] },
  { id: 37, i: 'OB', n: 'Owen Brady',    role: 'Brand Designer',         co: 'Independent', loc: 'Dublin',        yr: '15', st: 'open',      since: 2020, topics: ['Freelancing', 'Brand sprints'] },
  { id: 38, i: 'ZA', n: 'Zara Ahmed',    role: 'Design Lead',            co: 'Careem',      loc: 'Dubai',         yr: '13', st: 'open',      since: 2020, topics: ['Super apps', 'Leading remote teams'] },
  { id: 39, i: 'PL', n: 'Pedro Lima',    role: 'Motion Designer',        co: 'Nubank',      loc: 'S\u00e3o Paulo',     yr: '17', st: 'none',      since: 2021, topics: ['Motion systems', 'Fintech brand'] },
  { id: 40, i: 'KW', n: 'Kate Wilson',   role: 'Content Strategist',     co: 'Airtable',    loc: 'San Francisco', yr: '14', st: 'none',      since: 2021, topics: ['Content strategy', 'Information architecture'] },
  { id: 41, i: 'VH', n: 'Viktor Horvat', role: 'Design Engineer',        co: 'Framer',      loc: 'Amsterdam',     yr: '19', st: 'open',      since: 2022, topics: ['Design engineering', 'Interactive demos'] },
  { id: 42, i: 'SB', n: 'Sara Bianchi',  role: 'Service Designer',       co: 'Deloitte',    loc: 'Milan',         yr: '12', st: 'none',      since: 2017, topics: ['Consulting', 'Workshops'] },
  { id: 43, i: 'JP', n: 'Jae Park',      role: 'UX Designer',            co: 'Samsung',     loc: 'Seoul',         yr: '16', st: 'none',      since: 2020, topics: ['Hardware UX', 'Big-org navigation'] },
  { id: 44, i: 'NM', n: 'Nadia Mansour', role: 'Design Director',        co: 'Shopify',     loc: 'Ottawa',        yr: '08', st: 'open',      since: 2018, topics: ['Director path', 'Hiring seniors'] },
  { id: 45, i: 'CB', n: 'Cole Bennett',  role: 'Product Designer',       co: 'Robinhood',   loc: 'New York',      yr: '18', st: 'requested', since: 2022, topics: ['Trading UX', 'Data viz'] },
  { id: 46, i: 'AL', n: 'Anya Lebedeva', role: 'Illustrator',            co: 'Duolingo',    loc: 'Pittsburgh',    yr: '17', st: 'open',      since: 2021, topics: ['Brand illustration', 'Character design'] },
  { id: 47, i: 'HW', n: 'Harry Whitfield', role: 'Creative Director',    co: 'AKQA',        loc: 'London',        yr: '07', st: 'none',      since: 2014, topics: ['Agency leadership', 'Pitching'] },
  { id: 48, i: 'DM', n: 'Dana Moreau',   role: 'UX Lead',                co: 'Doctolib',    loc: 'Paris',         yr: '15', st: 'open',      since: 2021, topics: ['Health tech', 'Regulated UX'] },
  { id: 49, i: 'TS', n: 'Tara Shah',     role: 'Product Designer',       co: 'Canva',       loc: 'Sydney',        yr: '20', st: 'none',      since: 2023, topics: ['Templates', 'Growth design'] },
  { id: 50, i: 'MB', n: 'Miguel Barros', role: 'Design Ops',             co: 'Spotify',     loc: 'New York',      yr: '16', st: 'open',      since: 2021, topics: ['Design ops', 'Tooling'] },
];

const whyText = {
  1: 'Made the agency \u2192 in-house jump in 2018 and has reviewed 20+ portfolios for people making the same move.',
  4: 'Left BBDO for Stripe\u2019s brand team in 2022 \u2014 knows exactly what in-house brand hiring looks for.',
  2: 'Manages a 12-person in-house team at Airbnb and hires directly from agency backgrounds.',
  5: 'Went in-house at Google after seven agency years; mentors designers through the transition.',
  22: 'Moved from Sid Lee to Zalando to build the in-house creative org from scratch.',
  13: 'Switched from agency copywriting to content design at Slack in 2021.',
  11: 'Built Ramp\u2019s design org after a decade in agencies \u2014 hires ex-agency designers on purpose.',
  8: 'Went in-house at Toss after agency work in two countries; happy to talk fintech portfolios.',
  17: 'Landed an in-house startup role straight out of school; fresh read on the current market.',
  9: 'Runs design ops at Shopify and onboards ex-agency hires every quarter.',
  6: 'Directs at IDEO and has placed dozens of alumni into in-house teams.',
  14: 'Joined Apple\u2019s in-house motion team from a boutique studio.',
  19: 'Recruits designers for Sequoia portfolio companies \u2014 sees the in-house market weekly.',
  3: 'PM\u2019d Notion\u2019s design-tools area; interviewed in-house designers across three teams.',
};

const mutuals = {
  1: { t: '3 mutual connections', s: 'Jordan, Priya, and Tom' },
  2: { t: '2 mutual connections', s: 'Maya and Ruth' },
  4: { t: '1 mutual connection', s: 'Maya' },
  6: { t: '2 mutual connections', s: 'Maya and Nina' },
  11: { t: '2 mutual connections', s: 'Maya and Diego' },
  16: { t: '1 mutual connection', s: 'Nina' },
  19: { t: '1 mutual connection', s: 'Tom' },
  36: { t: '1 mutual connection', s: 'Dan' },
};

function sharedItems(p) {
  const items = [];
  if (mutuals[p.id]) items.push(mutuals[p.id]);
  if (p.id === 1) items.push({ t: 'Prof. Whitman\u2019s studio', s: 'RISD \u00b7 8 years apart' });
  if (p.loc === 'San Francisco') items.push({ t: 'San Francisco', s: 'You both live in the city' });
  const grad = 2000 + parseInt(p.yr, 10);
  if (grad >= 2020) items.push({ t: 'Overlapped at RISD', s: 'Class of \u2019' + p.yr + ' \u00b7 you\u2019re \u201922' });
  return items;
}

const details = {
  2: {
    about: 'Design manager who hires directly from agency backgrounds. Runs portfolio reviews for BridgeCircle members every other month.',
    career: [
      { t: 'Design Manager \u00b7 Airbnb', y: '2019 \u2014 now', d: 'Manages a 12-person team across Trips and guest experience. Hires 3\u20134 designers a year, often from agencies.' },
      { t: 'Senior Designer \u00b7 Huge', y: '2015 \u2014 2019', d: 'Led design on travel and e-commerce accounts; grew from mid-level IC to team lead.' },
      { t: 'Designer \u00b7 R/GA', y: '2012 \u2014 2015', d: 'Campaign and product work for sportswear and finance clients.' },
    ],
    edu: [{ t: 'RISD \u00b7 BFA Industrial Design', d: 'Minor in HCI.', y: '2008 \u2014 2012' }],
  },
  4: {
    about: 'Brand designer who made the agency \u2192 in-house move in 2022. Knows exactly what in-house brand hiring looks for.',
    career: [
      { t: 'Brand Designer \u00b7 Stripe', y: '2022 \u2014 now', d: 'Brand systems team \u2014 typography, illustration guidelines, and campaign toolkits used across 40+ product surfaces.' },
      { t: 'Art Director \u00b7 BBDO', y: '2018 \u2014 2022', d: 'Led visual identity work for consumer tech and CPG accounts; two Cannes shortlists.' },
      { t: 'Designer \u00b7 Pentagram', y: '2016 \u2014 2018', d: 'Identity systems under two partners.' },
    ],
    edu: [{ t: 'RISD \u00b7 BFA Graphic Design', d: 'Typography concentration.', y: '2012 \u2014 2016' }],
  },
  5: {
    about: 'Staff designer after seven agency years. Mentors designers through the agency \u2192 in-house transition.',
    career: [
      { t: 'Staff Product Designer \u00b7 Google', y: '2018 \u2014 now', d: 'Design systems lead for Workspace; drives cross-product component quality and mentors six designers.' },
      { t: 'Design Lead \u00b7 Instrument', y: '2013 \u2014 2018', d: 'Led interactive work on Google and Nike accounts \u2014 then moved to the client side.' },
      { t: 'Designer \u00b7 Odopod', y: '2011 \u2014 2013', d: 'Product and marketing sites for entertainment clients.' },
    ],
    edu: [{ t: 'RISD \u00b7 BFA Graphic Design', d: 'Exchange year at Brown (CS).', y: '2007 \u2014 2011' }],
  },
  13: {
    about: 'Switched from agency copywriting to content design in 2021 \u2014 happy to talk through the career-change playbook.',
    career: [
      { t: 'Content Designer \u00b7 Slack', y: '2021 \u2014 now', d: 'Owns product voice for onboarding and growth surfaces; partners with research on comprehension testing.' },
      { t: 'Copywriter \u00b7 Wieden+Kennedy', y: '2016 \u2014 2021', d: 'Brand campaigns for airline and sportswear clients before switching to product content.' },
    ],
    edu: [{ t: 'RISD \u00b7 BFA Illustration', d: 'Writing minor.', y: '2012 \u2014 2016' }],
  },
  22: {
    about: 'Creative director who left agency life to build an in-house org from zero. Strong opinions on when to make the move.',
    career: [
      { t: 'Creative Director \u00b7 Zalando', y: '2019 \u2014 now', d: 'Built the 25-person in-house creative org from scratch \u2014 brand, campaign, and motion under one roof.' },
      { t: 'Design Director \u00b7 Sid Lee', y: '2013 \u2014 2019', d: 'Ran the Berlin studio\u2019s design practice; global rebrands and launch campaigns.' },
      { t: 'Designer \u00b7 DDB Berlin', y: '2009 \u2014 2013', d: 'Integrated campaigns for automotive and telecom clients.' },
    ],
    edu: [{ t: 'RISD \u00b7 BFA Graphic Design', d: 'European Honors Program, Rome.', y: '2005 \u2014 2009' }],
  },
};

function fallbackDetail(p) {
  const grad = 2000 + parseInt(p.yr, 10);
  return {
    about: p.role + ' at ' + p.co + ', based in ' + p.loc + '. Happy to talk about ' + p.topics.map((t) => t.toLowerCase()).join(' and ') + '.',
    career: [{ t: p.role + ' \u00b7 ' + p.co, y: p.since + ' \u2014 now', d: 'Current role \u2014 ask about ' + (p.topics[0] || '').toLowerCase() + '.' }],
    edu: [{ t: 'RISD', d: 'Class of \u2019' + p.yr + '.', y: (grad - 4) + ' \u2014 ' + grad }],
  };
}

function getProfile(id) {
  const person = people.find((p) => p.id === id);
  if (!person) return null;
  const det = details[id] || fallbackDetail(person);
  const why = whyText[id] || ('Matches your search \u2014 ask about ' + person.topics.map((t) => t.toLowerCase()).join(' or ') + '.');
  return { person, det, why, shared: sharedItems(person) };
}

window.BCProfileData = { people, whyText, mutuals, sharedItems, getProfile };
