/* eslint-disable */
// HISTORICAL PROTOTYPE ONLY. Do not copy these Atrium token exports into
// production. Use ../tokens.md, ../components.md, and app/src/app/globals.css.
// Atrium Design System — Token Export & Code (§53)

function TokenExportSection() {
  return (
    <DSSection id="tokens" eyebrow="Code · 53" title="Token Export & Handoff">

      <DSSub title="CSS custom properties — paste into :root">
        <CSSCustomProps />
      </DSSub>

      <DSSub title="tokens.json — Style Dictionary–shaped">
        <TokenJSON />
      </DSSub>

      <DSSub title="Tailwind config — copy into theme.extend">
        <TailwindConfig />
      </DSSub>

      <DSSub title="Code tabs — every component should ship like this">
        <CodeTabDemo />
      </DSSub>

    </DSSection>
  );
}

function CodeBlock({ children, copyText, lang = 'css', maxHeight = 320 }) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(copyText || children).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div style={{ background: DSC.ink, color: DSC.paper, borderRadius: 12, overflow: 'hidden', border: `1px solid ${DSC.rule}`, boxShadow: '0 4px 14px rgba(42,34,26,0.10)' }}>
      <div style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: DSF.mono, fontSize: 10, color: 'rgba(240,229,208,0.55)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>{lang}</span>
        <button onClick={copy} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: copied ? DSC.ok : 'rgba(255,255,255,0.08)', color: copied ? '#fff' : 'rgba(240,229,208,0.85)', border: 'none', borderRadius: 999, padding: '4px 12px', fontFamily: DSF.body, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'background 140ms ease' }}>
          <Icon name={copied ? 'check' : 'save'} size={11} color="currentColor" strokeWidth={2.4} />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre style={{ margin: 0, padding: '14px 16px', fontFamily: DSF.mono, fontSize: 11.5, color: '#f0e5d0', lineHeight: 1.6, maxHeight, overflow: 'auto', whiteSpace: 'pre' }}>{children}</pre>
    </div>
  );
}

function CSSCustomProps() {
  const css = `:root {
  /* surfaces · lifted (default) */
  --color-paper:     #ebe1cb;
  --color-panel:     #e2d6bb;
  --color-card:      #fdf8eb;
  --color-card-alt:  #fefcf3;
  --color-rule:      #cdbe9c;
  --color-rule-soft: #d9cbb0;

  /* text */
  --color-ink:    #2a221a;
  --color-ink-2:  #3d3328;
  --color-muted:  #655a4a;
  --color-mute-2: #7a6e5e;

  /* semantic */
  --color-ok:    #62753a;
  --color-warn:  #a05a12;
  --color-bad:   #9b2c1f;

  /* accents — 7 grounded hues */
  --accent-terracotta: #b84e2c;
  --accent-saffron:    #b88033;
  --accent-olive:      #5f7038;
  --accent-lake:       #2f6e6c;
  --accent-indigo:     #3f5680;
  --accent-plum:       #7a3a5e;
  --accent-heather:    #8a5e7a;

  /* type */
  --font-display: "Inter Tight", "Neue Haas Grotesk", system-ui, sans-serif;
  --font-body:    "Inter", system-ui, sans-serif;
  --font-mono:    "JetBrains Mono", ui-monospace, "SF Mono", monospace;

  /* radius */
  --radius-sm:    6px;
  --radius-md:    10px;
  --radius-lg:    16px;
  --radius-pill:  9999px;

  /* spacing */
  --space-1:  2px;  --space-2:  4px;   --space-3:  6px;
  --space-4:  8px;  --space-5:  10px;  --space-6:  12px;
  --space-7:  14px; --space-8:  16px;  --space-9:  20px;
  --space-10: 24px; --space-12: 32px;  --space-16: 48px;
  --space-20: 72px;

  /* motion */
  --dur-fast:    80ms;
  --dur-base:    120ms;
  --dur-medium:  200ms;
  --dur-slow:    320ms;
  --ease-out:    cubic-bezier(0, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.2, 0.8, 0.2, 1);
}

/* Lamplight — opt-in dark */
[data-tone="lamplight"] {
  --color-paper: #1a1612;
  --color-card:  #2a221a;
  --color-rule:  #3d3328;
  --color-ink:   #f0e5d0;
  --color-muted: #998a72;
}`;
  return <CodeBlock copyText={css}>{css}</CodeBlock>;
}

