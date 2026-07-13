-- Decline reasons + explicit helper pause (the helper side of the
-- two-sided buffer; see the decline-moment mocks, 2026-06-11).
--
-- A declining helper may optionally pick a structured reason. It shapes
-- the dignified copy the asker sees and gives matching a routing signal
-- ("not_my_area" suppression is a follow-up — the signal is recorded now).

alter table asks add column decline_reason text
  check (decline_reason in ('at_capacity', 'not_my_area', 'not_now'));

comment on column asks.decline_reason is
  'Optional structured reason chosen by the helper at decline time. Shapes asker-facing copy; null = passed without a reason.';

-- The helper writes the reason together with the response transition, so
-- it joins the narrowed client-update surface from 20260611160000.
revoke update on asks from authenticated;
grant update (status, responded_at, decline_reason) on asks to authenticated;

-- Explicit, member-chosen pause with a horizon. Distinct from the
-- inactivity auto-pause: paused_at stays the single flag every matching
-- surface filters on, while paused_until marks the pause as deliberate —
-- the nightly sweep auto-resumes past it, and a settings save (the
-- existing "I'm back" signal) clears both.
alter table helper_preferences add column paused_until timestamptz;

comment on column helper_preferences.paused_until is
  'Horizon of an explicit member-chosen pause. Null for inactivity auto-pauses. The nightly sweep clears paused_at + paused_until once passed.';
