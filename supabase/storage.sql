-- =====================================================================
-- Hyundai Iraq — Storage setup  ·  bucket: car-assets
-- Run after schema.sql. Creates a public-read bucket and DEV policies.
-- Tighten these to authenticated admins once auth is added.
-- =====================================================================

-- 1) Public bucket (public read; uploads still governed by policies below)
insert into storage.buckets (id, name, public)
values ('car-assets', 'car-assets', true)
on conflict (id) do nothing;

-- 2) DEV policies ------------------------------------------------------
-- Anyone can read (the website needs public image URLs).
create policy "car-assets public read"
  on storage.objects for select
  using (bucket_id = 'car-assets');

-- DEV ONLY: allow anonymous uploads/updates/deletes so the dashboard
-- works before auth exists. REPLACE with an authenticated-admin check
-- (e.g. auth.role() = 'authenticated') before launch.
create policy "car-assets dev write"
  on storage.objects for insert
  with check (bucket_id = 'car-assets');

create policy "car-assets dev update"
  on storage.objects for update
  using (bucket_id = 'car-assets');

create policy "car-assets dev delete"
  on storage.objects for delete
  using (bucket_id = 'car-assets');
