-- One gentle reminder per direct ask. The asker may resurface a pending
-- ask once after the unlock window (7 days); the column doubles as the
-- "already used" flag. Intended writes go through service-role code only
-- (lib/asks/askLifecycle.ts validates ownership + timing). Note: the
-- blanket authenticated UPDATE grant initially left this column
-- helper-writable through the "mentors respond" row policy — closed by
-- the column-level grant in 20260611160000.

alter table asks add column reminder_sent_at timestamptz;

comment on column asks.reminder_sent_at is
  'When the asker sent their one gentle reminder. Null = available once unlocked; set = spent.';
