-- Find Us: replace GPS lat/lng with a single Google Maps link.
alter table locations drop column if exists lat;
alter table locations drop column if exists lng;
alter table locations add column if not exists map_url text;
