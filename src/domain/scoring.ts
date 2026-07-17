import type { CatchEntry, RecordEntry, Settings, SpeciesConfig } from "./types";

/**
 * 2026 Official Sea Robin Classic scoring engine.
 *
 * Point-per-inch is SIZE-BANDED by category (from the 2026 Official Scorecard):
 *   • The Coveted Sea Robin — 500 PPI, any size
 *   • Game Fish Tier 1 (Striped Bass, Flounder, Red Drum) — <18" ⇒ 120, ≥18" ⇒ 200
 *   • Game Fish Tier 2 (all other game fish)             — <13" ⇒ 50, 13–<18" ⇒ 100, ≥18" ⇒ 120
 *   • Trash Fish (Skates, Rays, Sharks, Stargazers, Eels,
 *     Puffer Fish, Toadfish, Oyster Crackers)            — 0–<12" ⇒ 20, 12–<17" ⇒ 30, ≥17" ⇒ 50
 *     (only the best 3 trash fish per angler score — see standings.ts)
 *
 * Additional scoring opportunities (each adds +100 PPI unless noted):
 *   • Lure          — game fish ≥ 16" landed on a bona-fide artificial (no bait)
 *   • Trophy        — game fish > 24"  (M.O.C. measured)
 *   • Record Breaker— beats the standing S.R.C. record for its species (M.O.C. measured)
 *   • Full Monty    — +1,000 flat to the angler with the largest game fish AND largest trash fish
 *
 * These values are fixed by the official scorecard, so they live in code (not
 * MOC-editable) to guarantee the app scores exactly like the paper card.
 */

export type Category = "SEA_ROBIN" | "GAME_1" | "GAME_2" | "TRASH";

/**
 * Every measurement is rounded DOWN to the nearest quarter inch before it is
 * scored (official scorecard rule). e.g. 17.3" → 17.25", 17.24" → 17.0".
 * Apply this at the write boundary so the stored length and its score agree.
 */
export function floorToQuarter(inches: number): number {
  return Math.floor(inches * 4) / 4;
}

/** A size band: applies while length < maxExclusive (null = no upper bound). */
export interface Band {
  maxExclusive: number | null;
  ppi: number;
}

export const SCORING = {
  seaRobinPPI: 500,
  tier1Bands: [
    { maxExclusive: 18, ppi: 120 },
    { maxExclusive: null, ppi: 200 },
  ] as Band[],
  tier2Bands: [
    { maxExclusive: 13, ppi: 50 },
    { maxExclusive: 18, ppi: 100 },
    { maxExclusive: null, ppi: 120 },
  ] as Band[],
  trashBands: [
    { maxExclusive: 12, ppi: 20 },
    { maxExclusive: 17, ppi: 30 },
    { maxExclusive: null, ppi: 50 },
  ] as Band[],
  lureBonusPPI: 100,
  lureMinInches: 16, // game fish must be ≥ this to earn the lure bonus
  trophyBonusPPI: 100,
  trophyMinInches: 24, // game fish must be strictly greater than this for Trophy
  recordBreakerBonusPPI: 100,
  fullMontyBonus: 1000,
  trashScorableLimit: 3, // only the best N trash fish per angler count
} as const;

/**
 * Species → category. Tier 1 and the trash types are named explicitly on the
 * scorecard; every other game fish is Tier 2. Unknown species (the "Other" flow)
 * default to Tier 2 provisionally and are re-scored by the M.O.C.
 */
export const SPECIES_2026: SpeciesConfig[] = [
  { name: "Sea Robin", category: "SEA_ROBIN" },
  // Game Fish — Tier 1
  { name: "Striped Bass", category: "GAME_1" },
  { name: "Flounder", category: "GAME_1" },
  { name: "Red Drum", category: "GAME_1" },
  // Game Fish — Tier 2 (all game fish not in Tier 1)
  { name: "Spot", category: "GAME_2" },
  { name: "Sheepshead", category: "GAME_2" },
  { name: "Bluefish", category: "GAME_2" },
  { name: "Kingfish", category: "GAME_2" },
  { name: "Black Drum", category: "GAME_2" },
  { name: "Sea Trout", category: "GAME_2" },
  { name: "Croaker", category: "GAME_2" },
  { name: "Silver Perch", category: "GAME_2" },
  { name: "Spotted Hake", category: "GAME_2" },
  // Trash Fish (measured wingtip-to-wingtip where noted)
  { name: "Skate", category: "TRASH", skate: true },
  { name: "Ray", category: "TRASH", skate: true },
  { name: "Shark", category: "TRASH" },
  { name: "Stargazer", category: "TRASH" },
  { name: "Eel", category: "TRASH" },
  { name: "Cusk Eel", category: "TRASH" },
  { name: "Puffer Fish", category: "TRASH" },
  { name: "Toadfish", category: "TRASH" },
  { name: "Oyster Cracker", category: "TRASH" },
];

const CATEGORY_BY_NAME = new Map(SPECIES_2026.map((s) => [s.name.toLowerCase(), s.category]));

export function categoryOf(species: string): Category {
  return CATEGORY_BY_NAME.get(species.trim().toLowerCase()) ?? "GAME_2";
}

export function speciesConfig(species: string): SpeciesConfig | undefined {
  return SPECIES_2026.find((s) => s.name.toLowerCase() === species.trim().toLowerCase());
}

export function isGameCategory(c: Category): boolean {
  return c === "GAME_1" || c === "GAME_2";
}
export function isGamefish(species: string): boolean {
  return isGameCategory(categoryOf(species));
}
export function isTrash(species: string): boolean {
  return categoryOf(species) === "TRASH";
}

