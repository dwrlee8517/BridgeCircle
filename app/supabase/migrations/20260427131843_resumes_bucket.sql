-- Private 'resumes' bucket for member-uploaded PDFs and DOCX files.
-- Files live at resumes/<user_id>/<timestamp>-<safe_filename>.{pdf,docx}.
-- Members can read + write their own folder; service role bypasses RLS for
-- the server-side extraction step.

insert into storage.buckets (id, name, public)
  values ('resumes', 'resumes', false)
  on conflict (id) do nothing;

create policy "users upload own resumes" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users read own resumes" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
