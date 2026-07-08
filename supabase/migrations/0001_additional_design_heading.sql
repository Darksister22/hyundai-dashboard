-- Run only if you applied schema.sql BEFORE the Additional Design heading
-- was added. New databases already include these columns.
alter table cars
  add column if not exists additional_design_heading_ar text,
  add column if not exists additional_design_heading_en text,
  add column if not exists additional_design_heading_ku text;
