// Shared sample data for all four theme artboards.
// Each theme renders the SAME content through its own design language —
// hero + ask field + three "people who can help" cards.

const SHOWCASE_PEOPLE = [
  {
    id: 'p1', name: 'Jamie Kim', initials: 'JK',
    role: 'Product Manager · Stripe',
    cohort: "Cornell '20 · Brooklyn, NY",
    bio: 'Spent five years in consulting before pivoting to PM. Can speak directly to the path you\'re asking about.',
    topics: ['Career transitions', 'Product', 'APM prep'],
    helped: 18, replyRate: 96, fit: 94,
    color: '#7a9eb8',  // muted slate for avatar fallback
  },
  {
    id: 'p2', name: 'Maya Reyes', initials: 'MR',
    role: 'Founder & CEO · Kinetic Health',
    cohort: "Cornell '19 · New York, NY",
    bio: 'Founded a health-tech startup after McKinsey. Knows the consulting-to-founder leap firsthand.',
    topics: ['Founders', 'Health tech', 'Fundraising'],
    helped: 11, replyRate: 90, fit: 88,
    color: '#c89970',
  },
  {
    id: 'p3', name: 'Alex Wong', initials: 'AW',
    role: 'Principal · Andreessen Horowitz',
    cohort: "Cornell '17 · San Francisco, CA",
    bio: 'Deep VC experience after a consulting background. Uniquely positioned for the pivot question.',
    topics: ['VC', 'Startups', 'Fundraising'],
    helped: 24, replyRate: 88, fit: 82,
    color: '#8e7ab8',
  },
];

const SHOWCASE_ASK = "Looking for advice on moving from consulting into product management";

// Reusable avatar primitive — color tone varies per theme so this just paints
// a flat colored square/circle with initials. Themes wrap it in their own ring.
function ShowcaseAvatar({ person, size = 48, radius = 999, font = "'Inter', sans-serif" }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: person.color, color: '#fff',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: font, fontWeight: 600, fontSize: size * 0.36,
      flexShrink: 0, letterSpacing: '0.01em',
    }}>{person.initials}</div>
  );
}

window.SHOWCASE_PEOPLE = SHOWCASE_PEOPLE;
window.SHOWCASE_ASK = SHOWCASE_ASK;
window.ShowcaseAvatar = ShowcaseAvatar;
