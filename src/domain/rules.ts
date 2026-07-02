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
    keywords: ["invite", "invitee", "participant", "roster", "24", "capacity", "prerequisite", "18", "male", "decline", "jafng", "rookie"],
    text: `Only those receiving an official Invite may participate — an Official Sea Robin Invite Letter with authorized response form and return envelope. Accepting means returning the completed form with payment to Eric W. Keresty before the deadline. Capacity is 24 Participants plus the M.O.C. Declines are final; alternates are contacted immediately. Invitees must be males at least 18 years of age. Selection order: (1) Prior Year's Champion, (2) Sea Robin Grand Robins (3), (3) Prior Year's Participants, (4) Adult Children of Participants, (5) Others selected by the M.O.C.`,
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
    text: `Each Participant receives an individualized scorecard before the start; scorecards may not be shared. A completed scorecard must be turned in immediately at the end of the Tournament — failure means an automatic score of ZERO. Each species is assigned a point value per inch. Fish are measured from the tip of the nose to the tip of the tail; SKATES are measured wingtip to wingtip. All measuring uses an approved measuring device longer than the fish: any device producing exact measurements equal to or exceeding 36 inches (tape measures, yardsticks, folding extension rulers, extension tapes).`,
  },
  {
    id: "scoring",
    title: "Scores, Calculation & Tiebreakers",
    keywords: ["score", "scores", "points", "calculation", "tie", "tiebreaker", "rounding", "final", "awards ceremony", "newsletter"],
    text: `All final score calculations, including bonuses and penalties, are completed by the M.O.C. before the Awards Ceremony. Scores are final and subject to rounding by the M.O.C. Final scores are announced at the Award Ceremony and cannot be discussed by the M.O.C. before then. TIEBREAKER hierarchy for the top three slots: Highest Scoring Game Fish → Largest Game Fish → Most Game Fish → Highest Scoring Fish → Largest Fish → Most Fish → alternate method at the sole discretion of the M.O.C. All scores are displayed in descending order in the following year's newsletter. The M.O.C. fishes but is not eligible for prizes or Champion status.`,
  },
  {
    id: "trophy",
    title: "Trophy Fish Clause",
    keywords: ["trophy", "24", "bonus", "gamefish", "game fish", "trash fish", "exact"],
    text: `Any GAMEFISH measuring over 24 inches is a Trophy Fish and receives bonus points per the official scorecard. Trash fish are NOT eligible for Trophy status. All Trophy Fish must be presented to the M.O.C. for official measurement — a fish over 24" not measured by the M.O.C. gets NO bonus points. After measurement the Participant may release or keep the fish per State law. Trophy measurements are never rounded — only exact measurements are used.`,
  },
  {
    id: "record-breaker",
    title: "Record Breaker Clause",
    keywords: ["record", "breaker", "record breaker", "bonus", "largest", "beat", "history"],
    text: `Any Participant catching a fish longer than the current Sea Robin Record for that species receives bonus points per the official scorecard. All Record Breaker fish must be presented to the M.O.C. for official measurement or NO bonus applies. Only ONE fish per species can take Record Breaker status each year; if two Participants break the same record, the larger fish presented to the M.O.C. wins the bonus — if identical in size, both receive it. Record measurements are never rounded.`,
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
    id: "jurisdiction",
    title: "Additional Regulations & Jurisdiction",
    keywords: ["jurisdiction", "final", "decision", "infraction", "malfeasance", "corrupt", "liability", "responsible"],
    text: `Any Participant operating outside these rules is disqualified and barred from subsequent Tournaments. All infractions are investigated; all final decisions rest solely with E.W. Keresty acting as Master of Ceremonies (A.A.M.O.C.) of the S.R.C.S.F.T. Malfeasance not explicitly covered by the rules is regulated solely and without debate by the A.A.M.O.C. The A.A.M.O.C. is not responsible for losses or injuries; participation implies acceptance of all terms as written.`,
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
