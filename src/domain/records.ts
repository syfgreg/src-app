import type { RecordEntry } from "./types";

/**
 * Current Sea Robin Fishing Records — top slot per species,
 * transcribed from the 2019 Official Rules and Regulations, Section 5-H.
 */
export const OFFICIAL_RECORDS: RecordEntry[] = [
  { species: "Sea Robin", holder: "N/A — the Coveted remains uncaught", year: null, lengthInches: 0 },
  { species: "Skate", holder: "Greg Keresty", year: 2012, lengthInches: 29 },
  { species: "Shark", holder: "Dave Gonzalez", year: 2006, lengthInches: 39 },
  { species: "Eel", holder: "Sean Sullivan", year: 2007, lengthInches: 26 },
  { species: "Stargazer", holder: "Pete Dzien", year: 2013, lengthInches: 21.5 },
  { species: "Striped Bass", holder: "Peter Dzien", year: 2008, lengthInches: 26 },
  { species: "Red Drum", holder: "Dave Gonzalez", year: 2013, lengthInches: 25.5 },
  { species: "Black Drum", holder: "Sean Sullivan", year: 2018, lengthInches: 11 },
  { species: "Sheepshead", holder: "Mike Cooper", year: 2007, lengthInches: 11 },
  { species: "Bluefish", holder: "Eric Keresty", year: 2004, lengthInches: 17.5 },
  { species: "Flounder", holder: "George Mummert", year: 2009, lengthInches: 19.25 },
  { species: "Sea Trout", holder: "Mike Cooper", year: 2003, lengthInches: 16 },
  { species: "Spot", holder: "Will Koth", year: 2012, lengthInches: 6 },
  { species: "Croaker", holder: "N/A — open record", year: null, lengthInches: 0 },
  { species: "Kingfish", holder: "Steve Getsie", year: 2015, lengthInches: 13 },
  { species: "Spotted Hake", holder: "Mike Cooper", year: 2008, lengthInches: 12 },
  { species: "Puffer Fish", holder: "Charles Goins", year: 2016, lengthInches: 7 },
];

/** Second-place slots, for the full record book display. */
export const RUNNER_UP_RECORDS: RecordEntry[] = [
  { species: "Skate", holder: "Ken Thompson", year: 1998, lengthInches: 24 },
  { species: "Shark", holder: "Jeff Kern / Fred Bubeck / Will Koth", year: 2012, lengthInches: 37 },
  { species: "Eel", holder: "Sean Sullivan", year: 2007, lengthInches: 21 },
  { species: "Stargazer", holder: "Jerry Egan", year: 2009, lengthInches: 19 },
  { species: "Striped Bass", holder: "Chris Vlot", year: 2008, lengthInches: 22.5 },
  { species: "Red Drum", holder: "Dave Gonzalez", year: 2017, lengthInches: 20.5 },
  { species: "Black Drum", holder: "Will Koth", year: 2014, lengthInches: 10.5 },
  { species: "Bluefish", holder: "Jeff Spear", year: 2014, lengthInches: 16.75 },
  { species: "Flounder", holder: "Jerry Egan", year: 2009, lengthInches: 19 },
  { species: "Sea Trout", holder: "Derek Hall", year: 2001, lengthInches: 15.5 },
  { species: "Spot", holder: "Will Koth", year: 2012, lengthInches: 5 },
  { species: "Kingfish", holder: "John Friscia", year: 2018, lengthInches: 11 },
  { species: "Spotted Hake", holder: "Dave Gonzalez / Sean Sullivan", year: 2008, lengthInches: 11.5 },
];
