--
-- PostgreSQL database dump
--

-- \restrict dec2s6qZH2ePgTRQ4zbFmsJ654HrXNjnUeFUyCABW5hbfnlwp5fVJ4rrYgT14cw

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
-- SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";

--
-- Name: SCHEMA "public"; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA "public" IS 'BridgeCircle public schema. Branching smoke test verified 2026-04-29.';


--
-- Name: admin_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."admin_role" AS ENUM (
    'super_admin',
    'admin',
    'event_moderator',
    'ambassador'
);


ALTER TYPE "public"."admin_role" OWNER TO "postgres";

--
-- Name: ask_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."ask_status" AS ENUM (
    'pending',
    'accepted',
    'declined',
    'expired'
);


ALTER TYPE "public"."ask_status" OWNER TO "postgres";

--
-- Name: ask_thread_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."ask_thread_status" AS ENUM (
    'active',
    'archived'
);


ALTER TYPE "public"."ask_thread_status" OWNER TO "postgres";

--
-- Name: ask_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."ask_type" AS ENUM (
    'advice',
    'mentorship'
);


ALTER TYPE "public"."ask_type" OWNER TO "postgres";

--
-- Name: event_rsvp_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."event_rsvp_status" AS ENUM (
    'going',
    'not_going',
    'waitlisted'
);


ALTER TYPE "public"."event_rsvp_status" OWNER TO "postgres";

--
-- Name: friend_request_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."friend_request_status" AS ENUM (
    'pending',
    'accepted',
    'declined'
);


ALTER TYPE "public"."friend_request_status" OWNER TO "postgres";

--
-- Name: invite_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."invite_status" AS ENUM (
    'pending',
    'accepted',
    'expired',
    'revoked'
);


ALTER TYPE "public"."invite_status" OWNER TO "postgres";

--
-- Name: membership_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."membership_status" AS ENUM (
    'pending',
    'active',
    'rejected',
    'revoked',
    'self_deactivated'
);


ALTER TYPE "public"."membership_status" OWNER TO "postgres";

--
-- Name: message_thread_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."message_thread_type" AS ENUM (
    'ask',
    'direct'
);


ALTER TYPE "public"."message_thread_type" OWNER TO "postgres";

--
-- Name: analytics_active_signed_in_count("uuid", interval); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."analytics_active_signed_in_count"("_org" "uuid", "_within" interval DEFAULT '30 days'::interval) RETURNS integer
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select count(distinct om.user_id)::int
  from organization_memberships om
  join auth.users au on au.id = om.user_id
  where om.organization_id = _org
    and om.status = 'active'
    and au.last_sign_in_at is not null
    and au.last_sign_in_at > now() - _within
$$;


ALTER FUNCTION "public"."analytics_active_signed_in_count"("_org" "uuid", "_within" interval) OWNER TO "postgres";

