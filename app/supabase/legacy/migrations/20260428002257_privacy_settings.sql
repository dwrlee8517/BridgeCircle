-- Per-section privacy settings for member profiles.
--
-- Stored as JSONB so we can add new sections without a schema change. Keys
-- are section names ('contact_links', 'career_history', 'education_history',
-- 'bio', 'skills'); values are tier strings ('org' | 'friends' | 'self').
-- Missing keys fall back to defaults defined in /lib/profile/privacy.ts.
--
-- Directory fields (name, graduation_year, city, current_employer,
-- current_title, university, major) are NOT configurable — they're the
-- always-org-visible directory by design. Hiding them defeats the purpose
-- of being in the directory.
--
-- No GIN index — at sub-1000 alumni this is read alongside the profile row
-- by user_id PK, never queried by content. Add later if a privacy-driven
-- query pattern emerges.

alter table base_profiles
  add column privacy_settings jsonb not null default '{}'::jsonb;
