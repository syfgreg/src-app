export type RoleTag =
  | "MOC"
  | "GRAND_ROBIN"
  | "CHAMP"
  | "ANGLER"
  | "JAFNG";

export const ROLE_LABELS: Record<RoleTag, string> = {
  MOC: "M.O.C.",
  GRAND_ROBIN: "Grand Robin",
  CHAMP: "The Champ",
  ANGLER: "Angler",
  JAFNG: "JAFNG (Rookie)",
};

export type GearType = "BAIT" | "LURE";

export type CatchStatus = "PENDING" | "APPROVED" | "REJECTED";

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
  createdAt: number;
}

export interface SpeciesConfig {
  name: string;
  tier: "SEA_ROBIN" | "GAME_1" | "GAME_2" | "TRASH";
  pointsPerInch: number;
  skate?: boolean;
}

export interface Settings {
  id: number;
  tournamentYear: number;
  lureBonusPPI: number;
  trophyMinInches: number;
  trophyBonus: number;
  recordBreakerBonus: number;
  skateBaselinePPI: number;
  species: SpeciesConfig[];
  offSeasonMode: boolean;
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
  table: "catches" | "glory_pics" | "notifications" | "profiles" | "settings" | "records";
  op: "upsert" | "update" | "delete";
  key: string;
  payload: Record<string, unknown>;
  /** catch/glory photo awaiting upload before the row is pushed */
  photo?: Blob;
  photoBucket?: "catch-photos" | "glory-pics";
  photoField?: "photo_url";
  at: number;
}