--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.users (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

--
-- Name: is_active_member_of("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."is_active_member_of"("org_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from organization_memberships
    where user_id = auth.uid()
      and organization_id = org_id
      and status = 'active'
  );
$$;


ALTER FUNCTION "public"."is_active_member_of"("org_id" "uuid") OWNER TO "postgres";

--
-- Name: is_admin_of("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."is_admin_of"("org_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from admin_role_assignments
    where user_id = auth.uid()
      and organization_id = org_id
      and role in ('super_admin', 'admin')
  );
$$;


ALTER FUNCTION "public"."is_admin_of"("org_id" "uuid") OWNER TO "postgres";

--
-- Name: match_profile_embedding_chunks("uuid", "public"."vector", "uuid", "uuid"[], integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."match_profile_embedding_chunks"("p_organization_id" "uuid", "p_query_embedding" "public"."vector", "p_viewer_id" "uuid", "p_friend_ids" "uuid"[], "p_limit" integer DEFAULT 80) RETURNS TABLE("chunk_id" "uuid", "user_id" "uuid", "organization_membership_id" "uuid", "chunk_kind" "text", "source_section" "text", "visibility_tier" "text", "content" "text", "similarity" double precision)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select
    c.id as chunk_id,
    c.user_id,
    c.organization_membership_id,
    c.chunk_kind,
    c.source_section,
    c.visibility_tier,
    c.content,
    1 - (c.embedding <=> p_query_embedding) as similarity
  from profile_embedding_chunks c
  join organization_memberships m
    on m.id = c.organization_membership_id
  where c.organization_id = p_organization_id
    and m.status = 'active'
    and c.user_id <> p_viewer_id
    and (
      c.visibility_tier = 'org'
      or (
        c.visibility_tier = 'friends'
        and c.user_id = any(coalesce(p_friend_ids, '{}'::uuid[]))
      )
    )
  order by c.embedding <=> p_query_embedding
  limit greatest(1, least(coalesce(p_limit, 80), 200));
$$;


ALTER FUNCTION "public"."match_profile_embedding_chunks"("p_organization_id" "uuid", "p_query_embedding" "public"."vector", "p_viewer_id" "uuid", "p_friend_ids" "uuid"[], "p_limit" integer) OWNER TO "postgres";

--
-- Name: shares_org_with("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."shares_org_with"("other_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from organization_memberships m1
    join organization_memberships m2 on m2.organization_id = m1.organization_id
    where m1.user_id = auth.uid()
      and m1.status = 'active'
      and m2.user_id = other_user_id
      and m2.status = 'active'
  );
$$;


ALTER FUNCTION "public"."shares_org_with"("other_user_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

--
-- Name: admin_role_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."admin_role_assignments" (
    "user_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "role" "public"."admin_role" NOT NULL,
    "granted_by" "uuid",
    "granted_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."admin_role_assignments" OWNER TO "postgres";

--
-- Name: organization_memberships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."organization_memberships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "status" "public"."membership_status" DEFAULT 'pending'::"public"."membership_status" NOT NULL,
    "joined_at" timestamp with time zone,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."organization_memberships" OWNER TO "postgres";

--
-- Name: analytics_active_membership_count; Type: VIEW; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW "public"."analytics_active_membership_count" AS
 SELECT "organization_id",
    ("count"(*))::integer AS "active_members"
   FROM "public"."organization_memberships"
  WHERE ("status" = 'active'::"public"."membership_status")
  GROUP BY "organization_id";


ALTER VIEW "public"."analytics_active_membership_count" OWNER TO "postgres";

--
-- Name: invites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "token" "text" NOT NULL,
    "status" "public"."invite_status" DEFAULT 'pending'::"public"."invite_status" NOT NULL,
    "full_name" "text",
    "graduation_year" integer,
    "expires_at" timestamp with time zone,
    "sent_by" "uuid",
    "accepted_by" "uuid",
    "accepted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."invites" OWNER TO "postgres";

--
-- Name: analytics_invited_to_active; Type: VIEW; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW "public"."analytics_invited_to_active" AS
 SELECT "organization_id",
    ("count"(*))::integer AS "invited_30d",
    ("count"(*) FILTER (WHERE (("status" = 'accepted'::"public"."invite_status") AND ("accepted_by" IS NOT NULL) AND (EXISTS ( SELECT 1
           FROM "public"."organization_memberships" "om"
          WHERE (("om"."user_id" = "i"."accepted_by") AND ("om"."organization_id" = "i"."organization_id") AND ("om"."status" = 'active'::"public"."membership_status")))))))::integer AS "became_active_30d"
   FROM "public"."invites" "i"
  WHERE ("created_at" > ("now"() - '30 days'::interval))
  GROUP BY "organization_id";


ALTER VIEW "public"."analytics_invited_to_active" OWNER TO "postgres";

--
-- Name: asks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."asks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "helper_id" "uuid" NOT NULL,
    "asker_id" "uuid" NOT NULL,
    "status" "public"."ask_status" DEFAULT 'pending'::"public"."ask_status" NOT NULL,
    "reason" "text",
    "help_needed" "text",
    "background" "text",
    "screening_answer" "text",
    "responded_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ask_type" "public"."ask_type" DEFAULT 'mentorship'::"public"."ask_type" NOT NULL,
    "reminder_sent_at" timestamp with time zone,
    "decline_reason" "text",
    "commitment" "text",
    CONSTRAINT "asks_commitment_check" CHECK (("commitment" = ANY (ARRAY['few_exchanges'::"text", 'monthly_semester'::"text", 'ongoing'::"text"]))),
    CONSTRAINT "asks_decline_reason_check" CHECK (("decline_reason" = ANY (ARRAY['at_capacity'::"text", 'not_my_area'::"text", 'not_now'::"text"]))),
    CONSTRAINT "mentorship_requests_check" CHECK (("helper_id" <> "asker_id"))
);


ALTER TABLE "public"."asks" OWNER TO "postgres";

--
-- Name: COLUMN "asks"."reminder_sent_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."asks"."reminder_sent_at" IS 'When the asker sent their one gentle reminder. Null = available once unlocked; set = spent.';


--
-- Name: COLUMN "asks"."decline_reason"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."asks"."decline_reason" IS 'Optional structured reason chosen by the helper at decline time. Shapes asker-facing copy; null = passed without a reason.';


--
-- Name: analytics_mentorship_30d; Type: VIEW; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW "public"."analytics_mentorship_30d" AS
 SELECT "organization_id",
    ("count"(*))::integer AS "total_requests",
    ("count"(*) FILTER (WHERE ("created_at" < ("now"() - '7 days'::interval))))::integer AS "eligible_for_response_check",
    ("count"(*) FILTER (WHERE (("created_at" < ("now"() - '7 days'::interval)) AND ("responded_at" IS NOT NULL) AND (("responded_at" - "created_at") <= '7 days'::interval))))::integer AS "responded_within_7d"
   FROM "public"."asks"
  WHERE ("created_at" > ("now"() - '30 days'::interval))
  GROUP BY "organization_id";


ALTER VIEW "public"."analytics_mentorship_30d" OWNER TO "postgres";

--
-- Name: base_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."base_profiles" (
    "user_id" "uuid" NOT NULL,
    "name" "text",
    "headline" "text",
    "current_employer" "text",
    "current_title" "text",
    "city" "text",
    "university" "text",
    "major" "text",
    "linkedin_url" "text",
    "avatar_url" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "career_history" "jsonb",
    "education_history" "jsonb",
    "skills" "text"[],
    "privacy_settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "preferred_name" "text",
    "name_other" "text"
);


ALTER TABLE "public"."base_profiles" OWNER TO "postgres";

--
-- Name: analytics_profile_freshness; Type: VIEW; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW "public"."analytics_profile_freshness" AS
 SELECT "om"."organization_id",
    ("count"(DISTINCT "om"."user_id"))::integer AS "total_active",
    ("count"(DISTINCT "om"."user_id") FILTER (WHERE (("bp"."updated_at" IS NOT NULL) AND ("bp"."updated_at" > ("now"() - '6 mons'::interval)))))::integer AS "fresh_profiles"
   FROM ("public"."organization_memberships" "om"
     LEFT JOIN "public"."base_profiles" "bp" ON (("bp"."user_id" = "om"."user_id")))
  WHERE ("om"."status" = 'active'::"public"."membership_status")
  GROUP BY "om"."organization_id";


ALTER VIEW "public"."analytics_profile_freshness" OWNER TO "postgres";

--
-- Name: event_rsvps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."event_rsvps" (
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "public"."event_rsvp_status" NOT NULL,
    "responded_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."event_rsvps" OWNER TO "postgres";

--
-- Name: events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "created_by" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "location" "text",
    "starts_at" timestamp with time zone NOT NULL,
    "ends_at" timestamp with time zone,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "capacity" integer,
    CONSTRAINT "events_capacity_positive" CHECK ((("capacity" IS NULL) OR ("capacity" > 0)))
);


ALTER TABLE "public"."events" OWNER TO "postgres";

--
-- Name: COLUMN "events"."capacity"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."events"."capacity" IS 'Maximum number of going RSVPs. NULL means unlimited. When set, new RSVPs past the cap are auto-waitlisted; the lib promotes the oldest waitlisted user when a going user un-RSVPs.';


--
-- Name: analytics_upcoming_rsvps; Type: VIEW; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW "public"."analytics_upcoming_rsvps" AS
 SELECT "e"."organization_id",
    ("count"(DISTINCT "e"."id"))::integer AS "upcoming_events",
    ("count"("r".*) FILTER (WHERE ("r"."status" = 'going'::"public"."event_rsvp_status")))::integer AS "going_count",
    ("count"("r".*) FILTER (WHERE ("r"."status" = 'waitlisted'::"public"."event_rsvp_status")))::integer AS "waitlist_count"
   FROM ("public"."events" "e"
     LEFT JOIN "public"."event_rsvps" "r" ON (("r"."event_id" = "e"."id")))
  WHERE (("e"."starts_at" > "now"()) AND ("e"."published_at" IS NOT NULL))
  GROUP BY "e"."organization_id";


ALTER VIEW "public"."analytics_upcoming_rsvps" OWNER TO "postgres";

--
-- Name: announcements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."announcements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "created_by" "uuid",
    "title" "text" NOT NULL,
    "body" "text",
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."announcements" OWNER TO "postgres";

--
-- Name: ask_threads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."ask_threads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ask_id" "uuid" NOT NULL,
    "helper_id" "uuid" NOT NULL,
    "asker_id" "uuid" NOT NULL,
    "status" "public"."ask_thread_status" DEFAULT 'active'::"public"."ask_thread_status" NOT NULL,
    "last_message_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ask_threads" OWNER TO "postgres";

--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "actor_id" "uuid",
    "organization_id" "uuid",
    "action" "text" NOT NULL,
    "target_type" "text",
    "target_id" "text",
    "payload" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."audit_log" OWNER TO "postgres";

--
-- Name: direct_message_threads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."direct_message_threads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_a_id" "uuid" NOT NULL,
    "user_b_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "direct_message_threads_check" CHECK (("user_a_id" < "user_b_id"))
);


ALTER TABLE "public"."direct_message_threads" OWNER TO "postgres";

--
-- Name: enrichment_sweep_jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."enrichment_sweep_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider" "text" NOT NULL,
    "snapshot_id" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "member_count" integer NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "error" "text",
    "targets" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    CONSTRAINT "enrichment_sweep_jobs_provider_check" CHECK (("provider" = ANY (ARRAY['brightdata'::"text", 'linkdapi'::"text", 'pdl'::"text"]))),
    CONSTRAINT "enrichment_sweep_jobs_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'ready'::"text", 'downloaded'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."enrichment_sweep_jobs" OWNER TO "postgres";

--
-- Name: TABLE "enrichment_sweep_jobs"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."enrichment_sweep_jobs" IS 'Snapshot lifecycle for async sweep providers (Bright Data is async; LinkdAPI/PDL fallback rows are immediately downloaded).';


--
-- Name: COLUMN "enrichment_sweep_jobs"."targets"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."enrichment_sweep_jobs"."targets" IS 'Frozen target list at snapshot start: [{ userId, url }, ...]. Used by the poll cron to map Bright Data records (url-keyed) back to user_ids.';


--
-- Name: friend_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."friend_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "receiver_id" "uuid" NOT NULL,
    "status" "public"."friend_request_status" DEFAULT 'pending'::"public"."friend_request_status" NOT NULL,
    "message" "text",
    "responded_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "friend_requests_check" CHECK (("sender_id" <> "receiver_id"))
);


ALTER TABLE "public"."friend_requests" OWNER TO "postgres";

--
-- Name: friendships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."friendships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_a_id" "uuid" NOT NULL,
    "user_b_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "friendships_check" CHECK (("user_a_id" < "user_b_id"))
);


ALTER TABLE "public"."friendships" OWNER TO "postgres";

--
-- Name: helper_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."helper_preferences" (
    "organization_membership_id" "uuid" NOT NULL,
    "topics" "text"[],
    "screening_prompt" "text",
    "max_active_mentees" integer DEFAULT 5 NOT NULL,
    "max_pending_requests" integer DEFAULT 10 NOT NULL,
    "paused_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "open_to_advice" boolean DEFAULT true NOT NULL,
    "open_to_mentorship" boolean DEFAULT true NOT NULL,
    "paused_until" timestamp with time zone
);


ALTER TABLE "public"."helper_preferences" OWNER TO "postgres";

--
-- Name: COLUMN "helper_preferences"."paused_until"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."helper_preferences"."paused_until" IS 'Horizon of an explicit member-chosen pause. Null for inactivity auto-pauses. The nightly sweep clears paused_at + paused_until once passed.';


--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "thread_id" "uuid" NOT NULL,
    "thread_type" "public"."message_thread_type" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "body" "text" NOT NULL,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."messages" OWNER TO "postgres";

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "organization_id" "uuid",
    "type" "text" NOT NULL,
    "target_type" "text",
    "target_id" "text",
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "payload" "jsonb"
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";

--
-- Name: COLUMN "notifications"."payload"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."notifications"."payload" IS 'Per-notification context (actor_name, event_title, etc.). Captured at write time so the bell does not need a join-per-row at read time.';


--
-- Name: open_ask_matches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."open_ask_matches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "open_ask_id" "uuid" NOT NULL,
    "helper_user_id" "uuid" NOT NULL,
    "match_score" numeric,
    "rationale" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notified_at" timestamp with time zone
);


