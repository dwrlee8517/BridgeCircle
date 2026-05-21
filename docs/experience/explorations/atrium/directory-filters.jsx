/* eslint-disable */
// Shared filter logic for the People directory. Each prototype renders its
// own UI on top of this hook — they share state + filter math, diverge on
// presentation.
//
// Mirrors the codebase's search-form.tsx filter set: city, employer,
// mentor topic, grad-year range, mentor-open, people-I-know, near-me.
// University/major are skipped because the prototype data models a single
// alumni network (everyone went to Hartwood).

const DEFAULT_FILTERS = {
  // Quick toggles
  mentor:      false,
  nearMe:      false,
  peopleIKnow: false,
  // Text filters
  city:        '',
  employer:    '',
  topic:       '',
  // Range
  yearMin:     '',
  yearMax:     '',
};

// Hardcoded "people I know" set so the toggle has bite. In production this
// would come from the friendship table.
const KNOWN_IDS = new Set(['dev-ramachandran', 'priya-sastry', 'sam-aldridge']);

function useDirectoryFilters(viewer) {
  const [filters, setFiltersState] = React.useState(DEFAULT_FILTERS);

  const setFilter = React.useCallback((k, v) => {
    setFiltersState((f) => ({ ...f, [k]: v }));
  }, []);

  const toggle = React.useCallback((k) => {
    setFiltersState((f) => ({ ...f, [k]: !f[k] }));
  }, []);

  const clearOne = React.useCallback((k) => {
    setFiltersState((f) => {
      const next = { ...f };
      if (k === 'year') { next.yearMin = ''; next.yearMax = ''; }
      else next[k] = typeof DEFAULT_FILTERS[k] === 'boolean' ? false : '';
      return next;
    });
  }, []);

  const clearAll = React.useCallback(() => setFiltersState(DEFAULT_FILTERS), []);

  const apply = React.useCallback((members) => {
    let r = members;
    if (filters.mentor)      r = r.filter((m) => m.open === 'mentor');
    if (filters.nearMe && viewer) r = r.filter((m) => m.city === viewer.city);
    if (filters.peopleIKnow) r = r.filter((m) => KNOWN_IDS.has(m.id));
    if (filters.city)        r = r.filter((m) => (m.city || '').toLowerCase().includes(filters.city.toLowerCase()));
    if (filters.employer)    r = r.filter((m) => (m.employer || '').toLowerCase().includes(filters.employer.toLowerCase()));
    if (filters.topic) {
      const needle = filters.topic.toLowerCase();
      r = r.filter((m) => {
        const hay = [(m.tags || []).join(' '), m.bio || '', m.title || ''].join(' ').toLowerCase();
        return hay.includes(needle);
      });
    }
    const ymin = parseInt(filters.yearMin, 10);
    const ymax = parseInt(filters.yearMax, 10);
    if (!Number.isNaN(ymin)) r = r.filter((m) => m.year >= ymin);
    if (!Number.isNaN(ymax)) r = r.filter((m) => m.year <= ymax);
    return r;
  }, [filters, viewer]);

  const activeChips = React.useMemo(() => {
    const chips = [];
    if (filters.mentor)      chips.push({ key: 'mentor',      label: 'Mentor only' });
    if (filters.nearMe && viewer) chips.push({ key: 'nearMe', label: `Near ${viewer.city.split(',')[0]}` });
    if (filters.peopleIKnow) chips.push({ key: 'peopleIKnow', label: 'People I know' });
    if (filters.city)        chips.push({ key: 'city',        label: `City · ${filters.city}` });
    if (filters.employer)    chips.push({ key: 'employer',    label: `Employer · ${filters.employer}` });
    if (filters.topic)       chips.push({ key: 'topic',       label: `Topic · ${filters.topic}` });
    if (filters.yearMin || filters.yearMax) {
      const lo = filters.yearMin || '…';
      const hi = filters.yearMax || '…';
      chips.push({ key: 'year', label: `Class ${lo}–${hi}` });
    }
    return chips;
  }, [filters, viewer]);

  return {
    filters,
    setFilter,
    toggle,
    clearOne,
    clearAll,
    apply,
    activeChips,
    activeCount: activeChips.length,
  };
}

window.useDirectoryFilters = useDirectoryFilters;
