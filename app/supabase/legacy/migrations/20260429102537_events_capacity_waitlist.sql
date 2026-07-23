-- Day 15: events capacity + waitlist
--
-- Adds optional capacity per event and a 'waitlisted' RSVP status. When
-- capacity is set and going_count >= capacity, new RSVPs land as
-- 'waitlisted'; when a 'going' user un-RSVPs, the lib promotes the oldest
-- waitlisted user back to 'going' (and emails them).
--
-- Migration shape mirrors Day 14b (account_lifecycle) — enum value addition
-- runs in the same transaction as the column add. Safe under modern PG.
-- We do not yet reference 'waitlisted' in any application SQL, so the
-- "can't use new value in same tx" rule is not violated.
--
-- Default for capacity is NULL = unlimited. Pre-existing events keep their
-- behavior; only events created or edited with a value are gated.

alter type event_rsvp_status add value if not exists 'waitlisted';

alter table events
  add column capacity int;

-- Sanity check: capacity, when set, must be a positive integer.
alter table events
  add constraint events_capacity_positive
  check (capacity is null or capacity > 0);

comment on column events.capacity is
  'Maximum number of going RSVPs. NULL means unlimited. When set, new RSVPs past the cap are auto-waitlisted; the lib promotes the oldest waitlisted user when a going user un-RSVPs.';
