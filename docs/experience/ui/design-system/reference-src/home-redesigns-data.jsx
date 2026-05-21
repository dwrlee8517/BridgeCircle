/* eslint-disable */
// Shared palette + small data slice for the home-page redesign mockups.
// Mirrors values from civic-theme.jsx and atrium-theme.jsx so the artboards
// feel like the real product, not stand-ins. Inlined here so each mockup
// stays a single React component with no theme-hook setup.

const CIVIC = {
	paper: "#fafaf9",
	panel: "#f4f3ee",
	card: "#ffffff",
	ink: "#0c0c0b",
	ink2: "#262521",
	muted: "#4d4d4a",
	mute2: "#8a8a84",
	rule: "#dcdcd6",
	ruleSoft: "#ebebe5",
	accent: "#2563eb", // electricSky — matches default tweak
	warn: "#b25e00",
	ok: "#165e34",
	bad: "#9b2c1f",
	font: {
		display: '"Inter Tight", "Neue Haas Grotesk", system-ui, sans-serif',
		body: '"Inter", system-ui, sans-serif',
		mono: '"JetBrains Mono", ui-monospace, "SF Mono", monospace',
		serif: '"Source Serif 4", "Iowan Old Style", Georgia, serif',
	},
};

const ATRIUM = {
	paper: "#efe7d8",
	panel: "#e6dcc8",
	card: "#f8f1e2",
	cardAlt: "#fbf6ea",
	ink: "#2a221a",
	ink2: "#3d3328",
	muted: "#7a6e5e",
	mute2: "#9a8e7d",
	rule: "#d8ccb6",
	ruleSoft: "#e4dcca",
	accent: "#c75a3a", // terracotta — Atrium default
	warn: "#a05a12",
	ok: "#62753a",
	bad: "#9b2c1f",
	font: {
		display: '"Inter Tight", "Neue Haas Grotesk", system-ui, sans-serif',
		body: '"Inter", system-ui, sans-serif',
		mono: '"JetBrains Mono", ui-monospace, "SF Mono", monospace',
		serif: '"Source Serif 4", "Iowan Old Style", Georgia, serif',
	},
};

// Re-export tiny slice of BC_DATA for the mockups. Pulled inline so the
// canvas doesn't depend on civic-data.jsx (which the actual product uses).
const HOME_DATA = {
	viewer: {
		firstName: "Maren",
		cohort: "’14",
		city: "Brooklyn",
		lastVisit: "Apr 22, 2026", // ~3 weeks ago — typical for a need-based app
		daysAway: 23,
		visitsThisYear: 4, // people open this a handful of times a year
	},
	pending: [
		{
			name: "Lena Park",
			initials: "LP",
			cohort: "’18",
			title: "PM at Currents",
			days: 4,
			body: "Considering leaving Currents for an AI-policy nonprofit — would love to hear how you thought through your jump from product to policy. 30 min?",
		},
		{
			name: "Iris Okonkwo",
			initials: "IO",
			cohort: "’19",
			title: "Founder, The Long Take Co.",
			days: 3,
			body: "Working on our seed deck. Could I get 20 minutes to walk you through it for a gut check?",
		},
		{
			name: "Matty Osei",
			initials: "MO",
			cohort: "’07",
			title: "Investor, Common Capital",
			days: 5,
			body: "Want to compare notes on climate seed deals before our office hours next week?",
		},
	],
	newJoiners: [
		{
			name: "Iris Okonkwo",
			initials: "IO",
			cohort: "’19",
			city: "Brooklyn",
			title: "Founder · The Long Take Co.",
			joined: "3d",
		},
		{
			name: "Dev Ramachandran",
			initials: "DR",
			cohort: "’09",
			city: "Oakland",
			title: "Director, Engineering · Brevity",
			joined: "5d",
		},
		{
			name: "Priya Sastry",
			initials: "PS",
			cohort: "’16",
			city: "London",
			title: "Senior Designer · Field & Co.",
			joined: "1w",
		},
	],
	event: {
		title: "Spring Supper at Hartwood",
		when: "Tue · May 20 · 7:00 PM",
		where: "The Hartwood House, Brooklyn",
		going: 38,
		capacity: 60,
		days: 6,
		host: "Maren Vasilakis · ’14",
	},
	stats: { newThisWeek: 12, openMentors: 148, mentees: 3 },
};

// Stable per-name avatar colour (for the rare mockup spots that need one).
function avatarColor(name, palette) {
	const seed = (name || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
	const bgs = [palette.ink, palette.accent, palette.ok, palette.warn];
	return bgs[seed % bgs.length];
}

function MockAvatar({ name, initials, size = 36, palette }) {
	const bg = avatarColor(name, palette);
	return (
		<div
			style={{
				width: size,
				height: size,
				borderRadius: palette === ATRIUM ? 999 : 6,
				background: bg,
				color: "#fff",
				display: "grid",
				placeItems: "center",
				flexShrink: 0,
				fontFamily: palette.font.display,
				fontSize: Math.round(size * 0.38),
				fontWeight: 600,
				letterSpacing: "-0.01em",
				userSelect: "none",
			}}
		>
			{initials}
		</div>
	);
}

window.CIVIC = CIVIC;
window.ATRIUM = ATRIUM;
window.HOME_DATA = HOME_DATA;
window.MockAvatar = MockAvatar;
