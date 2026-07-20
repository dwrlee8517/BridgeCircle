-- Flip the default for helper_preferences.open_to_mentorship from false to
-- true. Existing rows are unaffected (each already has a concrete value
-- from the prior migration's backfill); only freshly-inserted rows for
-- new helpers — the case where they haven't visited helper settings yet —
-- start opted in.
--
-- Rationale: at a small school the alumni board needs both supply and
-- demand. Most members who aren't actively opposed to mentorship would
-- benefit from being on. The settings page now shows a friendly caveat
-- when they uncheck the box, naming the value to younger alumni and
-- pointing at the active/pending caps as a way to keep mentorship light
-- rather than turn it off entirely.

alter table helper_preferences
  alter column open_to_mentorship set default true;
