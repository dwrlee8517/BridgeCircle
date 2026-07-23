// Seed data for Messages.dc.html — exposes window.BCMessagesData.
// People mirror ../people/People.dc.html (ids, initials, avatar index = ((id-1)%5)+1).
// Self = Iris Lau '22.

window.BCMessagesData = {

  // Pinned "Waiting on you" group (FLOWS §5.1): pending direct asks + connect requests.
  waiting: [
    {
      kind: 'ask', id: 'w1', pid: 8, i: 'DK', av: 3, name: 'Dan Kim', yr: '19',
      role: 'Product Designer \u00b7 Toss \u00b7 Seoul', time: '2h',
      title: 'Portfolio for fintech roles',
      text: 'Hi Iris \u2014 I saw you moved from brand work into product at a fintech. I\u2019m putting a portfolio together for fintech product roles and I\u2019m not sure which two case studies to lead with. Could you take a look and tell me what reads strongest?',
      defaultReply: 'Happy to help with this, Dan. Send the portfolio over whenever it\u2019s ready \u2014 tell me the two roles you\u2019re aiming at and I\u2019ll read it with those in mind.',
      declineNote: 'Dan, I\u2019m at capacity this month and couldn\u2019t give this real attention. Jordan Blake reviews fintech portfolios often \u2014 I\u2019d start there.'
    },
    {
      kind: 'connect', id: 'w2', pid: 25, i: 'RM', av: 5, name: 'Rosa Marquez', yr: '17',
      role: 'UX Writer \u00b7 Intercom \u00b7 Dublin', time: '1d',
      note: 'Hi Iris \u2014 we were both in Prof. Whitman\u2019s studio, a few years apart. Would love to stay in touch.'
    }
  ],

  // Conversations, list order = priority (needs reply, active, history).
  // msg kinds: day | sys | them | me (read: true shows the receipt)
  convos: [
    {
      id: 'c1', pid: 1, i: 'MC', av: 1, name: 'Maya Chen', yr: '14', circle: true,
      role: 'Design Lead \u00b7 Figma \u00b7 San Francisco', presence: 'Active now',
      time: '1h', unread: 0, typing: true, openToHelp: true,
      ask: { title: 'Timing an in-house move', mine: true, daysLeft: 9, resolved: false },
      msgs: [
        { k: 'sys', t: 'Maya accepted your ask \u00b7 Jul 6' },
        { k: 'day', t: 'Today' },
        { k: 'them', t: 'Hey Iris \u2014 saw you\u2019re weighing the in-house move. Happy to talk it through.', tm: '9:12 AM' },
        { k: 'me', t: 'Yes please. Mostly trying to figure out timing \u2014 did you regret jumping when you did?', tm: '9:20 AM', read: true },
        { k: 'them', t: 'Not at all. The skills transfer \u2014 the game is just different. I wrote up some notes after my own move; sending them over.', tm: '9:24 AM' }
      ],
      files: [
        { icon: 'doc', n: 'portfolio-reframe-notes.pdf', m: 'Maya \u00b7 9:24 AM' },
        { icon: 'link', n: 'figma.com/@maya/case-studies', m: 'You \u00b7 9:31 AM' }
      ],
      photos: [
        { n: 'whiteboard-sketch.jpg', tag: 'IMG 01' },
        { n: 'timeline-draft.png', tag: 'IMG 02' },
        { n: 'offsite-crit.jpg', tag: 'IMG 03' }
      ]
    },
    {
      id: 'c2', pid: 4, i: 'SO', av: 4, name: 'Sam Okafor', yr: '16', circle: false,
      role: 'Brand Designer \u00b7 Stripe \u00b7 San Francisco', presence: 'Class of \u201916',
      time: '5h', unread: 2, nudge: true, openToHelp: true,
      ask: { title: 'Brand system for a two-person startup', mine: false, daysLeft: 11, resolved: false },
      msgs: [
        { k: 'sys', t: 'You offered to help with Sam\u2019s ask \u00b7 Jul 3' },
        { k: 'day', t: 'Tuesday' },
        { k: 'them', t: 'Thanks for offering, Iris. Short version: two founders, no design hires, and the brand has to stretch from pitch deck to product UI.', tm: '2:04 PM' },
        { k: 'me', t: 'A familiar squeeze. Start with type, color, and one layout rule \u2014 skip the logo debate for now.', tm: '2:31 PM', read: true },
        { k: 'day', t: 'Today' },
        { k: 'them', t: 'That helps. How do I keep it from drifting once engineers start building?', tm: '11:02 AM' },
        { k: 'them', t: 'Also \u2014 is a full brand book overkill at this stage?', tm: '11:04 AM' }
      ],
      files: []
    },
    {
      id: 'c3', pid: 17, i: 'HY', av: 2, name: 'Hana Yoon', yr: '21', circle: false,
      role: 'Product Designer \u00b7 Linear \u00b7 Remote', presence: 'Class of \u201921',
      time: '1d', unread: 1, openToHelp: true,
      ask: { title: 'First portfolio before applications', mine: false, daysLeft: 2, resolved: false },
      msgs: [
        { k: 'sys', t: 'You offered to help with Hana\u2019s ask \u00b7 Jun 28' },
        { k: 'day', t: 'Monday' },
        { k: 'them', t: 'Would you look over my first portfolio before I send applications out?', tm: '4:12 PM' },
        { k: 'me', t: 'Send it over \u2014 I\u2019ll go through it this week.', tm: '5:40 PM', read: true },
        { k: 'day', t: 'Yesterday' },
        { k: 'them', t: 'Just shared the link. Honest notes welcome \u2014 I\u2019d rather hear it from you than a recruiter.', tm: '10:18 AM' }
      ],
      files: [
        { icon: 'link', n: 'hanayoon.design/portfolio-v1', m: 'Hana \u00b7 yesterday' }
      ],
      photos: [
        { n: 'portfolio-cover.png', tag: 'IMG 01' },
        { n: 'case-study-spread.png', tag: 'IMG 02' }
      ]
    },
    {
      id: 'c4', pid: 2, i: 'JB', av: 2, name: 'Jordan Blake', yr: '12', circle: true,
      role: 'Design Manager \u00b7 Airbnb \u00b7 New York', presence: 'Class of \u201912',
      time: '2d', unread: 0,
      ask: null,
      msgs: [
        { k: 'sys', t: 'You connected \u00b7 May 2026' },
        { k: 'day', t: 'May 22' },
        { k: 'them', t: 'Good running into you at the reunion \u2014 let\u2019s trade notes on hiring soon.', tm: '6:02 PM' },
        { k: 'me', t: 'Deal. I\u2019ll send some times next week.', tm: '6:15 PM', read: true },
        { k: 'them', t: 'Sounds good, talk soon.', tm: '6:20 PM' }
      ],
      files: []
    },
    {
      id: 'c5', pid: 6, i: 'TH', av: 1, name: 'Tom Hale', yr: '08', circle: true,
      role: 'Design Director \u00b7 IDEO \u00b7 San Francisco', presence: 'Class of \u201908',
      time: '2w', unread: 0,
      ask: { title: 'Pricing a first studio project', mine: true, daysLeft: 0, resolved: true },
      msgs: [
        { k: 'sys', t: 'Tom accepted your ask \u00b7 Jun 12' },
        { k: 'day', t: 'Jun 12' },
        { k: 'them', t: 'Pricing a first project is mostly nerve. Anchor on the value of the outcome, not your hours.', tm: '3:40 PM' },
        { k: 'me', t: 'That reframe helped \u2014 I quoted double what I planned to and they said yes without blinking.', tm: '5:02 PM', read: true },
        { k: 'them', t: 'There it is. Next time add twenty percent for the nerves.', tm: '5:10 PM' },
        { k: 'sys', t: 'You marked this ask resolved \u00b7 Jun 26' }
      ],
      files: []
    }
  ]
};
