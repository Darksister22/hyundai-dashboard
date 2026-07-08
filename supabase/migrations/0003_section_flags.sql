-- Replace the car-level "featured" flag with per-section show/hide flags.
alter table cars drop column if exists featured;

alter table cars
  add column if not exists feat_hero        boolean not null default true,
  add column if not exists feat_overview    boolean not null default true,
  add column if not exists feat_highlights  boolean not null default true,
  add column if not exists feat_design      boolean not null default true,
  add column if not exists feat_additional  boolean not null default true,
  add column if not exists feat_visualizer  boolean not null default true,
  add column if not exists feat_performance boolean not null default true,
  add column if not exists feat_safety      boolean not null default true,
  add column if not exists feat_convenience boolean not null default true,
  add column if not exists feat_gallery     boolean not null default true;