ALTER TABLE "public"."open_ask_matches" OWNER TO "postgres";

--
-- Name: TABLE "open_ask_matches"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."open_ask_matches" IS 'Sweep-discovered helper matches for standing asks. Service-role only; no client policies.';


--
-- Name: open_asks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."open_asks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "question" "text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "close_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "closed_at" timestamp with time zone,
    "last_matched_at" timestamp with time zone,
    CONSTRAINT "open_asks_check" CHECK ((("status" = 'open'::"text") OR ("closed_at" IS NOT NULL))),
    CONSTRAINT "open_asks_check1" CHECK ((("close_reason" IS NULL) OR ("status" = 'closed'::"text"))),
    CONSTRAINT "open_asks_check2" CHECK (("expires_at" <= ("created_at" + '30 days'::interval))),
    CONSTRAINT "open_asks_close_reason_check" CHECK (("close_reason" = ANY (ARRAY['member_closed'::"text", 'resolved'::"text"]))),
    CONSTRAINT "open_asks_question_check" CHECK ((("char_length"("question") >= 10) AND ("char_length"("question") <= 400))),
    CONSTRAINT "open_asks_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'closed'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."open_asks" OWNER TO "postgres";

--
-- Name: TABLE "open_asks"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."open_asks" IS 'Standing asks left open for background matching after live search found no strong fit.';


--
-- Name: organization_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."organization_profiles" (
    "organization_membership_id" "uuid" NOT NULL,
    "graduation_year" integer,
    "bio" "text",
    "mentoring_topics" "text"[],
    "open_to_mentor" boolean DEFAULT false NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."organization_profiles" OWNER TO "postgres";

--
-- Name: organizations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "requires_admin_approval" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";

--
-- Name: COLUMN "organizations"."requires_admin_approval"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."organizations"."requires_admin_approval" IS 'When true, invite acceptance lands as status=pending and admins must approve from /admin/approvals. When false (default), invite acceptance is auto-approved to status=active.';


--
-- Name: profile_change_proposals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."profile_change_proposals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "source" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "current_snapshot" "jsonb" NOT NULL,
    "proposed_snapshot" "jsonb" NOT NULL,
    "diff" "jsonb",
    "source_run_id" "uuid",
    "confidence" numeric(4,3),
    "review_token" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "profile_change_proposals_source_check" CHECK (("source" = ANY (ARRAY['linkdapi'::"text", 'brightdata'::"text", 'pdl'::"text", 'resume'::"text", 'manual'::"text"]))),
    CONSTRAINT "profile_change_proposals_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'edited'::"text", 'declined'::"text", 'auto_applied'::"text", 'superseded'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."profile_change_proposals" OWNER TO "postgres";

--
-- Name: TABLE "profile_change_proposals"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."profile_change_proposals" IS 'A user-visible diff between stored profile and provider-fetched profile. Confirmed/edited via session UI on the profile page; the same review UI is reachable via signed-token email link.';


--
-- Name: profile_embedding_chunks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."profile_embedding_chunks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "organization_membership_id" "uuid" NOT NULL,
    "chunk_kind" "text" NOT NULL,
    "source_section" "text" NOT NULL,
    "visibility_tier" "text" NOT NULL,
    "content" "text" NOT NULL,
    "content_hash" "text" NOT NULL,
    "synthetic_prompt_version" "text",
    "embedding_model" "text" NOT NULL,
    "embedding_dim" integer DEFAULT 1024 NOT NULL,
    "embedding" "public"."vector"(1024) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "profile_embedding_chunks_chunk_kind_check" CHECK (("chunk_kind" = ANY (ARRAY['raw'::"text", 'synthetic'::"text"]))),
    CONSTRAINT "profile_embedding_chunks_embedding_dim_check" CHECK (("embedding_dim" = 1024)),
    CONSTRAINT "profile_embedding_chunks_source_section_check" CHECK (("source_section" = ANY (ARRAY['directory'::"text", 'career_history'::"text", 'education_history'::"text", 'bio'::"text", 'skills'::"text", 'mentoring_topics'::"text", 'career_path_summary'::"text", 'help_topics_summary'::"text"]))),
    CONSTRAINT "profile_embedding_chunks_visibility_tier_check" CHECK (("visibility_tier" = ANY (ARRAY['org'::"text", 'friends'::"text"])))
);


ALTER TABLE "public"."profile_embedding_chunks" OWNER TO "postgres";

