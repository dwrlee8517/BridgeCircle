-- Rename legacy notification types to match the renamed routes.
--
-- Companion to the app-side rename of /mentorship/request/* and
-- /mentorship/thread/* to /ask/*. The notifications.type column is
-- plain text, not a Postgres enum, so this is a straight UPDATE.
--
-- Pre-launch: only seeded dev data has notifications using the legacy
-- names. Production carries no real users yet. We do this in one
-- forward-only step rather than carrying both names in the union.
--
-- After this migration the union in app/src/lib/notifications/types.ts
-- is the single source of truth for valid type strings.

update notifications set type = 'ask_received'
  where type = 'mentorship_request_received';

update notifications set type = 'ask_accepted'
  where type = 'mentorship_request_accepted';

update notifications set type = 'ask_declined'
  where type = 'mentorship_request_declined';

update notifications set type = 'ask_message'
  where type = 'mentorship_message';
