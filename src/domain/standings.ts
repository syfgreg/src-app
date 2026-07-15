import type { CatchEntry } from "./types";
import { categoryOf, isGameCategory, SCORING } from "./scoring";

/**
 * Tournament-level scoring aggregation — the single source of truth for an
 * angler's official total, used everywhere totals are shown.
 *
 * Beyond the per-catch points (scoring.ts), the official total applies two
 * scorecard rules that only make sense across a whole card / field:
 *   • Trash Fish limit — only the best 3 trash fish per angler score.
 *   • The Full Monty   — +1,000 to the angler who lands BOTH the largest game
 *                        fish and the largest trash fish of the tournament.
 * Ranking then uses the official tie-break hierarchy.
 */

export interface AnglerScore {
  userId: string;
  /** Official total: non-trash + best-3 trash + Full Monty − penalties. */
  total: number;
  /** Total before the Full Monty bonus and penalties. */
  baseTotal: number;
  fullMonty: boolean;
  /** Point deduction from M.O.C. penalties (a positive number that is subtracted). */
  penalty: number;
  /** Sea Robin + game + trash all landed. */
  trifecta: boolean;
  approvedCount: number;
  gameCount: number;
  trashCount: number;
  /** How many trash fish actually counted (capped at the limit). */
  trashScored: number;
  /** Ids of the trash catches that count toward the score (the best 3). */
  scoredTrashIds: string[];
  seaRobinCount: number;
  // tie-break metrics
  highestGamePts: number;
  largestGameLen: number;
  highestFishPts: number;
  largestFishLen: number;
}

function scoreAngler(userId: string, catches: CatchEntry[]): AnglerScore {
  const approved = catches.filter((c) => c.status === "APPROVED");
  let nonTrash = 0;
  const trash: { id: string; pts: number }[] = [];
  let gameCount = 0;
  let seaRobinCount = 0;
  let highestGamePts = 0;
  let largestGameLen = 0;
  let highestFishPts = 0;
  let largestFishLen = 0;

  for (const c of approved) {
    const cat = categoryOf(c.species);
    highestFishPts = Math.max(highestFishPts, c.pointValue);
    largestFishLen = Math.max(largestFishLen, c.lengthInches);
    if (cat === "TRASH") {
      trash.push({ id: c.id, pts: c.pointValue });
    } else {
      nonTrash += c.pointValue;
      if (cat === "SEA_ROBIN") seaRobinCount += 1;
      if (isGameCategory(cat)) {
        gameCount += 1;
        highestGamePts = Math.max(highestGamePts, c.pointValue);
        largestGameLen = Math.max(largestGameLen, c.lengthInches);
      }
    }
  }

  // Only the best N trash fish count; the rest are listed but score 0.
  trash.sort((a, b) => b.pts - a.pts);
  const scoredTrash = trash.slice(0, SCORING.trashScorableLimit);
  const baseTotal = nonTrash + scoredTrash.reduce((s, t) => s + t.pts, 0);

  return {
    userId,
    total: baseTotal,
    baseTotal,
    fullMonty: false,
    penalty: 0,
    trifecta: seaRobinCount > 0 && gameCount > 0 && trash.length > 0,
    approvedCount: approved.length,
    gameCount,
    trashCount: trash.length,
    trashScored: scoredTrash.length,
    scoredTrashIds: scoredTrash.map((t) => t.id),
    seaRobinCount,
    highestGamePts,
    largestGameLen,
    highestFishPts,
    largestFishLen,
  };
}

function compareStandings(a: AnglerScore, b: AnglerScore): number {
  if (b.total !== a.total) return b.total - a.total;
  // Official tie-break hierarchy (top three slots):
  // highest scoring game fish → largest game fish → most game fish →
  // highest scoring fish → largest fish → most fish.
  if (b.highestGamePts !== a.highestGamePts) return b.highestGamePts - a.highestGamePts;
  if (b.largestGameLen !== a.largestGameLen) return b.largestGameLen - a.largestGameLen;
  if (b.gameCount !== a.gameCount) return b.gameCount - a.gameCount;
  if (b.highestFishPts !== a.highestFishPts) return b.highestFishPts - a.highestFishPts;
  if (b.largestFishLen !== a.largestFishLen) return b.largestFishLen - a.largestFishLen;
  return b.approvedCount - a.approvedCount;
}

/**
 * Rank every angler in a tournament from all its APPROVED catches. Applies the
 * trash limit and the Full Monty, then sorts by the official tie-break rules.
 * `allCatches` must be the full field (all anglers) so Full Monty and the
 * largest-fish tie-breaks resolve correctly.
 */
export function computeStandings(
  allCatches: CatchEntry[],
  penaltyByUser: Map<string, number> = new Map(),
): AnglerScore[] {
  const approved = allCatches.filter((c) => c.status === "APPROVED");
  const byUser = new Map<string, CatchEntry[]>();
  for (const c of approved) {
    const arr = byUser.get(c.userId) ?? [];
    arr.push(c);
    byUser.set(c.userId, arr);
  }
  // Include anglers who only have a penalty (no catches) so their deficit shows.
  for (const uid of penaltyByUser.keys()) if (!byUser.has(uid)) byUser.set(uid, []);
  const scores = [...byUser.entries()].map(([uid, cs]) => scoreAngler(uid, cs));

  // Full Monty — the angler holding both the largest game fish and the largest
  // trash fish of the whole tournament.
  let largestGame: { uid: string; len: number } | null = null;
  let largestTrash: { uid: string; len: number } | null = null;
  for (const c of approved) {
    const cat = categoryOf(c.species);
    if (isGameCategory(cat)) {
      if (!largestGame || c.lengthInches > largestGame.len) largestGame = { uid: c.userId, len: c.lengthInches };
    } else if (cat === "TRASH") {
      if (!largestTrash || c.lengthInches > largestTrash.len) largestTrash = { uid: c.userId, len: c.lengthInches };
    }
  }
  if (largestGame && largestTrash && largestGame.uid === largestTrash.uid) {
    const s = scores.find((x) => x.userId === largestGame!.uid);
    if (s) {
      s.fullMonty = true;
      s.total = s.baseTotal + SCORING.fullMontyBonus;
    }
  }

  // Apply M.O.C. penalties (scoring deficits) last.
  for (const s of scores) {
    const p = penaltyByUser.get(s.userId) ?? 0;
    s.penalty = p;
    s.total -= p;
  }

  return scores.sort(compareStandings);
}

/** One angler's official score within the full tournament context. */
export function anglerScore(
  userId: string,
  allCatches: CatchEntry[],
  penaltyByUser: Map<string, number> = new Map(),
): AnglerScore {
  return (
    computeStandings(allCatches, penaltyByUser).find((x) => x.userId === userId) ??
    scoreAngler(userId, [])
  );
}
