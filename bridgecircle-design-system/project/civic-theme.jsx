/* eslint-disable */
// Civic theme — central token table + ThemeContext so every component can
// read tokens with one hook. Tokens depend on a small number of tweakable
// inputs (accent, density, card style). Everything else falls out.

const CIVIC_PALETTE = {
	paper: "#fafaf9",
	panel: "#f4f3ee",
	card: "#ffffff",
	ink: "#0c0c0b",
	ink2: "#262521",
	muted: "#4d4d4a",
	mute2: "#8a8a84",
	rule: "#dcdcd6",
	ruleSoft: "#ebebe5",
	ok: "#165e34",
	warn: "#b25e00",
	bad: "#9b2c1f",
};

const ACCENT_OPTIONS = {
	amber: "#c8761a", // signal amber (default)
	ink: "#0c0c0b", // monochrome — accent = ink
	electricSky: "#2563eb", // primary brand blue
	civicBlue: "#4d88ff", // vibrant accent blue
};

function hex(c, a = 1) {
	if (a >= 1) return c;
	const n = Math.round(a * 255).toString(16).padStart(2, '0');
	return c + n;
}

function getContrastColor(hexColor) {
	if (!hexColor) return "#ffffff";
	const cleanHex = hexColor.replace("#", "");
	if (cleanHex.length === 3) {
		const r = parseInt(cleanHex[0] + cleanHex[0], 16);
		const g = parseInt(cleanHex[1] + cleanHex[1], 16);
		const b = parseInt(cleanHex[2] + cleanHex[2], 16);
		const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
		return l > 140 ? "#0c0c0b" : "#ffffff";
	}
	const r = parseInt(cleanHex.substring(0, 2), 16);
	const g = parseInt(cleanHex.substring(2, 4), 16);
	const b = parseInt(cleanHex.substring(4, 6), 16);
	const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
	return l > 140 ? "#0c0c0b" : "#ffffff";
}

function useCivicTheme(tweaks) {
	const accent = ACCENT_OPTIONS[tweaks.accent] || ACCENT_OPTIONS.amber;
	const d =
		tweaks.density === "compact" ? 0.78 : tweaks.density === "roomy" ? 1.18 : 1;
	const cardStyle = tweaks.cardStyle;

	// Readability overrides
	const muted = tweaks.mutedContrast ? "#4d4d4a" : "#4d4d4a";
	const mute2 = tweaks.mutedContrast ? "#8a8a84" : "#8a8a84";
	const ruleSoft = tweaks.ruleContrast ? "#d0d0ca" : "#ebebe5";
	const monoFontSize = tweaks.monoSize ? 11.5 : 10.5;
	const bodySize = tweaks.bodySize ?? 14;

	return {
		palette: { ...CIVIC_PALETTE, accent, muted, mute2, ruleSoft },
		density: d,
		cardStyle,
		font: {
			display: '"Inter Tight", "Neue Haas Grotesk", system-ui, sans-serif',
			body: '"Inter", system-ui, sans-serif',
			mono: '"JetBrains Mono", ui-monospace, "SF Mono", monospace',
		},
		// Some helpful presets so screens stay terse
		eyebrow: {
			fontFamily: '"JetBrains Mono", ui-monospace, monospace',
			fontSize: monoFontSize,
			letterSpacing: "0.16em",
			textTransform: "uppercase",
			fontWeight: 500,
		},
		display: {
			fontFamily: '"Inter Tight", "Neue Haas Grotesk", system-ui, sans-serif',
			letterSpacing: "-0.035em",
			fontWeight: 500,
			lineHeight: 1.02,
		},
		body: {
			fontFamily: '"Inter", system-ui, sans-serif',
			lineHeight: 1.55,
		},
		// Hairline border for tables, cards, dividers
		bodySize,
		hairline: `1px solid ${CIVIC_PALETTE.rule}`,
		hairlineSoft: `1px solid ${CIVIC_PALETTE.ruleSoft}`,
		// Card surface depends on cardStyle tweak
		cardSurface: (overrides = {}) => ({
			background:
				cardStyle === "filled" ? CIVIC_PALETTE.panel : CIVIC_PALETTE.card,
			border:
				cardStyle === "hairline" ? `1px solid ${CIVIC_PALETTE.rule}` : "none",
			borderRadius: 6,
			...overrides,
		}),
		pad: (base) => Math.round(base * d),
	};
}

