-- Optional starter data for the editable lists. English only; translate /
-- edit later in the Lists manager. Safe to skip or change.

insert into categories (name_en, sort_order) values
  ('SUV', 1), ('Sedan', 2), ('Hatchback', 3), ('MPV', 4), ('Electric', 5);

insert into seating_options (label_en, value, sort_order) values
  ('2 seats', 2, 1), ('5 seats', 5, 2), ('7 seats', 7, 3);

insert into drive_options (label_en, sort_order) values
  ('2WD (FWD)', 1), ('2WD (RWD)', 2), ('AWD', 3), ('4WD', 4);
