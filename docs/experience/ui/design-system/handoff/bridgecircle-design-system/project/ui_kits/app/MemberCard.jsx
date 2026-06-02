// BridgeCircle UI Kit — PersonCard.jsx
// ResultCard: comfortable (default) + compact density
// Export: window.BCPersonCard

function BCPullQuote({ children, style = {}, accent = '#2563eb', textColor = '#0c0c0b' }) {
  return React.createElement('p', {
    style: {
      borderLeft: `3px solid ${accent}`,
      paddingLeft: '10px',
      fontStyle: 'italic',
      lineHeight: 1.5,
      fontSize: '12px',
      color: textColor,
      margin: 0,
      ...style,
    },
  }, children);
}

function TopicBadge({ label, bg = '#ebebe5', border = 'rgba(12,12,11,0.15)', color = '#4d4d4a' }) {
  return React.createElement('span', {
    style: {
      display: 'inline-flex', alignItems: 'center',
      borderRadius: '4px', padding: '1px 8px',
      fontSize: '9px', fontFamily: "'JetBrains Mono', monospace",
      fontWeight: 400, color,
      background: bg, border: `1px solid ${border}`,
    },
  }, label);
}

// Card variant presets — drawn from the Civic Editorial token palette:
// surface-page, surface-subtle, secondary panel, accent-sage / ochre / plum
// tints, surface-midnight. Avatar fallback color stays muted across all
// variants per Synthesis P3 (randomized hues read as meaningful, weren't).
const CARD_VARIANTS = {
  paper: {
    bg: '#fff', border: '#dcdcd6', text: '#0c0c0b', muted: '#4d4d4a',
    divider: 'rgba(220,220,214,0.8)',
    topicBg: '#ebebe5', topicBorder: 'rgba(12,12,11,0.15)', topicText: '#4d4d4a',
    shadow: '0 1px 0 rgba(12,12,11,0.03)',
  },
  bone: { // platinum bone — page surface as card
    bg: '#fafaf9', border: '#dcdcd6', text: '#0c0c0b', muted: '#4d4d4a',
    divider: 'rgba(220,220,214,0.8)',
    topicBg: '#fff', topicBorder: 'rgba(12,12,11,0.10)', topicText: '#4d4d4a',
    shadow: '0 1px 0 rgba(12,12,11,0.03)',
  },
  panel: { // warm secondary panel #f4f3ee
    bg: '#f4f3ee', border: '#e3e0d6', text: '#0c0c0b', muted: '#5a564b',
    divider: 'rgba(160,140,90,0.22)',
    topicBg: '#fff', topicBorder: 'rgba(12,12,11,0.10)', topicText: '#4d4d4a',
    shadow: '0 1px 0 rgba(80,70,40,0.04)',
  },
  sageTint: { // success-tint background — bumped for visibility
    bg: 'rgba(21,160,95,0.10)', border: 'rgba(21,160,95,0.30)', text: '#0c0c0b', muted: '#4d5249',
    divider: 'rgba(21,160,95,0.28)',
    topicBg: '#fff', topicBorder: 'rgba(21,160,95,0.25)', topicText: '#15a05f',
    shadow: '0 1px 0 rgba(21,160,95,0.06)',
  },
  ochreTint: { // warning-tint background
    bg: 'rgba(161,98,7,0.12)', border: 'rgba(161,98,7,0.32)', text: '#0c0c0b', muted: '#5a4e3a',
    divider: 'rgba(161,98,7,0.28)',
    topicBg: '#fff', topicBorder: 'rgba(161,98,7,0.25)', topicText: '#a05f15',
    shadow: '0 1px 0 rgba(161,98,7,0.06)',
  },
  plumTint: { // plum-tint background — categorized
    bg: 'rgba(124,58,237,0.10)', border: 'rgba(124,58,237,0.30)', text: '#0c0c0b', muted: '#52454a',
    divider: 'rgba(124,58,237,0.28)',
    topicBg: '#fff', topicBorder: 'rgba(124,58,237,0.25)', topicText: '#7c3aed',
    shadow: '0 1px 0 rgba(124,58,237,0.06)',
  },
  midnight: { // surface-midnight #081126
    bg: '#081126', border: 'rgba(250,250,249,0.12)', text: '#fafaf9', muted: 'rgba(250,250,249,0.68)',
    divider: 'rgba(250,250,249,0.16)',
    topicBg: 'rgba(250,250,249,0.06)', topicBorder: 'rgba(250,250,249,0.18)', topicText: '#cfcfca',
    shadow: 'none',
  },
  outlined: { // minimal hairline
    bg: 'transparent', border: '#0c0c0b', borderWidth: '1.5px', text: '#0c0c0b', muted: '#4d4d4a',
    divider: 'rgba(12,12,11,0.20)',
    topicBg: 'transparent', topicBorder: 'rgba(12,12,11,0.30)', topicText: '#0c0c0b',
    shadow: 'none',
  },
  accentBar: { // paper with primary stripe on top edge
    bg: '#fff', border: '#dcdcd6', text: '#0c0c0b', muted: '#4d4d4a',
    divider: 'rgba(220,220,214,0.8)',
    topicBg: '#ebebe5', topicBorder: 'rgba(12,12,11,0.15)', topicText: '#4d4d4a',
    shadow: '0 1px 0 rgba(12,12,11,0.03)',
    topBar: true,
  },
};