// ---------------------------------------------------------------------------
// Primitives — Buttons, Badges, Inputs
// ---------------------------------------------------------------------------

function CivicButton({
	children,
	variant = "primary",
	size = "md",
	as: As = "button",
	...rest
}) {
	const t = React.useContext(ThemeCtx);
	const sizes = {
		sm: { padding: "7px 12px", fontSize: 12 },
		md: { padding: "10px 16px", fontSize: 13 },
		lg: { padding: "13px 20px", fontSize: 14 },
	};
	const variants = {
		primary: {
			background: t.palette.ink,
			color: t.palette.paper,
			border: `1px solid ${t.palette.ink}`,
		},
		outline: {
			background: "transparent",
			color: t.palette.ink,
			border: `1px solid ${t.palette.ink}`,
		},
		ghost: {
			background: "transparent",
			color: t.palette.ink,
			border: "1px solid transparent",
		},
		accent: {
			background: t.palette.accent,
			color: getContrastColor(t.palette.accent),
			border: `1px solid ${t.palette.accent}`,
		},
	};
	return (
		<As
			{...rest}
			style={{
				...sizes[size],
				...variants[variant],
				fontFamily: t.font.body,
				fontWeight: 500,
				letterSpacing: 0.1,
				borderRadius: 6,
				cursor: "pointer",
				display: "inline-flex",
				alignItems: "center",
				justifyContent: "center",
				gap: 6,
				textDecoration: "none",
				transition: "opacity 120ms ease, transform 120ms ease",
				...rest.style,
			}}
			onMouseDown={(e) => {
				e.currentTarget.style.transform = "translateY(0.5px)";
				rest.onMouseDown?.(e);
			}}
			onMouseUp={(e) => {
				e.currentTarget.style.transform = "";
				rest.onMouseUp?.(e);
			}}
		>
			{children}
		</As>
	);
}

function CivicChip({ children, tone = "muted" }) {
	const t = React.useContext(ThemeCtx);
	const tones = {
		muted: {
			background: t.palette.panel,
			color: t.palette.muted,
			border: `1px solid ${t.palette.rule}`,
		},
		accent: {
			background: hex(t.palette.accent, 0.14),
			color: t.palette.accent,
			border: `1px solid ${t.palette.accent}`,
		},
		ok: {
			background: hex(t.palette.ok, 0.14),
			color: t.palette.ok,
			border: `1px solid ${t.palette.ok}`,
		},
		warn: {
			background: hex(t.palette.warn, 0.14),
			color: t.palette.warn,
			border: `1px solid ${t.palette.warn}`,
		},
	};
	return (
		<span
			style={{
				...tones[tone],
				fontFamily: t.font.mono,
				fontSize: 10,
				letterSpacing: "0.14em",
				textTransform: "uppercase",
				padding: "3px 7px",
				borderRadius: 6,
				display: "inline-flex",
				alignItems: "center",
				gap: 4,
				whiteSpace: "nowrap",
			}}
		>
			{children}
		</span>
	);
}

function Dot({ color }) {
	return (
		<span
			style={{
				width: 6,
				height: 6,
				borderRadius: 999,
				background: color,
				display: "inline-block",
				flexShrink: 0,
			}}
		/>
	);
}

function Eyebrow({ children, color }) {
	const t = React.useContext(ThemeCtx);
	return (
		<div style={{ ...t.eyebrow, color: color || t.palette.muted }}>
			{children}
		</div>
	);
}

function SectionTitle({ index, title, action, tag }) {
	const t = React.useContext(ThemeCtx);
	const m = useCivicIsMobile();
	return (
		<div
			style={{
				display: "flex",
				alignItems: m ? "flex-start" : "flex-end",
				flexDirection: m ? "column" : "row",
				justifyContent: "space-between",
				marginBottom: m ? 18 : 24,
				borderTop: `2px solid ${t.palette.ink}`,
				paddingTop: 14,
				gap: m ? 10 : 0,
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "baseline",
					gap: m ? 12 : 18,
					flexWrap: "wrap",
				}}
			>
				<h2 style={{ ...t.display, fontSize: m ? 22 : 28, margin: 0 }}>
					{title}
				</h2>
				{tag ? <CivicChip tone="muted">{tag}</CivicChip> : null}
			</div>
			{action}
		</div>
	);
}

