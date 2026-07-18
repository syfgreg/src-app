export type RoleTag =
  | "MOC"
  | "GRAND_ROBIN"
  | "CHAMP"
  | "ANGLER"
  | "JAFNG"
  | "INACTIVE";

export const ROLE_LABELS: Record<RoleTag, string> = {
  MOC: "M.O.C.",
  GRAND_ROBIN: "Grand Robin",
  CHAMP: "The Champ",
  ANGLER: "Angler",
  JAFNG: "JAFNG (Rookie)",
  INACTIVE: "Inactive",
};

export type GearType = "BAIT" | "LURE";

export type CatchStatus = "PENDING" | "APPROVED" | "REJECTED";

/** Tournament lifecycle: SETUP → LIVE (submissions open) → ENDED (M.O.C. reviews) → PUBLISHED (results out). */
export type TournamentState = "SETUP" | "LIVE" | "ENDED" | "PUBLISHED";

/**
 * Glory Shot Fav vote lifecycle, driven manually by the M.O.C. and independent
 * of the tournament state:
 *   OFF       — no vote running (M.O.C. still curating the ballot)
 *   OPEN      — voting is live; participants cast votes, tallies hidden from them
 *   CLOSED    — M.O.C. closed voting; no more votes, winner not yet revealed
 *   PUBLISHED — results revealed to everyone (M.O.C. announces verbally first)
 */
export type GloryFavState = "OFF" | "OPEN" | "CLOSED" | "PUBLISHED";

// Primary keys are UUID strings so the same id is used in Supabase (source of
// truth) and the local Dexie mirror. In local-only mode the client generates
// them with crypto.randomUUID().

export interface User {
  id: string;
  email: string;
  name: string;
  nickname?: string;
  roleTag: RoleTag;
  /** local-only mode credential; unused when Supabase Auth is active */
  passwordHash?: string;
  createdAt: number;
}

export interface CatchEntry {
  id: string;
  userId: string;
  tournamentYear: number;
  species: string;
  speciesDetected?: string;
  lengthInches: number;
  gearType: GearType;
  isSkate: boolean;
  isTrophy: boolean;
  isRecordBreaker: boolean;
  pointValue: number;
  /** remote URL once uploaded to Supabase Storage */
  photoUrl?: string;
  /** local blob held until the offline outbox uploads it */
  photo?: Blob;
  lat?: number;
  lng?: number;
  aiConfidence?: number;
  aiNotes?: string;
  status: CatchStatus;
  verifiedBy?: string;
  createdAt: number;
}

export interface GloryComment {
  userName: string;
  text: string;
  at: number;
}

export interface GloryPic {
  id: string;
  userId: string;
  photoUrl?: string;
  photo?: Blob;
  description: string;
  catchDate: number;
  comments: GloryComment[];
  /** When set, this shot is a "Glory Shot Fav!" nominee for that tournament year. */
  nominatedYear?: number;
  /** userIds who voted this shot the tournament's fav (one vote per participant). */
  votes?: string[];
  createdAt: number;
}

export interface SpeciesConfig {
  name: string;
  /** Scoring category — drives the size-banded points-per-inch (see scoring.ts). */
  category: "SEA_ROBIN" | "GAME_1" | "GAME_2" | "TRASH";
  /** measured wingtip-to-wingtip (skates / rays) */
  skate?: boolean;
}

export interface Settings {
  id: number;
  tournamentYear: number;
  /** Roster of scorable species + their category. Scoring values are fixed in code. */
  species: SpeciesConfig[];
  offSeasonMode: boolean;
  /** Tournament lifecycle state (defaults to SETUP on the server). */
  state?: TournamentState;
  /** ms epoch when results were published. */
  publishedAt?: number;
  /** userIds whose scorecards the M.O.C. has validated during end-of-tournament review. */
  reviewedAnglers?: string[];
  /** Glory Shot Fav vote lifecycle (defaults to OFF). */
  gloryFavState?: GloryFavState;
  /**
   * Status overrides for roster members who aren't app-login accounts (historic
   * anglers from the career data). Keyed by lowercased name → role. Real login
   * anglers store their role on their profile instead.
   */
  rosterOverrides?: Record<string, RoleTag>;
  /** userIds who've locked in their Glory Shot Fav vote (can't change it anymore). */
  gloryFavLockedVoters?: string[];
}

/** A dated bulletin the M.O.C. posts; every angler reads the feed. */
export interface Newsletter {
  id: string;
  title: string;
  body: string;
  author: string;
  createdAt: number;
  /** Can't be deleted (e.g. the historical archive import) — enforced via RLS too. */
  protected?: boolean;
}

/**
 * A named tournament in the registry. The *active* tournament is the row whose
 * `year` equals settings.tournamentYear; every catch is scoped by that year, so
 * starting a new tournament (a new year) gives a clean board while past
 * tournaments' catches stay queryable for history. participantIds is the roster
 * competing in this tournament (empty ⇒ everyone).
 */
export interface Tournament {
  id: string;
  name: string;
  year: number;
  participantIds: string[];
  createdAt: number;
  /** ms epoch when this tournament's results were published/finalized. */
  publishedAt?: number;
  /** ms epoch this tournament is scheduled to start; unset once it's activated. */
  scheduledFor?: number;
}

/**
 * A pending roster invite created by the M.O.C. When a person registers with a
 * matching email they inherit the pre-assigned role (and name) instead of the
 * default JAFNG.
 */
export interface Invite {
  id: string;
  email: string;
  name?: string;
  roleTag: RoleTag;
  createdAt: number;
}

/**
 * A scoring deficit the M.O.C. assesses against an angler for a tournament
 * (the "Penalty Assessment" on the scorecard). `points` is a positive number
 * that is subtracted from the angler's total.
 */
export interface Penalty {
  id: string;
  userId: string;
  tournamentYear: number;
  description: string;
  points: number;
  createdAt: number;
}

export interface RecordEntry {
  species: string;
  holder: string;
  year: number | null;
  lengthInches: number;
}

export interface AppNotification {
  id: string;
  message: string;
  at: number;
  /** per-device read state — not synced to the shared table */
  read: boolean;
}

/** Offline write queue entry. Replayed against Supabase on reconnect. */
export interface OutboxItem {
  id?: number;
  table:
    | "catches"
    | "glory_pics"
    | "notifications"
    | "profiles"
    | "settings"
    | "records"
    | "newsletters"
    | "tournaments"
    | "invites"
    | "penalties";
  op: "upsert" | "update" | "delete";
  key: string;
  payload: Record<string, unknown>;
  /** catch/glory photo awaiting upload before the row is pushed */
  photo?: Blob;
  photoBucket?: "catch-photos" | "glory-pics";
  photoField?: "photo_url";
  at: number;
}
