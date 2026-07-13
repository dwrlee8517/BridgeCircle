-- Onboarding rebuild: three new fields supporting the staged 5-step flow
-- and multi-name display.
--
-- 1. users.onboarding_completed_at — set on step-5 finish (or skip).
--    Drives the post-signin redirect: null → route to /onboarding at the
--    user's first uncompleted step; non-null → route to /. Nullable on
--    insert so the auth-user trigger doesn't have to populate it; the
--    redirect logic treats null as "needs onboarding" for new users.
--
--    Existing users (everyone with a row at migration time) are
--    backfilled to now() so they don't get re-prompted through onboarding
--    after this ships. They'll fill any missing fields from /profile/edit
--    as they always have.
--
-- 2/3. base_profiles.preferred_name + base_profiles.name_other —
--    canonical 'name' stays the verification anchor (legal/full name).
--    preferred_name drives directory display when set; name_other is a
--    free-form also-known-as field for multilingual or nickname use,
--    important for the Chadwick US ↔ Chadwick International overlap
--    where the same person may be known as 'Sue Lee' to one cohort and
--    '이수민' to another. Both fields are added to the search haystack so
--    members can find each other under any name they remember.

alter table users
  add column onboarding_completed_at timestamptz;

-- Backfill: grandfather everyone in. New auth users inserted after this
-- migration get null and will be routed through onboarding.
update users
  set onboarding_completed_at = now()
  where onboarding_completed_at is null;

alter table base_profiles
  add column preferred_name text,
  add column name_other text;
