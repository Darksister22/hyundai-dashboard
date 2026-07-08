-- Adds the "featured" flag to cars. New databases already include it.
alter table cars
  add column if not exists featured boolean not null default false;
