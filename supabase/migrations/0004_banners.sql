-- Hero banners table (+ RLS). Each banner may link to one car.
create table if not exists banners (
  id          uuid primary key default gen_random_uuid(),
  sort_order  int  not null default 0,
  title_ar text, title_en text, title_ku text,
  media_type  text not null check (media_type in ('image','video')),
  media_url   text,
  car_id      uuid references cars(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists banners_sort_order_idx on banners (sort_order);

drop trigger if exists trg_banners_updated on banners;
create trigger trg_banners_updated before update on banners
  for each row execute function set_updated_at();

alter table banners enable row level security;
drop policy if exists "public read" on banners;
create policy "public read" on banners for select using (true);
drop policy if exists "authenticated write" on banners;
create policy "authenticated write" on banners
  for all to authenticated using (true) with check (true);
