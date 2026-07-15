/**
 * The Official Sea Robin Classic Rules and Regulations, condensed into
 * retrieval sections. Source: 2019 Rules and Regulations PDF.
 * This text grounds the Tournament AI Assistant and the in-app rulebook.
 */
export interface RuleSection {
  id: string;
  title: string;
  keywords: string[];
  text: string;
}

export const RULE_SECTIONS: RuleSection[] = [
  {
    id: "summary",
    title: "Tournament Summary",
    keywords: ["summary", "overview", "what is", "invite", "camping", "weekend", "friday", "saturday", "moc", "keresty"],
    text: `The Sea Robin Classic Surf Fishing Tournament (The Tourney, The Sea Robin, SRC) is an invite-only camping and fishing event hosted annually by Mr. E.W. Keresty, the M.O.C. (Master of Ceremonies). It runs two nights (Friday and Saturday) and one complete day (Saturday), consisting of surf fishing plus other competitive events as determined by the M.O.C. By accepting the invitation, all Participants agree to abide by all rules and regulations.`,
  },
  {
    id: "fees",
    title: "Fees",
    keywords: ["fee", "fees", "cost", "pay", "payment", "check", "money order", "refund", "returned check"],
    text: `The annual fee is subject to change without notice and, once paid, is non-refundable. Payable ONLY by personal check or money order prior to the date published by the M.O.C. Cash is accepted only at the campsite for last-minute fee additions. Payment plans are not accepted. Returned checks incur a $30.00 fee each time presented. The entry fee includes campsite accommodations, tournament registration, the Awards Ceremony, Banquet Dinner, and assorted prizes.`,
  },
  {
    id: "accommodations",
    title: "Accommodations & Meals",
    keywords: ["camp", "campsite", "tent", "sleep", "vehicle", "bathroom", "water", "meals", "banquet", "dinner", "food", "breakfast", "lunch"],
    text: `Camping is in tents or primitive shelters only; sleeping in vehicles is allowed if parked properly and completely shut off (not idling). Bathrooms and running water may not be available — bring toilet paper and drinking water. Littering brings sanctions; campground rule violations mean immediate ejection and a lifetime ban. The fee includes the Award Ceremony Banquet Dinner (buffet style — you cook your own provided entrée). NOT provided: Friday dinner, Saturday breakfast, Saturday lunch, Sunday breakfast.`,
  },
  {
    id: "participants",
    title: "Participants & Invitees",
    keywords: ["invite", "invitee", "participant", "roster", "24", "capacity", "prerequisite", "21", "male", "decline", "jafng", "rookie", "grand robin"],
    text: `Only those receiving an official Invite may participate — an Official Sea Robin Invite Letter with authorized response form and return envelope. Accepting means returning the completed form with payment to Eric W. Keresty before the deadline. Capacity is 24 Participants plus the M.O.C. Declines are final; alternates are contacted immediately. Invitees must be males at least 21 years of age. Selection order: (1) Prior Year's Champion, (2) Sea Robin Grand Robins, (3) Prior Year's Participants, (4) Other Invitees as selected by the M.O.C.`,
  },
  {
    id: "champion",
    title: "Champion's Clause, Feast & Benefit",
    keywords: ["champion", "champ", "clause", "feast", "one pot", "peanut", "trophy", "cup", "title", "defend", "benefit", "free"],
    text: `Each year one Participant is crowned Sea Robin Champion and is MANDATED to return the following year to nobly defend the title. A Champion who does not return loses all benefits immediately. The Champion's name and winning score are engraved on the Sea Robin Trophy for all time, with exclusive rights to the Champion's Cup for one year. CHAMPION'S FEAST: the returning Champion provides a Friday evening One Pot meal feeding 24 Participants — cooked and served from one single pot (Crock Pots acceptable; bread/rolls may be served separately). No peanuts or peanut products, ever. CHAMPION'S BENEFIT: the reigning Champion pays no entry fee the year after winning, and is encouraged to put those funds toward the Feast.`,
  },
  {
    id: "equipment",
    title: "Permitted Equipment, Baits & Lures",
    keywords: ["equipment", "rod", "reel", "tackle", "hook", "share", "sharing", "lend", "bait", "lure", "chum", "chumming", "net", "netting"],
    text: `All legal fishing equipment is permitted. Sharing equipment (rods, reels, line) ON THE BEACH is not allowed; if equipment breaks, another Participant may LEND gear provided the borrower keeps reasonable distance and does not fish directly beside the lender. Multiple rods are allowed, but all of a Participant's gear must stay within a reasonable vicinity of that Participant. Netting fish is NOT permitted. All legal baits and lures are permitted; each Participant supplies their own bait. Sharing bait, lures, and terminal tackle IS permitted. Chumming is permitted and encouraged.`,
  },
  {
    id: "fishing-hours",
    title: "Tournament Fishing Hours & DQ Rules",
    keywords: ["hours", "start", "start time", "end", "ending", "dq", "disqualify", "disqualified", "late", "present", "10 minutes", "2 hours", "signal", "group vote"],
    text: `Fishing takes place only during Tournament hours set by the M.O.C. and established by Group Vote. Only fish caught during Tournament hours score. NO fishing within 10 minutes prior to the official start time — lines and baits must be reeled in until the M.O.C. gives the official signal. Participants must be on the beach and counted "Present" by the M.O.C. within 2 HOURS of the official start time or they are DISQUALIFIED. Fish hooked but not landed by the ending time do not score, and fish may not be presented for measurement after the end unless the M.O.C. announces otherwise. Skipping the Opening or Awards Ceremony means you are not counted present for that year statistically.`,
  },
  {
    id: "areas",
    title: "Fishing Areas & Boundaries",
    keywords: ["area", "boundary", "beach", "jetty", "jetties", "pier", "inlet", "dock", "wharf", "boat", "raft", "300 feet", "off limits", "indian river", "assateague", "location"],
    text: `All fishing is done from the beach — standing, sitting, or wading in the surf. All rocks, jetties, piers, inlets, docks and wharfs are OFF LIMITS. No boats or rafts. All Participants fish in the same specified area. Beach areas adjacent to the Indian River Inlet (Delaware) are off-limits. You are in an off-limits area if you or your group are more than 300 FEET from the next Participant or group on your right or left. Bottom line: Stay Together. It's more fun! Known locations: Delaware — 3Rs Road (open), Fenwick Island crossings (open), Cape Henlopen North Beach (open; the fishing pier is CLOSED). Maryland — Assateague Island, beach directly in front of the Group Camping Sites only; Site "B" at the end of Rt 707 (Old Bridge Road, Ocean City) is the severe-weather contingency location.`,
  },
  {
    id: "vehicles",
    title: "Beach Vehicles",
    keywords: ["vehicle", "4x4", "truck", "drive", "rove", "scout", "spotting"],
    text: `Legally permitted 4x4 vehicles may transport Participants and equipment onto and off the beach ONLY. Vehicles may not be used to rove the beach spotting fish or scouting spots — doing so is a disqualification.`,
  },
  {
    id: "caught-fish",
    title: "Fish Identification & Keeping Fish",
    keywords: ["caught", "identify", "identification", "species", "landed", "dropped", "released", "keep", "keeping", "eat", "undersized", "illegal"],
    text: `Every fish caught must be correctly identified and measured. A CAUGHT FISH is one hooked and landed on the beach with such control that it is easily and completely identified and accurately measured. Fish lost in the waves, dropped in the surf, or released before measuring are NOT caught and do not score. Unidentifiable fish go to the M.O.C. for a final ruling — the M.O.C.'s decision is always final. Any legal-sized fish per State regulations may be kept and eaten; keeping undersized or illegal fish means disqualification and a lifetime ban.`,
  },
  {
    id: "scorecard",
    title: "Scorecard & Measuring",
    keywords: ["scorecard", "score card", "measure", "measuring", "tape", "yardstick", "36", "device", "wingtip", "nose", "tail", "zero"],
    text: `Each Participant receives an individualized scorecard before the start; scorecards may not be shared. A completed scorecard must be turned in immediately at the end of the Tournament — failure (or turning it in more than 30 minutes after the ending time) means an automatic Total Score of ZERO. The scorecard groups fish into four categories: the Coveted Sea Robin, Game Fish Tier 1, Game Fish Tier 2, and Trash Fish (with a limit of 3 scorable Trash Fish per angler). Each species is assigned a size-banded point value per inch. Fish are measured from the tip of the nose to the tip of the tail; SKATES and RAYS are measured wingtip to wingtip. All measuring uses an approved measuring device longer than the fish: any device producing exact measurements equal to or exceeding 36 inches (tape measures, yardsticks, folding extension rulers, extension tapes).`,
  },
  {
    id: "scoring",
    title: "Scores, Point System & Tiebreakers",
    keywords: ["score", "scores", "points", "ppi", "points per inch", "tier", "tier 1", "tier 2", "calculation", "tie", "tiebreaker", "rounding", "final", "trash limit", "full monty", "trifecta", "sea robin points"],
    text: `Each species has a points-per-inch (PPI) value that is SIZE-BANDED, and total points = length × PPI for that band. The 2026 point system:
• The Coveted Sea Robin — 500 PPI at any size.
• Game Fish TIER 1 (Striped Bass, Flounder, Red Drum) — under 18" = 120 PPI; 18" and over = 200 PPI.
• Game Fish TIER 2 (all other game fish) — under 13" = 50 PPI; 13" to under 18" = 100 PPI; 18" and over = 120 PPI.
• TRASH FISH (Sharks, Skates, Rays, Toadfish, Oyster Crackers, Stargazers) — 0" to under 12" = 20 PPI; 12" to under 17" = 30 PPI; 17" and over = 50 PPI. Only the best THREE (3) scorable Trash Fish per angler count toward the score.
THE FULL MONTY: +1,000 points to the angler who lands BOTH the Largest Game Fish and the Largest Trash Fish of the Tournament.
All final calculations are completed by the M.O.C. before the Awards Ceremony; scores are final and subject to rounding. TIEBREAKER hierarchy for the top three slots: Highest Scoring Game Fish → Largest Game Fish → Most Game Fish → Highest Scoring Fish → Largest Fish → Most Fish → alternate method at the M.O.C.'s discretion. The M.O.C. fishes but is not eligible for prizes or Champion status.`,
  },
  {
    id: "trophy",
    title: "Trophy Fish Clause & Lure Bonus",
    keywords: ["trophy", "24", "16", "bonus", "lure", "artificial", "gamefish", "game fish", "trash fish", "exact"],
    text: `LURE BONUS ("Score More with a Lure"): any Game Fish measuring 16" or greater landed on a bona-fide artificial lure earns an additional +100 PPI on that fish. NO BAIT is permitted on that fish, and the lure must be presented to the M.O.C. for validation.
TROPHY FISH CLAUSE: any Game Fish measuring OVER 24" is a Trophy Fish and earns an additional +100 PPI on that fish only. Trash fish are NOT eligible for Trophy status. All Trophy Fish must be presented to the M.O.C. for official measurement — a fish over 24" not measured by the M.O.C. gets NO bonus. Trophy measurements are never rounded; only exact measurements are used.`,
  },
  {
    id: "record-breaker",
    title: "Record Breaker Clause",
    keywords: ["record", "breaker", "record breaker", "bonus", "largest", "beat", "history", "100"],
    text: `Any Participant catching a fish longer than the current Sea Robin Record for that species earns an additional +100 PPI on that specific fish only. All Record Breaker fish must be presented to the M.O.C. for official measurement or NO bonus applies. Only ONE fish per species can take Record Breaker status each year; if two Participants break the same record, the larger fish presented to the M.O.C. wins the bonus — if identical in size, both receive it. Record measurements are never rounded.`,
  },
  {
    id: "exception",
    title: "Trophy & Record Breaker Exception (Witness Rule)",
    keywords: ["exception", "witness", "verify", "verifying", "sign", "signature", "night", "unavailable", "collusion", "stress", "release"],
    text: `If a Trophy or Record fish is caught and the M.O.C. is not immediately available, another SRC Participant may measure and record the catch. The verifying Participant must SIGN the catcher's scorecard, attesting to species identification and measurement accuracy, and assumes personal responsibility for any real or perceived collusion — any breach of trust is dealt with swiftly and with uncompromising finality. Every reasonable effort must still be made to summon the M.O.C. The exception applies ONLY: (1) during night fishing hours when the M.O.C. has left the beach; (2) during daylight when the M.O.C. is away for meal prep, rest, or nature's call; (3) any time waiting would compromise the post-release survival of the fish.`,
  },
  {
    id: "abandonment",
    title: "Abandonment Clause & Penalty",
    keywords: ["abandon", "abandonment", "leave", "depart", "penalty", "abd", "1500", "10%", "emergency", "injury", "carpool"],
    text: `Participants who willfully depart before Closing Ceremonies end, intending to no longer participate, forfeit all scores for the year, are recorded as ABD, and are penalized. Permitted exceptions: (1) grave injuries sustained at the Tournament requiring off-site medical attention, (2) family emergencies requiring physical presence elsewhere, (3) carpool passengers of a Participant with a valid exception. Violators begin the next SRC Tournament with a scoring deficit equal to 10% of their cumulative career score, minimum penalty 1,500 points.`,
  },
  {
    id: "prizes",
    title: "Prizes, Champion's Cup & Apparel",
    keywords: ["prize", "prizes", "cup", "crystal", "apparel", "shirt", "wear", "second", "third", "damaged", "return"],
    text: `Prizes go to the top 3 scoring Participants. The Champion receives the coveted Champion's Cup — a leaping crystal fish atop a circular domed crystal base — gifted for a period not to exceed one year. If damaged while in a Champion's possession, that Champion pays for its replacement. The Cup must return to the Tournament every year without exception — failure to bring it means a ban from future Tournaments. Any Participant who won prior-year Tournament Apparel is EXPECTED to wear it each subsequent year (owner's choice of piece if multiple are owned).`,
  },
  {
    id: "derek-clause",
    title: "The Derek Clause (Unofficial Legend)",
    keywords: ["hot dog", "hotdog", "hot dogs", "hotdogs", "derek", "34000", "34,000", "sleeping", "asleep", "easter egg", "secret", "legend", "hands", "biggest bonus", "most points"],
    text: `THE DEREK CLAUSE (wholly unofficial, whispered only around the Saturday fire): legend holds that any Participant who successfully places hot dogs into Derek's sleeping hands — without waking him — shall be awarded a mythical 34,000 points. Be warned: these points are purely ceremonial. They never appear on any official scorecard, they cannot be validated by the M.O.C., and they will absolutely not count toward your Total Score. What you actually win is glory — eternal, unscored, and legendary. Attempt at your own risk; a woken Derek is a formidable Derek.`,
  },
  {
    id: "sandimas-cheeseburgers",
    title: "The Sandimas Cheeseburger Phenomenon (Unofficial Legend)",
    keywords: ["cheeseburger", "cheeseburgers", "burger", "burgers", "mcdonalds", "mcdonald's", "mickey d", "food", "lunch", "fries", "nuggets", "sandimas", "santimaw", "mike santimaw", "fastball", "10:54", "when do cheeseburgers", "delivery", "arrive"],
    text: `THE SANDIMAS CHEESEBURGER PHENOMENON (wholly unofficial, unscored, and yet more reliable than the tides): When do cheeseburgers arrive? There is no schedule — the beach simply knows. Typically, the instant Mike Santimaw (a.k.a. "Sandimas") either lands a fish OR is seized by the sacred urge to leave the beach — historically clocking in right around 10:54 a.m. on Tournament Day — he vanishes without a word or a goodbye. He then resurfaces, as if summoned by the Golden Arches themselves, bearing bags of McDonald's in truly biblical mass quantities: cheeseburgers, fries, and nuggets, stuffed to bursting. Distribution proceeds down the beach by one of two sacred methods — the gentle direct hand-off, or the entirely unsolicited fastball delivered squarely into an unsuspecting Participant's chest. Keep your hands up and your eyes open. Nutritional value: debatable. Morale value: immeasurable. Points awarded: zero, always — but the legend feeds on.`,
  },
  {
    id: "three-room-vacation-home",
    title: "The 3-Room Vacation Home (Unofficial Legend)",
    keywords: ["3 room", "three room", "3-room", "vacation home", "tent", "the hilary", "hilary", "propane", "propane heat", "heat", "cabin", "shelter", "palace", "canvas", "sandimas", "santimaw", "spot", "tony", "greg hudson", "john friscia", "friscia", "residents", "camp", "sleep", "retired", "2016"],
    text: `THE 3-ROOM VACATION HOME (unofficial, un-zoned, retired since 2016): Sandimas's legendary beach mansion — a Timberline Basin 12-Sleeper instant cabin (poly-weave, moss-green and bone-white; strictly NO canvas), three whole rooms and a front door you could walk through standing up. Its honored tenants over the years: Mike Santimaw ("Sandimas," landlord, master suite), Tony "Spot," Greg Hudson, and John Friscia. At its peak it had actual PROPANE HEAT piped inside — a luxury so obscene the tides got jealous. It was the glorious upgrade to "The Hilary," the massive old CANVAS tent that reigned before it. Retired in 2016 and no longer in service. Nightly rate: zero points, always. Reservations: closed — ask the ghosts of tournaments past.`,
  },
  {
    id: "jurisdiction",
    title: "Additional Regulations & Jurisdiction",
    keywords: ["jurisdiction", "final", "decision", "infraction", "malfeasance", "corrupt", "liability", "responsible"],
    text: `Any Participant operating outside these rules is disqualified and barred from subsequent Tournaments. All infractions are investigated; all final decisions rest solely with E.W. Keresty acting as Master of Ceremonies (A.A.M.O.C.) of the S.R.C.S.F.T. Malfeasance not explicitly covered by the rules is regulated solely and without debate by the A.A.M.O.C. The A.A.M.O.C. is not responsible for losses or injuries; participation implies acceptance of all terms as written.`,
  },
  {
    id: "shiner-club",
    title: "The Shiner & The Shiner Club President",
    keywords: ["shiner", "shiner club", "president", "goose egg", "goose", "egg", "blank", "blanked", "skunk", "skunked", "zero points", "zero", "no fish", "dq", "abd", "disqualified", "abandoned", "streak", "club"],
    text: `THE SHINER: A "Shiner" is a Participant who fished a given year's Tournament and finished it having caught zero scoring fish — a blank, a goose egg. It requires participation: sitting a year out is not a Shiner, it is simply an absence. A Shiner is judged at the final, published standings. Note two statuses that are NOT Shiners because the angler did not validly finish at zero: DQ (Disqualified) and ABD (Abandoned the Tournament). Neither counts as a Shiner, and either one breaks a Shiner streak.

THE SHINER CLUB PRESIDENT: Each year the Club crowns a President — a tongue-in-cheek crown for the proudest blanker of them all. To be eligible you must be a Shiner in the current year. Among the current year's Shiners, the Presidency goes to the one with the longest ACTIVE Shiner streak: the most consecutive years, ending with and including the current year, in which they participated and blanked (a scored year, a DQ, an ABD, or a year sat out all break the streak). If two or more are tied, the office goes to whoever most recently held the Presidency before; if that still cannot separate them, the M.O.C.'s ruling is final. If nobody blanks in a given year, the office sits vacant. The crown is worn with a grin, defended with a shrug, and passed to whoever out-blanks you next.`,
  },
];

/** Lightweight keyword retrieval for grounding the assistant (works offline). */
export function retrieveSections(query: string, k = 4): RuleSection[] {
  const q = query.toLowerCase();
  const words = q.split(/[^a-z0-9%]+/).filter((w) => w.length > 2);
  const scored = RULE_SECTIONS.map((s) => {
    let score = 0;
    for (const kw of s.keywords) if (q.includes(kw)) score += 3;
    for (const w of words) {
      if (s.text.toLowerCase().includes(w)) score += 1;
      if (s.title.toLowerCase().includes(w)) score += 2;
    }
    return { s, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, k).map((x) => x.s);
}

export const FULL_RULES_TEXT = RULE_SECTIONS.map(
  (s) => `## ${s.title}\n${s.text}`,
).join("\n\n");
