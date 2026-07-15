import type { RecordEntry } from "./types";

/**
 * Current Sea Robin Fishing Records — top slot per species.
 * Source: 2026 Official Rules and Regulations, Section 5-H
 * ("Current Sea Robin Fishing Records – Top Two Slots per Species").
 */
export const OFFICIAL_RECORDS: RecordEntry[] = [
  { species: "Sea Robin", holder: "N/A — the Coveted remains uncaught", year: null, lengthInches: 0 },
  // Game Fish — Tier 1
  { species: "Striped Bass", holder: "Peter Dzien", year: 2008, lengthInches: 26 },
  { species: "Flounder", holder: "Jeff Kern", year: 2020, lengthInches: 20 },
  { species: "Red Drum", holder: "Dave Gonzalez", year: 2013, lengthInches: 25.5 },
  // Game Fish — Tier 2
  { species: "Black Drum", holder: "Sean Sullivan", year: 2018, lengthInches: 11 },
  { species: "Sheepshead", holder: "Mike Cooper", year: 2007, lengthInches: 11 },
  { species: "Bluefish", holder: "Eric Keresty", year: 2004, lengthInches: 17.5 },
  { species: "Sea Trout", holder: "Mike Cooper", year: 2003, lengthInches: 16 },
  { species: "Kingfish", holder: "Jerry Egan", year: 2022, lengthInches: 14.25 },
  { species: "Croaker", holder: "Will Koth", year: 2020, lengthInches: 7 },
  { species: "Spot", holder: "Dave Gonzalez", year: 2024, lengthInches: 10 },
  { species: "Spotted Hake", holder: "Mike Cooper", year: 2008, lengthInches: 12 },
  { species: "Silver Perch", holder: "Phill Hall", year: 2020, lengthInches: 8 },
  { species: "Puffer Fish", holder: "Fred Bubeck", year: 2019, lengthInches: 10 },
  { species: "Eel", holder: "Sean Sullivan", year: 2007, lengthInches: 26 },
  { species: "Cusk Eel", holder: "Dave Gonzalez", year: 2022, lengthInches: 8.5 },
  // Trash Fish
  { species: "Skate", holder: "Greg Keresty", year: 2012, lengthInches: 29 },
  { species: "Shark", holder: "Dave Gonzalez", year: 2006, lengthInches: 39 },
  { species: "Ray", holder: "Greg Hudson (Butterfly)", year: 2023, lengthInches: 19.5 },
  { species: "Stargazer", holder: "Pete Dzien", year: 2013, lengthInches: 21.5 },
];

/** Second-place slots, for the full record book display. */
export const RUNNER_UP_RECORDS: RecordEntry[] = [
  { species: "Striped Bass", holder: "Chris Vlot", year: 2008, lengthInches: 22.5 },
  { species: "Flounder", holder: "George Mummert", year: 2009, lengthInches: 19.25 },
  { species: "Red Drum", holder: "Dave Gonzalez", year: 2017, lengthInches: 20.5 },
  { species: "Black Drum", holder: "Will Koth", year: 2014, lengthInches: 10.5 },
  { species: "Bluefish", holder: "Jeff Spear", year: 2014, lengthInches: 16.75 },
  { species: "Sea Trout", holder: "Derek Hall", year: 2001, lengthInches: 15.5 },
  { species: "Kingfish", holder: "Derek Hall", year: 2020, lengthInches: 14 },
  { species: "Croaker", holder: "Dave Gonzalez", year: 2020, lengthInches: 7 },
  { species: "Spot", holder: "Jeff Kern", year: 2023, lengthInches: 9.5 },
  { species: "Spotted Hake", holder: "Dave Gonzalez / Sean Sullivan", year: 2008, lengthInches: 11.5 },
  { species: "Puffer Fish", holder: "Charles Goins", year: 2016, lengthInches: 7 },
  { species: "Eel", holder: "Sean Sullivan", year: 2007, lengthInches: 21 },
  { species: "Skate", holder: "Ken Thompson", year: 1998, lengthInches: 24 },
  { species: "Shark", holder: "Jeff Kern / Fred Bubeck / Will Koth", year: 2012, lengthInches: 37 },
  { species: "Stargazer", holder: "Jerry Egan", year: 2009, lengthInches: 19 },
];
