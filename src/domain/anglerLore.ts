/**
 * Easter egg: type an SRC angler's name into the Rules Assistant and get their
 * newsletter-archive blurb instead of a rules answer. Match keys are curated
 * so no two anglers share one — bare first names ("Greg", "Jeff") and the two
 * colliding surnames ("Hall", "Keresty") are deliberately left out, so there's
 * never a real ambiguity to resolve at match time.
 */
export interface AnglerLore {
  name: string;
  matchKeys: string[];
  blurb: string;
}

export const ANGLER_LORE: AnglerLore[] = [
  {
    name: "Fred Bubeck",
    matchKeys: ["Fred Bubeck", "Freddy B", "Bubeck"],
    blurb:
      'A long-standing SRC participant and lifelong childhood friend of the MOC (they played sports together from elementary through high school), who openly admits he\'s "not a fisherman." Won the tournament\'s very first Calcutta in 2011 with a single 12" spotted hake in a "drunken frenzy of profanity laced excitement." Holds the record for the lowest scorecard total in SRC history — a single 7" bluefish in 1999 worth 35 points — and is the namesake of the mini keg "Wilson." Broke the Puffer Fish record (10") in 2018, and by 2024 had climbed to 10th all-time on an "Up-A-Lot" 16-fish haul.',
  },
  {
    name: "Pete Dzien",
    matchKeys: ["Pete Dzien", "Dzien"],
    blurb:
      "Became the second-ever two-time SRC Champion with his 2010 win, charging the beach at 5am yelling he was going to win, and landing two flounder plus a 20.5\" shark. Set a new record 21.5\" Stargazer in his 2nd-place 2013 finish.",
  },
  {
    name: "Jerry Egan",
    matchKeys: ["Jerry Egan", "GAE", "Sailor Jerry", "Egan"],
    blurb:
      'A collegiate friend of the MOC\'s from the early 1990s who first fished in 1999, took a sabbatical 2010–2013, then returned to become the tournament\'s defining dynasty: won his first Championship in 2021 after 19 years of trying, then went back-to-back-to-back-to-back for an unprecedented four-peat (2021–2024), shattering the long-standing "Champion\'s Curse." His 2024 season (18,485 points, including a single 19" flounder worth 5,700 points alone) is the highest point total in SRC history. Also a repeat winner of Derek Hall\'s Calcutta side-tournament, earning the nickname "Second Gentleman."',
  },
  {
    name: "John Friscia",
    matchKeys: ["John Friscia", "Friscia"],
    blurb:
      'President of the 2010 "Shiners Club" (the mock title for anglers who catch nothing), he then went nine full years without catching a fish (2005–2014) before breaking the streak to a celebratory "HERE\'S JOHNNY!!" newsletter writeup. He was honored for hand-crafting a cornhole set that became the tournament\'s official sporting event in 2018, and was one of the anglers involved in the disputed 2001 championship measurement that led to the Official SRC Measuring Device Rule.',
  },
  {
    name: "Steve Getsie",
    matchKeys: ["Steve Getsie", "Getsie"],
    blurb:
      'Joined as a Greenhorn in 2011 (an avid outdoorsman/river fisherman). Landed a new record 13" kingfish in 2015, then won his first Championship in 2016.',
  },
  {
    name: "Charles Goins",
    matchKeys: ["Charles Goins", "Goins"],
    blurb:
      'Won his first Championship in 1999, then a second one in 2015 — 15 years apart — landing a new record 7" pufferfish along the way; the MOC called it "even sweeter" than his first. Won the 2022 Glory Shot with a "monstrous" Largemouth Bass allegedly caught on a pink hula popper (treated with good-natured skepticism by the newsletter).',
  },
  {
    name: "Dave Gonzalez",
    matchKeys: ["Dave Gonzalez", "Gonzo", "Gonzalez"],
    blurb:
      'One of the tournament\'s two titans. Champion in 2013 (rod holder snapped in the final hour, then landed a record 25.5" Red Drum) and 2017 (first-ever "Full Monty" bonus winner, prompting the MOC\'s "there\'s a new sheriff in town" line). A serial record-breaker in later years (Cusk Eel in 2022, Spot in multiple years), and in 2024 he passed Will Koth to become the SRC\'s all-time career points leader.',
  },
  {
    name: "Derek Hall",
    matchKeys: ["Derek Hall"],
    blurb:
      'Won the very first Glory Shot competition (2010) and the 2013 edition too (a 32" Tiger Musky). The original, perpetually-intoxicated founder of the Thursday-night Calcutta side-tournament (later rebranded "The Gentleman\'s Tournament"), and once became the first Participant ever marked as a Shiner while still seated in his camping chair, "relying heavily on chocolate chip cookies and chilled scotch."',
  },
  {
    name: "Phillip Hall",
    matchKeys: ["Phillip Hall", "Phill Hall"],
    blurb:
      'He joined in 2009. His best-ever gamefish was a modest 9" Striped Bass in 2010. He\'s fished only about half the tournaments since, a Shiner roughly 50% of the time, though he did set the Silver Perch record in 2020, and once finished 3rd in an early response-card contest with a "Nancies in the sand" entry.',
  },
  {
    name: "Patrick Hough",
    matchKeys: ["Patrick Hough", "Nephew Hough", "Hough"],
    blurb:
      'The MOC\'s actual nephew, joined as a Greenhorn in 2019 alongside Mason Keresty. His debut season was a bust (showed up with freshwater crappie spinnerbaits and earned a Shiner mark), but he\'s been a steady "gamefish magnet" ever since.',
  },
  {
    name: "Greg Hudson",
    matchKeys: ["Greg Hudson", "Hudson"],
    blurb:
      'Held the mock title of Secretary in the 2010 "Shiners Club" for anglers who caught nothing, and was the first to flag that response cards were missing from tournament invites, prompting a whole response-card contest the following year. After 16 consecutive years of competition (2001–2016), finally notched his first-ever Elite 3 finish with a 2nd-place showing in 2016. A 2017 spotlight described him as reportedly the only Participant who doesn\'t drink beer (barring "Shotgun" challenges) and dislikes nearly all food except Chicken and Dumplings — also a talented singer/guitarist known to the MOC for 35 years. Landed a new record Butterfly Ray (19.5") in 2023.',
  },
  {
    name: "Eric Keresty",
    matchKeys: ["Eric Keresty"],
    blurb:
      'Writes "Deep Thoughts from the M.O.C." in every single newsletter and has run the tournament throughout the archive. Also fishes himself: 4th place in 2010, and Glory Shot wins in 2018 (rainbow trout on the fly) and 2023 (brown trout in Utah, a "bucket list trip").',
  },
  {
    name: "Greg Keresty",
    matchKeys: ["Greg Keresty"],
    blurb:
      'Informally dubbed "Sea Robin Royalty" for helping build the tournament\'s modern framework and pushing its move to Assateague. His sole Championship came in 2004. In 2012 he landed a 29" skate that remains the all-time SRC record — though a separate near-record skate he caught in 2013 went unrecognized because he released it before an official measurement. Won the very first response-card contest by mailing in a miniature fishing rod with a real hook attached.',
  },
  {
    name: "Jeff Kern",
    matchKeys: ["Jeff Kern", "Kern"],
    blurb:
      'First joined for the infamous fishless, gale-force-wind washout of 2011 — the MOC later wrote he was "glad he decided to return the following year." Won his first Championship in 2020 with a new record 20" Flounder, beating both Dave Gonzalez and 5-time-champ Will Koth. Described in a 2025 spotlight as showing up to a pre-SRC trout tournament "barely clothed in an old fishing vest with a half-chewed cigar clenched between his teeth."',
  },
  {
    name: "Will Koth",
    matchKeys: ["Will Koth", "Koth"],
    blurb:
      'The tournament\'s most decorated Champion for most of the archive: five titles (2000, 2005, 2012, 2014, 2019), including a 3rd win despite Hurricane Sandy forcing a last-minute relocation. Was the all-time points leader for over a decade (once joking he wanted his name "on each face of the trophy") until Dave Gonzalez finally passed him in 2024. Caught the tournament\'s very first Calcutta "winning" shark in 2011, only to be beaten in the final minutes.',
  },
  {
    name: "George Mummert",
    matchKeys: ["George Mummert", "Mummert"],
    blurb:
      "Hand-crafted a bronze remodel of the SRC Trophy itself in 2010, complete with internal storage for the original crystal trophy. Won Glory Shot competitions in 2012 (Tiger Musky) and 2014 (bluefish), and finished 2nd overall in the 2014 tournament.",
  },
  {
    name: "Mike Santimaw",
    matchKeys: ["Mike Santimaw", "Santimaw"],
    blurb:
      'Beloved for running the informal "Lunchtime Cheeseburger Delivery Service" at camp every year — a tradition the MOC didn\'t create but fully embraces. Was the tournament\'s only Shiner in its highest-volume fishing year (2016, 124 fish caught).',
  },
  {
    name: "Jeff Spear",
    matchKeys: ["Jeff Spear", "Spear"],
    blurb:
      'A Participant since 1999 and the only SRC angler ever to catch a gamefish using an artificial lure — a flounder back in 2001, long before lure bonuses existed. Repeatedly described as "the highest-ranked angler never to have won a Championship," a title that persisted for years across multiple newsletters.',
  },
  {
    name: "Sean Sullivan",
    matchKeys: ["Sean Sullivan", "Sullivan"],
    blurb:
      'Won a controversial first Championship in 2007 by catching just two eels during a hurricane-forced relocation, and endured 11 years of ridicule for it before "silencing" his critics with a legitimate 2nd Championship in 2018, landing a new record 11" Black Drum.',
  },
  {
    name: "Chris Vlot",
    matchKeys: ["Chris Vlot", "Vlot"],
    blurb:
      "The camp's cook, a fixture since 1999 (24 consecutive tournaments at one point). Holds the smallest championship margin in SRC history — a disputed 70-point win in 2001 via a contested measuring technique — a controversy that directly led to the creation of the Official SRC Measuring Device Rule. Won the 2020 Glory Shot with a carp.",
  },
];

/** Case-insensitive substring match against every angler's match keys.
 * Returns the first hit's blurb, or null if nothing matches. */
export function findAnglerLore(message: string): string | null {
  const text = message.toLowerCase();
  for (const entry of ANGLER_LORE) {
    for (const key of entry.matchKeys) {
      if (text.includes(key.toLowerCase())) return entry.blurb;
    }
  }
  return null;
}