--
-- Name: profile_embedding_index_status; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."profile_embedding_index_status" (
    "organization_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "organization_membership_id" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "dirty_reason" "text",
    "dirty_since" timestamp with time zone,
    "last_indexed_at" timestamp with time zone,
    "last_success_at" timestamp with time zone,
    "last_error" "text",
    "attempt_count" integer DEFAULT 0 NOT NULL,
    "locked_at" timestamp with time zone,
    "locked_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "profile_embedding_index_status_attempt_count_check" CHECK (("attempt_count" >= 0)),
    CONSTRAINT "profile_embedding_index_status_status_check" CHECK (("status" = ANY (ARRAY['dirty'::"text", 'indexing'::"text", 'ready'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."profile_embedding_index_status" OWNER TO "postgres";

--
-- Name: TABLE "profile_embedding_index_status"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."profile_embedding_index_status" IS 'Service-role owned queue/status table for async Ask profile embedding indexing.';


--
-- Name: profile_enrichment_runs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."profile_enrichment_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "purpose" "text" NOT NULL,
    "status" "text" NOT NULL,
    "cost_units" integer,
    "fingerprint" "text",
    "error" "text",
    "fetched_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "profile_enrichment_runs_provider_check" CHECK (("provider" = ANY (ARRAY['linkdapi'::"text", 'brightdata'::"text", 'pdl'::"text"]))),
    CONSTRAINT "profile_enrichment_runs_purpose_check" CHECK (("purpose" = ANY (ARRAY['onboarding_import'::"text", 'manual_refresh'::"text", 'scheduled_sweep'::"text", 'sweep_miss_fallback'::"text", 'fallback_verification'::"text"]))),
    CONSTRAINT "profile_enrichment_runs_status_check" CHECK (("status" = ANY (ARRAY['succeeded'::"text", 'no_match'::"text", 'failed'::"text", 'skipped_cap'::"text", 'skipped_unchanged'::"text"])))
);


ALTER TABLE "public"."profile_enrichment_runs" OWNER TO "postgres";

--
-- Name: TABLE "profile_enrichment_runs"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."profile_enrichment_runs" IS 'One row per provider call. Powers per-user audit, the 3-miss escalation rule, and provider cost telemetry.';


--
-- Name: profile_enrichment_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."profile_enrichment_settings" (
    "user_id" "uuid" NOT NULL,
    "linkedin_url" "text",
    "linkedin_username" "text",
    "primary_provider_name" "text",
    "primary_provider_id" "text",
    "refresh_policy" "text" DEFAULT 'review_before_update'::"text" NOT NULL,
    "refresh_interval" "text" DEFAULT 'monthly'::"text" NOT NULL,
    "consented_at" timestamp with time zone,
    "last_checked_at" timestamp with time zone,
    "last_enriched_at" timestamp with time zone,
    "last_profile_fingerprint" "text",
    "consecutive_sweep_misses" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "profile_enrichment_settings_primary_provider_name_check" CHECK (("primary_provider_name" = ANY (ARRAY['linkdapi'::"text", 'brightdata'::"text", 'pdl'::"text"]))),
    CONSTRAINT "profile_enrichment_settings_refresh_interval_check" CHECK (("refresh_interval" = ANY (ARRAY['monthly'::"text", 'quarterly'::"text"]))),
    CONSTRAINT "profile_enrichment_settings_refresh_policy_check" CHECK (("refresh_policy" = ANY (ARRAY['manual_only'::"text", 'review_before_update'::"text", 'auto_apply_and_notify'::"text"])))
);


ALTER TABLE "public"."profile_enrichment_settings" OWNER TO "postgres";

--
-- Name: TABLE "profile_enrichment_settings"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."profile_enrichment_settings" IS 'Per-user freshness config and last-seen fingerprint. Authoritative source for sweep targeting; base_profiles.linkedin_url stays the display field.';


--
-- Name: profile_refresh_prompts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."profile_refresh_prompts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_membership_id" "uuid" NOT NULL,
    "due_at" timestamp with time zone NOT NULL,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profile_refresh_prompts" OWNER TO "postgres";

--
-- Name: saved_searches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."saved_searches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "filters" "jsonb" NOT NULL,
    "notify_cadence" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."saved_searches" OWNER TO "postgres";

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "deleted_at" timestamp with time zone,
    "last_seen_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "delete_scheduled_for" timestamp with time zone,
    "delete_reason" "text",
    "delete_initiated_by_admin" boolean DEFAULT false NOT NULL,
    "onboarding_completed_at" timestamp with time zone
);


ALTER TABLE "public"."users" OWNER TO "postgres";

--
-- Name: COLUMN "users"."delete_scheduled_for"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."users"."delete_scheduled_for" IS 'When set, account is scheduled for tombstoning. Memberships are already revoked. Cleared on cancel or finalization.';


--
-- Name: COLUMN "users"."delete_reason"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."users"."delete_reason" IS 'Reason captured at delete request. Surfaced in emails (admin path) and the cancel-deletion page.';


--
-- Name: COLUMN "users"."delete_initiated_by_admin"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."users"."delete_initiated_by_admin" IS 'Whether the deletion was triggered by an admin (true) or by the user themselves (false). Affects who can cancel and whether auth is banned during grace.';


--
-- Name: admin_role_assignments admin_role_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."admin_role_assignments"
    ADD CONSTRAINT "admin_role_assignments_pkey" PRIMARY KEY ("user_id", "organization_id", "role");


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_pkey" PRIMARY KEY ("id");


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");


--
-- Name: base_profiles base_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."base_profiles"
    ADD CONSTRAINT "base_profiles_pkey" PRIMARY KEY ("user_id");


--
-- Name: direct_message_threads direct_message_threads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."direct_message_threads"
    ADD CONSTRAINT "direct_message_threads_pkey" PRIMARY KEY ("id");


--
-- Name: direct_message_threads direct_message_threads_user_a_id_user_b_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."direct_message_threads"
    ADD CONSTRAINT "direct_message_threads_user_a_id_user_b_id_key" UNIQUE ("user_a_id", "user_b_id");


--
-- Name: enrichment_sweep_jobs enrichment_sweep_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."enrichment_sweep_jobs"
    ADD CONSTRAINT "enrichment_sweep_jobs_pkey" PRIMARY KEY ("id");


--
-- Name: event_rsvps event_rsvps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_rsvps"
    ADD CONSTRAINT "event_rsvps_pkey" PRIMARY KEY ("event_id", "user_id");


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");


--
-- Name: friend_requests friend_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."friend_requests"
    ADD CONSTRAINT "friend_requests_pkey" PRIMARY KEY ("id");


--
-- Name: friendships friendships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "friendships_pkey" PRIMARY KEY ("id");


--
-- Name: friendships friendships_user_a_id_user_b_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "friendships_user_a_id_user_b_id_key" UNIQUE ("user_a_id", "user_b_id");


--
-- Name: invites invites_organization_id_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "invites_organization_id_email_key" UNIQUE ("organization_id", "email");


--
-- Name: invites invites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "invites_pkey" PRIMARY KEY ("id");


--
-- Name: invites invites_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "invites_token_key" UNIQUE ("token");


--
-- Name: helper_preferences mentorship_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."helper_preferences"
    ADD CONSTRAINT "mentorship_preferences_pkey" PRIMARY KEY ("organization_membership_id");


--
-- Name: asks mentorship_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."asks"
    ADD CONSTRAINT "mentorship_requests_pkey" PRIMARY KEY ("id");


--
-- Name: ask_threads mentorship_threads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."ask_threads"
    ADD CONSTRAINT "mentorship_threads_pkey" PRIMARY KEY ("id");


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");


--
-- Name: open_ask_matches open_ask_matches_open_ask_id_helper_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."open_ask_matches"
    ADD CONSTRAINT "open_ask_matches_open_ask_id_helper_user_id_key" UNIQUE ("open_ask_id", "helper_user_id");


--
-- Name: open_ask_matches open_ask_matches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."open_ask_matches"
    ADD CONSTRAINT "open_ask_matches_pkey" PRIMARY KEY ("id");


--
-- Name: open_asks open_asks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."open_asks"
    ADD CONSTRAINT "open_asks_pkey" PRIMARY KEY ("id");


--
-- Name: organization_memberships organization_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."organization_memberships"
    ADD CONSTRAINT "organization_memberships_pkey" PRIMARY KEY ("id");


--
-- Name: organization_memberships organization_memberships_user_id_organization_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."organization_memberships"
    ADD CONSTRAINT "organization_memberships_user_id_organization_id_key" UNIQUE ("user_id", "organization_id");


--
-- Name: organization_profiles organization_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."organization_profiles"
    ADD CONSTRAINT "organization_profiles_pkey" PRIMARY KEY ("organization_membership_id");


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");


--
-- Name: organizations organizations_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_slug_key" UNIQUE ("slug");


--
-- Name: profile_change_proposals profile_change_proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profile_change_proposals"
    ADD CONSTRAINT "profile_change_proposals_pkey" PRIMARY KEY ("id");


--
-- Name: profile_change_proposals profile_change_proposals_review_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profile_change_proposals"
    ADD CONSTRAINT "profile_change_proposals_review_token_key" UNIQUE ("review_token");


--
-- Name: profile_embedding_chunks profile_embedding_chunks_organization_id_user_id_chunk_kind_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profile_embedding_chunks"
    ADD CONSTRAINT "profile_embedding_chunks_organization_id_user_id_chunk_kind_key" UNIQUE ("organization_id", "user_id", "chunk_kind", "source_section", "visibility_tier", "content_hash", "embedding_model", "embedding_dim");


--
-- Name: profile_embedding_chunks profile_embedding_chunks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profile_embedding_chunks"
    ADD CONSTRAINT "profile_embedding_chunks_pkey" PRIMARY KEY ("id");


--
-- Name: profile_embedding_index_status profile_embedding_index_status_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profile_embedding_index_status"
    ADD CONSTRAINT "profile_embedding_index_status_pkey" PRIMARY KEY ("organization_id", "user_id", "organization_membership_id");


--
-- Name: profile_enrichment_runs profile_enrichment_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profile_enrichment_runs"
    ADD CONSTRAINT "profile_enrichment_runs_pkey" PRIMARY KEY ("id");


--
-- Name: profile_enrichment_settings profile_enrichment_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profile_enrichment_settings"
    ADD CONSTRAINT "profile_enrichment_settings_pkey" PRIMARY KEY ("user_id");


--
-- Name: profile_refresh_prompts profile_refresh_prompts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profile_refresh_prompts"
    ADD CONSTRAINT "profile_refresh_prompts_pkey" PRIMARY KEY ("id");


--
-- Name: saved_searches saved_searches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."saved_searches"
    ADD CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id");


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");


--
-- Name: enrichment_sweep_jobs_pending_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "enrichment_sweep_jobs_pending_idx" ON "public"."enrichment_sweep_jobs" USING "btree" ("status", "started_at") WHERE ("status" = ANY (ARRAY['pending'::"text", 'ready'::"text"]));


--
-- Name: open_ask_matches_helper_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "open_ask_matches_helper_idx" ON "public"."open_ask_matches" USING "btree" ("helper_user_id");


--
-- Name: open_asks_one_open_per_user_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "open_asks_one_open_per_user_idx" ON "public"."open_asks" USING "btree" ("organization_id", "user_id") WHERE ("status" = 'open'::"text");


--
-- Name: open_asks_org_open_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "open_asks_org_open_idx" ON "public"."open_asks" USING "btree" ("organization_id") WHERE ("status" = 'open'::"text");


--
-- Name: profile_change_proposals_user_pending_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "profile_change_proposals_user_pending_idx" ON "public"."profile_change_proposals" USING "btree" ("user_id", "created_at" DESC) WHERE ("status" = 'pending'::"text");


--
-- Name: profile_embedding_chunks_embedding_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "profile_embedding_chunks_embedding_idx" ON "public"."profile_embedding_chunks" USING "ivfflat" ("embedding" "public"."vector_cosine_ops") WITH ("lists"='100');


--
-- Name: profile_embedding_chunks_hash_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "profile_embedding_chunks_hash_idx" ON "public"."profile_embedding_chunks" USING "btree" ("content_hash");


--
-- Name: profile_embedding_chunks_org_user_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "profile_embedding_chunks_org_user_idx" ON "public"."profile_embedding_chunks" USING "btree" ("organization_id", "user_id");


--
-- Name: profile_embedding_chunks_visibility_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "profile_embedding_chunks_visibility_idx" ON "public"."profile_embedding_chunks" USING "btree" ("organization_id", "visibility_tier");


--
-- Name: profile_embedding_index_status_lock_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "profile_embedding_index_status_lock_idx" ON "public"."profile_embedding_index_status" USING "btree" ("locked_at") WHERE ("locked_at" IS NOT NULL);


--
-- Name: profile_embedding_index_status_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "profile_embedding_index_status_status_idx" ON "public"."profile_embedding_index_status" USING "btree" ("status", "dirty_since");


--
-- Name: profile_embedding_index_status_user_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "profile_embedding_index_status_user_idx" ON "public"."profile_embedding_index_status" USING "btree" ("user_id");


--
-- Name: profile_enrichment_runs_provider_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "profile_enrichment_runs_provider_idx" ON "public"."profile_enrichment_runs" USING "btree" ("provider", "created_at" DESC);


--
-- Name: profile_enrichment_runs_user_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "profile_enrichment_runs_user_idx" ON "public"."profile_enrichment_runs" USING "btree" ("user_id", "created_at" DESC);


--
-- Name: profile_enrichment_settings_sweep_lookup_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "profile_enrichment_settings_sweep_lookup_idx" ON "public"."profile_enrichment_settings" USING "btree" ("refresh_policy", "last_checked_at") WHERE ("linkedin_url" IS NOT NULL);


--
-- Name: users_delete_scheduled_for_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "users_delete_scheduled_for_idx" ON "public"."users" USING "btree" ("delete_scheduled_for") WHERE ("delete_scheduled_for" IS NOT NULL);


--
-- Name: admin_role_assignments admin_role_assignments_granted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."admin_role_assignments"
    ADD CONSTRAINT "admin_role_assignments_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;


--
-- Name: admin_role_assignments admin_role_assignments_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."admin_role_assignments"
    ADD CONSTRAINT "admin_role_assignments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;


--
-- Name: admin_role_assignments admin_role_assignments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."admin_role_assignments"
    ADD CONSTRAINT "admin_role_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: announcements announcements_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;


--
-- Name: announcements announcements_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;


--
-- Name: audit_log audit_log_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;


--
-- Name: audit_log audit_log_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;


--
-- Name: base_profiles base_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."base_profiles"
    ADD CONSTRAINT "base_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: direct_message_threads direct_message_threads_user_a_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."direct_message_threads"
    ADD CONSTRAINT "direct_message_threads_user_a_id_fkey" FOREIGN KEY ("user_a_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: direct_message_threads direct_message_threads_user_b_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."direct_message_threads"
    ADD CONSTRAINT "direct_message_threads_user_b_id_fkey" FOREIGN KEY ("user_b_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: event_rsvps event_rsvps_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_rsvps"
    ADD CONSTRAINT "event_rsvps_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


--
-- Name: event_rsvps event_rsvps_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."event_rsvps"
    ADD CONSTRAINT "event_rsvps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: events events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;


--
-- Name: events events_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;


--
-- Name: friend_requests friend_requests_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."friend_requests"
    ADD CONSTRAINT "friend_requests_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: friend_requests friend_requests_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."friend_requests"
    ADD CONSTRAINT "friend_requests_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: friendships friendships_user_a_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "friendships_user_a_id_fkey" FOREIGN KEY ("user_a_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: friendships friendships_user_b_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "friendships_user_b_id_fkey" FOREIGN KEY ("user_b_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: invites invites_accepted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "invites_accepted_by_fkey" FOREIGN KEY ("accepted_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;


--
-- Name: invites invites_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "invites_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;


--
-- Name: invites invites_sent_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "invites_sent_by_fkey" FOREIGN KEY ("sent_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;


--
-- Name: helper_preferences mentorship_preferences_organization_membership_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."helper_preferences"
    ADD CONSTRAINT "mentorship_preferences_organization_membership_id_fkey" FOREIGN KEY ("organization_membership_id") REFERENCES "public"."organization_memberships"("id") ON DELETE CASCADE;


--
-- Name: asks mentorship_requests_mentee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."asks"
    ADD CONSTRAINT "mentorship_requests_mentee_id_fkey" FOREIGN KEY ("asker_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: asks mentorship_requests_mentor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."asks"
    ADD CONSTRAINT "mentorship_requests_mentor_id_fkey" FOREIGN KEY ("helper_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: asks mentorship_requests_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."asks"
    ADD CONSTRAINT "mentorship_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;


--
-- Name: ask_threads mentorship_threads_mentee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."ask_threads"
    ADD CONSTRAINT "mentorship_threads_mentee_id_fkey" FOREIGN KEY ("asker_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: ask_threads mentorship_threads_mentor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."ask_threads"
    ADD CONSTRAINT "mentorship_threads_mentor_id_fkey" FOREIGN KEY ("helper_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: ask_threads mentorship_threads_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."ask_threads"
    ADD CONSTRAINT "mentorship_threads_request_id_fkey" FOREIGN KEY ("ask_id") REFERENCES "public"."asks"("id") ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: notifications notifications_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: open_ask_matches open_ask_matches_helper_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."open_ask_matches"
    ADD CONSTRAINT "open_ask_matches_helper_user_id_fkey" FOREIGN KEY ("helper_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: open_ask_matches open_ask_matches_open_ask_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."open_ask_matches"
    ADD CONSTRAINT "open_ask_matches_open_ask_id_fkey" FOREIGN KEY ("open_ask_id") REFERENCES "public"."open_asks"("id") ON DELETE CASCADE;


--
-- Name: open_asks open_asks_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."open_asks"
    ADD CONSTRAINT "open_asks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;


--
-- Name: open_asks open_asks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."open_asks"
    ADD CONSTRAINT "open_asks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: organization_memberships organization_memberships_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."organization_memberships"
    ADD CONSTRAINT "organization_memberships_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;


--
-- Name: organization_memberships organization_memberships_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."organization_memberships"
    ADD CONSTRAINT "organization_memberships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;


--
-- Name: organization_memberships organization_memberships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."organization_memberships"
    ADD CONSTRAINT "organization_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: organization_profiles organization_profiles_organization_membership_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."organization_profiles"
    ADD CONSTRAINT "organization_profiles_organization_membership_id_fkey" FOREIGN KEY ("organization_membership_id") REFERENCES "public"."organization_memberships"("id") ON DELETE CASCADE;


--
-- Name: profile_change_proposals profile_change_proposals_source_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profile_change_proposals"
    ADD CONSTRAINT "profile_change_proposals_source_run_id_fkey" FOREIGN KEY ("source_run_id") REFERENCES "public"."profile_enrichment_runs"("id") ON DELETE SET NULL;


--
-- Name: profile_change_proposals profile_change_proposals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profile_change_proposals"
    ADD CONSTRAINT "profile_change_proposals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: profile_embedding_chunks profile_embedding_chunks_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profile_embedding_chunks"
    ADD CONSTRAINT "profile_embedding_chunks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;


--
-- Name: profile_embedding_chunks profile_embedding_chunks_organization_membership_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profile_embedding_chunks"
    ADD CONSTRAINT "profile_embedding_chunks_organization_membership_id_fkey" FOREIGN KEY ("organization_membership_id") REFERENCES "public"."organization_memberships"("id") ON DELETE CASCADE;


--
-- Name: profile_embedding_chunks profile_embedding_chunks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profile_embedding_chunks"
    ADD CONSTRAINT "profile_embedding_chunks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: profile_embedding_index_status profile_embedding_index_status_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profile_embedding_index_status"
    ADD CONSTRAINT "profile_embedding_index_status_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;


--
-- Name: profile_embedding_index_status profile_embedding_index_status_organization_membership_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profile_embedding_index_status"
    ADD CONSTRAINT "profile_embedding_index_status_organization_membership_id_fkey" FOREIGN KEY ("organization_membership_id") REFERENCES "public"."organization_memberships"("id") ON DELETE CASCADE;


--
-- Name: profile_embedding_index_status profile_embedding_index_status_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profile_embedding_index_status"
    ADD CONSTRAINT "profile_embedding_index_status_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: profile_enrichment_runs profile_enrichment_runs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profile_enrichment_runs"
    ADD CONSTRAINT "profile_enrichment_runs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: profile_enrichment_settings profile_enrichment_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profile_enrichment_settings"
    ADD CONSTRAINT "profile_enrichment_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: profile_refresh_prompts profile_refresh_prompts_organization_membership_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profile_refresh_prompts"
    ADD CONSTRAINT "profile_refresh_prompts_organization_membership_id_fkey" FOREIGN KEY ("organization_membership_id") REFERENCES "public"."organization_memberships"("id") ON DELETE CASCADE;


--
-- Name: saved_searches saved_searches_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."saved_searches"
    ADD CONSTRAINT "saved_searches_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;


--
-- Name: saved_searches saved_searches_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."saved_searches"
    ADD CONSTRAINT "saved_searches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: users users_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: admin_role_assignments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."admin_role_assignments" ENABLE ROW LEVEL SECURITY;

--
-- Name: events admins create events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admins create events" ON "public"."events" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin_of"("organization_id"));


--
-- Name: invites admins create invites; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admins create invites" ON "public"."invites" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin_of"("organization_id"));


--
-- Name: announcements admins delete announcements; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admins delete announcements" ON "public"."announcements" FOR DELETE TO "authenticated" USING ("public"."is_admin_of"("organization_id"));


--
-- Name: events admins delete events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admins delete events" ON "public"."events" FOR DELETE TO "authenticated" USING ("public"."is_admin_of"("organization_id"));


--
-- Name: admin_role_assignments admins read admin_role_assignments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admins read admin_role_assignments" ON "public"."admin_role_assignments" FOR SELECT TO "authenticated" USING ("public"."is_admin_of"("organization_id"));


--
-- Name: announcements admins read all announcements; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admins read all announcements" ON "public"."announcements" FOR SELECT TO "authenticated" USING ("public"."is_admin_of"("organization_id"));


--
-- Name: events admins read all events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admins read all events" ON "public"."events" FOR SELECT TO "authenticated" USING ("public"."is_admin_of"("organization_id"));


--
-- Name: organization_memberships admins read all org memberships; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admins read all org memberships" ON "public"."organization_memberships" FOR SELECT TO "authenticated" USING ("public"."is_admin_of"("organization_id"));


--
-- Name: invites admins read invites; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admins read invites" ON "public"."invites" FOR SELECT TO "authenticated" USING ("public"."is_admin_of"("organization_id"));


--
-- Name: audit_log admins read org audit_log; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admins read org audit_log" ON "public"."audit_log" FOR SELECT TO "authenticated" USING ((("organization_id" IS NOT NULL) AND "public"."is_admin_of"("organization_id")));


--
-- Name: announcements admins update announcements; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admins update announcements" ON "public"."announcements" FOR UPDATE TO "authenticated" USING ("public"."is_admin_of"("organization_id")) WITH CHECK ("public"."is_admin_of"("organization_id"));


--
-- Name: events admins update events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admins update events" ON "public"."events" FOR UPDATE TO "authenticated" USING ("public"."is_admin_of"("organization_id")) WITH CHECK ("public"."is_admin_of"("organization_id"));


--
-- Name: invites admins update invites; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admins update invites" ON "public"."invites" FOR UPDATE TO "authenticated" USING ("public"."is_admin_of"("organization_id")) WITH CHECK ("public"."is_admin_of"("organization_id"));


--
-- Name: announcements admins write announcements; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admins write announcements" ON "public"."announcements" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin_of"("organization_id"));


--
-- Name: announcements; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."announcements" ENABLE ROW LEVEL SECURITY;

--
-- Name: ask_threads; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."ask_threads" ENABLE ROW LEVEL SECURITY;

--
-- Name: asks; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."asks" ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_log; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;

--
-- Name: base_profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."base_profiles" ENABLE ROW LEVEL SECURITY;

--
-- Name: direct_message_threads; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."direct_message_threads" ENABLE ROW LEVEL SECURITY;

--
-- Name: enrichment_sweep_jobs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."enrichment_sweep_jobs" ENABLE ROW LEVEL SECURITY;

--
-- Name: event_rsvps; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."event_rsvps" ENABLE ROW LEVEL SECURITY;

--
-- Name: events; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;

--
-- Name: friend_requests; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."friend_requests" ENABLE ROW LEVEL SECURITY;

--
-- Name: friendships; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."friendships" ENABLE ROW LEVEL SECURITY;

--
-- Name: helper_preferences; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."helper_preferences" ENABLE ROW LEVEL SECURITY;

--
-- Name: invites; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."invites" ENABLE ROW LEVEL SECURITY;

--
-- Name: open_asks members close own open asks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "members close own open asks" ON "public"."open_asks" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "user_id") AND "public"."is_active_member_of"("organization_id")));


--
-- Name: open_asks members create own open asks in their org; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "members create own open asks in their org" ON "public"."open_asks" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "user_id") AND "public"."is_active_member_of"("organization_id")));


--
-- Name: event_rsvps members read event_rsvps; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "members read event_rsvps" ON "public"."event_rsvps" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."events" "e"
  WHERE (("e"."id" = "event_rsvps"."event_id") AND "public"."is_active_member_of"("e"."organization_id")))));


