-- Day 17: notifications — realtime + payload column
--
-- Two changes here. Both are small.
--
-- 1. Adds the notifications table to the supabase_realtime publication so
--    clients can subscribe to per-user inserts and update the bell + toast
--    without polling. Same pattern as 20260427233336_messages_realtime.sql.
--    RLS still gates which rows the client receives — a postgres_changes
--    subscription filtered by user_id only sees that user's own notifications.
--
-- 2. Adds a `payload jsonb` column for per-notification context (actor name,
--    event title, etc.). The bell renders rows like "Mark sent you a friend
--    request" — without payload we'd need a join per row to look up the
--    actor's name, which is wasteful for a list of 15. Storing the name at
--    write time is cheap and idempotent.

alter publication supabase_realtime add table notifications;

alter table notifications
  add column payload jsonb;

comment on column notifications.payload is
  'Per-notification context (actor_name, event_title, etc.). Captured at write time so the bell does not need a join-per-row at read time.';
