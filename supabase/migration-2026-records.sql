-- ============================================================================
-- Sea Robin Classic — migration: 2026 record book
-- Updates the standing records the app uses to detect Record Breakers, and
-- adds the new species (Ray, Cusk Eel, Silver Perch). Run once in the Supabase
-- SQL editor. Idempotent (upsert by species).
-- Source: 2026 Official Rules, Section 5-H (top slot per species).
-- ============================================================================

insert into public.records (species, holder, year, length_inches) values
  ('Sea Robin',    'N/A — the Coveted remains uncaught', null, 0),
  ('Striped Bass', 'Peter Dzien',   2008, 26),
  ('Flounder',     'Jeff Kern',     2020, 20),
  ('Red Drum',     'Dave Gonzalez', 2013, 25.5),
  ('Black Drum',   'Sean Sullivan', 2018, 11),
  ('Sheepshead',   'Mike Cooper',   2007, 11),
  ('Bluefish',     'Eric Keresty',  2004, 17.5),
  ('Sea Trout',    'Mike Cooper',   2003, 16),
  ('Kingfish',     'Jerry Egan',    2022, 14.25),
  ('Croaker',      'Will Koth',     2020, 7),
  ('Spot',         'Dave Gonzalez', 2024, 10),
  ('Spotted Hake', 'Mike Cooper',   2008, 12),
  ('Silver Perch', 'Phill Hall',    2020, 8),
  ('Puffer Fish',  'Fred Bubeck',   2019, 10),
  ('Eel',          'Sean Sullivan', 2007, 26),
  ('Cusk Eel',     'Dave Gonzalez', 2022, 8.5),
  ('Skate',        'Greg Keresty',  2012, 29),
  ('Shark',        'Dave Gonzalez', 2006, 39),
  ('Ray',          'Greg Hudson (Butterfly)', 2023, 19.5),
  ('Stargazer',    'Pete Dzien',    2013, 21.5)
on conflict (species) do update
  set holder = excluded.holder,
      year = excluded.year,
      length_inches = excluded.length_inches;