--
-- Name: helper_preferences members read org mentorship_preferences; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "members read org mentorship_preferences" ON "public"."helper_preferences" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."organization_memberships" "m"
  WHERE (("m"."id" = "helper_preferences"."organization_membership_id") AND "public"."is_active_member_of"("m"."organization_id")))));


--
-- Name: base_profiles members read org-mate base_profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "members read org-mate base_profiles" ON "public"."base_profiles" FOR SELECT TO "authenticated" USING ("public"."shares_org_with"("user_id"));


--
-- Name: organization_profiles members read org_profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "members read org_profiles" ON "public"."organization_profiles" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."organization_memberships" "m"
  WHERE (("m"."id" = "organization_profiles"."organization_membership_id") AND "public"."is_active_member_of"("m"."organization_id")))));


--
-- Name: open_asks members read own open asks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "members read own open asks" ON "public"."open_asks" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));


--
-- Name: announcements members read published announcements; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "members read published announcements" ON "public"."announcements" FOR SELECT TO "authenticated" USING (("public"."is_active_member_of"("organization_id") AND ("published_at" IS NOT NULL)));


--
-- Name: events members read published events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "members read published events" ON "public"."events" FOR SELECT TO "authenticated" USING (("public"."is_active_member_of"("organization_id") AND ("published_at" IS NOT NULL)));


