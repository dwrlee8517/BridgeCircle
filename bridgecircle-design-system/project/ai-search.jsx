/* eslint-disable */
// AI-assisted member search — shared between Civic and Atrium prototypes.
//
// Mirrors the production NL pipeline in concept:
//   1. Stage "Reading your search…"      (would be: Haiku filter extraction)
//   2. Stage "Looking through your circle…" (would be: Postgres pool query)
//   3. Stage "Reading career histories…"    (would be: Haiku rerank w/ rationales)
//
// In the prototype, stages 1+2 are scripted timing; stage 3 fires an actual
// claude.complete call asking for ordered IDs + per-result rationales. If
// claude is unavailable, falls back to a heuristic keyword scorer so the
// experience still works end-to-end for design review.

const AI_STAGE_COPY = {
  idle:      null,
  reading:   'Reading your search…',
  looking:   'Looking through your circle…',
  reasoning: 'Reading career histories and skills…',
  ready:     null,
  error:     null,
  empty:     null,
};

const AI_EXAMPLES = [
  'designers in Brooklyn open to mentoring',
  'product folks who switched into climate',
  'someone who can advise on a seed deck',
  'founders who left big tech for nonprofits',
];

function useAISearch(members) {
  const [query, setQuery]   = React.useState('');
  const [stage, setStage]   = React.useState('idle');
  const [results, setResults] = React.useState(null); // null | [{id, rationale}]
  const [extracted, setExtracted] = React.useState(null); // {filters:{}, theme:''}
  const cacheRef = React.useRef(new Map());
  const runIdRef = React.useRef(0);

  const run = React.useCallback(async (raw) => {
    const q = (raw || '').trim();
    if (!q) {
      setQuery('');
      setStage('idle');
      setResults(null);
      setExtracted(null);
      return;
    }
    const runId = ++runIdRef.current;
    setQuery(q);

    // Cache hit — still flash a tiny "reading" so it feels reactive.
    if (cacheRef.current.has(q)) {
      const cached = cacheRef.current.get(q);
      setStage('reading');
      await sleep(220);
      if (runId !== runIdRef.current) return;
      setExtracted(cached.extracted);
      setResults(cached.results);
      setStage(cached.results.length === 0 ? 'empty' : 'ready');
      return;
    }

    // Stage 1: pretend extraction
    setStage('reading');
    setResults(null);
    setExtracted(null);
    await sleep(550);
    if (runId !== runIdRef.current) return;

    // Stage 2: pretend pool query — also do a fast heuristic pre-filter so
    // the candidate pool is bounded and relevant before the LLM call.
    setStage('looking');
    const candidates = preFilter(members, q).slice(0, 20);
    await sleep(450);
    if (runId !== runIdRef.current) return;

    // Stage 3: actual LLM call (or heuristic fallback).
    setStage('reasoning');
    let parsed = null;
    try {
      if (window.claude && typeof window.claude.complete === 'function') {
        parsed = await callClaude(q, candidates);
      }
    } catch (e) {
      parsed = null;
    }
    if (runId !== runIdRef.current) return;

    if (!parsed) {
      // Heuristic fallback so the prototype is still demoable offline.
      parsed = heuristicRank(q, candidates);
    }

    const cleaned = (parsed.matches || [])
      .map(m => ({
        id: m.id,
        rationale: typeof m.rationale === 'string' ? m.rationale.trim() : '',
      }))
      .filter(m => members.find(mm => mm.id === m.id))
      .slice(0, 8);

    const payload = {
      results: cleaned,
      extracted: parsed.extracted || null,
    };
    cacheRef.current.set(q, payload);
    setExtracted(payload.extracted);
    setResults(cleaned);
    setStage(cleaned.length === 0 ? 'empty' : 'ready');
  }, [members]);

  const clear = React.useCallback(() => {
    runIdRef.current++;
    setQuery('');
    setStage('idle');
    setResults(null);
    setExtracted(null);
  }, []);

  return { run, clear, query, stage, results, extracted };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Lightweight pre-filter: tokens overlap with name/title/employer/city/tags/bio.
// Always returns at least 8 candidates so the LLM has something to rank if
// the user's terms don't match anyone literally.
function preFilter(members, q) {
  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
  const scored = members.map(m => {
    const hay = [m.name, m.title, m.employer, m.city, (m.tags || []).join(' '), m.bio || '']
      .join(' ').toLowerCase();
    let score = 0;
    for (const t of tokens) if (hay.includes(t)) score += 1;
    // Slight boost for mentor-open if query mentions mentor/advice/help.
    if (m.open === 'mentor' && /mentor|help|advise|advice|guidance/.test(q.toLowerCase())) score += 0.5;
    return { m, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const filtered = scored.filter(s => s.score > 0);
  // If nothing matched literally, fall back to all members so the LLM can do
  // thematic matching from scratch.
  return (filtered.length >= 4 ? filtered : scored).map(s => s.m);
}

async function callClaude(query, candidates) {
  const compact = candidates.map(m => ({
    id: m.id,
    name: m.name,
    year: m.year,
    role: `${m.title || ''} at ${m.employer || ''}`.trim(),
    city: m.city,
    openTo: m.open,
    tags: m.tags || [],
    bio: m.bio || '',
  }));
  const prompt = [
    'You rank alumni search results for a small members-only network.',
    '',
    `Search: "${query}"`,
    '',
    'Candidates:',
    JSON.stringify(compact),
    '',
    'Return a single JSON object — no prose, no markdown fences. Schema:',
    '{',
    '  "extracted": { "filters": { "city": string|null, "employer": string|null, "topic": string|null, "openToMentor": boolean|null, "yearMin": number|null, "yearMax": number|null }, "theme": string|null },',
    '  "matches": [ { "id": string, "rationale": string } ]',
    '}',
    '',
    'Rules:',
    '- Include 3 to 8 matches, ordered best first.',
    '- Each rationale is ONE concise sentence (max 22 words), addressed to the searcher in second person ("she", "he", "they" for the alum is fine).',
    '- Reference a SPECIFIC detail — a city, employer, tag, or line from the bio — never generic praise.',
    '- If genuinely nothing matches, return "matches": [].',
    '- "extracted.filters" reflects what you understood from the query; use null for fields the query did not imply.',
    '- "extracted.theme" is a short phrase summarising the thematic intent (e.g. "career pivot to climate"), or null.',
  ].join('\n');

  const raw = await window.claude.complete(prompt);
  return parseLLMJson(raw);
}

function parseLLMJson(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let text = raw.trim();
  // Strip code fences if the model added them despite instructions.
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  // If extra prose surrounds the JSON, grab the largest {...} block.
  const first = text.indexOf('{');
  const last  = text.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    text = text.slice(first, last + 1);
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

// Offline fallback — scores candidates by token overlap and synthesises
// templated rationales. Plain but functional; lets the prototype be reviewed
// without a working claude.complete bridge.
function heuristicRank(query, candidates) {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const scored = candidates.map(m => {
    const hay = [m.name, m.title, m.employer, m.city, (m.tags || []).join(' '), m.bio || '']
      .join(' ').toLowerCase();
    let score = 0;
    const reasons = [];
    for (const t of tokens) {
      if (hay.includes(t)) {
        score += 1;
        if ((m.city || '').toLowerCase().includes(t)) reasons.push(`based in ${m.city}`);
        else if ((m.employer || '').toLowerCase().includes(t)) reasons.push(`at ${m.employer}`);
        else if ((m.tags || []).join(' ').toLowerCase().includes(t)) reasons.push(`works on ${t}`);
      }
    }
    if (m.open === 'mentor' && /mentor|help|advise/.test(query.toLowerCase())) {
      score += 0.5; reasons.push('open to mentoring');
    }
    const rationale = reasons.length
      ? `${m.name.split(' ')[0]} is ${uniq(reasons).slice(0, 2).join(' and ')}.`
      : `${m.name.split(' ')[0]} — ${m.title} at ${m.employer}, class of ’${String(m.year).slice(-2)}.`;
    return { m, score, rationale };
  });
  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter(s => s.score > 0).slice(0, 6);
  return {
    extracted: { filters: {}, theme: null },
    matches: top.map(s => ({ id: s.m.id, rationale: s.rationale })),
  };
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

window.useAISearch  = useAISearch;
window.AI_STAGE_COPY = AI_STAGE_COPY;
window.AI_EXAMPLES   = AI_EXAMPLES;