function HairlineTable({ rows, cols }) {
	const t = React.useContext(ThemeCtx);
	return (
		<div style={{ borderTop: `1px solid ${t.palette.ink}` }}>
			{rows.map((row, i) => (
				<div
					key={i}
					style={{
						display: "grid",
						gridTemplateColumns: cols,
						padding: "12px 0",
						borderBottom: `1px solid ${t.palette.ruleSoft}`,
						fontSize: 13,
						alignItems: "center",
						gap: 12,
					}}
				>
					{row}
				</div>
			))}
		</div>
	);
}

// Field label with mono numeric prefix (Civic detail)
function NumberedField({ n, label, value, sub }) {
	const t = React.useContext(ThemeCtx);
	return (
		<div
			style={{
				display: "grid",
				gridTemplateColumns: "28px 1fr auto",
				gap: 12,
				padding: "10px 0",
				borderBottom: `1px solid ${t.palette.ruleSoft}`,
				alignItems: "baseline",
			}}
		>
			<span style={{ ...t.eyebrow, color: t.palette.mute2, fontSize: 10 }}>
				{String(n).padStart(2, "0")}
			</span>
			<span style={{ fontSize: 13, color: t.palette.muted }}>{label}</span>
			<div style={{ textAlign: "right" }}>
				<div style={{ fontSize: 13, fontWeight: 500, color: t.palette.ink }}>
					{value}
				</div>
				{sub ? (
					<div style={{ fontSize: 11, color: t.palette.mute2, marginTop: 2 }}>
						{sub}
					</div>
				) : null}
			</div>
		</div>
	);
}

// CivicAvatar — square initials block; colour is stable-hashed from name.
function CivicAvatar({ name, initials, size = 40 }) {
	const t = React.useContext(ThemeCtx);
	const seed = (name || "")
		.split("")
		.reduce((acc, c) => acc + c.charCodeAt(0), 0);
	const bgs = [
		CIVIC_PALETTE.ink,
		ACCENT_OPTIONS.electricSky,
		CIVIC_PALETTE.ok,
		ACCENT_OPTIONS.amber,
	];
	const bg = bgs[seed % bgs.length];
	const fg = bg === CIVIC_PALETTE.ink ? CIVIC_PALETTE.paper : "#fff";
	return (
		<div
			style={{
				width: size,
				height: size,
				borderRadius: 6,
				background: bg,
				color: fg,
				display: "grid",
				placeItems: "center",
				fontFamily: '"Inter Tight", system-ui, sans-serif',
				fontSize: Math.round(size * 0.38),
				fontWeight: 600,
				letterSpacing: "-0.01em",
				flexShrink: 0,
				userSelect: "none",
			}}
		>
			{initials}
		</div>
	);
}

// Mobile breakpoint hook — used by every screen in this app to switch from
// the desktop grid layout to a stacked single-column layout. Threshold lines
// up with the input[font-size] media query in BridgeCircle Civic.html.
function useCivicIsMobile(bp = 760) {
	const q = `(max-width:${bp}px)`;
	const [is, setIs] = React.useState(
		() => typeof window !== "undefined" && window.matchMedia(q).matches,
	);
	React.useEffect(() => {
		if (typeof window === "undefined") return;
		const mql = window.matchMedia(q);
		const fn = (e) => setIs(e.matches);
		mql.addEventListener
			? mql.addEventListener("change", fn)
			: mql.addListener(fn);
		setIs(mql.matches);
		return () => {
			mql.removeEventListener
				? mql.removeEventListener("change", fn)
				: mql.removeListener(fn);
		};
	}, [q]);
	return is;
}

window.useCivicIsMobile = useCivicIsMobile;
window.useCivicTheme = useCivicTheme;
window.CivicButton = CivicButton;
window.CivicChip = CivicChip;
window.CivicAvatar = CivicAvatar;
window.Dot = Dot;
window.Eyebrow = Eyebrow;
window.SectionTitle = SectionTitle;
window.HairlineTable = HairlineTable;
window.NumberedField = NumberedField;
window.ACCENT_OPTIONS = ACCENT_OPTIONS;
window.hex = hex;
