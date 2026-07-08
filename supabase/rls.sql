-- =====================================================================
-- Hyundai Iraq — Row Level Security
-- Public (anon) can READ everything (the website + dashboard read with the
-- anon key). Only AUTHENTICATED users (admins you create) can write.
--
-- Run AFTER schema.sql + storage.sql. Safe to re-run.
--
-- IMPORTANT one-time setup in the Supabase dashboard:
--   1. Authentication -> Users -> "Add user": create your admin
--      (email + password), and tick "Auto Confirm User".
--   2. Authentication -> Providers/Sign In -> turn OFF "Allow new users to
--      sign up" so only the admins you create can log in.
-- =====================================================================

-- Tables: enable RLS + add "public read" and "authenticated write" policies.
do $$
declare
  t text;
  tables text[] := array[
    'categories','seating_options','drive_options','cars',
    'highlight_cards','design_cards','additional_design_items',
    'safety_cards','convenience_cards','gallery_images',
    'visualizer_spin_colors','visualizer_spin_frames','visualizer_360_colors',
    'banners','locations'
  ];
begin
  foreach t in array tables loop
    execute format('alter table %I enable row level security;', t);

    execute format('drop policy if exists "public read" on %I;', t);
    execute format(
      'create policy "public read" on %I for select using (true);', t);

    execute format('drop policy if exists "authenticated write" on %I;', t);
    execute format(
      'create policy "authenticated write" on %I for all to authenticated using (true) with check (true);',
      t);
  end loop;
end $$;

-- Storage: replace the dev (anon) write policies with authenticated ones.
drop policy if exists "car-assets dev write"   on storage.objects;
drop policy if exists "car-assets dev update"  on storage.objects;
drop policy if exists "car-assets dev delete"  on storage.objects;
drop policy if exists "car-assets public read" on storage.objects;
drop policy if exists "car-assets auth write"  on storage.objects;
drop policy if exists "car-assets auth update" on storage.objects;
drop policy if exists "car-assets auth delete" on storage.objects;

create policy "car-assets public read"
  on storage.objects for select
  using (bucket_id = 'car-assets');

create policy "car-assets auth write"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'car-assets');

create policy "car-assets auth update"
  on storage.objects for update to authenticated
  using (bucket_id = 'car-assets');

create policy "car-assets auth delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'car-assets');
