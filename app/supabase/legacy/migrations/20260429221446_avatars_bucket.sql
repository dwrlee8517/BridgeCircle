-- Public 'avatars' bucket for member profile pictures.
--
-- Files live at avatars/<user_id>/<timestamp>.<ext>. Members can write their
-- own folder (single-image-per-user — new uploads overwrite via upsert),
-- and anyone authenticated can read any avatar (avatars are deliberately
-- visible across the org so member cards can render them everywhere).
--
-- The bucket is `public: true` so we can serve URLs directly without signed
-- URLs in every render path. PII risk is low: avatars only show up alongside
-- profile data the viewer already has org-mate access to via RLS, and
-- guessing avatar URLs requires knowing user_ids.

insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

create policy "users upload own avatar" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users update own avatar" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users delete own avatar" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read: anyone can see any avatar. Bucket is `public: true` which
-- already allows anonymous read, but we add the explicit policy for clarity
-- and to make the intent reviewable in `select * from pg_policies`.
create policy "anyone reads avatars" on storage.objects
  for select to public
  using (bucket_id = 'avatars');