function BCPersonCard({
  name = 'Jamie Kim',
  preferredName = null,
  currentTitle = 'Product Manager',
  currentEmployer = 'Stripe',
  city = 'Brooklyn, NY',
  university = 'Cornell',
  major = null,
  graduationYear = 2020,
  avatarUrl = null,
  isOpenAsMentor = true,
  isOpenAsAdviceHelper = true,
  mentorPaused = false,
  isFriend = false,
  rationale = null,
  matchTier = null,
  mentoringTopics = ['Career transitions', 'Product management'],
  activeMenteeCount = 2,
  maxActiveMentees = 5,
  density = 'comfortable',
  variant = 'paper',
  accent = '#2563eb',
  radius = 10,
  avatarShape = 'square',
  hoverLift = true,
  matchScore = null,
  onAsk,
  onView,
}) {
  const v = CARD_VARIANTS[variant] || CARD_VARIANTS.paper;
  const isAvatarSquare = avatarShape !== 'circle';
  const display = preferredName
    ? `${preferredName} (${name.split(' ')[0]})`
    : name;
  const yearShort = graduationYear ? `'${String(graduationYear).slice(-2)}` : null;
  const activeRatio = maxActiveMentees > 0 ? activeMenteeCount / maxActiveMentees : 0;
  const dotColor = activeRatio <= 0.5 ? '#15a05f' : activeRatio <= 0.85 ? '#a16207' : '#9b2c1f';
  const capacityRatio = isOpenAsMentor ? activeRatio : null;

  // ── Compact row ────────────────────────────────────────────────────────────
  if (density === 'compact') {
    return React.createElement('div', {
      style: {
        border: '1px solid #dcdcd6', borderRadius: '8px',
        background: '#fff', padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: '12px',
        boxShadow: '0 1px 0 rgba(12,12,11,0.03)',
      },
    },
      React.createElement(BCAvatar, { name: display, avatarUrl, size: 36, square: true, capacityRatio }),
      React.createElement('div', { style: { minWidth: 0, flex: 1 } },
        React.createElement('div', { style: { display: 'flex', alignItems: 'baseline', gap: '6px' } },
          React.createElement('span', {
            style: { fontFamily: "'Inter Tight', sans-serif", fontSize: '13px', fontWeight: 600, color: '#0c0c0b' },
          }, display),
          yearShort && React.createElement('span', {
            style: { fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#4d4d4a' },
          }, yearShort)
        ),
        React.createElement('p', {
          style: { fontSize: '11px', color: '#0c0c0b', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
        }, [currentTitle, currentEmployer].filter(Boolean).join(' · '))
      ),
      React.createElement('div', { style: { display: 'flex', gap: '6px', flexShrink: 0 } },
        isFriend && React.createElement(BCStatusBadge, { tone: 'info', size: 'sm' }, 'Friend'),
        isOpenAsMentor
          ? React.createElement(BCStatusBadge, { tone: 'open', size: 'sm' },
              React.createElement('span', { style: { width: '4px', height: '4px', borderRadius: '50%', background: dotColor } }),
              'Mentor'
            )
          : isOpenAsAdviceHelper
            ? React.createElement(BCStatusBadge, { tone: 'open', size: 'sm' }, 'Advice')
            : null
      ),
      React.createElement(BCButton, {
        variant: (isOpenAsAdviceHelper || isOpenAsMentor) ? 'default' : 'ghost',
        size: 'sm',
        onClick: (isOpenAsAdviceHelper || isOpenAsMentor) ? onAsk : onView,
        style: { borderRadius: '8px', flexShrink: 0, fontSize: '11.5px', height: '30px' },
      }, (isOpenAsAdviceHelper || isOpenAsMentor) ? 'Ask for help' : 'View')
    );
  }

  // ── Comfortable card ────────────────────────────────────────────────────────
  const isDark = variant === 'midnight';
  return React.createElement('div', {
    className: hoverLift ? 'bc-person-card bc-person-card--lift' : 'bc-person-card',
    style: {
      border: `${v.borderWidth || '1px'} solid ${v.border}`,
      borderRadius: `${radius}px`,
      background: v.bg, padding: '20px',
      display: 'flex', flexDirection: 'column', gap: 0,
      boxShadow: v.shadow,
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 150ms ease-out, border-color 150ms ease-out, box-shadow 150ms ease-out',
    },
  },
    // Optional accent bar (top edge)
    v.topBar && React.createElement('span', {
      style: { position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: accent },
    }),

    // Header row
    React.createElement('div', { style: { display: 'flex', gap: '12px', flex: 1 } },
      React.createElement(BCAvatar, { name: display, avatarUrl, size: 52, square: isAvatarSquare, capacityRatio }),
      React.createElement('div', { style: { minWidth: 0, flex: 1 } },
        React.createElement('div', { style: { display: 'flex', alignItems: 'baseline', gap: '8px' } },
          React.createElement('span', {
            style: { fontFamily: "'Inter Tight', sans-serif", fontSize: '15px', fontWeight: 600, color: v.text },
          }, display),
          yearShort && React.createElement('span', {
            style: { fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: v.muted },
          }, yearShort)
        ),
        React.createElement('div', { style: { display: 'flex', gap: '5px', marginTop: '4px', flexWrap: 'wrap' } },
          isFriend && React.createElement(BCStatusBadge, { tone: 'info', size: 'sm', dot: true }, 'Friend'),
          isOpenAsMentor
            ? React.createElement(BCStatusBadge, { tone: 'open', size: 'sm' },
                React.createElement('span', { style: { width: '5px', height: '5px', borderRadius: '50%', background: dotColor } }),
                ' Mentor'
              )
            : isOpenAsAdviceHelper
              ? React.createElement(BCStatusBadge, { tone: 'open', size: 'sm', dot: true }, 'Advice')
              : mentorPaused
                ? React.createElement(BCStatusBadge, { tone: 'warn', size: 'sm', dot: true }, 'Paused')
                : null
        ),
        React.createElement('p', {
          style: { fontSize: '12px', color: v.text, marginTop: '6px', fontWeight: 500 },
        }, [currentTitle, currentEmployer].filter(Boolean).join(' · ')),
        React.createElement('p', {
          style: { fontSize: '11px', color: v.muted, marginTop: '2px' },
        }, [city, university, major].filter(Boolean).join(' · '))
      )
    ),

    // Match brief
    rationale && React.createElement('div', { style: { marginTop: '12px' } },
      React.createElement('p', {
        style: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: accent, marginBottom: '6px' },
      }, 'Match brief'),
      React.createElement(BCPullQuote, { accent, textColor: v.text }, `"${rationale}"`)
    ),

    // Topics
    mentoringTopics && mentoringTopics.length > 0 && React.createElement('div', {
      style: { display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '10px' },
    },
      mentoringTopics.slice(0, 3).map(t => React.createElement(TopicBadge, {
        key: t, label: t, bg: v.topicBg, border: v.topicBorder, color: v.topicText,
      }))
    ),

    // Actions
    React.createElement('div', {
      style: {
        marginTop: '14px', paddingTop: '12px',
        borderTop: `1px dashed ${v.divider}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
      },
    },
      React.createElement('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' } },
        (isOpenAsAdviceHelper || isOpenAsMentor)
          ? React.createElement(BCButton, {
              variant: 'default', size: 'sm', onClick: onAsk,
              style: {
                borderRadius: '8px', fontSize: '12px', height: '32px',
                ...(isDark ? { background: accent, color: '#fff', borderColor: accent } : {}),
              },
            }, 'Ask for help')
          : React.createElement(BCButton, {
              variant: 'outline', size: 'sm', onClick: onView,
              style: {
                borderRadius: '8px', fontSize: '12px', height: '32px',
                ...(isDark ? { color: v.text, borderColor: v.border, background: 'transparent' } : {}),
              },
            }, 'View profile'),
        (isOpenAsAdviceHelper || isOpenAsMentor) && React.createElement('button', {
          onClick: onView,
          style: { background: 'none', border: 'none', fontSize: '11px', fontWeight: 500, color: v.muted, cursor: 'pointer', padding: '4px 6px', fontFamily: "'Inter', sans-serif" },
        }, 'View profile')
      ),
      React.createElement('div', { style: { display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 } },
        matchScore != null && React.createElement('span', {
          style: {
            fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', fontWeight: 700,
            padding: '3px 6px', borderRadius: '4px',
            border: `1px solid ${isDark ? 'rgba(147,197,253,0.32)' : 'rgba(37,99,235,0.20)'}`,
            background: isDark ? 'rgba(147,197,253,0.10)' : 'rgba(37,99,235,0.05)',
            color: isDark ? '#bfdbfe' : accent,
            letterSpacing: '0.02em',
          },
        }, `${matchScore}% MATCH`),
        matchTier && (() => {
          const tierMap = {
            strong: { label: 'Strong match', color: '#15a05f', bg: 'rgba(21,160,95,0.10)', border: 'rgba(21,160,95,0.25)' },
            good:   { label: 'Good match',   color: accent,    bg: 'rgba(37,99,235,0.08)', border: 'rgba(37,99,235,0.22)' },
            weak:   { label: 'Weak match',   color: v.muted,   bg: v.topicBg,              border: v.topicBorder },
          };
          const tier = tierMap[matchTier] || tierMap.weak;
          return React.createElement('span', {
            style: {
              fontFamily: "'Inter', sans-serif", fontSize: '10px',
              padding: '3px 8px', border: `1px solid ${tier.border}`,
              background: tier.bg, color: tier.color,
              borderRadius: '4px', fontWeight: 600, flexShrink: 0,
              letterSpacing: '0.01em',
            },
          }, tier.label);
        })()
      )
    )
  );
}

Object.assign(window, { BCPersonCard, BCPullQuote, TopicBadge, CARD_VARIANTS });
