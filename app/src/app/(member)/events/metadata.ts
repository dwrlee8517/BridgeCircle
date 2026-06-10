export type AccentColor = {
  name: string
  hex: string
  bg: string
  text: string
  border: string
  lightBg: string
  lightBorder: string
}

export type EventMetadata = {
  category: string
  tagline: string
  preparations: string[]
  agenda: { time: string; title: string; sub?: string }[]
  street: string
  cityZip: string
  coordinates: string
}

export function getEventStableColor(title: string): AccentColor {
  const normalizedTitle = title.toLowerCase()

  if (normalizedTitle.includes('mixer')) {
    return {
      name: 'Emerald',
      hex: '#15a05f',
      bg: 'bg-accent-sage',
      text: 'text-accent-sage',
      border: 'border-accent-sage',
      lightBg: 'bg-accent-sage/5',
      lightBorder: 'border-accent-sage/20',
    }
  }
  if (normalizedTitle.includes('coffee')) {
    return {
      name: 'Ochre',
      hex: '#a16207',
      bg: 'bg-accent-ochre',
      text: 'text-accent-ochre',
      border: 'border-accent-ochre',
      lightBg: 'bg-accent-ochre/5',
      lightBorder: 'border-accent-ochre/20',
    }
  }
  if (normalizedTitle.includes('roundtable') || normalizedTitle.includes('tech')) {
    return {
      name: 'Electric Sky',
      hex: '#2563eb',
      bg: 'bg-primary',
      text: 'text-primary',
      border: 'border-primary',
      lightBg: 'bg-primary/5',
      lightBorder: 'border-primary/20',
    }
  }
  if (
    normalizedTitle.includes('dinner') ||
    normalizedTitle.includes('winter') ||
    normalizedTitle.includes('holiday')
  ) {
    return {
      name: 'Grape',
      hex: '#7c3aed',
      bg: 'bg-accent-plum',
      text: 'text-accent-plum',
      border: 'border-accent-plum',
      lightBg: 'bg-accent-plum/5',
      lightBorder: 'border-accent-plum/20',
    }
  }
  if (
    normalizedTitle.includes('creative') ||
    normalizedTitle.includes('careers') ||
    normalizedTitle.includes('panel')
  ) {
    return {
      name: 'Crimson',
      hex: '#c4314b',
      bg: 'bg-accent-rust',
      text: 'text-accent-rust',
      border: 'border-accent-rust',
      lightBg: 'bg-accent-rust/5',
      lightBorder: 'border-accent-rust/20',
    }
  }

  // Fallback: Electric Sky
  return {
    name: 'Electric Sky',
    hex: '#2563eb',
    bg: 'bg-primary',
    text: 'text-primary',
    border: 'border-primary',
    lightBg: 'bg-primary/5',
    lightBorder: 'border-primary/20',
  }
}