--
-- Name: organization_memberships members read same-org memberships; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "members read same-org memberships" ON "public"."organization_memberships" FOR SELECT TO "authenticated" USING ((("status" = 'active'::"public"."membership_status") AND "public"."is_active_member_of"("organization_id")));


--
-- Name: organizations members read their orgs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "members read their orgs" ON "public"."organizations" FOR SELECT TO "authenticated" USING ("public"."is_active_member_of"("id"));


--
-- Name: asks mentees create mentorship_requests; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "mentees create mentorship_requests" ON "public"."asks" FOR INSERT TO "authenticated" WITH CHECK ((("asker_id" = "auth"."uid"()) AND "public"."is_active_member_of"("organization_id")));


--
-- Name: asks mentors respond to mentorship_requests; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "mentors respond to mentorship_requests" ON "public"."asks" FOR UPDATE TO "authenticated" USING (("helper_id" = "auth"."uid"())) WITH CHECK (("helper_id" = "auth"."uid"()));


--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;

--
-- Name: open_ask_matches; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."open_ask_matches" ENABLE ROW LEVEL SECURITY;

--
-- Name: open_asks; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."open_asks" ENABLE ROW LEVEL SECURITY;

--
-- Name: organization_memberships; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."organization_memberships" ENABLE ROW LEVEL SECURITY;

--
-- Name: organization_profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."organization_profiles" ENABLE ROW LEVEL SECURITY;

--
-- Name: organizations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;

--
-- Name: messages participants read ask messages; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "participants read ask messages" ON "public"."messages" FOR SELECT TO "authenticated" USING ((("thread_type" = 'ask'::"public"."message_thread_type") AND (EXISTS ( SELECT 1
   FROM "public"."ask_threads" "t"
  WHERE (("t"."id" = "messages"."thread_id") AND (("t"."helper_id" = "auth"."uid"()) OR ("t"."asker_id" = "auth"."uid"())))))));


--
-- Name: messages participants read direct messages; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "participants read direct messages" ON "public"."messages" FOR SELECT TO "authenticated" USING ((("thread_type" = 'direct'::"public"."message_thread_type") AND (EXISTS ( SELECT 1
   FROM "public"."direct_message_threads" "t"
  WHERE (("t"."id" = "messages"."thread_id") AND (("t"."user_a_id" = "auth"."uid"()) OR ("t"."user_b_id" = "auth"."uid"())))))));


--
-- Name: messages participants send ask messages; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "participants send ask messages" ON "public"."messages" FOR INSERT TO "authenticated" WITH CHECK ((("sender_id" = "auth"."uid"()) AND ("thread_type" = 'ask'::"public"."message_thread_type") AND (EXISTS ( SELECT 1
   FROM "public"."ask_threads" "t"
  WHERE (("t"."id" = "messages"."thread_id") AND ("t"."status" = 'active'::"public"."ask_thread_status") AND (("t"."helper_id" = "auth"."uid"()) OR ("t"."asker_id" = "auth"."uid"())))))));