export const CATEGORY_LABEL: Record<Category, string> = {
  SEA_ROBIN: "The Coveted Sea Robin",
  GAME_1: "Game Fish — Tier 1",
  GAME_2: "Game Fish — Tier 2",
  TRASH: "Trash Fish",
};

function bandPPI(bands: Band[], len: number): number {
  for (const b of bands) if (b.maxExclusive === null || len < b.maxExclusive) return b.ppi;
  return bands[bands.length - 1].ppi;
}

/** Base points-per-inch for a category at a given length (before bonuses). */
export function basePPI(category: Category, len: number): number {
  switch (category) {
    case "SEA_ROBIN":
      return SCORING.seaRobinPPI;
    case "GAME_1":
      return bandPPI(SCORING.tier1Bands, len);
    case "GAME_2":
      return bandPPI(SCORING.tier2Bands, len);
    case "TRASH":
      return bandPPI(SCORING.trashBands, len);
  }
}

export interface ScoreResult {
  points: number;
  category: Category;
  basePPI: number;
  isGame: boolean;
  isTrash: boolean;
  isTrophy: boolean;
  isRecordBreaker: boolean;
  breakdown: string[];
}

/**
 * Official per-catch scoring: banded base points + lure / trophy / record-breaker
 * bonuses. Full Monty and the trash-fish limit are tournament-level aggregations
 * applied in standings.ts, not here.
 */
/**
 * A compact, human-readable "how this fish scored" string, rebuilt from a
 * stored catch (no records lookup needed — it uses the catch's saved trophy /
 * record flags). e.g. `10" × 50 PPI = 500` or
 * `20" × 120 PPI = 2,400 · +Lure 2,000 · +Record 2,000`.
 */
export function scoreCalc(c: {
  species: string;
  lengthInches: number;
  gearType: "BAIT" | "LURE";
  isTrophy?: boolean;
  isRecordBreaker?: boolean;
}): string {
  const cat = categoryOf(c.species);
  const ppi = basePPI(cat, c.lengthInches);
  const parts = [`${c.lengthInches}" × ${ppi} PPI = ${Math.round(c.lengthInches * ppi).toLocaleString()}`];
  if (c.gearType === "LURE" && isGameCategory(cat) && c.lengthInches >= SCORING.lureMinInches)
    parts.push(`+Lure ${Math.round(c.lengthInches * SCORING.lureBonusPPI).toLocaleString()}`);
  if (c.isTrophy)
    parts.push(`+Trophy ${Math.round(c.lengthInches * SCORING.trophyBonusPPI).toLocaleString()}`);
  if (c.isRecordBreaker)
    parts.push(`+Record ${Math.round(c.lengthInches * SCORING.recordBreakerBonusPPI).toLocaleString()}`);
  return parts.join(" · ");
}

export function scoreCatch(
  species: string,
  lengthInches: number,
  gearType: "BAIT" | "LURE",
  records: RecordEntry[],
): ScoreResult {
  const category = categoryOf(species);
  const isGame = isGameCategory(category);
  const ppi = basePPI(category, lengthInches);
  const breakdown: string[] = [];

  let points = lengthInches * ppi;
  breakdown.push(
    `${lengthInches}" × ${ppi} PPI (${CATEGORY_LABEL[category]}${category === "TRASH" ? ", best 3 count" : ""}) = ${Math.round(points)}`,
  );

  // Lure bonus — game fish ≥ 16" on a bona-fide artificial lure (no bait)
  if (gearType === "LURE" && isGame && lengthInches >= SCORING.lureMinInches) {
    const bonus = lengthInches * SCORING.lureBonusPPI;
    points += bonus;
    breakdown.push(
      `Artificial lure bonus (+${SCORING.lureBonusPPI} PPI, game fish ≥ ${SCORING.lureMinInches}") = +${Math.round(bonus)}`,
    );
  }

  // Trophy — game fish over 24"
  const isTrophy = isGame && lengthInches > SCORING.trophyMinInches;
  if (isTrophy) {
    const bonus = lengthInches * SCORING.trophyBonusPPI;
    points += bonus;
    breakdown.push(
      `Trophy Fish Clause (+${SCORING.trophyBonusPPI} PPI, game fish over ${SCORING.trophyMinInches}") = +${Math.round(bonus)}`,
    );
  }

  // Record Breaker — beats the standing record for its species
  const record = records.find((r) => r.species.toLowerCase() === species.trim().toLowerCase());
  const isRecordBreaker = !!record && lengthInches > record.lengthInches;
  if (isRecordBreaker && record) {
    const bonus = lengthInches * SCORING.recordBreakerBonusPPI;
    points += bonus;
    breakdown.push(
      `RECORD BREAKER (+${SCORING.recordBreakerBonusPPI} PPI, beats ${record.holder || "the open record"} — ${record.lengthInches}") = +${Math.round(bonus)}`,
    );
  }

  return {
    points: Math.round(points),
    category,
    basePPI: ppi,
    isGame,
    isTrash: category === "TRASH",
    isTrophy,
    isRecordBreaker,
    breakdown,
  };
}

/**
 * Default settings row (local seed / first run). Scoring itself is code-driven,
 * so these are just the tournament-config fields the settings row still carries.
 */
export const DEFAULT_SETTINGS: Omit<Settings, "id"> = {
  tournamentYear: new Date().getFullYear(),
  species: SPECIES_2026,
  offSeasonMode: false,
  state: "LIVE",
  reviewedAnglers: [],
};
