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
      'Fred joined the SRC roster in 1999 and, by his own admission, is not a fisherman — the record book agrees, cheerfully. That first season he posted a single 7" bluefish worth 35 points, still the worst scorecard in tournament history, and nobody\'s come close to beating it since. Stats were never really his department, though — his department is the mini keg "Wilson," named in his honor after one legendary fireside collapse, and a friendship with the MOC that predates most people\'s mortgages. He did somehow back into the tournament\'s very first Calcutta win in 2011 (one 12" spotted hake, celebrated per the newsletter in "a drunken frenzy of profanity laced excitement"), and broke the Puffer Fish record in 2018 — presumably while looking for the cooler.',
  },
  {
    name: "Pete Dzien",
    matchKeys: ["Pete Dzien", "Dzien"],
    blurb:
      'Pete Dzien has been part of the SRC since 1998, but he\'s best remembered for one specific sunrise in 2010, when he charged the beach at 5am hollering that he was going to win the whole thing — and then actually did, becoming only the second angler ever to win the Championship twice, on the strength of two flounder and a 20.5" shark. He backed it up in 2013 with a new record 21.5" Stargazer, because apparently yelling at the ocean works.',
  },
  {
    name: "Jerry Egan",
    matchKeys: ["Jerry Egan", "GAE", "Sailor Jerry", "Egan"],
    blurb:
      'Jerry Egan first showed up in 1999 as the SRC\'s resident tragic hero — always in the mix, never quite closing it out, the kind of guy the newsletter kept rooting for. Then 2021 arrived and broke something in the universe: his first Championship, at last. He responded by not stopping — four Championships in a row, an "Egan Era" that finally buried the tournament\'s long-standing superstition, the Champion\'s Curse, under a pile of his own trophies. His 2024 season — 18,485 points, propped up by a single 19" flounder worth 5,700 points on its own — is the single highest point total anyone has ever posted. He\'s also the reigning, repeat "Second Gentleman" of Derek Hall\'s gloriously disorganized Calcutta side-tournament, because apparently he can\'t help but win things.',
  },
  {
    name: "John Friscia",
    matchKeys: ["John Friscia", "Friscia"],
    blurb:
      'John Friscia has been fishing the SRC since 1998, though for a long stretch that verb was doing a lot of work — he went years without landing a single fish, long enough to be crowned President of the inaugural Shiners Club in 2010, the tournament\'s finest zero-fish anglers. Then he finally hooked something, and the newsletter greeted the news with an actual "HERE\'S JOHNNY!!" headline. He\'s also been honored for hand-crafting the cornhole set that became the tournament\'s official sporting event, and was one of the anglers at the center of a disputed 2001 measurement controversy that\'s the entire reason the SRC now has an Official Measuring Device Rule.',
  },
  {
    name: "Steve Getsie",
    matchKeys: ["Steve Getsie", "Getsie"],
    blurb:
      'Steve Getsie joined the SRC in 2011 as a self-described river-fishing outdoorsman, which either helped or didn\'t, because it still took him a few years to find his footing. He set a new record 13" kingfish in 2015, then cashed it all in for his first Championship the very next year.',
  },
  {
    name: "Charles Goins",
    matchKeys: ["Charles Goins", "Goins"],
    blurb:
      'Charles Goins won his first SRC Championship in 1999 and then made everyone wait a very long time for a second one, finally getting it in 2015 with a new record 7" pufferfish — a win the MOC called "even sweeter" than the first, mostly because of how long the wait was. He also won the 2022 Glory Shot with a "monstrous" Largemouth Bass allegedly caught on a pink hula popper, a claim the newsletter treated with the skepticism it probably deserved.',
  },
  {
    name: "Dave Gonzalez",
    matchKeys: ["Dave Gonzalez", "Gonzo", "Gonzalez"],
    blurb:
      'Dave Gonzalez, better known simply as Gonzo, joined the SRC in 2004 and has been quietly assembling a dynasty ever since. In 2013 his rod holder literally snapped in the tournament\'s final hour, and he responded by landing a record 25.5" Red Drum anyway. In 2017 he became the first angler ever to pull off the "Full Monty" bonus, prompting the MOC to declare "there\'s a new sheriff in town." He\'s also developed a habit of finding species nobody else bothers with — a Cusk Eel in 2022 among them — and in 2024 he finally passed Will Koth to become the SRC\'s all-time career points leader.',
  },
  {
    name: "Derek Hall",
    matchKeys: ["Derek Hall"],
    blurb:
      'Derek Hall has been part of the SRC scene since 2000, and while his own scorecard has never been the story, everything around it usually is. He founded the tournament\'s chaotic Thursday-night Calcutta side-bet, presiding over it in a state the newsletter has charitably described as "perpetually intoxicated." He once became the first Participant ever formally marked as a Shiner while still seated in his camping chair, unable to move or speak, "relying heavily on chocolate chip cookies and chilled scotch." He did manage two Glory Shot wins along the way — a largemouth bass in 2010 and a 32" Tiger Musky in 2013 — so the fish do occasionally show up too.',
  },
  {
    name: "Phillip Hall",
    matchKeys: ["Phillip Hall", "Phill Hall"],
    blurb:
      'Phillip "Phill" Hall joined the SRC in 2009 and has kept his ambitions refreshingly modest ever since — his best-ever gamefish, to date, is a 9" Striped Bass landed in 2010. He did eventually pick up the Silver Perch record in 2020, and once finished third in an early response-card contest with an entry titled, memorably, "Nancies in the sand."',
  },
  {
    name: "Patrick Hough",
    matchKeys: ["Patrick Hough", "Nephew Hough", "Hough"],
    blurb:
      'Patrick "Nephew" Hough is, as the nickname suggests, the MOC\'s actual nephew, who joined the SRC in 2019 and immediately proved that family connections don\'t help you catch fish — he showed up with freshwater crappie spinnerbaits, entirely the wrong gear for the ocean, and earned himself a Shiner mark on his very first scorecard. He\'s been a steady "gamefish magnet" ever since, presumably after someone finally showed him the tackle shop.',
  },
  {
    name: "Greg Hudson",
    matchKeys: ["Greg Hudson", "Hudson"],
    blurb:
      'Greg Hudson has been fishing the SRC since 2001, and for a long stretch his most notable accomplishment was serving as Secretary of the 2010 Shiners Club — the mock leadership slate for anglers who\'d caught nothing. He was also the one who first noticed response cards were missing from tournament invites, single-handedly launching an annual response-card contest. He finally broke through with his first Elite-3 finish in 2016, and picked up a record Butterfly Ray in 2023. A 2017 spotlight also noted he\'s reportedly the only Participant who doesn\'t drink beer and dislikes nearly every food except Chicken and Dumplings — which, if nothing else, keeps grocery runs simple.',
  },
  {
    name: "Eric Keresty",
    matchKeys: ["Eric Keresty"],
    blurb:
      'Eric Keresty has run the SRC since 1998 and writes "Deep Thoughts from the M.O.C." in every single newsletter, which makes him either the tournament\'s most reliable narrator or its only unreliable one, depending who you ask. He does still fish himself when the robes come off — a 4th-place finish in 2010, plus Glory Shot wins in 2018 (a rainbow trout on the fly) and 2023 (a brown trout in Utah, on what he called a bucket-list trip).',
  },
  {
    name: "Greg Keresty",
    matchKeys: ["Greg Keresty"],
    blurb:
      'Greg Keresty has been part of the SRC since the very beginning in 1998, and is informally known as "Sea Robin Royalty" for helping build the tournament\'s modern framework and pushing its eventual move to Assateague. His sole Championship came in 2004, and in 2012 he landed a 29" skate that remains the all-time SRC record to this day — though a second near-record skate in 2013 doesn\'t count, because he released it before anyone could officially measure it, a mistake he presumably does not need reminding of. He also won the very first response-card contest by mailing in a miniature fishing rod with a real, working hook attached, which is either the most committed or the most dangerous RSVP in tournament history.',
  },
  {
    name: "Jeff Kern",
    matchKeys: ["Jeff Kern", "Kern"],
    blurb:
      'Jeff Kern\'s SRC career got off to the worst possible start in 2011, when he joined right in time for the infamous, gale-force-wind, completely fishless washout of a tournament — the MOC later admitted he was "glad he decided to return the following year." Return he did, and in 2020 he claimed his first Championship with a record 20" Flounder, beating both Dave Gonzalez and five-time-champ Will Koth in the process. A 2025 spotlight also recalled first meeting him at a pre-SRC trout tournament "barely clothed in an old fishing vest with a half-chewed cigar clenched between his teeth," which honestly explains a lot.',
  },
  {
    name: "Will Koth",
    matchKeys: ["Will Koth", "Koth"],
    blurb:
      'Will Koth joined the SRC in 2000 and, it turned out, never really left the podium — five Championships in all, including a title won in 2012 despite Hurricane Sandy forcing a last-minute relocation of the entire tournament. He was the SRC\'s all-time points leader for over a decade, once joking he wanted his name "on each face of the trophy" (there are four faces; he got most of them). He also caught what he thought was the winning shark in the tournament\'s very first Calcutta back in 2011, only to be scooped in the closing minutes — proof that even legends get got sometimes.',
  },
  {
    name: "George Mummert",
    matchKeys: ["George Mummert", "Mummert"],
    blurb:
      'George Mummert has been fishing the SRC since 1999, and somewhere along the way decided competing wasn\'t enough — in 2010 he hand-crafted an entire bronze remodel of the SRC Trophy itself, complete with hidden storage for the original crystal version, because apparently he\'s also a metalworker in his spare time. He picked up Glory Shot wins in 2012 (a Tiger Musky) and 2014 (a bluefish), and finished 2nd overall in the 2014 tournament, presumably while still admiring his own trophy work.',
  },
  {
    name: "Mike Santimaw",
    matchKeys: ["Mike Santimaw", "Santimaw"],
    blurb:
      'Mike Santimaw started coming to the SRC in 2001, and although he no longer makes it to the beach each year, he still remains part of the SRC IT team. His scorecard was never the headline, but his lunchtime menu was: he\'s the man behind the informal "Lunchtime Cheeseburger Delivery Service," a beloved camp tradition the MOC didn\'t invent but happily takes credit for enjoying. In 2016 — the single highest-volume fishing year in SRC history, with 124 fish landed — Mike was the only angler at the entire tournament who caught nothing at all, which feels almost impressively specific.',
  },
  {
    name: "Jeff Spear",
    matchKeys: ["Jeff Spear", "Spear"],
    blurb:
      'Jeff Spear has fished the SRC since 1999 and holds a genuinely unique distinction: he\'s the only angler in tournament history to catch a gamefish on an artificial lure before lure bonuses even existed — a flounder, back in 2001, apparently just for the fun of it. For years afterward, the newsletter kept handing him the same bittersweet title: the highest-ranked angler never to have won a Championship. It\'s not clear if that\'s finally changed, but it wasn\'t for lack of trying.',
  },
  {
    name: "Sean Sullivan",
    matchKeys: ["Sean Sullivan", "Sullivan"],
    blurb:
      'Sean Sullivan has been part of the SRC since 1999, and won his first Championship in 2007 under, let\'s say, unusual circumstances — a hurricane forced a last-minute relocation, and he took the title with a grand total of two eels. The roster spent years ribbing him for it. He finally silenced everybody in 2018 with a thoroughly legitimate second Championship and a new record 11" Black Drum, proving eels aside, the man can fish.',
  },
  {
    name: "Chris Vlot",
    matchKeys: ["Chris Vlot", "Vlot"],
    blurb:
      "Chris Vlot has been the SRC's unofficial camp cook since 1999, and also happens to hold the smallest championship margin in tournament history — a 70-point win in 2001 that came down to a disputed measuring technique, a controversy so contentious it directly created the SRC's Official Measuring Device Rule. He's kept things simpler since, picking up the 2020 Glory Shot with a carp.",
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
