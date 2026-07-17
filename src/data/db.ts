import Dexie, { type Table } from "dexie";
import type {
  AppNotification,
  CatchEntry,
  GloryPic,
  Invite,
  Newsletter,
  OutboxItem,
  Penalty,
  RecordEntry,
  Settings,
  Tournament,
  User,
} from "../domain/types";

/**
 * Local store. In cloud mode this is a mirror of Supabase (kept fresh by the
 * sync service) plus an offline write queue; the UI always reads from here via
 * useLiveQuery, so the leaderboard, records, and vault keep working with no
 * signal. In local-only mode it is the source of truth.
 *
 * All entity keys are UUID strings supplied by the app / Supabase, so `id` is
 * an inbound primary key (not `++id`).
 */
class SeaRobinDB extends Dexie {
  users!: Table<User, string>;
  catches!: Table<CatchEntry, string>;
  gloryPics!: Table<GloryPic, string>;
  settings!: Table<Settings, number>;
  records!: Table<RecordEntry & { id?: string }, string>;
  notifications!: Table<AppNotification, string>;
  newsletters!: Table<Newsletter, string>;
  tournaments!: Table<Tournament, string>;
  invites!: Table<Invite, string>;
  penalties!: Table<Penalty, string>;
  outbox!: Table<OutboxItem, number>;

  constructor() {
    super("sea-robin-classic");
    // v1 was the pre-Supabase numeric-key schema. v2 rekeys to string UUIDs
    // and adds the offline outbox.
    this.version(2)
      .stores({
        users: "id, email, roleTag",
        catches: "id, userId, tournamentYear, species, status, createdAt",
        gloryPics: "id, userId, createdAt",
        settings: "id",
        records: "species",
        notifications: "id, at, read",
        outbox: "++id, at",
      })
      .upgrade(async (tx) => {
        // Old numeric-keyed rows are incompatible; clear them for a clean rebuild.
        await Promise.all(
          ["users", "catches", "gloryPics", "settings", "records", "notifications"].map((t) =>
            tx.table(t).clear(),
          ),
        );
      });
    // v3 adds the newsletter bulletin table (additive; existing stores unchanged).
    this.version(3).stores({
      newsletters: "id, createdAt",
    });
    // v4 adds the tournament registry (history) and roster invites (additive).
    this.version(4).stores({
      tournaments: "id, year, createdAt",
      invites: "id, email, createdAt",
    });
    // v5 adds M.O.C. scoring penalties (additive).
    this.version(5).stores({
      penalties: "id, userId, tournamentYear",
    });
  }
}

export const db = new SeaRobinDB();

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(`src-salt::${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Fire an OS notification when the PWA has permission (feed row is added by the caller). */
export function osNotify(message: string, title?: string) {
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title || "Notification", { body: message, icon: "/icon-192.png" });
    } catch {
      // Some mobile browsers require the service-worker path; the in-app feed still shows it.
    }
  }
}
