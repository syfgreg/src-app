// AUTO-GENERATED from 'SRC Cumulative Scoring Standings - 2026.xlsx'.
// Career accolades for every S.R.C. angler, past and present.
// Regenerate if the standings workbook changes.

/**
 * A season's result for a year the angler PARTICIPATED:
 *   • a number  — points scored (0 = a "Shiner": fished, caught no scoring fish)
 *   • "DQ"      — disqualified that year (NOT a Shiner)
 *   • "ABD"     — abandoned the tournament that year (NOT a Shiner)
 * Years the angler sat out are simply absent from `history`.
 */
export type SeasonResult = number | "DQ" | "ABD";

export interface Accolade {
  id: string;
  name: string;
  email?: string;
  championships: number;
  recordsHeld: number;
  elite3: number;
  years: number;
  grandRobin: boolean;
  moc: boolean;
  careerTotal: number;
  placeThisYear?: number;
  /** [year, result] for participated years. 0 = Shiner; "DQ"/"ABD" don't count. */
  history: [number, SeasonResult][];
}

export const HALL_OF_FAME: Accolade[] = [
  { id: "davegonzalez1@gmail.com", name: "Dave Gonzalez", email: "davegonzalez1@gmail.com", championships: 4, recordsHeld: 5, elite3: 13, years: 22, grandRobin: false, moc: false, careerTotal: 116613, placeThisYear: 1, history: [[2004, 2651], [2005, 2850], [2006, 6500], [2007, 0], [2008, 1305], [2009, 3665], [2010, 3100], [2011, 0], [2012, 5150], [2013, 11635], [2014, 3100], [2015, 3650], [2016, 7285], [2017, 8960], [2018, 2225], [2019, 6862], [2020, 9060], [2021, 900], [2022, 8585], [2023, 5825], [2024, 14805], [2025, 8500]] },
  { id: "wok451@aol.com", name: "Will Koth", email: "wok451@aol.com", championships: 5, recordsHeld: 1, elite3: 15, years: 26, grandRobin: false, moc: false, careerTotal: 104083, placeThisYear: 2, history: [[2000, 3540], [2001, 190], [2002, 800], [2003, 0], [2004, 1290], [2005, 5000], [2006, 200], [2007, 4625], [2008, 6838], [2009, 1300], [2010, 3350], [2011, 0], [2012, 10310], [2013, 4195], [2014, 6310], [2015, 3875], [2016, 2775], [2017, 4000], [2018, 3900], [2019, 9290], [2020, 8505], [2021, 3100], [2022, 4200], [2023, 6450], [2024, 4475], [2025, 5565]] },
  { id: "gerardeganjr@gmail.com", name: "Jerry Egan", email: "gerardeganjr@gmail.com", championships: 4, recordsHeld: 1, elite3: 9, years: 23, grandRobin: false, moc: false, careerTotal: 95342.5, placeThisYear: 3, history: [[1999, 0], [2000, 0], [2001, 0], [2002, 740], [2003, 0], [2004, 3005], [2005, 0], [2006, 1088], [2007, 0], [2008, 2425], [2009, 5130], [2014, 3875], [2015, 4950], [2016, 5737.5], [2017, 4237], [2018, 1700], [2019, 4175], [2020, 7250], [2021, 7115], [2022, 9300], [2023, 8330], [2024, 18485], [2025, 7800]] },
  { id: "sonicspear@yahoo.com", name: "Jeff Spear", email: "sonicspear@yahoo.com", championships: 0, recordsHeld: 0, elite3: 4, years: 26, grandRobin: false, moc: false, careerTotal: 53222, placeThisYear: 4, history: [[1999, 400], [2000, 0], [2001, 330], [2002, 0], [2003, 0], [2004, 1095], [2005, 1725], [2006, 1475], [2007, 0], [2008, 550], [2009, 0], [2010, 1900], [2011, 0], [2012, 4550], [2013, 1100], [2014, 3087], [2015, 5925], [2016, 3875], [2017, 0], [2018, 3060], [2019, 1380], [2020, 5760], [2021, 4315], [2022, 2240], [2023, 1175], [2024, 9280]] },
  { id: "jkern75@hotmail.com", name: "Jeff Kern", email: "jkern75@hotmail.com", championships: 1, recordsHeld: 1, elite3: 4, years: 15, grandRobin: false, moc: false, careerTotal: 52400, placeThisYear: 5, history: [[2011, 0], [2012, 5200], [2013, 2400], [2014, 3730], [2015, 2370], [2016, 4130], [2017, 850], [2018, 3375], [2019, 1100], [2020, 9700], [2021, 0], [2022, 5465], [2023, 5755], [2024, 1825], [2025, 6500]] },
  { id: "georgemummert@hotmail.com", name: "George Mummert", email: "georgemummert@hotmail.com", championships: 1, recordsHeld: 0, elite3: 5, years: 25, grandRobin: false, moc: false, careerTotal: 51237.25, placeThisYear: 6, history: [[1999, 516], [2000, 670], [2003, 0], [2004, 6570], [2005, 1725], [2006, 0], [2007, 0], [2008, 190], [2009, 5870], [2010, 0], [2011, 0], [2012, 4250], [2013, 3290], [2014, 4530], [2015, 1395], [2016, 4843.75], [2017, 375], [2018, 1200], [2019, 0], [2020, 840], [2021, 2280], [2022, 1740], [2023, 3312.5], [2024, 5150], [2025, 2490]] },
  { id: "cgfamilyg@comcast.net", name: "Charles Goins", email: "cgfamilyg@comcast.net", championships: 2, recordsHeld: 0, elite3: 5, years: 28, grandRobin: true, moc: false, careerTotal: 48418, placeThisYear: 7, history: [[1998, 0], [1999, 1860], [2000, 600], [2001, 0], [2002, 865], [2003, 256], [2004, 440], [2005, 0], [2006, 0], [2007, 0], [2008, 3700], [2009, 0], [2010, 2645], [2011, 0], [2012, 2800], [2013, 967.5], [2014, 3450], [2015, 7885], [2016, 5212.5], [2017, 512], [2018, 2105], [2019, 0], [2020, 2325], [2021, 1350], [2022, 2495], [2023, 3850], [2024, 1700], [2025, 3400]] },
  { id: "seanksullivan@hotmail.com", name: "Sean Sullivan", email: "seanksullivan@hotmail.com", championships: 2, recordsHeld: 2, elite3: 4, years: 25, grandRobin: false, moc: false, careerTotal: 46495, placeThisYear: 8, history: [[1999, 0], [2000, 0], [2002, 600], [2003, 0], [2004, 3825], [2005, 0], [2006, 1675], [2007, 4950], [2008, 1625], [2009, 0], [2010, 1600], [2011, 0], [2012, 4550], [2013, 0], [2014, 2830], [2015, 2050], [2016, 3775], [2017, 2100], [2018, 4340], [2019, 850], [2020, 4525], [2021, 825], [2022, 0], [2023, 0], [2025, 6375]] },
  { id: "syfgreg@gmail.com", name: "Greg Hudson", email: "syfgreg@gmail.com", championships: 0, recordsHeld: 1, elite3: 1, years: 24, grandRobin: false, moc: false, careerTotal: 44580.5, placeThisYear: 9, history: [[2001, 110], [2002, 680], [2003, 0], [2004, 1553], [2005, 2375], [2006, 0], [2007, 1100], [2008, 1770], [2009, 1400], [2010, 0], [2011, "ABD"], [2012, 620], [2013, 0], [2014, 3425], [2015, 2400], [2016, 8062.5], [2017, 1125], [2019, 0], [2020, 1200], [2021, 0], [2022, 5035], [2023, 4625], [2024, 3175], [2025, 5925]] },
  { id: "fkbubeck10@gmail.com", name: "Fred Bubeck", email: "fkbubeck10@gmail.com", championships: 0, recordsHeld: 1, elite3: 2, years: 27, grandRobin: false, moc: false, careerTotal: 42615, placeThisYear: 10, history: [[1999, 35], [2000, 0], [2001, 0], [2002, 210], [2003, 0], [2004, 800], [2005, 3100], [2006, 0], [2007, 0], [2008, 0], [2009, 0], [2010, 473], [2011, 0], [2012, 5050], [2013, 0], [2014, 500], [2015, 4075], [2016, 4800], [2017, 450], [2018, 0], [2019, 1200], [2020, 4450], [2021, 925], [2022, 1625], [2023, 2210], [2024, 5987], [2025, 6725]] },
  { id: "cmvlot@gmail.com", name: "Chris Vlot", email: "cmvlot@gmail.com", championships: 1, recordsHeld: 0, elite3: 2, years: 27, grandRobin: false, moc: false, careerTotal: 40112, placeThisYear: 11, history: [[1999, 250], [2000, 0], [2001, 730], [2002, 300], [2003, 0], [2004, 770], [2005, 475], [2006, 0], [2007, 0], [2008, 5625], [2009, 0], [2010, 1800], [2011, 0], [2012, 1750], [2013, 1750], [2014, 3700], [2015, 3367], [2016, 4295], [2017, 825], [2018, 3250], [2019, 0], [2020, 1850], [2021, 0], [2022, 325], [2023, 480], [2024, 2895], [2025, 5675]] },
  { id: "sgetsie@icloud.com", name: "Steve Getsie", email: "sgetsie@icloud.com", championships: 1, recordsHeld: 0, elite3: 2, years: 13, grandRobin: false, moc: false, careerTotal: 36702, placeThisYear: 12, history: [[2011, 0], [2012, 2850], [2013, 2450], [2014, 3700], [2015, 5137], [2016, 9225], [2017, 0], [2019, 2635], [2021, 0], [2022, 1475], [2023, 2780], [2024, 3950], [2025, 2500]] },
  { id: "pjdzien@hotmail.com", name: "Pete Dzien", email: "pjdzien@hotmail.com", championships: 2, recordsHeld: 0, elite3: 3, years: 20, grandRobin: false, moc: false, careerTotal: 35875, placeThisYear: 13, history: [[1998, 0], [2001, 0], [2002, 0], [2003, 120], [2004, 1050], [2005, 0], [2006, 0], [2007, "DQ"], [2008, 13725], [2009, 0], [2010, 3775], [2011, 0], [2012, "DQ"], [2013, 6125], [2014, 855], [2015, 1750], [2016, 3930], [2018, 1150], [2024, 1575], [2025, 1820]] },
  { id: "fuzzysix@att.net", name: "Greg Keresty", email: "fuzzysix@att.net", championships: 1, recordsHeld: 0, elite3: 3, years: 26, grandRobin: false, moc: false, careerTotal: 34192, placeThisYear: 14, history: [[1998, 0], [1999, 900], [2000, 520], [2001, 0], [2002, 510], [2003, 127], [2004, 7075], [2005, 915], [2006, 1200], [2007, 0], [2009, 0], [2010, 1000], [2011, 0], [2012, 4400], [2013, 0], [2014, 3500], [2015, 1650], [2016, 1350], [2017, 0], [2018, 0], [2019, 0], [2020, 5370], [2021, 0], [2022, 2000], [2024, 400], [2025, 3275]] },
  { id: "ekeresty@gmail.com", name: "Eric Keresty", email: "ekeresty@gmail.com", championships: 0, recordsHeld: 1, elite3: 3, years: 28, grandRobin: false, moc: true, careerTotal: 26692.5, placeThisYear: 15, history: [[1998, 0], [1999, 600], [2000, 780], [2001, 110], [2002, 360], [2003, 127], [2004, 6263], [2005, 1025], [2006, 0], [2007, 0], [2008, 0], [2009, 1475], [2010, 2750], [2011, 0], [2012, 900], [2013, 0], [2014, 3175], [2015, 465], [2016, 1125], [2017, 450], [2018, 0], [2019, 1350], [2020, 1380], [2021, 0], [2022, 1795], [2023, 412.5], [2024, 1150], [2025, 1000]] },
  { id: "hall.phill@yahoo.com", name: "Phill Hall", email: "hall.phill@yahoo.com", championships: 0, recordsHeld: 1, elite3: 0, years: 16, grandRobin: false, moc: false, careerTotal: 23727.5, placeThisYear: 16, history: [[2009, 0], [2010, 975], [2011, 0], [2012, 1080], [2013, 550], [2014, 495], [2015, 0], [2016, 2102.5], [2017, 0], [2018, 0], [2019, 0], [2020, 7205], [2021, 1320], [2022, 5025], [2023, 1475], [2024, 3500]] },
  { id: "mcoop221@comcast.net", name: "Mike Cooper", email: "mcoop221@comcast.net", championships: 1, recordsHeld: 3, elite3: 2, years: 17, grandRobin: false, moc: false, careerTotal: 14325.5, placeThisYear: 17, history: [[2003, 425], [2004, 360], [2005, 0], [2006, 0], [2007, 2750], [2008, 3180], [2009, 0], [2010, 495], [2011, "ABD"], [2012, 623], [2013, 0], [2014, 3755], [2015, 0], [2016, 2237.5], [2017, 500]] },
  { id: "deugenehall@gmail.com", name: "Derek Hall", email: "deugenehall@gmail.com", championships: 0, recordsHeld: 0, elite3: 0, years: 26, grandRobin: false, moc: false, careerTotal: 13283, placeThisYear: 18, history: [[2000, 0], [2001, 320], [2002, 305], [2003, 0], [2004, 435], [2005, 230], [2006, 0], [2007, 0], [2008, 230], [2009, 0], [2010, 1113], [2011, 0], [2012, 975], [2013, 0], [2014, 1175], [2015, 0], [2016, 1050], [2017, 0], [2018, 0], [2019, 840], [2020, 3300], [2021, 0], [2022, 325], [2023, 300], [2024, 0], [2025, 2685]] },
  { id: "johnfriscia@yahoo.com", name: "John Friscia", email: "johnfriscia@yahoo.com", championships: 1, recordsHeld: 0, elite3: 2, years: 27, grandRobin: false, moc: false, careerTotal: 13042.5, placeThisYear: 19, history: [[1998, 0], [1999, 200], [2000, 0], [2001, 370], [2002, 1615], [2003, 0], [2004, 1210], [2005, 0], [2006, 0], [2007, 0], [2008, 0], [2009, 0], [2010, 0], [2011, 0], [2012, 0], [2013, 0], [2014, 900], [2015, 0], [2016, 600], [2017, 525], [2018, 550], [2020, 3600], [2021, 0], [2022, 1712.5], [2023, 400], [2024, 960], [2025, 400]] },
  { id: "houghstler@gmail.com", name: "Patrick Hough", email: "houghstler@gmail.com", championships: 0, recordsHeld: 0, elite3: 0, years: 7, grandRobin: false, moc: false, careerTotal: 11110, placeThisYear: 20, history: [[2019, 0], [2020, 4430], [2021, 0], [2022, 1485], [2023, 350], [2024, 3125], [2025, 1720]] },
  { id: "mikesantimaw@gmail.com", name: "Mike Santimaw", email: "mikesantimaw@gmail.com", championships: 0, recordsHeld: 0, elite3: 0, years: 15, grandRobin: false, moc: false, careerTotal: 10115, placeThisYear: 21, history: [[2001, 0], [2002, 180], [2003, 0], [2004, 0], [2005, 360], [2006, 0], [2007, 0], [2008, 3500], [2009, 0], [2010, 850], [2011, "ABD"], [2012, 3800], [2013, 0], [2014, 495], [2015, 930], [2016, 0]] },
  { id: "kevin.weeks1@verizon.net", name: "Kevin Weeks", email: "kevin.weeks1@verizon.net", championships: 0, recordsHeld: 0, elite3: 0, years: 15, grandRobin: false, moc: false, careerTotal: 9498, placeThisYear: 22, history: [[1999, 0], [2000, 0], [2001, 0], [2002, 0], [2004, 1750], [2005, 0], [2006, 0], [2007, 1100], [2008, 220], [2009, 0], [2010, 473], [2011, 0], [2012, 3350], [2013, 1980], [2022, 625]] },
  { id: "coldan3@yahoo.com", name: "Mike Jones", email: "coldan3@yahoo.com", championships: 0, recordsHeld: 0, elite3: 1, years: 6, grandRobin: false, moc: false, careerTotal: 7445, placeThisYear: 23, history: [[2012, 5915], [2013, 0], [2014, 0], [2015, 930], [2016, 600], [2017, 0]] },
  { id: "stevenopsitnick@gmail.com", name: "Steve Opsitnick", email: "StevenOpsitnick@gmail.com", championships: 0, recordsHeld: 0, elite3: 0, years: 1, grandRobin: false, moc: false, careerTotal: 2175, placeThisYear: 25, history: [[2025, 2175]] },
  { id: "nick-insley", name: "Nick Insley", championships: 0, recordsHeld: 0, elite3: 0, years: 2, grandRobin: false, moc: false, careerTotal: 180, history: [[2021, 0], [2022, 180]] },
  { id: "tony-marandola", name: "Tony Marandola", championships: 0, recordsHeld: 0, elite3: 0, years: 9, grandRobin: false, moc: false, careerTotal: 2439, history: [[2001, 0], [2002, 0], [2003, 100], [2004, 2119], [2005, 0], [2006, 0], [2007, 0], [2008, 220], [2009, 0]] },
  { id: "john-dinlocker", name: "John Dinlocker", championships: 0, recordsHeld: 0, elite3: 1, years: 6, grandRobin: false, moc: false, careerTotal: 1680, history: [[2001, 660], [2002, 420], [2005, 600], [2006, 0], [2007, 0], [2008, 0]] },
  { id: "kevin-tumola", name: "Kevin Tumola", championships: 0, recordsHeld: 0, elite3: 0, years: 6, grandRobin: false, moc: false, careerTotal: 735, history: [[1998, 0], [1999, 425], [2000, 0], [2001, 0], [2002, 310], [2003, 0]] },
  { id: "ken-thompson", name: "Ken Thompson", championships: 1, recordsHeld: 0, elite3: 1, years: 2, grandRobin: false, moc: false, careerTotal: 600, history: [[1998, 600], [1999, 0]] },
  { id: "carlo-gambone", name: "Carlo Gambone", championships: 0, recordsHeld: 0, elite3: 0, years: 5, grandRobin: false, moc: false, careerTotal: 390, history: [[2000, 0], [2005, 390], [2006, 0], [2007, 0], [2008, 0]] },
  { id: "mike-hurrell", name: "Mike Hurrell", championships: 0, recordsHeld: 0, elite3: 0, years: 1, grandRobin: false, moc: false, careerTotal: 330, history: [[2000, 330]] },
  { id: "chris-coughlin", name: "Chris Coughlin", championships: 0, recordsHeld: 0, elite3: 0, years: 2, grandRobin: false, moc: false, careerTotal: 210, history: [[2001, 0], [2002, 210]] },
  { id: "masonkone@gmail.com", name: "Mason Keresty", email: "masonkone@gmail.com", championships: 0, recordsHeld: 0, elite3: 0, years: 1, grandRobin: false, moc: false, careerTotal: 0, history: [[2019, 0]] },
  { id: "karlos-gutierrez", name: "Karlos Gutierrez", championships: 0, recordsHeld: 0, elite3: 0, years: 1, grandRobin: false, moc: false, careerTotal: 0, history: [[2012, 0]] },
];

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/** True if the angler has earned at least one badge. */
export function hasAnyAccolade(a: Accolade): boolean {
  return a.championships > 0 || a.recordsHeld > 0 || a.elite3 > 0 || a.grandRobin || a.moc;
}

