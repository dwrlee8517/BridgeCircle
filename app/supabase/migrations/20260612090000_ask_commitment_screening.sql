-- Mentorship composer split: the asker proposes a pace at compose time.
--
-- commitment — the pace the asker is imagining. Mentorship-only; advice
--   asks leave it null. Shown to the mentor on the review screen with the
--   rest of the request ("a starting point, not a contract").
--
-- (asks.screening_answer already exists from the init migration — the
-- composer finally writes it; no schema change needed for screening.)
--
-- No grant changes needed: INSERT on asks is table-wide for authenticated
-- (the asker writes this at creation), and the UPDATE grant stays
-- restricted to (status, responded_at, decline_reason) — neither side can
-- rewrite the pace after sending.

alter table public.asks
  add column commitment text
    check (commitment in ('few_exchanges', 'monthly_semester', 'ongoing'));
