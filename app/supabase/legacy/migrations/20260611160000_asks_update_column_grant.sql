-- Close the asks client-write surface to the response transition only.
-- The blanket authenticated UPDATE grant (20260426214838) plus the
-- "mentors respond" row policy let a helper write ANY column on asks
-- addressed to them — including reminder_sent_at (added in the previous
-- migration: a helper could burn the asker's one gentle reminder before
-- it unlocked, or clear it) and created_at (which would shift both the
-- reminder unlock and the expiry sweep). Same column-level-grant pattern
-- as open_asks (20260611120000).
--
-- App-code audit (2026-06-11): the only user-scoped-client update on asks
-- writes status + responded_at (lib/asks/respondToAsk.ts). The reminder
-- write and the expiry sweep run on the admin client, which bypasses
-- grants. Deploy-window safe.

revoke update on asks from authenticated;
grant update (status, responded_at) on asks to authenticated;
