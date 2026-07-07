import type { CatchEntry, RecordEntry, Settings, SpeciesConfig } from "./types";

/**
 * Default scoring configuration. The exact per-inch values on the official
 * scorecard are not published (the scorecard in the rulebook is VOID), so
 * these are sensible defaults the M.O.C. can edit from the Admin panel.
 * Species list and tiers come from the 2019 Official Rules record table.
 */
export const DEFAULT_SPECIES: SpeciesConfig[] = [
  { name: "Sea Robin", tier: "SEA_ROBIN", pointsPerInch: 150 },
  // Game Fish — Tier 1
  { name: "Striped Bass", tier: "GAME_1", pointsPerInch: 100 },
  { name: "Red Drum", tier: "GAME_1", pointsPerInch: 100 },
  { name: "Black Drum", tier: "GAME_1", pointsPerInch: 100 },
  { name: "Sheepshead", tier: "GAME_1", pointsPerInch: 100 },
  // Game Fish — Tier 2
  { name: "Flounder", tier: "GAME_2", pointsPerInch: 60 },
  { name: "Sea Trout", tier: "GAME_2", pointsPerInch: 60 },
  { name: "Bluefish", tier: "GAME_2", pointsPerInch: 60 },
  { name: "Kingfish", tier: "GAME_2", pointsPerInch: 60 },
  { name: "Croaker", tier: "GAME_2", pointsPerInch: 60 },
  // Trash fish — not eligible for Trophy bonus
  { name: "Skate", tier: "TRASH", pointsPerInch: 10, skate: true },
  { name: "Shark", tier: "TRASH", pointsPerInch: 10 },
  { name: "Eel", tier: "TRASH", pointsPerInch: 10 },
  { name: "Stargazer", tier: "TRASH", pointsPerInch: 10 },
  { name: "Spot", tier: "TRASH", pointsPerInch: 10 },
  { name: "Spotted Hake", tier: "TRASH", pointsPerInch: 10 },
  { name: "Puffer Fish", tier: "TRASH", pointsPerInch: 10 },
];

export const DEFAULT_SETTINGS: Omit<Settings, "id"> = {
  tournamentYear: new Date().getFullYear(),
  lureBonusPPI: 100,
  trophyMinInches: 24,
  trophyBonus: 500,
  recordBreakerBonus: 1000,
  skateBaselinePPI: 10,
  species: DEFAULT_SPECIES,
  offSeasonMode: false,
  // Local/demo seed opens the tournament immediately; the live Supabase row
  // defaults to SETUP so the M.O.C. explicitly starts it.
  state: "LIVE",
  reviewedAnglers: [],
};

export function isGamefish(cfg: SpeciesConfig): boolean {
  return cfg.tier === "GAME_1" || cfg.tier === "GAME_2" || cfg.tier === "SEA_ROBIN";
}

export interface ScoreResult {
  points: number;
  isTrophy: boolean;
  isRecordBreaker: boolean;
  breakdown: string[];
}

/**
 * Official scoring pipeline:
 *  base = length x points-per-inch (Skate Clause substitutes the M.O.C.'s
 *  baseline PPI and wingtip-to-wingtip measurement),
 *  + lure bonus PPI when caught on artificial,
 *  + Trophy bonus for gamefish over the trophy threshold,
 *  + Record Breaker bonus when the length beats the standing record.
 */
export function scoreCatch(
  species: string,
  lengthInches: number,
  gearType: "BAIT" | "LURE",
  settings: Settings,
  records: RecordEntry[],
): ScoreResult {
  const cfg =
    settings.species.find((s) => s.name === species) ??
    ({ name: species, tier: "TRASH", pointsPerInch: 10 } as SpeciesConfig);
  const breakdown: string[] = [];

  const isSkate = !!cfg.skate;
  const ppi = isSkate ? settings.skateBaselinePPI : cfg.pointsPerInch;
  let points = lengthInches * ppi;
  breakdown.push(
    `${lengthInches}" x ${ppi} PPI${isSkate ? " (Skate Clause baseline, wingtip to wingtip)" : ""} = ${Math.round(points)}`,
  );

  if (gearType === "LURE") {
    const bonus = lengthInches * settings.lureBonusPPI;
    points += bonus;
    breakdown.push(`Artificial lure bonus +${settings.lureBonusPPI} PPI = +${Math.round(bonus)}`);
  }

  const isTrophy =
    isGamefish(cfg) && cfg.tier !== "SEA_ROBIN" && lengthInches > settings.trophyMinInches;
  if (isTrophy) {
    points += settings.trophyBonus;
    breakdown.push(`Trophy Fish Clause (gamefish over ${settings.trophyMinInches}") = +${settings.trophyBonus}`);
  }

  const record = records.find((r) => r.species.toLowerCase() === species.toLowerCase());
  const isRecordBreaker = !!record && lengthInches > record.lengthInches;
  if (isRecordBreaker && record) {
    points += settings.recordBreakerBonus;
    breakdown.push(
      `RECORD BREAKER — beats ${record.holder ?? "the open record"} (${record.lengthInches}", ${record.year ?? "—"}) = +${settings.recordBreakerBonus}`,
    );
  }

  return { points: Math.round(points), isTrophy, isRecordBreaker, breakdown };
}

export function totalPoints(catches: CatchEntry[]): number {
  return catches
    .filter((c) => c.status === "APPROVED")
    .reduce((sum, c) => sum + c.pointValue, 0);
}
