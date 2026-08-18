-- Help candidate search: deterministic lexical baseline.
--
-- Replaces the chunk-dependent hybrid retrieval with a self-contained weighted
-- "helper card" search. Decision + evaluation harness:
--   engineering-spec-obsidian-vault/Initiatives/help-search-golden-baseline/
--   memory vault: 2026-08-15-0022-richard-help-search-deterministic-baseline-before-ai
-- Quality is asserted by `pnpm eval:search` against the golden dataset
-- (app/src/lib/help/__fixtures__/golden-search.json + supabase/seeds/eval-org.sql).
--
-- Shape of the change:
--   * Return table changes (score + matched_fields replace the dead
--     lexical/semantic/evidence columns), so this is drop+create — Postgres
--     cannot `create or replace` across OUT-column changes.
--   * Parameter lists are UNCHANGED, including the now-dormant
--     p_query_embedding: callers and to_regprocedure checks keep working, and
--     the parameter stays as the seam for a future semantic stage (which must
--     beat this baseline on the golden set before it returns).
--   * Eligibility gates are copied verbatim from the previous version:
--     open_to_help, not paused, active user + membership, not the viewer, not
--     blocked, under max_pending_requests. A search rewrite must never widen
--     who is reachable.
--
-- Algorithm:
--   document  weighted tsvector built inline per eligible helper:
--             A helper_topics · B headline/current_title/industry ·
--             C employer/university/major/city · D org bio + experiences
--   query     lexemes of to_tsvector('english', question), OR-ed into one
--             tsquery (built from quoted lexemes — user punctuation cannot
--             inject tsquery syntax). Zero informative lexemes -> zero rows.
--   topic hit a topic counts as matched only when ALL of its own lexemes
--             appear in the query ('Managing people' needs manag AND peopl;
--             'for the first time' cannot claim 'First jobs' via 'first').
--   score     rarity-weighted class sum: for each matched query lexeme,
--             (1 / #eligible-docs-containing-it) × Σ weights of the weight
--             CLASSES it appears in (A 1.0 · B 0.5 · C 0.3 · D 0.2, each
--             class counted once per lexeme). Rarity is what lets a unique
--             proper noun (INSEAD, Seoul) in a C field beat a common word in
--             a B field; the class sum is what lets a specialist whose
--             headline AND bio speak to the question beat a bare topic
--             opt-in. ts_rank_cd was tried and rejected: unnormalized, it
--             swamps the topic bonus, and it has no notion of term rarity.
--             Per-FIELD sums (9 tsvectors/row) were tried and rejected too:
--             5.7s at 2k eligible helpers. One weighted tsvector per helper,
--             unnested once, is what keeps this an online query.
--             + 0.5 topic bonus (0.8 when two or more topics match — coverage
--               beats single-topic in crowded fields).
--             A flat query-coverage term was tried and rejected: it paid the
--             same credit for matching generic words ("talk", "want") as for
--             the query's actual subject, which let template phrases outrank
--             true matches. Rarity weighting already rewards multi-term hits.
--   display   structural, no numeric threshold: a topic hit or a match in an
--             A/B/C field (bio/experience text alone never displays someone).
--             Additionally, when >= 3 candidates have topic hits, only
--             topic-hit candidates display: enough members explicitly offer
--             the asked topic, so text matches are padding, not answers.
--   ties      fewer pending asks first (spreads load), then most recently
--             updated profile, then membership id (stability).

drop function api.search_help_candidates(uuid, text, extensions.vector, integer);
drop function api.search_ask_matching_candidates(bigint, text, extensions.vector, integer);
drop function private.search_help_candidates(uuid, uuid, text, extensions.vector, integer);

create function private.search_help_candidates(
  p_organization_id uuid,
  p_viewer_user_id uuid,
  p_question text,
  p_query_embedding extensions.vector(1024) default null,
  p_limit integer default 20
)
returns table (
  helper_membership_id uuid,
  helper_user_id uuid,
  display_name text,
  headline text,
  avatar_path text,
  graduation_year smallint,
  topics text[],
  score double precision,
  matched_fields text[],
  match_reason text
)
language sql
stable
security definer
set search_path = ''
as $$
  with query_lexeme as (
    select lex.lexeme
    from unnest(to_tsvector('english', coalesce(p_question, ''))) as lex
    group by lex.lexeme
  ),
  query_shape as (
    select
      count(*)::double precision as lexeme_count,
      to_tsquery(
        'simple',
        string_agg('''' || replace(lexeme, '''', '''''') || '''', ' | ')
      ) as or_query
    from query_lexeme
  ),
  eligible as (
    select
      helper.id as membership_id,
      helper.user_id,
      p.display_name,
      p.headline,
      p.avatar_path,
      p.current_title,
      p.current_employer,
      p.industry,
      p.city,
      p.university,
      p.major,
      p.updated_at as profile_updated_at,
      op.graduation_year,
      op.bio,
      coalesce((
        select array_agg(ht.name order by ht.sort_order)
        from public.helper_topics ht
        where ht.organization_membership_id = helper.id
      ), '{}'::text[]) as topics,
      pending.waiting_count as pending_count
    from public.organization_memberships helper
    join public.users helper_user
      on helper_user.id = helper.user_id and helper_user.account_state = 'active'
    join public.helper_preferences hp
      on hp.organization_membership_id = helper.id
     and hp.organization_id = helper.organization_id
     and hp.open_to_help = true
     and hp.paused_at is null
    join public.profiles p on p.user_id = helper.user_id
    left join public.organization_profiles op
      on op.organization_membership_id = helper.id
    cross join lateral (
      select count(*) as waiting_count
      from public.asks pending
      where pending.recipient_membership_id = helper.id
        and pending.kind = 'direct'
        and pending.status = 'waiting'
    ) pending
    where helper.organization_id = p_organization_id
      and helper.status = 'active'
      and helper.user_id <> p_viewer_user_id
      and not private.is_blocked(p_viewer_user_id, helper.user_id)
      and pending.waiting_count < hp.max_pending_requests
  ),
  documented as (
    select
      e.*,
      q.lexeme_count,
      setweight(to_tsvector('english', array_to_string(e.topics, ' ')), 'A')
        || setweight(to_tsvector('english', concat_ws(' ', e.headline, e.current_title, e.industry)), 'B')
        || setweight(to_tsvector('english', concat_ws(' ', e.current_employer, e.university, e.major, e.city)), 'C')
        || setweight(to_tsvector('english', concat_ws(' ', e.bio, (
             select string_agg(concat_ws(' ', pe.employer, pe.title, pe.description), ' ')
             from public.profile_experiences pe
             where pe.user_id = e.user_id
           ))), 'D') as document,
      topic_match.matched_topics,
      topic_match.first_matched_topic
    from eligible e
    cross join query_shape q
    cross join lateral (
      select
        count(*) as matched_topics,
        min(topic.name) as first_matched_topic
      from (
        select t.name
        from unnest(e.topics) as t(name)
        where not exists (
          select 1
          from unnest(to_tsvector('english', t.name)) as tl
          where tl.lexeme not in (select lexeme from query_lexeme)
        )
      ) topic
    ) topic_match
    where q.or_query is not null
  ),
  -- One row per (member, matched query lexeme, weight class), from a single
  -- unnest of the weighted document — no per-field tsquery probes.
  doc_hit as (
    select
      d.membership_id,
      entry.lexeme,
      weight_class.class
    from documented d
    cross join lateral unnest(d.document) as entry(lexeme, positions, weights)
    cross join lateral (
      select distinct w.class from unnest(entry.weights) as w(class)
    ) weight_class
    where entry.lexeme in (select lexeme from query_lexeme)
  ),
  lexeme_stats as (
    -- Document frequency per query lexeme across ELIGIBLE helpers: the
    -- rarity signal. A term matching one member is worth its full class sum;
    -- a term matching thirty is nearly generic.
    select
      hit.lexeme,
      count(distinct hit.membership_id)::double precision as df
    from doc_hit hit
    group by hit.lexeme
  ),
  scored as (
    select
      d.*,
      coalesce(hits.text_score, 0) as text_score,
      coalesce(hits.matched_fields, '{}'::text[]) as matched_fields,
      coalesce(hits.matched_classes, '{}'::text[]) as matched_classes
    from documented d
    left join (
      select
        hit.membership_id,
        sum(
          (1.0 / ls.df) * case hit.class
            when 'A' then 1.0
            when 'B' then 0.5
            when 'C' then 0.3
            else 0.2
          end
        )::double precision as text_score,
        array_agg(distinct case hit.class
          when 'A' then 'topics'
          when 'B' then 'headline'
          when 'C' then 'credentials'
          else 'profile'
        end) as matched_fields,
        array_agg(distinct hit.class::text) as matched_classes
      from doc_hit hit
      join lexeme_stats ls on ls.lexeme = hit.lexeme
      group by hit.membership_id
    ) hits on hits.membership_id = d.membership_id
  ),
  gated as (
    select
      s.*,
      count(*) filter (where s.matched_topics > 0) over () as topic_hitter_count
    from scored s
    where s.matched_topics > 0
       or s.matched_classes && array['A', 'B', 'C']
  )
  select
    g.membership_id,
    g.user_id,
    g.display_name,
    g.headline,
    g.avatar_path,
    g.graduation_year,
    g.topics,
    (
      g.text_score
      + case when g.matched_topics >= 2 then 0.8
             when g.matched_topics = 1 then 0.5
             else 0 end
    )::double precision as score,
    g.matched_fields,
    case
      when g.first_matched_topic is not null then 'Speaks to ' || g.first_matched_topic
      else coalesce(g.headline, 'Relevant experience')
    end as match_reason
  from gated g
  where g.matched_topics > 0 or g.topic_hitter_count < 3
  order by
    score desc,
    g.pending_count asc,
    g.profile_updated_at desc,
    g.membership_id asc
  limit greatest(1, least(coalesce(p_limit, 20), 50));
$$;

create function api.search_help_candidates(
  p_membership_id uuid,
  p_question text,
  p_query_embedding extensions.vector(1024) default null,
  p_limit integer default 20
)
returns table (
  helper_membership_id uuid,
  helper_user_id uuid,
  display_name text,
  headline text,
  avatar_path text,
  graduation_year smallint,
  topics text[],
  score double precision,
  matched_fields text[],
  match_reason text
)
language sql
stable
security definer
set search_path = ''
as $$
  with viewer as (
    select m.id, m.organization_id, m.user_id
    from public.organization_memberships m
    join public.users u on u.id = m.user_id and u.account_state = 'active'
    where m.id = p_membership_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  )
  select candidate.*
  from viewer
  cross join lateral private.search_help_candidates(
    viewer.organization_id,
    viewer.user_id,
    p_question,
    p_query_embedding,
    p_limit
  ) candidate;
$$;

create function api.search_ask_matching_candidates(
  p_job_id bigint,
  p_worker_id text,
  p_query_embedding extensions.vector(1024) default null,
  p_limit integer default 40
)
returns table (
  helper_membership_id uuid,
  helper_user_id uuid,
  display_name text,
  headline text,
  avatar_path text,
  graduation_year smallint,
  topics text[],
  score double precision,
  matched_fields text[],
  match_reason text
)
language sql
stable
security definer
set search_path = ''
as $$
  with context as (
    select c.*, m.organization_id, m.user_id as asker_user_id
    from private.get_ask_matching_context(p_job_id, p_worker_id) c
    join public.organization_memberships m on m.id = c.asker_membership_id
  )
  select candidate.*
  from context
  cross join lateral private.search_help_candidates(
    context.organization_id,
    context.asker_user_id,
    context.question,
    p_query_embedding,
    p_limit
  ) candidate;
$$;

revoke all on function private.search_help_candidates(uuid, uuid, text, extensions.vector, integer) from public, anon, authenticated;
revoke all on function api.search_help_candidates(uuid, text, extensions.vector, integer) from public, anon;
grant execute on function api.search_help_candidates(uuid, text, extensions.vector, integer) to authenticated;
revoke all on function api.search_ask_matching_candidates(bigint, text, extensions.vector, integer) from public, anon, authenticated;
grant execute on function api.search_ask_matching_candidates(bigint, text, extensions.vector, integer) to service_role;

notify pgrst, 'reload schema';