export function getEventMetadata(title: string): EventMetadata {
  const normalizedTitle = title.toLowerCase()

  if (normalizedTitle.includes('mixer')) {
    return {
      category: 'Local network',
      tagline: 'Casual evening drinks at the PV campus with structured advisory discussions.',
      preparations: [
        'Bring business cards or digital profile QR code',
        'Review current member matching requests in PV cohort',
      ],
      agenda: [
        { time: '6:00 PM', title: 'Arrivals & Welcoming Cocktails', sub: 'Main Court Patio' },
        {
          time: '6:30 PM',
          title: 'Structured Roundtables by Industry Cohort',
          sub: 'Roessler Hall Chambers',
        },
        {
          time: '7:30 PM',
          title: 'Open Networking & Mentorship Matching',
          sub: 'Appetizers served',
        },
      ],
      street: '26800 Academy Dr',
      cityZip: 'Palos Verdes Peninsula, CA 90274',
      coordinates: '33.7788° N, 118.3512° W',
    }
  }
  if (normalizedTitle.includes('coffee')) {
    return {
      category: 'Local network',
      tagline: 'Saturday morning coffee meetup for Chadwick International alumni in Seoul.',
      preparations: [
        'Confirm RSVP 24 hours prior due to space limits',
        'Optional: Prepare one active career question for group circle',
      ],
      agenda: [
        { time: '10:00 AM', title: 'Coffee Pouring & Morning Warmups', sub: 'Brew bar counter' },
        {
          time: '10:30 AM',
          title: 'Mentorship Circles & Ask/Offer Board',
          sub: 'Upstairs terrace',
        },
        { time: '11:30 AM', title: 'Open Conversations & Next Steps', sub: 'Group photos' },
      ],
      street: '45 Songdomunhwa-ro, Yeonsu-gu',
      cityZip: 'Incheon 21985, South Korea',
      coordinates: '37.3750° N, 126.6667° E',
    }
  }
  if (normalizedTitle.includes('roundtable') || normalizedTitle.includes('tech')) {
    return {
      category: 'Tech & product',
      tagline: 'A focused roundtable for alumni working across product, engineering, and design.',
      preparations: [
        'Bring one current project, team challenge, or hiring question',
        'Use People before the event to find two alumni you want to meet',
      ],
      agenda: [
        { time: '6:30 PM', title: 'Arrival and introductions', sub: 'Foyer area' },
        {
          time: '7:00 PM',
          title: 'Roundtable discussion',
          sub: 'Hartwood Library main stage',
        },
        {
          time: '8:00 PM',
          title: 'Small-group follow-ups',
          sub: 'Terrace garden networking',
        },
      ],
      street: '144 Hartwood St',
      cityZip: 'San Francisco, CA 94107',
      coordinates: '37.7749° N, 122.4194° W',
    }
  }
  if (
    normalizedTitle.includes('dinner') ||
    normalizedTitle.includes('winter') ||
    normalizedTitle.includes('holiday')
  ) {
    return {
      category: 'Community network',
      tagline: 'Our annual end-of-year dinner celebration for local alumni.',
      preparations: [
        'Semiformality: Jacket recommended, no tie required',
        'Voluntary: Bring one unwrapped book for charity drive',
      ],
      agenda: [
        { time: '7:00 PM', title: 'Festive Reception & Mulled Wine', sub: 'Athenaeum Courtyard' },
        {
          time: '7:30 PM',
          title: 'Served Dinner & Alumni Vouched Speeches',
          sub: 'Grand Dining Hall',
        },
        {
          time: '9:00 PM',
          title: 'Dessert Buffet & Charity Book Collection',
          sub: 'Library fireplace room',
        },
      ],
      street: '551 S Hill Ave',
      cityZip: 'Pasadena, CA 91106',
      coordinates: '34.1378° N, 118.1250° W',
    }
  }
  if (
    normalizedTitle.includes('creative') ||
    normalizedTitle.includes('careers') ||
    normalizedTitle.includes('panel')
  ) {
    return {
      category: 'Mentorship',
      tagline:
        'Moderated conversation with Chadwick alumni in media, art direction, photography, and design.',
      preparations: [
        'Submit portfolio link for spotlight critique session',
        'Prepare one question for panel Q&A section',
      ],
      agenda: [
        { time: '6:00 PM', title: 'Gallery Walkthrough & Drinks', sub: 'Soho House Lobby Gallery' },
        {
          time: '6:30 PM',
          title: 'Panel Discussion: "Bridging Mediums"',
          sub: 'Third Floor Auditorium',
        },
        {
          time: '7:45 PM',
          title: 'Portfolio Spotlight Reviews',
          sub: 'Individual feedback tables',
        },
      ],
      street: '9200 Sunset Blvd',
      cityZip: 'West Hollywood, CA 90069',
      coordinates: '34.0900° N, 118.3900° W',
    }
  }

  // Fallback
  return {
    category: 'Gathering',
    tagline: 'A community gathering for BridgeCircle members.',
    preparations: [
      'Bring your community profile on the BridgeCircle mobile app',
      'Arrive 10 minutes prior to start time',
    ],
    agenda: [
      { time: 'Starts', title: 'Welcome and Check-in', sub: 'Registration Desk' },
      { time: 'Middle', title: 'Main Program Session', sub: 'Main Hall' },
      { time: 'Ends', title: 'Networking Reception', sub: 'Social Area' },
    ],
    street: 'BridgeCircle Space',
    cityZip: 'Vouched Campus',
    coordinates: '33.7490° N, 126.3880° E',
  }
}
