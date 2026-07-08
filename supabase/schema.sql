-- =====================================================================
-- Hyundai Iraq — Content Dashboard  ·  database schema
-- Target: PostgreSQL (Supabase). Written in portable SQL so it ports to
-- MySQL / Oracle with minimal edits (identity columns, standard FKs).
--
-- Run this once in the Supabase SQL editor (or psql) on a fresh project.
-- =====================================================================

create extension if not exists "pgcrypto";   -- for gen_random_uuid()

-- ---------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================================
-- EDITABLE LISTS  (the "Lists" side of the Cars section)
-- All labels are trilingual; *_en is required, *_ar / *_ku may be null
-- and fall back to English at render time.
-- =====================================================================

create table categories (
  id          bigint generated always as identity primary key,
  name_ar     text,
  name_en     text not null,
  name_ku     text,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table seating_options (
  id          bigint generated always as identity primary key,
  label_ar    text,
  label_en    text not null,
  label_ku    text,
  value       int,                 -- numeric seats (2,5,7…) for sane sorting
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table drive_options (
  id          bigint generated always as identity primary key,
  label_ar    text,
  label_en    text not null,
  label_ku    text,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- =====================================================================
-- CORE CAR
-- 1:1 content lives here as columns grouped by form section.
-- id is UUID so Storage paths (cars/{id}/...) can be built before insert.
-- =====================================================================

create table cars (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,          -- auto from name_en, deduped
  sort_order   int  not null default 0,
  -- Per-section "show on website" flags (default on)
  feat_hero        boolean not null default true,
  feat_overview    boolean not null default true,
  feat_highlights  boolean not null default true,
  feat_design      boolean not null default true,
  feat_additional  boolean not null default true,
  feat_visualizer  boolean not null default true,
  feat_performance boolean not null default true,
  feat_safety      boolean not null default true,
  feat_convenience boolean not null default true,
  feat_gallery     boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- ID --------------------------------------------------------------
  name_ar      text,
  name_en      text not null,
  name_ku      text,
  category_id  bigint references categories(id) on delete restrict,

  -- HERO ------------------------------------------------------------
  hero_image           text,
  hero_headline_ar     text,
  hero_headline_en     text,
  hero_headline_ku     text,

  -- OVERVIEW --------------------------------------------------------
  overview_headline_ar text,
  overview_headline_en text,
  overview_headline_ku text,
  overview_tagline_ar  text,
  overview_tagline_en  text,
  overview_tagline_ku  text,
  seating_id   bigint references seating_options(id) on delete restrict,
  drive_id     bigint references drive_options(id)  on delete restrict,

  -- SPECS  (shared: shown in BOTH Overview and Performance) ---------
  engine_ar     text, engine_en     text, engine_ku     text,
  max_power_ar  text, max_power_en  text, max_power_ku  text,
  max_torque_ar text, max_torque_en text, max_torque_ku text,

  -- DESIGN (top-level) ----------------------------------------------
  design_title_ar  text, design_title_en text, design_title_ku text,
  design_hero_image text,

  -- ADDITIONAL DESIGN (heading; items live in additional_design_items)
  additional_design_heading_ar text,
  additional_design_heading_en text,
  additional_design_heading_ku text,

  -- PERFORMANCE (engine/power/torque come from SPECS above) ---------
  perf_hero_image      text,
  transmission_ar text, transmission_en text, transmission_ku text,
  accel_0_100_ar  text, accel_0_100_en  text, accel_0_100_ku  text,
  perf_closing_image   text,

  -- SAFETY (top-level) ----------------------------------------------
  safety_heading_ar text, safety_heading_en text, safety_heading_ku text,

  -- CONVENIENCE (top-level) -----------------------------------------
  convenience_heading_ar text, convenience_heading_en text, convenience_heading_ku text,
  convenience_image text
);

create index cars_name_en_idx     on cars (name_en);
create index cars_category_id_idx on cars (category_id);
create index cars_sort_order_idx  on cars (sort_order);

-- =====================================================================
-- COLLECTIONS (1:many). Each links to a car and cascades on delete.
-- sort_order = display order (array position in the dashboard).
-- =====================================================================

create table highlight_cards (
  id          bigint generated always as identity primary key,
  car_id      uuid not null references cars(id) on delete cascade,
  sort_order  int  not null default 0,
  title_ar text, title_en text, title_ku text,
  description_ar text, description_en text, description_ku text,
  image text
);
create index highlight_cards_car_id_idx on highlight_cards (car_id);

create table design_cards (
  id          bigint generated always as identity primary key,
  car_id      uuid not null references cars(id) on delete cascade,
  kind        text not null check (kind in ('exterior','interior')),
  sort_order  int  not null default 0,
  caption_ar text, caption_en text, caption_ku text,
  image text
);
create index design_cards_car_id_idx on design_cards (car_id);

create table additional_design_items (
  id          bigint generated always as identity primary key,
  car_id      uuid not null references cars(id) on delete cascade,
  sort_order  int  not null default 0,   -- 0,1,2  (exactly 3, enforced in app)
  label_ar text, label_en text, label_ku text,
  image text
);
create index additional_design_items_car_id_idx on additional_design_items (car_id);

create table safety_cards (
  id          bigint generated always as identity primary key,
  car_id      uuid not null references cars(id) on delete cascade,
  sort_order  int  not null default 0,
  title_ar text, title_en text, title_ku text,
  description_ar text, description_en text, description_ku text,
  image text
);
create index safety_cards_car_id_idx on safety_cards (car_id);

create table convenience_cards (
  id          bigint generated always as identity primary key,
  car_id      uuid not null references cars(id) on delete cascade,
  sort_order  int  not null default 0,
  title_ar text, title_en text, title_ku text,
  description_ar text, description_en text, description_ku text,
  image text
);
create index convenience_cards_car_id_idx on convenience_cards (car_id);

create table gallery_images (
  id          bigint generated always as identity primary key,
  car_id      uuid not null references cars(id) on delete cascade,
  sort_order  int  not null default 0,
  image text
);
create index gallery_images_car_id_idx on gallery_images (car_id);

-- VISUALIZER · SPIN  ---------------------------------------------------
-- Each spin color owns exactly 36 ordered frames (enforced in app).
create table visualizer_spin_colors (
  id          bigint generated always as identity primary key,
  car_id      uuid not null references cars(id) on delete cascade,
  sort_order  int  not null default 0,
  color_hex   text,
  color_name_ar text, color_name_en text, color_name_ku text
);
create index visualizer_spin_colors_car_id_idx on visualizer_spin_colors (car_id);

create table visualizer_spin_frames (
  id            bigint generated always as identity primary key,
  spin_color_id bigint not null references visualizer_spin_colors(id) on delete cascade,
  frame_index   int  not null,            -- 1..36
  image         text,
  unique (spin_color_id, frame_index)
);
create index visualizer_spin_frames_color_idx on visualizer_spin_frames (spin_color_id);

-- VISUALIZER · 360  ----------------------------------------------------
-- Each color = one equirectangular (2:1) panorama image.
create table visualizer_360_colors (
  id          bigint generated always as identity primary key,
  car_id      uuid not null references cars(id) on delete cascade,
  sort_order  int  not null default 0,
  color_hex   text,
  color_name_ar text, color_name_en text, color_name_ku text,
  image text
);
create index visualizer_360_colors_car_id_idx on visualizer_360_colors (car_id);

-- =====================================================================
-- HERO BANNERS (independent of cars; each may link to one car)
-- =====================================================================
create table banners (
  id          uuid primary key default gen_random_uuid(),
  sort_order  int  not null default 0,
  title_ar text, title_en text, title_ku text,
  media_type  text not null check (media_type in ('image','video')),
  media_url   text,
  car_id      uuid references cars(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index banners_sort_order_idx on banners (sort_order);

-- =====================================================================
-- FIND US (showroom / dealer locations)
-- =====================================================================
create table locations (
  id          uuid primary key default gen_random_uuid(),
  sort_order  int  not null default 0,
  province    text,                 -- one of Iraq's governorates
  city_ar text, city_en text, city_ku text,
  landmark_ar text, landmark_en text, landmark_ku text,
  map_url     text,                 -- full Google Maps link
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index locations_sort_order_idx on locations (sort_order);

-- ---------------------------------------------------------------------
-- updated_at triggers (only tables that carry updated_at)
-- ---------------------------------------------------------------------
create trigger trg_categories_updated before update on categories
  for each row execute function set_updated_at();
create trigger trg_seating_updated    before update on seating_options
  for each row execute function set_updated_at();
create trigger trg_drive_updated      before update on drive_options
  for each row execute function set_updated_at();
create trigger trg_cars_updated       before update on cars
  for each row execute function set_updated_at();
create trigger trg_banners_updated    before update on banners
  for each row execute function set_updated_at();
create trigger trg_locations_updated  before update on locations
  for each row execute function set_updated_at();

-- =====================================================================
-- ROW LEVEL SECURITY
-- Auth comes later. Until then, RLS is intentionally NOT enabled so the
-- dashboard can read/write with the anon key during development.
-- Before going live, enable RLS on every table and add policies that
-- allow writes only for authenticated admins and reads for everyone.
-- =====================================================================