--
-- Name: messages participants send direct messages; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "participants send direct messages" ON "public"."messages" FOR INSERT TO "authenticated" WITH CHECK ((("sender_id" = "auth"."uid"()) AND ("thread_type" = 'direct'::"public"."message_thread_type") AND (EXISTS ( SELECT 1
   FROM "public"."direct_message_threads" "t"
  WHERE (("t"."id" = "messages"."thread_id") AND (("t"."user_a_id" = "auth"."uid"()) OR ("t"."user_b_id" = "auth"."uid"())))))));


--
-- Name: messages participants update ask messages; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "participants update ask messages" ON "public"."messages" FOR UPDATE TO "authenticated" USING ((("thread_type" = 'ask'::"public"."message_thread_type") AND (EXISTS ( SELECT 1
   FROM "public"."ask_threads" "t"
  WHERE (("t"."id" = "messages"."thread_id") AND (("t"."helper_id" = "auth"."uid"()) OR ("t"."asker_id" = "auth"."uid"())))))));


--
-- Name: messages participants update direct messages; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "participants update direct messages" ON "public"."messages" FOR UPDATE TO "authenticated" USING ((("thread_type" = 'direct'::"public"."message_thread_type") AND (EXISTS ( SELECT 1
   FROM "public"."direct_message_threads" "t"
  WHERE (("t"."id" = "messages"."thread_id") AND (("t"."user_a_id" = "auth"."uid"()) OR ("t"."user_b_id" = "auth"."uid"())))))));


--
-- Name: direct_message_threads parties read direct_message_threads; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "parties read direct_message_threads" ON "public"."direct_message_threads" FOR SELECT TO "authenticated" USING ((("user_a_id" = "auth"."uid"()) OR ("user_b_id" = "auth"."uid"())));


--
-- Name: friend_requests parties read friend_requests; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "parties read friend_requests" ON "public"."friend_requests" FOR SELECT TO "authenticated" USING ((("sender_id" = "auth"."uid"()) OR ("receiver_id" = "auth"."uid"())));


--
-- Name: friendships parties read friendships; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "parties read friendships" ON "public"."friendships" FOR SELECT TO "authenticated" USING ((("user_a_id" = "auth"."uid"()) OR ("user_b_id" = "auth"."uid"())));


--
-- Name: asks parties read mentorship_requests; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "parties read mentorship_requests" ON "public"."asks" FOR SELECT TO "authenticated" USING ((("helper_id" = "auth"."uid"()) OR ("asker_id" = "auth"."uid"())));


--
-- Name: ask_threads parties read mentorship_threads; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "parties read mentorship_threads" ON "public"."ask_threads" FOR SELECT TO "authenticated" USING ((("helper_id" = "auth"."uid"()) OR ("asker_id" = "auth"."uid"())));


--
-- Name: ask_threads parties update mentorship_threads; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "parties update mentorship_threads" ON "public"."ask_threads" FOR UPDATE TO "authenticated" USING ((("helper_id" = "auth"."uid"()) OR ("asker_id" = "auth"."uid"()))) WITH CHECK ((("helper_id" = "auth"."uid"()) OR ("asker_id" = "auth"."uid"())));


--
-- Name: profile_change_proposals; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."profile_change_proposals" ENABLE ROW LEVEL SECURITY;

--
-- Name: profile_embedding_chunks; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."profile_embedding_chunks" ENABLE ROW LEVEL SECURITY;

--
-- Name: profile_embedding_index_status; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."profile_embedding_index_status" ENABLE ROW LEVEL SECURITY;

--
-- Name: profile_enrichment_runs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."profile_enrichment_runs" ENABLE ROW LEVEL SECURITY;

--
-- Name: profile_enrichment_settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."profile_enrichment_settings" ENABLE ROW LEVEL SECURITY;

--
-- Name: profile_refresh_prompts; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."profile_refresh_prompts" ENABLE ROW LEVEL SECURITY;

--
-- Name: friend_requests receiver updates friend_requests; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "receiver updates friend_requests" ON "public"."friend_requests" FOR UPDATE TO "authenticated" USING (("receiver_id" = "auth"."uid"())) WITH CHECK (("receiver_id" = "auth"."uid"()));


--
-- Name: saved_searches; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."saved_searches" ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

--
-- Name: event_rsvps users delete own rsvp; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users delete own rsvp" ON "public"."event_rsvps" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));


--
-- Name: saved_searches users delete own saved_searches; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users delete own saved_searches" ON "public"."saved_searches" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));


--
-- Name: audit_log users insert own audit_log; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users insert own audit_log" ON "public"."audit_log" FOR INSERT TO "authenticated" WITH CHECK (("actor_id" = "auth"."uid"()));


--
-- Name: base_profiles users insert own base_profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users insert own base_profile" ON "public"."base_profiles" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));


--
-- Name: helper_preferences users insert own mentorship_preferences; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users insert own mentorship_preferences" ON "public"."helper_preferences" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."organization_memberships" "m"
  WHERE (("m"."id" = "helper_preferences"."organization_membership_id") AND ("m"."user_id" = "auth"."uid"())))));


--
-- Name: organization_profiles users insert own org_profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users insert own org_profile" ON "public"."organization_profiles" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."organization_memberships" "m"
  WHERE (("m"."id" = "organization_profiles"."organization_membership_id") AND ("m"."user_id" = "auth"."uid"())))));


--
-- Name: event_rsvps users insert own rsvp; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users insert own rsvp" ON "public"."event_rsvps" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));


--
-- Name: saved_searches users insert own saved_searches; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users insert own saved_searches" ON "public"."saved_searches" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));


--
-- Name: users users read org mates; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users read org mates" ON "public"."users" FOR SELECT TO "authenticated" USING ("public"."shares_org_with"("id"));


--
-- Name: admin_role_assignments users read own admin roles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users read own admin roles" ON "public"."admin_role_assignments" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));


--
-- Name: base_profiles users read own base_profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users read own base_profile" ON "public"."base_profiles" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));


--
-- Name: profile_change_proposals users read own change_proposals; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users read own change_proposals" ON "public"."profile_change_proposals" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));


--
-- Name: profile_enrichment_runs users read own enrichment_runs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users read own enrichment_runs" ON "public"."profile_enrichment_runs" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));


--
-- Name: profile_enrichment_settings users read own enrichment_settings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users read own enrichment_settings" ON "public"."profile_enrichment_settings" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));


--
-- Name: organization_memberships users read own memberships; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users read own memberships" ON "public"."organization_memberships" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));


--
-- Name: notifications users read own notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users read own notifications" ON "public"."notifications" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));


--
-- Name: profile_refresh_prompts users read own profile_refresh_prompts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users read own profile_refresh_prompts" ON "public"."profile_refresh_prompts" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."organization_memberships" "m"
  WHERE (("m"."id" = "profile_refresh_prompts"."organization_membership_id") AND ("m"."user_id" = "auth"."uid"())))));


--
-- Name: saved_searches users read own saved_searches; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users read own saved_searches" ON "public"."saved_searches" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));


--
-- Name: users users read self; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users read self" ON "public"."users" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));


--
-- Name: friend_requests users send friend_requests; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users send friend_requests" ON "public"."friend_requests" FOR INSERT TO "authenticated" WITH CHECK (("sender_id" = "auth"."uid"()));


--
-- Name: base_profiles users update own base_profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users update own base_profile" ON "public"."base_profiles" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));


--
-- Name: helper_preferences users update own mentorship_preferences; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users update own mentorship_preferences" ON "public"."helper_preferences" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."organization_memberships" "m"
  WHERE (("m"."id" = "helper_preferences"."organization_membership_id") AND ("m"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."organization_memberships" "m"
  WHERE (("m"."id" = "helper_preferences"."organization_membership_id") AND ("m"."user_id" = "auth"."uid"())))));


--
-- Name: notifications users update own notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users update own notifications" ON "public"."notifications" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));


--
-- Name: organization_profiles users update own org_profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users update own org_profile" ON "public"."organization_profiles" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."organization_memberships" "m"
  WHERE (("m"."id" = "organization_profiles"."organization_membership_id") AND ("m"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."organization_memberships" "m"
  WHERE (("m"."id" = "organization_profiles"."organization_membership_id") AND ("m"."user_id" = "auth"."uid"())))));


--
-- Name: profile_refresh_prompts users update own profile_refresh_prompts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users update own profile_refresh_prompts" ON "public"."profile_refresh_prompts" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."organization_memberships" "m"
  WHERE (("m"."id" = "profile_refresh_prompts"."organization_membership_id") AND ("m"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."organization_memberships" "m"
  WHERE (("m"."id" = "profile_refresh_prompts"."organization_membership_id") AND ("m"."user_id" = "auth"."uid"())))));


--
-- Name: event_rsvps users update own rsvp; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users update own rsvp" ON "public"."event_rsvps" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));


--
-- Name: saved_searches users update own saved_searches; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users update own saved_searches" ON "public"."saved_searches" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));