/**
 * "Shiner" seasons: years the angler competed and finished with zero points.
 * Derived straight from the participation record — `history` only holds seasons
 * they actually fished, so a 0 there is a blanked year, and years they sat out
 * are never counted.
 */
export function shinerSeasons(a: Accolade): number {
  return a.history.filter(([, result]) => result === 0).length;
}

/** A season result is a Shiner iff it's exactly 0 points (not DQ/ABD/absent). */
const isShiner = (r: SeasonResult | undefined): boolean => r === 0;

/**
 * Active Shiner streak ending in `year`: consecutive years, counting back from
 * `year`, in which the angler participated and blanked. Any scored year, a
 * DQ/ABD year, or a year they sat out (absent) breaks the run. Returns 0 unless
 * `year` itself is a Shiner.
 */
export function shinerStreakEndingAt(a: Accolade, year: number): number {
  const byYear = new Map<number, SeasonResult>(a.history);
  let streak = 0;
  for (let y = year; isShiner(byYear.get(y)); y--) streak++;
  return streak;
}

export interface Presidency {
  year: number;
  holderId: string;
  streak: number;
  /** true when a tie had to be broken by fallback (no prior-president to rule it). */
  auto: boolean;
}

/**
 * The Shiner Club President for every year, computed from the career file.
 * Each year the office goes to the current-year Shiner with the longest active
 * streak. Ties fall to whoever most recently held the office (criterion 3);
 * a remaining tie is auto-broken by most career Shiners then name (historically
 * there's no M.O.C. present to rule — flagged with `auto`). Years with no Shiner
 * leave the office vacant.
 */