function TokenJSON() {
  const json = `{
  "color": {
    "paper":   { "value": "#ebe1cb", "type": "color" },
    "card":    { "value": "#fdf8eb", "type": "color" },
    "ink":     { "value": "#2a221a", "type": "color" },
    "muted":   { "value": "#655a4a", "type": "color" },
    "rule":    { "value": "#cdbe9c", "type": "color" },
    "accent": {
      "terracotta": { "value": "#b84e2c", "type": "color" },
      "saffron":    { "value": "#b88033", "type": "color" },
      "olive":      { "value": "#5f7038", "type": "color" },
      "lake":       { "value": "#2f6e6c", "type": "color" },
      "indigo":     { "value": "#3f5680", "type": "color" },
      "plum":       { "value": "#7a3a5e", "type": "color" },
      "heather":    { "value": "#8a5e7a", "type": "color" }
    },
    "semantic": {
      "ok":   { "value": "#62753a", "type": "color" },
      "warn": { "value": "#a05a12", "type": "color" },
      "bad":  { "value": "#9b2c1f", "type": "color" }
    }
  },
  "font": {
    "display": { "value": "Inter Tight, system-ui, sans-serif" },
    "body":    { "value": "Inter, system-ui, sans-serif" },
    "mono":    { "value": "JetBrains Mono, monospace" }
  },
  "radius": {
    "sm":   { "value": "6px" },
    "md":   { "value": "10px" },
    "lg":   { "value": "16px" },
    "pill": { "value": "9999px" }
  },
  "space": {
    "1": { "value": "2px" },  "2": { "value": "4px" },
    "3": { "value": "6px" },  "4": { "value": "8px" },
    "5": { "value": "10px" }, "6": { "value": "12px" },
    "7": { "value": "14px" }, "8": { "value": "16px" },
    "9": { "value": "20px" }, "10": { "value": "24px" },
    "12": { "value": "32px" }, "16": { "value": "48px" },
    "20": { "value": "72px" }
  },
  "motion": {
    "duration": {
      "fast":   { "value": "80ms" },
      "base":   { "value": "120ms" },
      "medium": { "value": "200ms" },
      "slow":   { "value": "320ms" }
    },
    "ease": {
      "out":    { "value": "cubic-bezier(0,0,0.2,1)" },
      "spring": { "value": "cubic-bezier(0.2,0.8,0.2,1)" }
    }
  }
}`;
  return <CodeBlock copyText={json} lang="json" maxHeight={420}>{json}</CodeBlock>;
}

function TailwindConfig() {
  const cfg = `// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        paper:    '#ebe1cb',
        card:     '#fdf8eb',
        ink:      '#2a221a',
        muted:    '#655a4a',
        rule:     '#cdbe9c',
        accent: {
          DEFAULT:    '#b84e2c',
          saffron:    '#b88033',
          olive:      '#5f7038',
          lake:       '#2f6e6c',
          indigo:     '#3f5680',
          plum:       '#7a3a5e',
          heather:    '#8a5e7a',
        },
        ok:   '#62753a',
        warn: '#a05a12',
        bad:  '#9b2c1f',
      },
      fontFamily: {
        display: ['Inter Tight', 'system-ui', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      borderRadius: { sm: '6px', md: '10px', lg: '16px' },
      transitionTimingFunction: {
        out:    'cubic-bezier(0,0,0.2,1)',
        spring: 'cubic-bezier(0.2,0.8,0.2,1)',
      },
    },
  },
};`;
  return <CodeBlock copyText={cfg} lang="javascript">{cfg}</CodeBlock>;
}

function CodeTabDemo() {
  const [tab, setTab] = React.useState('render');
  const jsx = `import { Button, Icon } from '@bridgecircle/atrium';

<Button variant="primary" size="md" leadIcon={<Icon name="send" />}>
  Send intro
</Button>`;
  const usage = `// Three variants × three sizes
<Button variant="primary" size="sm">Small</Button>
<Button variant="outline" size="md">Default</Button>
<Button variant="ink"     size="lg">Large</Button>

// Disabled state
<Button disabled>Sent</Button>

// As a link
<Button as="a" href="/profile/iris">Open profile</Button>`;
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '12px 18px', borderBottom: `1px solid ${DSC.ruleSoft}`, background: DSC.cardAlt, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontFamily: DSF.display, fontSize: 14, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.005em' }}>Button</span>
        <StatusBadge kind="stable" />
        <div style={{ marginLeft: 'auto', display: 'inline-flex', gap: 2, background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 999, padding: 2 }}>
          {['render', 'jsx', 'usage'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '4px 12px', background: tab === t ? DSC.ink : 'transparent', color: tab === t ? DSC.paper : DSC.muted, border: 'none', borderRadius: 999, fontFamily: DSF.body, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{t === 'render' ? 'Render' : t === 'jsx' ? 'JSX' : 'Usage'}</button>
          ))}
        </div>
      </div>
      <div style={{ padding: 22, minHeight: 180 }}>
        {tab === 'render' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-start' }}>
            <DSButton size="sm">Small</DSButton>
            <DSButton size="md">Default</DSButton>
            <DSButton size="lg" leadIcon={<Icon name="send" size={14} color="currentColor" />}>Send intro</DSButton>
          </div>
        )}
        {tab === 'jsx'   && <CodeBlock copyText={jsx} lang="jsx" maxHeight={240}>{jsx}</CodeBlock>}
        {tab === 'usage' && <CodeBlock copyText={usage} lang="jsx" maxHeight={240}>{usage}</CodeBlock>}
      </div>
    </div>
  );
}

window.TokenExportSection = TokenExportSection;
