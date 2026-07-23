-- Grants on the public schema for the Supabase Postgrest roles.
-- Tables created via `supabase db push` from a CLI-driven migration do not
-- automatically receive the role-level grants that Supabase applies to tables
-- created through the dashboard. Without these, the sb_secret_ key (which maps
-- to the service_role) cannot read or write the tables defined in 0001_init.

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables       in schema public to service_role;
grant all on all sequences    in schema public to service_role;
grant all on all functions    in schema public to service_role;

grant select, insert, update, delete on all tables    in schema public to authenticated;
grant usage,  select                  on all sequences in schema public to authenticated;
grant execute                          on all functions in schema public to authenticated;

grant select on all tables    in schema public to anon;
grant usage,  select on all sequences in schema public to anon;
grant execute on all functions in schema public to anon;

-- Ensure tables created in future migrations also get the grants without
-- having to repeat this block in every migration.
alter default privileges in schema public grant all on tables    to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant all on functions to service_role;

alter default privileges in schema public grant select, insert, update, delete on tables    to authenticated;
alter default privileges in schema public grant usage,  select                  on sequences to authenticated;
alter default privileges in schema public grant execute                          on functions to authenticated;

alter default privileges in schema public grant select on tables    to anon;
alter default privileges in schema public grant usage,  select on sequences to anon;
alter default privileges in schema public grant execute on functions to anon;