export function computeShinerPresidents(field: Accolade[] = HALL_OF_FAME): Presidency[] {
  const years = [...new Set(field.flatMap((a) => a.history.map(([y]) => y)))].sort((x, y) => x - y);
  const ledger: Presidency[] = [];
  const lastHeld = new Map<string, number>(); // holderId -> most recent year in office
  for (const y of years) {
    const scored = field
      .filter((a) => isShiner(new Map<number, SeasonResult>(a.history).get(y)))
      .map((a) => ({ a, streak: shinerStreakEndingAt(a, y) }));
    if (scored.length === 0) continue; // vacant year
    const maxStreak = Math.max(...scored.map((s) => s.streak));
    let top = scored.filter((s) => s.streak === maxStreak);
    let auto = false;
    if (top.length > 1) {
      const priors = top.filter((s) => lastHeld.has(s.a.id));
      if (priors.length > 0) {
        priors.sort((p, q) => lastHeld.get(q.a.id)! - lastHeld.get(p.a.id)!);
        top = [priors[0]];
      } else {
        auto = true;
        top.sort((p, q) => shinerSeasons(q.a) - shinerSeasons(p.a) || p.a.name.localeCompare(q.a.name));
        top = [top[0]];
      }
    }
    ledger.push({ year: y, holderId: top[0].a.id, streak: top[0].streak, auto });
    lastHeld.set(top[0].a.id, y);
  }
  return ledger;
}

