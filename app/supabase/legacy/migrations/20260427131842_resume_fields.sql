-- Adds resume-extracted fields to base_profiles for analytical search.
--
-- career_history / education_history are JSONB arrays because they map 1:1
-- to what the LLM extracts and Day 10's NL search reads them via the LLM
-- rerank step (no SQL filters over past roles). skills is a flat tag array.
--
-- No GIN indexes yet — at sub-1000 alumni and zero JSONB queries today,
-- they aren't earning their keep. Add when a real query pattern emerges.

alter table base_profiles
  add column career_history    jsonb,
  add column education_history jsonb,
  add column skills            text[];
