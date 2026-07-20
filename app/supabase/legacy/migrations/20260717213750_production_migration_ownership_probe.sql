create schema if not exists private;

create table private.production_migration_ownership_probe (
  singleton boolean primary key default true,
  applied_at timestamptz not null default now(),
  constraint production_migration_ownership_probe_singleton check (singleton)
);

comment on table private.production_migration_ownership_probe is
  'Temporary proof that the protected GitHub workflow owns production migrations before the database-v2 reset.';

alter table private.production_migration_ownership_probe enable row level security;

revoke all privileges on schema private from public, anon, authenticated;
revoke all privileges on table private.production_migration_ownership_probe from public, anon, authenticated;