/** Memoized ledger — the career file is static, so compute once. */
export const SHINER_PRESIDENTS: Presidency[] = computeShinerPresidents();

export interface YearChampion {
  year: number;
  holderId: string;
  name: string;
  points: number;
}

/**
 * The top scorer for each year in the career file — used as the historical
 * fallback for years before the app tracked individual catches (there's no
 * catch-level data for these seasons, only each angler's yearly total).
 * Excludes DQ/ABD/zero (Shiner) results, since those can't be a champion.
 */
export function computeYearChampions(field: Accolade[] = HALL_OF_FAME): YearChampion[] {
  const byYear = new Map<number, { a: Accolade; pts: number }>();
  for (const a of field) {
    for (const [year, result] of a.history) {
      if (typeof result !== "number" || result <= 0) continue;
      const cur = byYear.get(year);
      if (!cur || result > cur.pts) byYear.set(year, { a, pts: result });
    }
  }
  return [...byYear.entries()]
    .map(([year, { a, pts }]) => ({ year, holderId: a.id, name: a.name, points: pts }))
    .sort((x, y) => x.year - y.year);
}

/** Memoized — the career file is static, so compute once. */
export const YEAR_CHAMPIONS: YearChampion[] = computeYearChampions();

/** Years this angler held the Shiner Club Presidency (most recent first). */
export function presidencyYears(a: Accolade): number[] {
  return SHINER_PRESIDENTS.filter((p) => p.holderId === a.id)
    .map((p) => p.year)
    .sort((x, y) => y - x);
}

/** Match a roster member to their standings record by email first, then name. */
export function findAccolade(who: { email?: string | null; name?: string | null }): Accolade | undefined {
  const email = who.email ? norm(who.email) : "";
  if (email) {
    const byEmail = HALL_OF_FAME.find((a) => a.email && norm(a.email) === email);
    if (byEmail) return byEmail;
  }
  const name = who.name ? norm(who.name) : "";
  if (name) return HALL_OF_FAME.find((a) => norm(a.name) === name);
  return undefined;
}

/** Free-text search across every angler, past and present (name or email). */
export function searchAnglers(query: string): Accolade[] {
  const q = norm(query);
  const list = q
    ? HALL_OF_FAME.filter((a) => norm(a.name).includes(q) || (a.email && norm(a.email).includes(q)))
    : [...HALL_OF_FAME];
  // Rank by career total so the legends surface first.
  return list.sort((a, b) => b.careerTotal - a.careerTotal);
}