--
-- Name: SCHEMA "public"; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";


--
-- Name: FUNCTION "analytics_active_signed_in_count"("_org" "uuid", "_within" interval); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION "public"."analytics_active_signed_in_count"("_org" "uuid", "_within" interval) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."analytics_active_signed_in_count"("_org" "uuid", "_within" interval) TO "service_role";


--
-- Name: FUNCTION "handle_new_user"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";


--
-- Name: FUNCTION "is_active_member_of"("org_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."is_active_member_of"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_active_member_of"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_active_member_of"("org_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "is_admin_of"("org_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."is_admin_of"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_of"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_of"("org_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "match_profile_embedding_chunks"("p_organization_id" "uuid", "p_query_embedding" "public"."vector", "p_viewer_id" "uuid", "p_friend_ids" "uuid"[], "p_limit" integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION "public"."match_profile_embedding_chunks"("p_organization_id" "uuid", "p_query_embedding" "public"."vector", "p_viewer_id" "uuid", "p_friend_ids" "uuid"[], "p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."match_profile_embedding_chunks"("p_organization_id" "uuid", "p_query_embedding" "public"."vector", "p_viewer_id" "uuid", "p_friend_ids" "uuid"[], "p_limit" integer) TO "service_role";


--
-- Name: FUNCTION "shares_org_with"("other_user_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."shares_org_with"("other_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."shares_org_with"("other_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."shares_org_with"("other_user_id" "uuid") TO "service_role";


--
-- Name: TABLE "admin_role_assignments"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."admin_role_assignments" TO "anon";
GRANT ALL ON TABLE "public"."admin_role_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_role_assignments" TO "service_role";


--
-- Name: TABLE "organization_memberships"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."organization_memberships" TO "anon";
GRANT ALL ON TABLE "public"."organization_memberships" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_memberships" TO "service_role";


--
-- Name: TABLE "analytics_active_membership_count"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."analytics_active_membership_count" TO "service_role";


--
-- Name: TABLE "invites"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."invites" TO "anon";
GRANT ALL ON TABLE "public"."invites" TO "authenticated";
GRANT ALL ON TABLE "public"."invites" TO "service_role";


--
-- Name: TABLE "analytics_invited_to_active"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."analytics_invited_to_active" TO "service_role";


--
-- Name: TABLE "asks"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."asks" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."asks" TO "authenticated";
GRANT ALL ON TABLE "public"."asks" TO "service_role";


--
-- Name: COLUMN "asks"."status"; Type: ACL; Schema: public; Owner: postgres
--

GRANT UPDATE("status") ON TABLE "public"."asks" TO "authenticated";


--
-- Name: COLUMN "asks"."responded_at"; Type: ACL; Schema: public; Owner: postgres
--

GRANT UPDATE("responded_at") ON TABLE "public"."asks" TO "authenticated";


--
-- Name: COLUMN "asks"."decline_reason"; Type: ACL; Schema: public; Owner: postgres
--

GRANT UPDATE("decline_reason") ON TABLE "public"."asks" TO "authenticated";


--
-- Name: TABLE "analytics_mentorship_30d"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."analytics_mentorship_30d" TO "service_role";


--
-- Name: TABLE "base_profiles"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."base_profiles" TO "anon";
GRANT ALL ON TABLE "public"."base_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."base_profiles" TO "service_role";


--
-- Name: TABLE "analytics_profile_freshness"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."analytics_profile_freshness" TO "service_role";


--
-- Name: TABLE "event_rsvps"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."event_rsvps" TO "anon";
GRANT ALL ON TABLE "public"."event_rsvps" TO "authenticated";
GRANT ALL ON TABLE "public"."event_rsvps" TO "service_role";


--
-- Name: TABLE "events"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";


--
-- Name: TABLE "analytics_upcoming_rsvps"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."analytics_upcoming_rsvps" TO "service_role";


--
-- Name: TABLE "announcements"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."announcements" TO "anon";
GRANT ALL ON TABLE "public"."announcements" TO "authenticated";
GRANT ALL ON TABLE "public"."announcements" TO "service_role";


--
-- Name: TABLE "ask_threads"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."ask_threads" TO "anon";
GRANT ALL ON TABLE "public"."ask_threads" TO "authenticated";
GRANT ALL ON TABLE "public"."ask_threads" TO "service_role";


--
-- Name: TABLE "audit_log"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."audit_log" TO "anon";
GRANT ALL ON TABLE "public"."audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_log" TO "service_role";


--
-- Name: TABLE "direct_message_threads"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."direct_message_threads" TO "anon";
GRANT ALL ON TABLE "public"."direct_message_threads" TO "authenticated";
GRANT ALL ON TABLE "public"."direct_message_threads" TO "service_role";


--
-- Name: TABLE "enrichment_sweep_jobs"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."enrichment_sweep_jobs" TO "anon";
GRANT ALL ON TABLE "public"."enrichment_sweep_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."enrichment_sweep_jobs" TO "service_role";


--
-- Name: TABLE "friend_requests"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."friend_requests" TO "anon";
GRANT ALL ON TABLE "public"."friend_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."friend_requests" TO "service_role";


--
-- Name: TABLE "friendships"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."friendships" TO "anon";
GRANT ALL ON TABLE "public"."friendships" TO "authenticated";
GRANT ALL ON TABLE "public"."friendships" TO "service_role";


--
-- Name: TABLE "helper_preferences"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."helper_preferences" TO "anon";
GRANT ALL ON TABLE "public"."helper_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."helper_preferences" TO "service_role";


--
-- Name: TABLE "messages"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";


--
-- Name: TABLE "notifications"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";


--
-- Name: TABLE "open_ask_matches"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."open_ask_matches" TO "anon";
GRANT ALL ON TABLE "public"."open_ask_matches" TO "authenticated";
GRANT ALL ON TABLE "public"."open_ask_matches" TO "service_role";


--
-- Name: TABLE "open_asks"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."open_asks" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."open_asks" TO "authenticated";
GRANT ALL ON TABLE "public"."open_asks" TO "service_role";


--
-- Name: COLUMN "open_asks"."status"; Type: ACL; Schema: public; Owner: postgres
--

GRANT UPDATE("status") ON TABLE "public"."open_asks" TO "authenticated";


--
-- Name: COLUMN "open_asks"."close_reason"; Type: ACL; Schema: public; Owner: postgres
--

GRANT UPDATE("close_reason") ON TABLE "public"."open_asks" TO "authenticated";


--
-- Name: COLUMN "open_asks"."closed_at"; Type: ACL; Schema: public; Owner: postgres
--

GRANT UPDATE("closed_at") ON TABLE "public"."open_asks" TO "authenticated";


--
-- Name: TABLE "organization_profiles"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."organization_profiles" TO "anon";
GRANT ALL ON TABLE "public"."organization_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_profiles" TO "service_role";


--
-- Name: TABLE "organizations"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";


--
-- Name: TABLE "profile_change_proposals"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."profile_change_proposals" TO "anon";
GRANT ALL ON TABLE "public"."profile_change_proposals" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_change_proposals" TO "service_role";


--
-- Name: TABLE "profile_embedding_chunks"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."profile_embedding_chunks" TO "anon";
GRANT ALL ON TABLE "public"."profile_embedding_chunks" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_embedding_chunks" TO "service_role";


--
-- Name: TABLE "profile_embedding_index_status"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."profile_embedding_index_status" TO "anon";
GRANT ALL ON TABLE "public"."profile_embedding_index_status" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_embedding_index_status" TO "service_role";


--
-- Name: TABLE "profile_enrichment_runs"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."profile_enrichment_runs" TO "anon";
GRANT ALL ON TABLE "public"."profile_enrichment_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_enrichment_runs" TO "service_role";


--
-- Name: TABLE "profile_enrichment_settings"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."profile_enrichment_settings" TO "anon";
GRANT ALL ON TABLE "public"."profile_enrichment_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_enrichment_settings" TO "service_role";


--
-- Name: TABLE "profile_refresh_prompts"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."profile_refresh_prompts" TO "anon";
GRANT ALL ON TABLE "public"."profile_refresh_prompts" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_refresh_prompts" TO "service_role";


--
-- Name: TABLE "saved_searches"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."saved_searches" TO "anon";
GRANT ALL ON TABLE "public"."saved_searches" TO "authenticated";
GRANT ALL ON TABLE "public"."saved_searches" TO "service_role";


--
-- Name: TABLE "users"; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";


--
-- PostgreSQL database dump complete
--

-- \unrestrict dec2s6qZH2ePgTRQ4zbFmsJ654HrXNjnUeFUyCABW5hbfnlwp5fVJ4rrYgT14cw
