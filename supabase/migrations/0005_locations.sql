-- Find Us: showroom/dealer locations (+ RLS).
create table if not exists locations (
  id          uuid primary key default gen_random_uuid(),
  sort_order  int  not null default 0,
  province    text,
  city_ar text, city_en text, city_ku text,
  landmark_ar text, landmark_en text, landmark_ku text,
  lat         double precision,
  lng         double precision,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists locations_sort_order_idx on locations (sort_order);

drop trigger if exists trg_locations_updated on locations;
create trigger trg_locations_updated before update on locations
  for each row execute function set_updated_at();

alter table locations enable row level security;
drop policy if exists "public read" on locations;
create policy "public read" on locations for select using (true);
drop policy if exists "authenticated write" on locations;
create policy "authenticated write" on locations
  for all to authenticated using (true) with check (true);
